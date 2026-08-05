/**
 * Purchase Order module.
 *
 * Intended ownership:
 * - Purchase order entry validation.
 * - PO register persistence.
 * - PO status lifecycle handling.
 * - Purchase order lookup services.
 *
 * No purchase order workflows are implemented in Phase 1.
 */
/**
 * @namespace PO
 * Purchase Order lifecycle management for AIIMS Store ERP.
 * Strictly adheres to WorkbookDesign.md (Version 1.1).
 * Utilizes Utils.gs, Settings.gs, and RC.gs for shared logic and validation.
 */
const PO = (function() {

  // --- Constants ---
  const REGISTER_SHEET_NAME = 'PO_Register';
  const ENTRY_SHEET_NAME = 'PO_Entry';

  // --- Private Helper Functions ---

  /**
   * Derives the Financial Year string (e.g., '2023-24') from a given date.
   * Assumes Indian Financial Year (April 1 - March 31).
   * @private
   * @param {Date} date - The date to evaluate.
   * @returns {string} Financial Year string.
   */
  function _getFinancialYear(date) {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed (0 = Jan, 3 = Apr)
    if (month >= 3) {
      return `${year}-${(year + 1).toString().slice(-2)}`;
    } else {
      return `${year - 1}-${year.toString().slice(-2)}`;
    }
  }

  /**
   * Maps a 2D array (with headers in the first row) to an array of objects.
   * @private
   * @param {Array<Array>} data - 2D array from sheet.getDataRange().getValues().
   * @returns {Array<Object>} Array of key-value objects.
   */
  function _mapRowsToObjects(data) {
    if (!data || data.length <= 1) return [];
    const headers = data[0];
    const rows = data.slice(1);
    
    return rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        if (header) {
          obj[header] = row[index];
        }
      });
      return obj;
    });
  }

  /**
   * Validates the basic structure and mandatory fields of the PO payload.
   * @private
   */
  function _validatePOPayload(payload) {
    if (!payload.RC_No) throw new Error("Validation Failed: RC_No is mandatory.");
    if (!(payload.PO_Date instanceof Date) || isNaN(payload.PO_Date)) {
      throw new Error("Validation Failed: PO_Date must be a valid date.");
    }
    if (!payload.Delivery_Period_Days || payload.Delivery_Period_Days <= 0) {
      throw new Error("Validation Failed: Delivery_Period_Days must be greater than zero.");
    }
    if (!payload.Delivery_Address) throw new Error("Validation Failed: Delivery_Address is mandatory.");
    if (!payload.Consignee) throw new Error("Validation Failed: Consignee is mandatory.");
    if (!payload.Supply_Mode) throw new Error("Validation Failed: Supply_Mode is mandatory.");
    
    if (!Array.isArray(payload.Items) || payload.Items.length === 0) {
      throw new Error("Validation Failed: Purchase Order must contain at least one item.");
    }

    payload.Items.forEach((item, index) => {
      const rowNum = index + 1;
      if (!item.Item_ID) throw new Error(`Validation Failed (Row ${rowNum}): Item_ID is mandatory.`);
      if (typeof item.Ordered_Quantity !== 'number' || item.Ordered_Quantity <= 0) {
        throw new Error(`Validation Failed (Row ${rowNum}): Ordered_Quantity must be a number greater than zero.`);
      }
    });
  }

  /**
   * Cross-references the PO payload against the authoritative Rate Contract.
   * @private
   */
  function _validateAgainstRC(payload) {
    const rcHeader = RC.getRateContract(payload.RC_No);
    if (rcHeader.Status !== 'Active') {
      throw new Error(`Validation Failed: Rate Contract '${payload.RC_No}' is not Active (Current Status: ${rcHeader.Status}).`);
    }

    const rcItems = RC.getRateContractItems(payload.RC_No);
    const enrichedItems = [];

    payload.Items.forEach((poItem, index) => {
      const rowNum = index + 1;
      const authoritativeItem = rcItems.find(rcI => rcI.Item_Code === poItem.Item_ID);
      
      if (!authoritativeItem) {
        throw new Error(`Validation Failed (Row ${rowNum}): Item '${poItem.Item_ID}' does not exist in Rate Contract '${payload.RC_No}'.`);
      }

      const qty = Number(poItem.Ordered_Quantity);
      const rate = Number(authoritativeItem.Rate);
      const taxableAmount = Number((qty * rate).toFixed(2));
      
      const gstPercent = (poItem.GST_Percent !== undefined && poItem.GST_Percent !== '') 
                         ? Number(poItem.GST_Percent) 
                         : (Number(authoritativeItem.GST) || 0);
                         
      const gstAmount = Number((taxableAmount * (gstPercent / 100)).toFixed(2));
      const totalAmount = Number((taxableAmount + gstAmount).toFixed(2));

      enrichedItems.push({
        ...poItem,
        Authoritative_Item: authoritativeItem,
        Calculated_Taxable: taxableAmount,
        Calculated_GST_Percent: gstPercent,
        Calculated_GST_Amount: gstAmount,
        Calculated_Total: totalAmount
      });
    });

    return enrichedItems;
  }

  /**
   * Persists the validated PO data to the PO_Register sheet using a single batch write.
   * @private
   */
  function _persistToRegister(poNo, fy, payload, enrichedItems) {
    const sheet = Utils.getSheet(REGISTER_SHEET_NAME);
    const currentUser = Session.getActiveUser().getEmail();
    const now = new Date();
    
    const validStatuses = Settings.getActiveSettingsByGroup('PO_STATUS_LIST').map(s => s.Setting_Value);
    const initialStatus = validStatuses.includes('Pending') ? 'Pending' : validStatuses[0];

    // Build 2D array for batch insertion to minimize Spreadsheet API calls
    const rowsData = enrichedItems.map(item => {
      const rcItem = item.Authoritative_Item;
      return [
        'POL-' + Utilities.getUuid(),  // 1. PO_Line_ID (Native GAS UUID)
        poNo,                          // 2. PO_No
        payload.PO_Date,               // 3. PO_Date
        fy,                            // 4. Financial_Year
        payload.RC_No,                 // 5. RC_No
        rcItem.Bidder_Name,            // 6. Bidder_ID (Fallback to Name)
        rcItem.Bidder_Name,            // 7. Bidder_Name
        payload.Distributor_ID || '',  // 8. Distributor_ID
        payload.Distributor_Name || rcItem.Distributor_Name || '', // 9. Distributor_Name
        payload.Delivery_Period_Days,  // 10. Delivery_Period_Days
        payload.Delivery_Address,      // 11. Delivery_Address
        payload.Consignee,             // 12. Consignee
        payload.Supply_Mode,           // 13. Supply_Mode
        item.Item_ID,                  // 14. Item_ID
        rcItem.Item_Name,              // 15. Item_Name
        rcItem.Item_Specification,     // 16. Item_Description
        rcItem.Make,                   // 17. Make
        rcItem.UOM,                    // 18. Unit
        item.Ordered_Quantity,         // 19. Ordered_Quantity
        rcItem.Rate,                   // 20. Rate
        item.Calculated_Taxable,       // 21. Taxable_Amount
        item.Calculated_GST_Percent,   // 22. GST_Percent
        item.Calculated_GST_Amount,    // 23. GST_Amount
        item.Calculated_Total,         // 24. Total_Amount
        0,                             // 25. Received_Quantity (Initial)
        item.Ordered_Quantity,         // 26. Balance_Quantity (Initial)
        initialStatus,                 // 27. PO_Status
        '',                            // 28. Close_Reason
        '',                            // 29. PO_Document_Link
        true,                          // 30. Locked
        now,                           // 31. Created_At
        currentUser,                   // 32. Created_By
        '',                            // 33. Updated_At
        ''                             // 34. Updated_By
      ];
    });

    if (rowsData.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rowsData.length, rowsData[0].length).setValues(rowsData);
    }
  }

  /**
   * Rolls back a failed PO creation attempt by deleting rows from PO_Register.
   * @private
   */
  function _rollbackPO(poNo) {
    if (!poNo) return;
    const sheet = Utils.getSheet(REGISTER_SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    for (let i = data.length - 1; i > 0; i--) {
      if (data[i][1] === poNo) { 
        sheet.deleteRow(i + 1);
      }
    }
  }

  /**
   * Clears the user-facing PO_Entry sheet after successful persistence.
   * @private
   */
  function _clearEntrySheet() {
    try {
      const sheet = Utils.getSheet(ENTRY_SHEET_NAME);
      const itemRange = sheet.getRange('PO_ENTRY_ITEM_ROWS');
      if (itemRange) itemRange.clearContent();
    } catch (e) {
      console.warn("Could not clear PO_ENTRY_ITEM_ROWS. Named range may be missing.");
    }
  }

  // --- Public API ---

  return {
    createPurchaseOrder: function(payload) {
      let generatedPoNo = null;
      try {
        _validatePOPayload(payload);
        const enrichedItems = _validateAgainstRC(payload);
        const fy = _getFinancialYear(payload.PO_Date);
        generatedPoNo = Settings.generateNextDocumentNumber('PO', fy);
        
        _persistToRegister(generatedPoNo, fy, payload, enrichedItems);
        _clearEntrySheet();
        
        console.log(`Successfully created Purchase Order: ${generatedPoNo}`);
        return generatedPoNo;
      } catch (error) {
        console.error(`PO Creation Failed. Initiating rollback for ${generatedPoNo || 'unknown'}. Error: ${error.message}`);
        _rollbackPO(generatedPoNo);
        throw new Error(`Failed to create Purchase Order: ${error.message}`);
      }
    },

    getPurchaseOrder: function(poNo) {
      if (!poNo) throw new Error("poNo is required.");
      const sheet = Utils.getSheet(REGISTER_SHEET_NAME);
      const data = sheet.getDataRange().getValues();
      const records = _mapRowsToObjects(data);
      const poItems = records.filter(record => record.PO_No === poNo);
      
      if (poItems.length === 0) throw new Error(`Purchase Order '${poNo}' not found.`);
      return poItems;
    },

    getOpenPurchaseOrders: function() {
      const sheet = Utils.getSheet(REGISTER_SHEET_NAME);
      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) return [];

      const records = _mapRowsToObjects(data);
      const openPOs = new Map();

      records.forEach(record => {
        if (record.PO_Status !== 'Closed' && Number(record.Balance_Quantity) > 0) {
          if (!openPOs.has(record.PO_No)) {
            openPOs.set(record.PO_No, {
              PO_No: record.PO_No,
              PO_Date: record.PO_Date,
              RC_No: record.RC_No,
              Bidder_Name: record.Bidder_Name,
              PO_Status: record.PO_Status
            });
          }
        }
      });
      return Array.from(openPOs.values());
    },

    updatePurchaseOrderStatus: function(poNo, newStatus, closeReason = '') {
      if (!poNo || !newStatus) throw new Error("poNo and newStatus are required.");
      if (newStatus === 'Closed' && String(closeReason).trim() === '') {
        throw new Error("Close_Reason is mandatory when closing a Purchase Order.");
      }

      const validStatuses = Settings.getActiveSettingsByGroup('PO_STATUS_LIST').map(s => s.Setting_Value);
      if (!validStatuses.includes(newStatus)) {
        throw new Error(`Invalid status '${newStatus}'. Allowed values: ${validStatuses.join(', ')}`);
      }

      const sheet = Utils.getSheet(REGISTER_SHEET_NAME);
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      
      const poNoIdx = headers.indexOf('PO_No');
      const statusIdx = headers.indexOf('PO_Status');
      const reasonIdx = headers.indexOf('Close_Reason');
      const updatedByIdx = headers.indexOf('Updated_By');
      const updatedAtIdx = headers.indexOf('Updated_At');
      
      let found = false;
      const currentUser = Session.getActiveUser().getEmail();
      const now = new Date();

      for (let i = 1; i < data.length; i++) {
        if (data[i][poNoIdx] === poNo) {
          // Update array in memory
          data[i][statusIdx] = newStatus;
          if (newStatus === 'Closed') data[i][reasonIdx] = closeReason;
          data[i][updatedByIdx] = currentUser;
          data[i][updatedAtIdx] = now;
          
          // Write the single row back in one operation
          sheet.getRange(i + 1, 1, 1, data[i].length).setValues([data[i]]);
          found = true;
        }
      }

      if (!found) throw new Error(`Purchase Order '${poNo}' not found.`);
      return true;
    },

    applyReceipt: function(poNo, itemCode, receivedQty) {
      if (!poNo || !itemCode || typeof receivedQty !== 'number' || receivedQty <= 0) {
        throw new Error("Invalid parameters for applyReceipt.");
      }

      const sheet = Utils.getSheet(REGISTER_SHEET_NAME);
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      
      const poNoIdx = headers.indexOf('PO_No');
      const itemIdx = headers.indexOf('Item_ID');
      const orderedQtyIdx = headers.indexOf('Ordered_Quantity');
      const receivedQtyIdx = headers.indexOf('Received_Quantity');
      const balanceQtyIdx = headers.indexOf('Balance_Quantity');
      const statusIdx = headers.indexOf('PO_Status');
      const updatedByIdx = headers.indexOf('Updated_By');
      const updatedAtIdx = headers.indexOf('Updated_At');

      let found = false;
      const currentUser = Session.getActiveUser().getEmail();
      const now = new Date();

      for (let i = 1; i < data.length; i++) {
        if (data[i][poNoIdx] === poNo && data[i][itemIdx] === itemCode) {
          
          const currentStatus = data[i][statusIdx];
          if (currentStatus === 'Closed') {
            throw new Error(`Cannot apply receipt: Purchase Order '${poNo}' is Closed.`);
          }

          const orderedQty = Number(data[i][orderedQtyIdx]);
          const currentReceived = Number(data[i][receivedQtyIdx]);
          const newReceived = currentReceived + receivedQty;

          if (newReceived > orderedQty) {
            throw new Error(`Receipt violation: Cumulative received quantity (${newReceived}) cannot exceed ordered quantity (${orderedQty}).`);
          }

          const newBalance = orderedQty - newReceived;
          if (newBalance < 0) {
            throw new Error("Receipt violation: Balance quantity cannot become negative.");
          }

          let newStatus = currentStatus;
          if (newBalance === 0) {
            newStatus = 'Completed';
          } else if (newReceived > 0) {
            newStatus = 'Partial';
          }

          // Update array in memory
          data[i][receivedQtyIdx] = newReceived;
          data[i][balanceQtyIdx] = newBalance;
          data[i][statusIdx] = newStatus;
          data[i][updatedByIdx] = currentUser;
          data[i][updatedAtIdx] = now;

          // Write the single row back in one operation
          sheet.getRange(i + 1, 1, 1, data[i].length).setValues([data[i]]);
          found = true;
          break;
        }
      }

            if (!found) throw new Error(`Item '${itemCode}' not found in Purchase Order '${poNo}'.`);
      return true;
    },

    /**
     * Internal System API: Reverses a previously applied receipt.
     * Used exclusively for compensating transactions during a rollback.
     * Must never be called directly by UI modules.
     *
     * @param {string} poNo
     * @param {string} itemCode
     * @param {number} receivedQty
     * @returns {boolean}
     */
    reverseReceipt: function(poNo, itemCode, receivedQty) {
      if (!poNo || !itemCode || typeof receivedQty !== 'number' || receivedQty <= 0) {
        throw new Error("Invalid parameters for reverseReceipt.");
      }

      const sheet = Utils.getSheet(REGISTER_SHEET_NAME);
      const data = sheet.getDataRange().getValues();
      const headers = data[0];

      const poNoIdx = headers.indexOf('PO_No');
      const itemIdx = headers.indexOf('Item_ID');
      const orderedQtyIdx = headers.indexOf('Ordered_Quantity');
      const receivedQtyIdx = headers.indexOf('Received_Quantity');
      const balanceQtyIdx = headers.indexOf('Balance_Quantity');
      const statusIdx = headers.indexOf('PO_Status');
      const updatedByIdx = headers.indexOf('Updated_By');
      const updatedAtIdx = headers.indexOf('Updated_At');

      const validStatuses = Settings.getActiveSettingsByGroup('PO_STATUS_LIST').map(s => s.Setting_Value);

      if (!validStatuses.includes('Pending') ||
          !validStatuses.includes('Partial') ||
          !validStatuses.includes('Completed') ||
          !validStatuses.includes('Closed')) {
        throw new Error("PO_STATUS_LIST is misconfigured.");
      }

      const currentUser = Session.getActiveUser().getEmail();
      const now = new Date();

      let found = false;

      for (let i = 1; i < data.length; i++) {

        if (data[i][poNoIdx] === poNo && data[i][itemIdx] === itemCode) {

          if (data[i][statusIdx] === 'Closed') {
            throw new Error(`Cannot reverse receipt: Purchase Order '${poNo}' is Closed.`);
          }

          const orderedQty = Number(data[i][orderedQtyIdx]);
          const currentReceived = Number(data[i][receivedQtyIdx]);

          const newReceived = currentReceived - receivedQty;

          if (newReceived < 0) {
            throw new Error("Rollback violation.");
          }

          const newBalance = orderedQty - newReceived;

          let newStatus = 'Pending';

          if (newBalance === 0) {
            newStatus = 'Completed';
          } else if (newReceived > 0) {
            newStatus = 'Partial';
          }

          data[i][receivedQtyIdx] = newReceived;
          data[i][balanceQtyIdx] = newBalance;
          data[i][statusIdx] = newStatus;
          data[i][updatedByIdx] = currentUser;
          data[i][updatedAtIdx] = now;

          sheet.getRange(i + 1, 1, 1, data[i].length).setValues([data[i]]);

          found = true;
          break;
        }
      }

      if (!found) {
        throw new Error(`Item '${itemCode}' not found in Purchase Order '${poNo}'.`);
      }

      return true;
    }

  };

})();
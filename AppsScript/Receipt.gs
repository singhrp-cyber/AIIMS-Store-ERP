/**
 * Receipt module.
 *
 * Intended ownership:
 * - Material receipt entry validation.
 * - Receipt register persistence.
 * - Receipt-to-PO reconciliation support.
 * - Receipt status lifecycle handling.
 *
 * No receipt workflows are implemented in Phase 1.
 */
/**
 * @namespace Receipt
 * Goods Receipt lifecycle management for AIIMS Store ERP.
 * Strictly adheres to WorkbookDesign.md (Version 1.1).
 * Utilizes Utils.gs, Settings.gs, and PO.gs for shared logic and validation.
 */
const Receipt = (function() {

  // --- Constants ---
  const REGISTER_SHEET_NAME = 'Receipt_Register';
  const ENTRY_SHEET_NAME = 'Receipt_Entry';

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
   * Validates the basic structure and mandatory fields of the Receipt payload.
   * @private
   * @param {Object} payload - The Receipt data payload.
   * @throws {Error} If validation fails.
   */
  function _validateReceiptPayload(payload) {
    if (!payload.PO_No) throw new Error("Validation Failed: PO_No is mandatory.");
    if (!payload.Invoice_No || String(payload.Invoice_No).trim() === '') {
      throw new Error("Validation Failed: Invoice_No is mandatory.");
    }
    if (!(payload.Invoice_Date instanceof Date) || isNaN(payload.Invoice_Date)) {
      throw new Error("Validation Failed: Invoice_Date must be a valid date.");
    }
    if (!(payload.Receipt_Date instanceof Date) || isNaN(payload.Receipt_Date)) {
      throw new Error("Validation Failed: Receipt_Date must be a valid date.");
    }
    if (typeof payload.Supplier_Invoice_Value !== 'number' || payload.Supplier_Invoice_Value <= 0) {
      throw new Error("Validation Failed: Supplier_Invoice_Value must be a number greater than zero.");
    }
    if (typeof payload.Inspection_Required !== 'boolean') {
      throw new Error("Validation Failed: Inspection_Required must be a boolean (TRUE/FALSE).");
    }
    
    if (!Array.isArray(payload.Items) || payload.Items.length === 0) {
      throw new Error("Validation Failed: Receipt must contain at least one item.");
    }

    payload.Items.forEach((item, index) => {
      const rowNum = index + 1;
      if (!item.Item_ID) throw new Error(`Validation Failed (Row ${rowNum}): Item_ID is mandatory.`);
      if (typeof item.Received_Quantity !== 'number' || item.Received_Quantity <= 0) {
        throw new Error(`Validation Failed (Row ${rowNum}): Received_Quantity must be a number greater than zero.`);
      }
      if (typeof item.GST_Percent !== 'number') {
        throw new Error(`Validation Failed (Row ${rowNum}): GST_Percent is mandatory at the Receipt stage.`);
      }
    });
  }

  /**
   * Validates that the Invoice Number is unique within the given Purchase Order.
   * @private
   * @param {string} poNo - The Purchase Order Number.
   * @param {string} invoiceNo - The Supplier Invoice Number.
   * @throws {Error} If the invoice already exists for this PO.
   */
  function _validateInvoiceUniqueness(poNo, invoiceNo) {
    const sheet = Utils.getSheet(REGISTER_SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return; // Empty register

    const headers = data[0];
    const poNoIdx = headers.indexOf('PO_No');
    const invoiceNoIdx = headers.indexOf('Invoice_No');

    for (let i = 1; i < data.length; i++) {
      if (data[i][poNoIdx] === poNo && String(data[i][invoiceNoIdx]).trim() === String(invoiceNo).trim()) {
        throw new Error(`Validation Failed: Invoice Number '${invoiceNo}' already exists for Purchase Order '${poNo}'.`);
      }
    }
  }

  /**
   * Cross-references the Receipt payload against the authoritative PO balances.
   * @private
   * @param {Object} payload - The Receipt data payload.
   * @returns {Array<Object>} Array of enriched item objects with authoritative PO data and math.
   * @throws {Error} If PO validation fails or quantities exceed balance.
   */
  function _validateAgainstPO(payload) {
    const poItems = PO.getPurchaseOrder(payload.PO_No);
    
    if (poItems.length > 0 && poItems[0].PO_Status === 'Closed') {
      throw new Error(`Validation Failed: Purchase Order '${payload.PO_No}' is Closed.`);
    }

    const enrichedItems = [];

    payload.Items.forEach((receiptItem, index) => {
      const rowNum = index + 1;
      const poItem = poItems.find(pi => pi.Item_ID === receiptItem.Item_ID);
      
      if (!poItem) {
        throw new Error(`Validation Failed (Row ${rowNum}): Item '${receiptItem.Item_ID}' does not exist in Purchase Order '${payload.PO_No}'.`);
      }

      const receivedQty = Number(receiptItem.Received_Quantity);
      const balanceQty = Number(poItem.Balance_Quantity);

      if (receivedQty > balanceQty) {
        throw new Error(`Validation Failed (Row ${rowNum}): Received Quantity (${receivedQty}) exceeds Balance Quantity (${balanceQty}) for Item '${receiptItem.Item_ID}'.`);
      }

      // Calculate Math
      const rate = Number(poItem.Rate);
      const gstPercent = Number(receiptItem.GST_Percent);
      
      const taxableValue = Number((receivedQty * rate).toFixed(2));
      const gstValue = Number((taxableValue * (gstPercent / 100)).toFixed(2));
      const totalValue = Number((taxableValue + gstValue).toFixed(2));

      // Calculate Cumulative and Balance for the Receipt Register record
      const cumulativeReceived = Number(poItem.Received_Quantity) + receivedQty;
      const newBalance = balanceQty - receivedQty;

      enrichedItems.push({
        ...receiptItem,
        PO_Item: poItem,
        Calculated_Taxable: taxableValue,
        Calculated_GST_Value: gstValue,
        Calculated_Total: totalValue,
        Cumulative_Received_Quantity: cumulativeReceived,
        Balance_Quantity: newBalance
      });
    });

    return enrichedItems;
  }

  /**
   * Persists the validated Receipt data to the Receipt_Register sheet.
   * @private
   * @param {string} receiptNo - The generated Receipt Number.
   * @param {string} fy - The Financial Year.
   * @param {Object} payload - The original payload.
   * @param {Array<Object>} enrichedItems - The items enriched with PO data and math.
   */
  function _persistToRegister(receiptNo, fy, payload, enrichedItems) {
    const sheet = Utils.getSheet(REGISTER_SHEET_NAME);
    const currentUser = Session.getActiveUser().getEmail();
    const now = new Date();
    
    const validReceiptStatuses = Settings.getActiveSettingsByGroup('RECEIPT_STATUS_LIST').map(s => s.Setting_Value);
    const initialReceiptStatus = validReceiptStatuses.includes('Received') ? 'Received' : validReceiptStatuses[0];

    const validInspectionStatuses = Settings.getActiveSettingsByGroup('INSPECTION_STATUS_LIST').map(s => s.Setting_Value);
    const initialInspectionStatus = payload.Inspection_Required 
      ? (validInspectionStatuses.includes('Pending') ? 'Pending' : validInspectionStatuses[0])
      : 'Not Required';

    const rowsData = enrichedItems.map(item => {
      const poItem = item.PO_Item;
      return [
        'RCL-' + Utilities.getUuid(),  // 1. Receipt_Line_ID
        receiptNo,                     // 2. Receipt_No
        payload.Receipt_Date,          // 3. Receipt_Date
        fy,                            // 4. Financial_Year
        payload.PO_No,                 // 5. PO_No
        payload.Invoice_No,            // 6. Invoice_No
        payload.Invoice_Date,          // 7. Invoice_Date
        payload.Supplier_Invoice_Value,// 8. Supplier_Invoice_Value
        poItem.RC_No,                  // 9. RC_No
        poItem.Bidder_Name,            // 10. Bidder_Name
        poItem.Distributor_Name || '', // 11. Distributor_Name
        item.Item_ID,                  // 12. Item_ID
        poItem.Item_Name,              // 13. Item_Name
        poItem.Make || '',             // 14. Make
        poItem.Unit,                   // 15. Unit
        poItem.Ordered_Quantity,       // 16. Ordered_Quantity
        item.Received_Quantity,        // 17. Received_Quantity
        item.Cumulative_Received_Quantity, // 18. Cumulative_Received_Quantity
        item.Balance_Quantity,         // 19. Balance_Quantity
        poItem.Rate,                   // 20. Rate
        item.GST_Percent,              // 21. GST_Percent
        item.Calculated_Taxable,       // 22. Taxable_Value
        item.Calculated_GST_Value,     // 23. GST_Value
        item.Calculated_Total,         // 24. Total_Value
        initialReceiptStatus,          // 25. Receipt_Status
        payload.Inspection_Required,   // 26. Inspection_Required
        initialInspectionStatus,       // 27. Inspection_Status
        '',                            // 28. Receipt_Document_Link
        now,                           // 29. Created_At
        currentUser,                   // 30. Created_By
        '',                            // 31. Updated_At
        ''                             // 32. Updated_By
      ];
    });

    if (rowsData.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rowsData.length, rowsData[0].length).setValues(rowsData);
    }
  }

  /**
   * Updates the PO balances by calling PO.applyReceipt.
   * Tracks successful updates to allow for transactional rollback.
   * @private
   * @param {string} poNo - The Purchase Order Number.
   * @param {Array<Object>} enrichedItems - The items to update.
   * @throws {Object} Custom error object containing successful updates for rollback.
   */
  function _updatePOBalances(poNo, enrichedItems) {
    const successfulUpdates = [];
    
    try {
      for (const item of enrichedItems) {
        PO.applyReceipt(poNo, item.Item_ID, item.Received_Quantity);
        successfulUpdates.push(item);
      }
    } catch (error) {
      throw {
        message: `Failed to update PO balances: ${error.message}`,
        successfulUpdates: successfulUpdates
      };
    }
  }

  /**
   * Rolls back a failed Receipt creation attempt.
   * Reverses successful PO updates and deletes rows from Receipt_Register.
   * @private
   * @param {string} receiptNo - The generated Receipt Number.
   * @param {string} poNo - The Purchase Order Number.
   * @param {Array<Object>} successfulUpdates - Array of items that were successfully applied to the PO.
   */
  function _rollbackReceipt(receiptNo, poNo, successfulUpdates) {
    // 1. Reverse PO Updates (Compensating Transaction)
    if (poNo && Array.isArray(successfulUpdates)) {
      // Iterate backwards to reverse in LIFO order
      for (let i = successfulUpdates.length - 1; i >= 0; i--) {
        const item = successfulUpdates[i];
        try {
          PO.reverseReceipt(poNo, item.Item_ID, item.Received_Quantity);
        } catch (e) {
          console.error(`CRITICAL: Failed to reverse PO receipt during rollback for PO ${poNo}, Item ${item.Item_ID}. System may be out of sync.`);
        }
      }
    }

    // 2. Delete Receipt Rows
    if (receiptNo) {
      const sheet = Utils.getSheet(REGISTER_SHEET_NAME);
      const data = sheet.getDataRange().getValues();
      
      for (let i = data.length - 1; i > 0; i--) {
        if (data[i][1] === receiptNo) { // Column 2 (index 1) is Receipt_No
          sheet.deleteRow(i + 1);
        }
      }
    }
  }

  /**
   * Clears the user-facing Receipt_Entry sheet after successful persistence.
   * @private
   */
  function _clearEntrySheet() {
    try {
      const sheet = Utils.getSheet(ENTRY_SHEET_NAME);
      const itemRange = sheet.getRange('RECEIPT_ENTRY_ITEM_ROWS');
      if (itemRange) itemRange.clearContent();
    } catch (e) {
      console.warn("Could not clear RECEIPT_ENTRY_ITEM_ROWS. Named range may be missing.");
    }
  }

  // --- Public API ---

  return {
    /**
     * Orchestrates the creation of a new Goods Receipt.
     * Validates data, checks invoice uniqueness, generates Receipt_No, 
     * persists to register, updates PO balances, and clears entry sheet.
     * 
     * @param {Object} payload - The Receipt data payload.
     * @returns {string} The newly generated Receipt_No.
     * @throws {Error} If validation fails or an error occurs during persistence.
     */
    createReceipt: function(payload) {
      let generatedReceiptNo = null;
      let successfulPOUpdates = [];

      try {
        // 1. Validate Payload Structure & GST
        _validateReceiptPayload(payload);

        // 2. Check Invoice Uniqueness (PO-wise)
        _validateInvoiceUniqueness(payload.PO_No, payload.Invoice_No);

        // 3. Validate against Authoritative PO Balances
        const enrichedItems = _validateAgainstPO(payload);

        // 4. Number Generation
        const fy = _getFinancialYear(payload.Receipt_Date);
        generatedReceiptNo = Settings.generateNextDocumentNumber('RECEIPT', fy);

        // 5. Persistence to Receipt_Register
        _persistToRegister(generatedReceiptNo, fy, payload, enrichedItems);

        // 6. Update PO Balances (Transactional)
        try {
          _updatePOBalances(payload.PO_No, enrichedItems);
        } catch (poUpdateError) {
          successfulPOUpdates = poUpdateError.successfulUpdates || [];
          throw new Error(poUpdateError.message);
        }

        // 7. Cleanup Entry Sheet
        _clearEntrySheet();

        console.log(`Successfully created Receipt: ${generatedReceiptNo} for PO: ${payload.PO_No}`);
        return generatedReceiptNo;

      } catch (error) {
        // Execute Rollback on failure
        console.error(`Receipt Creation Failed. Initiating rollback for ${generatedReceiptNo || 'unknown'}. Error: ${error.message}`);
        _rollbackReceipt(generatedReceiptNo, payload.PO_No, successfulPOUpdates);
        throw new Error(`Failed to create Receipt: ${error.message}`);
      }
    },

    /**
     * Retrieves all line items for a specific Receipt Number.
     * 
     * @param {string} receiptNo - The Receipt Number.
     * @returns {Array<Object>} Array of key-value pairs representing the Receipt line items.
     * @throws {Error} If Receipt is not found.
     */
    getReceipt: function(receiptNo) {
      if (!receiptNo) throw new Error("receiptNo is required.");
      const sheet = Utils.getSheet(REGISTER_SHEET_NAME);
      const data = sheet.getDataRange().getValues();
      const records = _mapRowsToObjects(data);
      const receiptItems = records.filter(record => record.Receipt_No === receiptNo);
      
      if (receiptItems.length === 0) throw new Error(`Receipt '${receiptNo}' not found.`);
      return receiptItems;
    },

    /**
     * Retrieves a list of receipt lines pending inspection.
     * Filters for Inspection_Required = TRUE and Inspection_Status = 'Pending'.
     * 
     * @returns {Array<Object>} Array of receipt line objects pending inspection.
     */
    getPendingInspectionReceipts: function() {
      const sheet = Utils.getSheet(REGISTER_SHEET_NAME);
      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) return [];

      const records = _mapRowsToObjects(data);
      
      return records.filter(record => 
        (record.Inspection_Required === true || String(record.Inspection_Required).toUpperCase() === 'TRUE') && 
        record.Inspection_Status === 'Pending'
      );
    },

    /**
     * Updates the inspection status of a specific receipt line.
     * Called exclusively by Inspection.gs.
     * 
     * @param {string} receiptLineId - The unique Receipt_Line_ID.
     * @param {string} newStatus - The new inspection status (e.g., 'Accepted', 'Rejected').
     * @returns {boolean} True if successful.
     * @throws {Error} If Receipt Line is not found or status is invalid.
     */
    updateInspectionStatus: function(receiptLineId, newStatus) {
      if (!receiptLineId || !newStatus) throw new Error("receiptLineId and newStatus are required.");

      const validStatuses = Settings.getActiveSettingsByGroup('INSPECTION_STATUS_LIST').map(s => s.Setting_Value);
      if (!validStatuses.includes(newStatus)) {
        throw new Error(`Invalid inspection status '${newStatus}'. Allowed values: ${validStatuses.join(', ')}`);
      }

      const sheet = Utils.getSheet(REGISTER_SHEET_NAME);
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      
      const lineIdIdx = headers.indexOf('Receipt_Line_ID');
      const statusIdx = headers.indexOf('Inspection_Status');
      const updatedByIdx = headers.indexOf('Updated_By');
      const updatedAtIdx = headers.indexOf('Updated_At');
      
      let found = false;
      const currentUser = Session.getActiveUser().getEmail();
      const now = new Date();

      for (let i = 1; i < data.length; i++) {
        if (data[i][lineIdIdx] === receiptLineId) {
          // Update array in memory
          data[i][statusIdx] = newStatus;
          data[i][updatedByIdx] = currentUser;
          data[i][updatedAtIdx] = now;
          
          // Write the single row back in one operation
          sheet.getRange(i + 1, 1, 1, data[i].length).setValues([data[i]]);
          found = true;
          break;
        }
      }

      if (!found) throw new Error(`Receipt Line ID '${receiptLineId}' not found.`);
      return true;
    }
  };

})();
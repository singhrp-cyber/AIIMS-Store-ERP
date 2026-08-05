/**
 * @namespace RC
 * Rate Contract lifecycle management for AIIMS Store ERP.
 * Strictly adheres to WorkbookDesign.md (Version 1.1).
 * Utilizes Utils.gs and Settings.gs for shared logic and configuration.
 */
const RC = (function() {

  // --- Constants ---
  const HEADER_SHEET_NAME = 'RC_Header';
  
  const ITEM_COLUMNS = [
    'RC_No', 'Item_Code', 'Item_Name', 'Item_Specification', 
    'UOM', 'Make', 'Rate', 'GST', 'Bidder_Name', 'Distributor_Name'
  ];

  // --- Private Helper Functions ---

  /**
   * Validates the RC Header payload.
   * @private
   * @param {Object} payload - The header data.
   * @throws {Error} If validation fails.
   */
  function _validateHeader(payload) {
    if (!payload.RC_Name || String(payload.RC_Name).trim() === '') {
      throw new Error("Validation Failed: RC_Name is mandatory.");
    }
    if (!(payload.RC_Date instanceof Date) || isNaN(payload.RC_Date)) {
      throw new Error("Validation Failed: RC_Date must be a valid date.");
    }
    if (!(payload.Start_Date instanceof Date) || isNaN(payload.Start_Date)) {
      throw new Error("Validation Failed: Start_Date must be a valid date.");
    }
    if (!(payload.End_Date instanceof Date) || isNaN(payload.End_Date)) {
      throw new Error("Validation Failed: End_Date must be a valid date.");
    }
    
    const start = new Date(payload.Start_Date).setHours(0, 0, 0, 0);
    const end = new Date(payload.End_Date).setHours(0, 0, 0, 0);
    if (end < start) {
      throw new Error("Validation Failed: End_Date cannot be before Start_Date.");
    }
  }

  /**
   * Validates the RC Items payload.
   * @private
   * @param {Array<Object>} items - The items data.
   * @throws {Error} If validation fails.
   */
  function _validateItems(items) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("Validation Failed: At least one item is required.");
    }

    const itemCodes = new Set();

    items.forEach((item, index) => {
      const rowNum = index + 1;
      if (!item.Item_Code || String(item.Item_Code).trim() === '') {
        throw new Error(`Validation Failed (Row ${rowNum}): Item_Code is mandatory.`);
      }
      if (itemCodes.has(item.Item_Code)) {
        throw new Error(`Validation Failed: Duplicate Item_Code '${item.Item_Code}' found in payload.`);
      }
      itemCodes.add(item.Item_Code);

      if (!item.Item_Name || String(item.Item_Name).trim() === '') {
        throw new Error(`Validation Failed (Row ${rowNum}): Item_Name is mandatory.`);
      }
      if (!item.Item_Specification || String(item.Item_Specification).trim() === '') {
        throw new Error(`Validation Failed (Row ${rowNum}): Item_Specification is mandatory.`);
      }
      if (!item.UOM || String(item.UOM).trim() === '') {
        throw new Error(`Validation Failed (Row ${rowNum}): UOM is mandatory.`);
      }
      if (typeof item.Rate !== 'number' || item.Rate <= 0) {
        throw new Error(`Validation Failed (Row ${rowNum}): Rate must be a number greater than zero.`);
      }
      if (!item.Bidder_Name || String(item.Bidder_Name).trim() === '') {
        throw new Error(`Validation Failed (Row ${rowNum}): Bidder_Name is mandatory.`);
      }
    });
  }

  /**
   * Provisions a dedicated sheet for the RC Items.
   * @private
   * @param {string} rcNo - The generated RC Number.
   * @returns {string} The name of the newly created sheet.
   * @throws {Error} If sheet creation fails.
   */
  function _provisionItemSheet(rcNo) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const safeSheetName = rcNo.replace(/[^a-zA-Z0-9_-]/g, '_'); // Sanitize for sheet name
    
    if (ss.getSheetByName(safeSheetName)) {
      throw new Error(`Critical Error: Sheet '${safeSheetName}' already exists.`);
    }

    const sheet = ss.insertSheet(safeSheetName);
    
    // Set Headers and freeze row
    sheet.getRange(1, 1, 1, ITEM_COLUMNS.length)
         .setValues([ITEM_COLUMNS])
         .setFontWeight('bold');
    
    sheet.setFrozenRows(1);

    // Apply Protections (Header Row and RC_No column)
    const protection = sheet.protect().setDescription(`Protection for ${safeSheetName}`);
    protection.setWarningOnly(true);

    return safeSheetName;
  }

  /**
   * Persists the RC Header record to the RC_Header sheet.
   * @private
   * @param {string} rcNo - The RC Number.
   * @param {string} sheetName - The dedicated item sheet name.
   * @param {Object} payload - The header data.
   */
  function _persistHeader(rcNo, sheetName, payload) {
    const sheet = Utils.getSheet(HEADER_SHEET_NAME);
    
    // Fetch valid statuses from Settings to avoid hardcoding
    const validStatuses = Settings.getActiveSettingsByGroup('RC_STATUS_LIST').map(s => s.Setting_Value);
    const initialStatus = validStatuses.includes('Active') ? 'Active' : validStatuses[0];

    const rowData = [
      rcNo,
      payload.RC_Name,
      sheetName,
      payload.RC_Date,
      payload.Start_Date,
      payload.End_Date,
      initialStatus,
      0, // Total_Items (calculated later)
      0, // Total_Bidders (calculated later)
      payload.Document_Ref || '',
      payload.Remarks || ''
    ];

    Utils.appendRow(sheet, rowData);
  }

  /**
   * Persists the RC Items to the dedicated item sheet.
   * @private
   * @param {string} rcNo - The RC Number.
   * @param {string} sheetName - The dedicated item sheet name.
   * @param {Array<Object>} items - The items data.
   */
  function _persistItems(rcNo, sheetName, items) {
    const sheet = Utils.getSheet(sheetName);
    
    const rowsData = items.map(item => [
      rcNo,
      item.Item_Code,
      item.Item_Name,
      item.Item_Specification,
      item.UOM,
      item.Make || '',
      item.Rate,
      item.GST || '',
      item.Bidder_Name,
      item.Distributor_Name || ''
    ]);

    // Start writing from row 2
    sheet.getRange(2, 1, rowsData.length, ITEM_COLUMNS.length).setValues(rowsData);
  }

  /**
   * Recalculates Total_Items and Total_Bidders and updates the RC_Header.
   * @private
   * @param {string} rcNo - The RC Number.
   * @param {string} sheetName - The dedicated item sheet name.
   */
  function _recalculateSummary(rcNo, sheetName) {
    const itemSheet = Utils.getSheet(sheetName);
    const itemData = itemSheet.getDataRange().getValues();
    
    if (itemData.length <= 1) return; // Only headers exist

    const items = Utils.mapRowsToObjects(itemData);
    
    const uniqueItems = new Set(items.map(item => item.Item_Code).filter(Boolean));
    const uniqueBidders = new Set(items.map(item => item.Bidder_Name).filter(Boolean));

    const headerSheet = Utils.getSheet(HEADER_SHEET_NAME);
    const headerData = headerSheet.getDataRange().getValues();
    
    // Find the RC in the header sheet and update metrics
    for (let i = 1; i < headerData.length; i++) {
      if (headerData[i][0] === rcNo) {
        headerSheet.getRange(i + 1, 8).setValue(uniqueItems.size); // Total_Items
        headerSheet.getRange(i + 1, 9).setValue(uniqueBidders.size); // Total_Bidders
        break;
      }
    }
  }

  /**
   * Rolls back a failed RC creation attempt.
   * Deletes the orphaned sheet and removes the header row.
   * Burned document numbers are NEVER reused.
   * @private
   * @param {string} rcNo - The RC Number.
   * @param {string} sheetName - The dedicated item sheet name.
   */
  function _rollbackRC(rcNo, sheetName) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Delete orphaned item sheet
    if (sheetName) {
      const sheetToDelete = ss.getSheetByName(sheetName);
      if (sheetToDelete) {
        ss.deleteSheet(sheetToDelete);
      }
    }

    // 2. Delete orphaned header row
    if (rcNo) {
      const headerSheet = Utils.getSheet(HEADER_SHEET_NAME);
      const data = headerSheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === rcNo) {
          headerSheet.deleteRow(i + 1);
          break;
        }
      }
    }
  }

  // --- Public API ---

  return {
    /**
     * Orchestrates the creation of a new Rate Contract.
     * Validates data, generates RC_No, provisions sheets, and persists data.
     * 
     * @param {Object} headerPayload - The RC Header data.
     * @param {Array<Object>} itemsPayload - Array of RC Item data objects.
     * @returns {string} The newly generated RC_No.
     * @throws {Error} If validation fails or an error occurs during persistence.
     */
    createRateContract: function(headerPayload, itemsPayload) {
      let generatedRcNo = null;
      let generatedSheetName = null;

      try {
        // 1. Pre-flight Validation
        _validateHeader(headerPayload);
        _validateItems(itemsPayload);

        // 2. Number Generation (Delegated to Settings & Utils)
        const fy = Utils.getFinancialYear(headerPayload.RC_Date);
        generatedRcNo = Settings.generateNextDocumentNumber('RC', fy);

        // 3. Sheet Provisioning
        generatedSheetName = _provisionItemSheet(generatedRcNo);

        // 4. Header Persistence
        _persistHeader(generatedRcNo, generatedSheetName, headerPayload);

        // 5. Item Persistence
        _persistItems(generatedRcNo, generatedSheetName, itemsPayload);

        // 6. Summary Calculation
        _recalculateSummary(generatedRcNo, generatedSheetName);

        // Note: Audit logging will be handled by a centralized service in the future.
        console.log(`Successfully created Rate Contract: ${generatedRcNo}`);

        return generatedRcNo;

      } catch (error) {
        // Execute Rollback on failure
        console.error(`RC Creation Failed. Initiating rollback for ${generatedRcNo || 'unknown'}. Error: ${error.message}`);
        _rollbackRC(generatedRcNo, generatedSheetName);
        throw new Error(`Failed to create Rate Contract: ${error.message}`);
      }
    },

    /**
     * Updates the status of an existing Rate Contract.
     * Rate Contracts are never physically deleted; lifecycle is managed via status.
     * 
     * @param {string} rcNo - The RC Number to update.
     * @param {string} newStatus - The new status (e.g., 'Expired', 'Closed').
     * @returns {boolean} True if successful.
     * @throws {Error} If RC is not found or status is invalid.
     */
    updateRateContractStatus: function(rcNo, newStatus) {
      if (!rcNo || !newStatus) throw new Error("rcNo and newStatus are required.");

      // Validate status against Settings
      const validStatuses = Settings.getActiveSettingsByGroup('RC_STATUS_LIST').map(s => s.Setting_Value);
      if (!validStatuses.includes(newStatus)) {
        throw new Error(`Invalid status '${newStatus}'. Allowed values: ${validStatuses.join(', ')}`);
      }

      const sheet = Utils.getSheet(HEADER_SHEET_NAME);
      const data = sheet.getDataRange().getValues();

      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === rcNo) {
          // Status is column 7 (index 6)
          sheet.getRange(i + 1, 7).setValue(newStatus);
          return true;
        }
      }

      throw new Error(`Rate Contract '${rcNo}' not found.`);
    },

    /**
     * Retrieves a single Rate Contract header record.
     * 
     * @param {string} rcNo - The RC Number.
     * @returns {Object} Key-value pairs representing the RC Header.
     * @throws {Error} If RC is not found.
     */
    getRateContract: function(rcNo) {
      if (!rcNo) throw new Error("rcNo is required.");

      const sheet = Utils.getSheet(HEADER_SHEET_NAME);
      const data = sheet.getDataRange().getValues();
      const records = Utils.mapRowsToObjects(data);
      
      const rc = records.find(record => record.RC_No === rcNo);
      if (!rc) {
        throw new Error(`Rate Contract '${rcNo}' not found.`);
      }
      
      return rc;
    },

    /**
     * Retrieves all items for a specific Rate Contract from its dedicated sheet.
     * 
     * @param {string} rcNo - The RC Number.
     * @returns {Array<Object>} Array of key-value pairs representing the RC Items.
     * @throws {Error} If RC or its dedicated sheet is not found.
     */
    getRateContractItems: function(rcNo) {
      const rcHeader = this.getRateContract(rcNo);
      const sheet = Utils.getSheet(rcHeader.Sheet_Name);
      const data = sheet.getDataRange().getValues();
      
      if (data.length <= 1) return [];
      
      return Utils.mapRowsToObjects(data);
    },

    /**
     * Retrieves all active Rate Contract headers.
     * 
     * @returns {Array<Object>} Array of key-value pairs representing active RC Header rows.
     */
    getActiveRateContracts: function() {
      const sheet = Utils.getSheet(HEADER_SHEET_NAME);
      const data = sheet.getDataRange().getValues();
      
      if (data.length <= 1) return [];

      const records = Utils.mapRowsToObjects(data);
      return records.filter(record => record.Status === 'Active');
    }
  };

})();
/**
 * @namespace Inspection
 * Inspection lifecycle management for AIIMS Store ERP.
 * Strictly adheres to WorkbookDesign.md (Version 1.1).
 * Utilizes Utils.gs, Settings.gs, and Receipt.gs for shared logic and validation.
 */
const Inspection = (function() {

  // --- Constants ---
  const REGISTER_SHEET_NAME = 'Inspection_Register';
  const ENTRY_SHEET_NAME = 'Inspection_Verification';

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
   * Validates the basic structure, mandatory fields, and quantities of the Inspection payload.
   * @private
   * @param {Object} payload - The Inspection data payload.
   * @throws {Error} If validation fails.
   */
  function _validateInspectionPayload(payload) {
    if (!payload.PO_No) throw new Error("Validation Failed: PO_No is mandatory.");
    if (!payload.Invoice_No) throw new Error("Validation Failed: Invoice_No is mandatory.");
    if (!(payload.Inspection_Date instanceof Date) || isNaN(payload.Inspection_Date)) {
      throw new Error("Validation Failed: Inspection_Date must be a valid date.");
    }
    if (!payload.Inspection_Note_No || String(payload.Inspection_Note_No).trim() === '') {
      throw new Error("Validation Failed: Inspection_Note_No is mandatory.");
    }
    if (!(payload.Inspection_Note_Date instanceof Date) || isNaN(payload.Inspection_Note_Date)) {
      throw new Error("Validation Failed: Inspection_Note_Date must be a valid date.");
    }
    if (!payload.Committee || String(payload.Committee).trim() === '') {
      throw new Error("Validation Failed: Committee is mandatory.");
    }
    
    if (!Array.isArray(payload.Items) || payload.Items.length === 0) {
      throw new Error("Validation Failed: Inspection must contain at least one item.");
    }

    payload.Items.forEach((item, index) => {
      const rowNum = index + 1;
      if (!item.Receipt_Line_ID) throw new Error(`Validation Failed (Row ${rowNum}): Receipt_Line_ID is mandatory.`);
      if (!item.Item_ID) throw new Error(`Validation Failed (Row ${rowNum}): Item_ID is mandatory.`);
      if (!item.Inspection_Result) throw new Error(`Validation Failed (Row ${rowNum}): Inspection_Result is mandatory.`);
      
      const accepted = Number(item.Accepted_Quantity);
      const rejected = Number(item.Rejected_Quantity);
      const received = Number(item.Received_Quantity);

      if (isNaN(accepted) || accepted < 0) throw new Error(`Validation Failed (Row ${rowNum}): Accepted_Quantity must be a positive number or zero.`);
      if (isNaN(rejected) || rejected < 0) throw new Error(`Validation Failed (Row ${rowNum}): Rejected_Quantity must be a positive number or zero.`);
      if (isNaN(received) || received <= 0) throw new Error(`Validation Failed (Row ${rowNum}): Received_Quantity must be greater than zero.`);

      if (accepted + rejected !== received) {
        throw new Error(`Validation Failed (Row ${rowNum}): Accepted (${accepted}) + Rejected (${rejected}) must exactly equal Received (${received}) for Item '${item.Item_ID}'.`);
      }
    });
  }

  /**
   * Validates the Committee against Settings.
   * @private
   * @param {string} committee - The Committee string from the payload.
   * @throws {Error} If the Committee is invalid or inactive.
   */
  function _validateCommittee(committee) {
    const validCommittees = Settings.getActiveSettingsByGroup('COMMITTEE_LIST').map(s => s.Setting_Value);
    if (!validCommittees.includes(committee)) {
      throw new Error(`Validation Failed: Committee '${committee}' is not a valid, active committee in Settings.`);
    }
  }

  /**
   * Validates the Inspection Result against Settings.
   * @private
   * @param {Array<Object>} items - The items array from the payload.
   * @throws {Error} If any Inspection_Result is invalid.
   */
  function _validateInspectionResults(items) {
    const validResults = Settings.getActiveSettingsByGroup('INSPECTION_RESULT_LIST').map(s => s.Setting_Value);
    items.forEach((item, index) => {
      if (!validResults.includes(item.Inspection_Result)) {
        throw new Error(`Validation Failed (Row ${index + 1}): Inspection_Result '${item.Inspection_Result}' is invalid.`);
      }
    });
  }

  /**
   * Cross-references the Inspection payload against pending receipts.
   * Ensures items are actually pending inspection for the specified PO/Invoice.
   * Captures the original Inspection_Status for rollback purposes.
   * @private
   * @param {Object} payload - The Inspection data payload.
   * @returns {Array<Object>} Array of enriched item objects with authoritative Receipt data.
   * @throws {Error} If Receipt validation fails.
   */
  function _validateAgainstReceipt(payload) {
    const pendingReceipts = Receipt.getPendingInspectionReceipts();
    const enrichedItems = [];

    payload.Items.forEach((inspectionItem, index) => {
      const rowNum = index + 1;
      
      // Find the exact receipt line matching PO, Invoice, and Receipt_Line_ID
      const receiptLine = pendingReceipts.find(pr => 
        pr.PO_No === payload.PO_No && 
        pr.Invoice_No === payload.Invoice_No && 
        pr.Receipt_Line_ID === inspectionItem.Receipt_Line_ID
      );
      
      if (!receiptLine) {
        throw new Error(`Validation Failed (Row ${rowNum}): Receipt Line ID '${inspectionItem.Receipt_Line_ID}' is not pending inspection for PO '${payload.PO_No}' and Invoice '${payload.Invoice_No}'.`);
      }

      if (Number(receiptLine.Received_Quantity) !== Number(inspectionItem.Received_Quantity)) {
        throw new Error(`Validation Failed (Row ${rowNum}): Payload Received Quantity (${inspectionItem.Received_Quantity}) does not match authoritative Receipt Register (${receiptLine.Received_Quantity}).`);
      }

      enrichedItems.push({
        ...inspectionItem,
        Receipt_Line: receiptLine,
        Original_Inspection_Status: receiptLine.Inspection_Status // Captured for rollback
      });
    });

    return enrichedItems;
  }

  /**
   * Persists the validated Inspection data to the Inspection_Register sheet.
   * @private
   * @param {string} inspectionNo - The generated Inspection Number.
   * @param {string} fy - The Financial Year.
   * @param {Object} payload - The original payload.
   * @param {Array<Object>} enrichedItems - The items enriched with Receipt data.
   */
  function _persistToRegister(inspectionNo, fy, payload, enrichedItems) {
    const sheet = Utils.getSheet(REGISTER_SHEET_NAME);
    const currentUser = Session.getActiveUser().getEmail();
    const now = new Date();
    
    const rowsData = enrichedItems.map(item => {
      const receiptLine = item.Receipt_Line;
      return [
        'INSL-' + Utilities.getUuid(), // 1. Inspection_Line_ID
        inspectionNo,                  // 2. Inspection_No
        payload.Inspection_Date,       // 3. Inspection_Date
        fy,                            // 4. Financial_Year
        payload.PO_No,                 // 5. PO_No
        payload.Invoice_No,            // 6. Invoice_No
        payload.Inspection_Note_No,    // 7. Inspection_Note_No
        payload.Inspection_Note_Date,  // 8. Inspection_Note_Date
        receiptLine.RC_No,             // 9. RC_No
        receiptLine.Bidder_Name,       // 10. Bidder_Name
        receiptLine.Distributor_Name || '', // 11. Distributor_Name
        item.Item_ID,                  // 12. Item_ID
        receiptLine.Item_Name,         // 13. Item_Name
        receiptLine.Make || '',        // 14. Make
        receiptLine.Unit,              // 15. Unit
        item.Received_Quantity,        // 16. Received_Quantity
        item.Accepted_Quantity,        // 17. Accepted_Quantity
        item.Rejected_Quantity,        // 18. Rejected_Quantity
        item.Inspection_Result,        // 19. Inspection_Result
        payload.Committee,             // 20. Committee
        payload.Remarks || '',         // 21. Remarks
        '',                            // 22. Inspection_Document_Link
        now,                           // 23. Created_At
        currentUser,                   // 24. Created_By
        '',                            // 25. Updated_At
        ''                             // 26. Updated_By
      ];
    });

    if (rowsData.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rowsData.length, rowsData[0].length).setValues(rowsData);
    }
  }

  /**
   * Updates the Inspection_Status on the parent Receipt lines.
   * Tracks successful updates to allow for transactional rollback.
   * @private
   * @param {Array<Object>} enrichedItems - The items to update.
   * @throws {Object} Custom error object containing successful updates for rollback.
   */
  function _updateReceiptStatuses(enrichedItems) {
    const successfulUpdates = [];
    
    try {
      for (const item of enrichedItems) {
        Receipt.updateInspectionStatus(item.Receipt_Line_ID, item.Inspection_Result);
        successfulUpdates.push(item);
      }
    } catch (error) {
      throw {
        message: `Failed to update Receipt statuses: ${error.message}`,
        successfulUpdates: successfulUpdates
      };
    }
  }

  /**
   * Rolls back a failed Inspection creation attempt.
   * Reverses successful Receipt updates (restoring original status) and deletes rows from Inspection_Register.
   * @private
   * @param {string} inspectionNo - The generated Inspection Number.
   * @param {Array<Object>} successfulUpdates - Array of items that were successfully applied to the Receipt.
   */
  function _rollbackInspection(inspectionNo, successfulUpdates) {
    // 1. Reverse Receipt Updates (Compensating Transaction)
    if (Array.isArray(successfulUpdates)) {
      // Iterate backwards to reverse in LIFO order
      for (let i = successfulUpdates.length - 1; i >= 0; i--) {
        const item = successfulUpdates[i];
        try {
          // Restore the exact status captured before the transaction began
          Receipt.updateInspectionStatus(item.Receipt_Line_ID, item.Original_Inspection_Status);
        } catch (e) {
          console.error(`CRITICAL: Failed to restore Receipt status during rollback for Receipt Line ${item.Receipt_Line_ID}. System may be out of sync.`);
        }
      }
    }

    // 2. Delete Inspection Rows
    if (inspectionNo) {
      const sheet = Utils.getSheet(REGISTER_SHEET_NAME);
      const data = sheet.getDataRange().getValues();
      
      for (let i = data.length - 1; i > 0; i--) {
        if (data[i][1] === inspectionNo) { // Column 2 (index 1) is Inspection_No
          sheet.deleteRow(i + 1);
        }
      }
    }
  }

  /**
   * Clears the user-facing Inspection_Verification sheet after successful persistence.
   * @private
   */
  function _clearEntrySheet() {
    try {
      const sheet = Utils.getSheet(ENTRY_SHEET_NAME);
      const itemRange = sheet.getRange('INSPECTION_ITEM_ROWS');
      if (itemRange) itemRange.clearContent();
    } catch (e) {
      console.warn("Could not clear INSPECTION_ITEM_ROWS. Named range may be missing.");
    }
  }

  // --- Public API ---

  return {
    /**
     * Orchestrates the creation of a new Inspection record.
     * Validates data, quantities, and committee, generates Inspection_No, 
     * persists to register, updates Receipt statuses, and clears entry sheet.
     * 
     * @param {Object} payload - The Inspection data payload.
     * @returns {string} The newly generated Inspection_No.
     * @throws {Error} If validation fails or an error occurs during persistence.
     */
    createInspection: function(payload) {
      let generatedInspectionNo = null;
      let successfulReceiptUpdates = [];

      try {
        // 1. Validate Payload Structure & Quantities
        _validateInspectionPayload(payload);

        // 2. Validate Committee & Results against Settings
        _validateCommittee(payload.Committee);
        _validateInspectionResults(payload.Items);

        // 3. Validate against Authoritative Pending Receipts
        const enrichedItems = _validateAgainstReceipt(payload);

        // 4. Number Generation
        const fy = _getFinancialYear(payload.Inspection_Date);
        generatedInspectionNo = Settings.generateNextDocumentNumber('INSPECTION', fy);

        // 5. Persistence to Inspection_Register
        _persistToRegister(generatedInspectionNo, fy, payload, enrichedItems);

        // 6. Update Receipt Statuses (Transactional)
        try {
          _updateReceiptStatuses(enrichedItems);
        } catch (receiptUpdateError) {
          successfulReceiptUpdates = receiptUpdateError.successfulUpdates || [];
          throw new Error(receiptUpdateError.message);
        }

        // 7. Cleanup Entry Sheet
        _clearEntrySheet();

        console.log(`Successfully created Inspection: ${generatedInspectionNo} for PO: ${payload.PO_No}, Invoice: ${payload.Invoice_No}`);
        return generatedInspectionNo;

      } catch (error) {
        // Execute Rollback on failure
        console.error(`Inspection Creation Failed. Initiating rollback for ${generatedInspectionNo || 'unknown'}. Error: ${error.message}`);
        _rollbackInspection(generatedInspectionNo, successfulReceiptUpdates);
        throw new Error(`Failed to create Inspection: ${error.message}`);
      }
    },

    /**
     * Retrieves all line items for a specific Inspection Number.
     * 
     * @param {string} inspectionNo - The Inspection Number.
     * @returns {Array<Object>} Array of key-value pairs representing the Inspection line items.
     * @throws {Error} If Inspection is not found.
     */
    getInspection: function(inspectionNo) {
      if (!inspectionNo) throw new Error("inspectionNo is required.");
      const sheet = Utils.getSheet(REGISTER_SHEET_NAME);
      const data = sheet.getDataRange().getValues();
      const records = _mapRowsToObjects(data);
      const inspectionItems = records.filter(record => record.Inspection_No === inspectionNo);
      
      if (inspectionItems.length === 0) throw new Error(`Inspection '${inspectionNo}' not found.`);
      return inspectionItems;
    },

    /**
     * Retrieves inspection records linked to a specific PO and Invoice combination.
     * 
     * @param {string} poNo - The Purchase Order Number.
     * @param {string} invoiceNo - The Supplier Invoice Number.
     * @returns {Array<Object>} Array of key-value pairs representing the Inspection line items.
     */
    getInspectionsByInvoice: function(poNo, invoiceNo) {
      if (!poNo || !invoiceNo) throw new Error("poNo and invoiceNo are required.");
      const sheet = Utils.getSheet(REGISTER_SHEET_NAME);
      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) return [];

      const records = _mapRowsToObjects(data);
      return records.filter(record => record.PO_No === poNo && record.Invoice_No === invoiceNo);
    }
  };

})();
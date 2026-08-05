/**
 * @namespace Settings
 * Central configuration provider for AIIMS Store ERP.
 * Strictly adheres to WorkbookDesign.md (Version 1.1).
 */
const Settings = (function() {

  // Centralized constants for column headers to prevent string duplication
  const COLUMNS = {
    GROUP: 'Setting_Group',
    KEY: 'Setting_Key',
    VALUE: 'Setting_Value',
    ACTIVE: 'Active',
    EFFECTIVE_FROM: 'Effective_From',
    EFFECTIVE_TO: 'Effective_To',
    SORT_ORDER: 'Sort_Order'
  };

  // Cache variables to prevent multiple sheet reads during a single execution
  let _cachedRange = null;
  let _cachedHeaders = null;
  let _cachedDataRows = null;

  /**
   * Fetches the SETTINGS_TABLE named range data, utilizing cache if available.
   * @private
   * @param {boolean} forceRefresh - If true, bypasses the cache and reads fresh data.
   * @returns {Object} Object containing the range, headers, and data rows.
   * @throws {Error} If SETTINGS_TABLE named range is missing or empty.
   */
  function _getSettingsData(forceRefresh = false) {
    if (!_cachedDataRows || forceRefresh) {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const range = ss.getRangeByName('SETTINGS_TABLE');
      
      if (!range) {
        throw new Error("Critical Error: Named range 'SETTINGS_TABLE' not found.");
      }
      
      const values = range.getValues();
      if (values.length === 0) {
        throw new Error("Critical Error: 'SETTINGS_TABLE' is empty.");
      }
      
      _cachedHeaders = values[0];
      _cachedDataRows = values.slice(1);
      _cachedRange = range;
    }
    
    return { 
      range: _cachedRange, 
      headers: _cachedHeaders, 
      dataRows: _cachedDataRows 
    };
  }

  /**
   * Gets the index of a column by its header name.
   * @private
   * @param {Array<string>} headers - The header row array.
   * @param {string} colName - The column name to find.
   * @returns {number} The index of the column.
   * @throws {Error} If the column is not found.
   */
  function _getColumnIndex(headers, colName) {
    const index = headers.indexOf(colName);
    if (index === -1) {
      throw new Error(`Critical Error: Column '${colName}' not found in SETTINGS_TABLE.`);
    }
    return index;
  }

  /**
   * Maps a 2D array row to a key-value object based on headers.
   * @private
   * @param {Array} row - The data row from the sheet.
   * @param {Array<string>} headers - The header row from the sheet.
   * @returns {Object} Mapped object.
   */
  function _mapRowToObject(row, headers) {
    const obj = {};
    headers.forEach((header, index) => {
      if (header) {
        obj[header] = row[index];
      }
    });
    return obj;
  }

  /**
   * Evaluates if a setting row is currently active and within its effective dates.
   * Operates directly on the array row to avoid unnecessary object creation.
   * @private
   * @param {Array} row - The data row array.
   * @param {Array<string>} headers - The header row array.
   * @returns {boolean} True if active and effective, false otherwise.
   */
  function _isActiveAndEffective(row, headers) {
    const activeIdx = _getColumnIndex(headers, COLUMNS.ACTIVE);
    const fromIdx = _getColumnIndex(headers, COLUMNS.EFFECTIVE_FROM);
    const toIdx = _getColumnIndex(headers, COLUMNS.EFFECTIVE_TO);

    const isActive = row[activeIdx];
    if (isActive !== true && String(isActive).toUpperCase() !== 'TRUE') {
      return false;
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0); // Normalize to midnight for accurate date comparison

    const effectiveFrom = row[fromIdx];
    if (effectiveFrom && effectiveFrom instanceof Date) {
      const fromDate = new Date(effectiveFrom);
      fromDate.setHours(0, 0, 0, 0);
      if (now < fromDate) return false;
    }

    const effectiveTo = row[toIdx];
    if (effectiveTo && effectiveTo instanceof Date) {
      const toDate = new Date(effectiveTo);
      toDate.setHours(0, 0, 0, 0);
      if (now > toDate) return false;
    }

    return true;
  }

  return {
    /**
     * Retrieves a single active Setting_Value for a specific group and key.
     * 
     * @param {string} group - The Setting_Group to search within.
     * @param {string} key - The Setting_Key to find.
     * @returns {string|number} The Setting_Value.
     * @throws {Error} If the setting is not found, inactive, or expired.
     */
    getSettingValue: function(group, key) {
      if (!group || !key) throw new Error("group and key are required parameters.");
      
      const { headers, dataRows } = _getSettingsData();
      const groupIdx = _getColumnIndex(headers, COLUMNS.GROUP);
      const keyIdx = _getColumnIndex(headers, COLUMNS.KEY);
      const valueIdx = _getColumnIndex(headers, COLUMNS.VALUE);
      
      for (let i = 0; i < dataRows.length; i++) {
        if (dataRows[i][groupIdx] === group && dataRows[i][keyIdx] === key) {
          if (!_isActiveAndEffective(dataRows[i], headers)) {
            throw new Error(`Setting [${group} - ${key}] is inactive or expired.`);
          }
          return dataRows[i][valueIdx];
        }
      }
      
      throw new Error(`Setting [${group} - ${key}] not found in Settings.`);
    },

    /**
     * Retrieves an array of active settings for a given Setting_Group.
     * Results are filtered by effective dates and sorted by Sort_Order.
     * 
     * @param {string} group - The Setting_Group to retrieve.
     * @returns {Array<Object>} Array of setting objects containing all sheet columns.
     */
    getActiveSettingsByGroup: function(group) {
      if (!group) throw new Error("group is a required parameter.");
      
      const { headers, dataRows } = _getSettingsData();
      const groupIdx = _getColumnIndex(headers, COLUMNS.GROUP);
      const results = [];
      
      for (let i = 0; i < dataRows.length; i++) {
        if (dataRows[i][groupIdx] === group) {
          if (_isActiveAndEffective(dataRows[i], headers)) {
            // Only map to an object if the row passes the active/effective filter
            results.push(_mapRowToObject(dataRows[i], headers));
          }
        }
      }
      
      // Sort by Sort_Order (empty or invalid sort orders are pushed to the end)
      results.sort((a, b) => {
        const orderA = (typeof a[COLUMNS.SORT_ORDER] === 'number' && !isNaN(a[COLUMNS.SORT_ORDER])) ? a[COLUMNS.SORT_ORDER] : 999999;
        const orderB = (typeof b[COLUMNS.SORT_ORDER] === 'number' && !isNaN(b[COLUMNS.SORT_ORDER])) ? b[COLUMNS.SORT_ORDER] : 999999;
        return orderA - orderB;
      });
      
      return results;
    },

    /**
     * Generates the next formatted document number and safely increments the running number in the sheet.
     * Uses LockService to prevent race conditions during concurrent generation.
     * 
     * @param {string} documentType - The document type identifier (e.g., 'RC', 'PO', 'RECEIPT', 'INSPECTION').
     * @param {string} financialYear - The active financial year string (e.g., '2023-24').
     * @returns {string} The formatted document number (e.g., 'PO/2023-24/0001').
     * @throws {Error} If numbering configuration is missing or lock cannot be acquired.
     */
    generateNextDocumentNumber: function(documentType, financialYear) {
      if (!documentType || !financialYear) {
        throw new Error("documentType and financialYear are required parameters.");
      }

      const lock = LockService.getScriptLock();
      // Wait up to 10 seconds for other processes to finish generating a number
      if (!lock.tryLock(10000)) {
        throw new Error("System is currently busy generating another document number. Please try again.");
      }

      try {
        // Force refresh to ensure we have the absolute latest running number from the sheet
        const { range, headers, dataRows } = _getSettingsData(true);
        
        const group = 'NUMBERING_CONFIG';
        const prefixKey = `${documentType}_PREFIX`;
        const runningKey = `${documentType}_RUNNING_NUMBER`;
        
        const groupIdx = _getColumnIndex(headers, COLUMNS.GROUP);
        const keyIdx = _getColumnIndex(headers, COLUMNS.KEY);
        const valueIdx = _getColumnIndex(headers, COLUMNS.VALUE);
        
        let prefix = '';
        let runningNumber = 0;
        let runningRowIndex = -1;
        
        // Locate Prefix and Running Number configurations
        for (let i = 0; i < dataRows.length; i++) {
          if (dataRows[i][groupIdx] === group) {
            if (dataRows[i][keyIdx] === prefixKey) {
              prefix = dataRows[i][valueIdx];
            }
            if (dataRows[i][keyIdx] === runningKey) {
              runningNumber = parseInt(dataRows[i][valueIdx], 10) || 0;
              runningRowIndex = i; // Index within dataRows
            }
          }
        }

        if (!prefix) {
          throw new Error(`Numbering configuration missing: Prefix not found for ${documentType} (${prefixKey}).`);
        }
        if (runningRowIndex === -1) {
          throw new Error(`Numbering configuration missing: Running number not found for ${documentType} (${runningKey}).`);
        }

        // Increment the running number
        runningNumber += 1;

        // Calculate absolute sheet coordinates to write back the incremented number
        // range.getRow() is the header row. dataRows[0] is range.getRow() + 1.
        const absoluteSheetRow = range.getRow() + runningRowIndex + 1;
        const absoluteSheetCol = range.getColumn() + valueIdx;
        
        // Write the new running number back to the Settings sheet
        range.getSheet().getRange(absoluteSheetRow, absoluteSheetCol).setValue(runningNumber);

        // Invalidate cache since we just modified the sheet data
        _cachedDataRows = null;

        // Format the document number: PREFIX/FY/000X (Padded to 4 digits)
        const paddedNumber = runningNumber.toString().padStart(4, '0');
        return `${prefix}/${financialYear}/${paddedNumber}`;

      } finally {
        // Always release the lock, even if an error occurs
        lock.releaseLock();
      }
    }
  };

})();
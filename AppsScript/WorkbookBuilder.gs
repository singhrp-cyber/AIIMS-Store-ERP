/**
 * @namespace WorkbookBuilder
 * Execution engine to provision and verify the AIIMS Store ERP workbook.
 * Strictly adheres to WorkbookConfig.gs.
 * Idempotent architecture.
 */
const WorkbookBuilder = (function() {

  // --- Private Helper Functions ---

  /**
   * Converts a column letter to its corresponding index (A=1, B=2).
   * @private
   * @param {string} letter - The column letter.
   * @returns {number} The column index.
   */
  function _letterToColumn(letter) {
    let column = 0;
    const length = letter.length;
    for (let i = 0; i < length; i++) {
      column += (letter.charCodeAt(i) - 64) * Math.pow(26, length - i - 1);
    }
    return column;
  }

  /**
   * Converts a column index to its corresponding letter (1=A, 2=B).
   * @private
   * @param {number} column - The column index.
   * @returns {string} The column letter.
   */
  function _columnToLetter(column) {
    let temp, letter = '';
    while (column > 0) {
      temp = (column - 1) % 26;
      letter = String.fromCharCode(temp + 65) + letter;
      column = (column - temp - 1) / 26;
    }
    return letter;
  }

  /**
   * Provisions a sheet. Creates it if it doesn't exist.
   * @private
   * @param {string} sheetName - The name of the sheet.
   * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss - The active spreadsheet.
   * @returns {GoogleAppsScript.Spreadsheet.Sheet} The provisioned sheet.
   */
  function _provisionSheet(sheetName, ss) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    return sheet;
  }

  /**
   * Applies headers to a sheet if Row 1 is empty.
   * @private
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The target sheet.
   * @param {Array<string>} headers - The array of header strings.
   */
  function _applyHeaders(sheet, headers) {
    if (headers && headers.length > 0) {
      // Check if Row 1 is empty to prevent overwriting existing headers/data
      const firstRowValues = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
      const isRowEmpty = firstRowValues.every(cell => cell === '');
      
      if (isRowEmpty) {
        const range = sheet.getRange(1, 1, 1, headers.length);
        range.setValues([headers]);
      }
    }
  }

  /**
   * Calculates the dynamic A1 notation for a named range and provisions it.
   * @private
   * @param {Object} rangeConfig - The named range configuration object.
   * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss - The active spreadsheet.
   */
  function _provisionNamedRange(rangeConfig, ss) {
    const sheet = ss.getSheetByName(rangeConfig.sheetName);
    if (!sheet) return;

    let targetRangeNotation = 'A1'; // Fallback

    // Use Presentation config if explicitly defined
    if (WorkbookConfig.PRESENTATION && WorkbookConfig.PRESENTATION.NAMED_RANGE_NOTATIONS) {
      const predefinedNotation = WorkbookConfig.PRESENTATION.NAMED_RANGE_NOTATIONS[rangeConfig.name];
      if (predefinedNotation) {
        targetRangeNotation = predefinedNotation;
      }
    } else {
      // Dynamic calculation based on headers if no presentation config exists
      const headers = WorkbookConfig.HEADERS[rangeConfig.sheetName];
      if (headers && headers.length > 0) {
        const lastColLetter = _columnToLetter(headers.length);
        // Default to a large row count for tables, or specific rows if it's an entry sheet
        // Since we can't guess entry sheet bounds without config, we rely on the presentation config
        // provided in WorkbookConfig.gs. If missing, we default to a safe table range.
        targetRangeNotation = `A1:${lastColLetter}1000`; 
      }
    }

    const targetRange = sheet.getRange(targetRangeNotation);
    let namedRange = ss.getNamedRanges().find(nr => nr.getName() === rangeConfig.name);
    
    if (namedRange) {
      namedRange.setRange(targetRange);
    } else {
      ss.setNamedRange(rangeConfig.name, targetRange);
    }
  }

  /**
   * Applies presentation formatting to a sheet.
   * @private
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The target sheet.
   * @param {string} sheetName - The name of the sheet.
   */
  function _applyFormatting(sheet, sheetName) {
    if (!WorkbookConfig.PRESENTATION) return;

    // Freeze Rows
    if (WorkbookConfig.PRESENTATION.FREEZE_ROWS && WorkbookConfig.PRESENTATION.FREEZE_ROWS[sheetName]) {
      sheet.setFrozenRows(WorkbookConfig.PRESENTATION.FREEZE_ROWS[sheetName]);
    }

    const maxCols = sheet.getMaxColumns();
    const maxRows = sheet.getMaxRows();

    // Header Style
    if (WorkbookConfig.PRESENTATION.HEADER_STYLES && WorkbookConfig.PRESENTATION.HEADER_STYLES[sheetName]) {
      const style = WorkbookConfig.PRESENTATION.HEADER_STYLES[sheetName];
      const headerRange = sheet.getRange(1, 1, 1, maxCols);
      headerRange.setBackground(style.background);
      headerRange.setFontColor(style.fontColor);
      headerRange.setFontWeight(style.bold ? 'bold' : 'normal');
    }

    // Data Formatting
    if (WorkbookConfig.PRESENTATION.DATA_FORMATTING && WorkbookConfig.PRESENTATION.DATA_FORMATTING[sheetName]) {
      const formatConfig = WorkbookConfig.PRESENTATION.DATA_FORMATTING[sheetName];
      
      if (formatConfig.dateColumns) {
        formatConfig.dateColumns.forEach(colIdx => {
          if (colIdx <= maxCols && maxRows > 1) {
            sheet.getRange(2, colIdx, maxRows - 1, 1).setNumberFormat('dd-mm-yyyy');
          }
        });
      }

      if (formatConfig.currencyColumns) {
        formatConfig.currencyColumns.forEach(colIdx => {
          if (colIdx <= maxCols && maxRows > 1) {
            sheet.getRange(2, colIdx, maxRows - 1, 1).setNumberFormat('₹#,##0.00');
          }
        });
      }

      if (formatConfig.centerAlignColumns) {
        formatConfig.centerAlignColumns.forEach(colIdx => {
          if (colIdx <= maxCols) {
            sheet.getRange(1, colIdx, maxRows, 1).setHorizontalAlignment('center');
          }
        });
      }
    }
  }

  /**
   * Applies protection rules to a sheet based strictly on WorkbookConfig.
   * @private
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The target sheet.
   * @param {string} sheetName - The name of the sheet.
   */
  function _applyProtections(sheet, sheetName) {
    const protectionConfig = WorkbookConfig.PROTECTION.find(p => p.sheetName === sheetName);
    if (!protectionConfig) return;

    const desc = protectionConfig.description.toLowerCase();
    
    // If SSOT specifies "Entire sheet" or "Entire register", apply sheet-level protection.
    if (desc.includes('entire sheet') || desc.includes('entire register')) {
      const protections = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET);
      if (protections.length === 0) {
        const protection = sheet.protect().setDescription(protectionConfig.description);
        // In a production environment, this should restrict editors to specific roles.
        // For automated setup, we apply the protection. The exact editor list is environment-specific.
        protection.setWarningOnly(true); 
      }
    }
    // Note: Cell-level protections (e.g., "Header row") require specific range calculations
    // which are not explicitly defined in SSOT coordinates. They are deferred to UI/Entry logic
    // or require manual setup post-deployment.
  }

  /**
   * Sets up the Dashboard layout based on Presentation config.
   * @private
   * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss - The active spreadsheet.
   */
  function _setupDashboard(ss) {
    if (!WorkbookConfig.PRESENTATION || !WorkbookConfig.PRESENTATION.DASHBOARD_LAYOUT) return;
    
    const sheet = ss.getSheetByName('Dashboard');
    if (!sheet) return;

    const layout = WorkbookConfig.PRESENTATION.DASHBOARD_LAYOUT;
    
    if (layout.headers) {
      layout.headers.forEach(header => {
        const range = sheet.getRange(header.range);
        range.setValues(header.values);
        range.setBackground(header.background);
        range.setFontColor(header.fontColor);
        range.setFontWeight('bold');
      });
    }

    if (layout.columnWidths) {
      Object.keys(layout.columnWidths).forEach(colLetter => {
        const colIdx = _letterToColumn(colLetter);
        sheet.setColumnWidth(colIdx, layout.columnWidths[colLetter]);
      });
    }
  }

  /**
   * Sets up the Reports layout based on Presentation config.
   * @private
   * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss - The active spreadsheet.
   */
  function _setupReports(ss) {
    if (!WorkbookConfig.PRESENTATION || !WorkbookConfig.PRESENTATION.REPORTS_LAYOUT) return;

    const sheet = ss.getSheetByName('Reports');
    if (!sheet) return;

    const layout = WorkbookConfig.PRESENTATION.REPORTS_LAYOUT;
    
    if (layout.headers) {
      layout.headers.forEach(header => {
        const range = sheet.getRange(header.range);
        range.setValues(header.values);
        range.setBackground(header.background);
        range.setFontColor(header.fontColor);
        range.setFontWeight('bold');
      });
    }

    if (layout.columnWidths) {
      Object.keys(layout.columnWidths).forEach(colLetter => {
        const colIdx = _letterToColumn(colLetter);
        sheet.setColumnWidth(colIdx, layout.columnWidths[colLetter]);
      });
    }
  }

  // --- Internal Phases ---

  function _phaseStructure(ss) {
    // 1. Permanent Sheets
    WorkbookConfig.SHEETS.forEach(sheetConfig => {
      const sheet = _provisionSheet(sheetConfig.name, ss);
      _applyHeaders(sheet, WorkbookConfig.HEADERS[sheetConfig.name]);
      
      if (sheetConfig.hidden) {
        sheet.hideSheet();
      }
    });

    // 2. Dynamic Template Sheet
    if (WorkbookConfig.DYNAMIC_SHEETS && WorkbookConfig.DYNAMIC_SHEETS.RC_ITEM_TEMPLATE) {
      const templateConfig = WorkbookConfig.DYNAMIC_SHEETS.RC_ITEM_TEMPLATE;
      const templateSheet = _provisionSheet(templateConfig.sheetName, ss);
      _applyHeaders(templateSheet, templateConfig.headers);
      
      if (templateConfig.hidden) {
        templateSheet.hideSheet();
      }
    }

    // 3. Named Ranges
    WorkbookConfig.NAMED_RANGES.forEach(rangeConfig => {
      _provisionNamedRange(rangeConfig, ss);
    });
  }

  function _phaseFormatting(ss) {
    // 1. Permanent Sheets Formatting & Protection
    WorkbookConfig.SHEETS.forEach(sheetConfig => {
      const sheet = ss.getSheetByName(sheetConfig.name);
      if (!sheet) return;

      _applyFormatting(sheet, sheetConfig.name);
      _applyProtections(sheet, sheetConfig.name);
    });

    // 2. Dynamic Template Formatting
    if (WorkbookConfig.DYNAMIC_SHEETS && WorkbookConfig.DYNAMIC_SHEETS.RC_ITEM_TEMPLATE) {
      const templateConfig = WorkbookConfig.DYNAMIC_SHEETS.RC_ITEM_TEMPLATE;
      const templateSheet = ss.getSheetByName(templateConfig.sheetName);
      
      if (templateSheet && templateConfig.presentation) {
        if (templateConfig.presentation.freezeRows) {
          templateSheet.setFrozenRows(templateConfig.presentation.freezeRows);
        }
        if (templateConfig.presentation.headerStyle) {
          const style = templateConfig.presentation.headerStyle;
          const headerRange = templateSheet.getRange(1, 1, 1, templateSheet.getMaxColumns());
          headerRange.setBackground(style.background);
          headerRange.setFontColor(style.fontColor);
          headerRange.setFontWeight(style.bold ? 'bold' : 'normal');
        }
      }
    }

    // 3. Layouts
    _setupDashboard(ss);
    _setupReports(ss);
  }

  function _phaseVerification(ss) {
    return WorkbookBuilder.verifyWorkbook();
  }

  // --- Public API ---

  return {
    /**
     * Orchestrates the complete provisioning of the workbook.
     * Executes in three phases: Structure, Formatting, Verification.
     * Idempotent operation.
     * 
     * @returns {Object} Verification results.
     */
    buildWorkbook: function() {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      
      _phaseStructure(ss);
      _phaseFormatting(ss);
      
      return _phaseVerification(ss);
    },

    /**
     * Scans the current workbook against WorkbookConfig and returns a diagnostic report.
     * 
     * @returns {Object} { success, sheetStatus, headerStatus, namedRangeStatus, warnings, errors }
     */
    verifyWorkbook: function() {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const result = {
        success: true,
        sheetStatus: [],
        headerStatus: [],
        namedRangeStatus: [],
        warnings: [],
        errors: []
      };

      // 1. Verify Permanent Sheets
      WorkbookConfig.SHEETS.forEach(config => {
        const sheet = ss.getSheetByName(config.name);
        if (!sheet) {
          result.sheetStatus.push({ name: config.name, status: 'Missing' });
          result.errors.push(`Missing Sheet: ${config.name}`);
          result.success = false;
        } else {
          result.sheetStatus.push({ name: config.name, status: 'OK' });
        }
      });

      // 2. Verify Dynamic Template Sheet
      if (WorkbookConfig.DYNAMIC_SHEETS && WorkbookConfig.DYNAMIC_SHEETS.RC_ITEM_TEMPLATE) {
        const templateName = WorkbookConfig.DYNAMIC_SHEETS.RC_ITEM_TEMPLATE.sheetName;
        if (!ss.getSheetByName(templateName)) {
          result.sheetStatus.push({ name: templateName, status: 'Missing' });
          result.errors.push(`Missing Template Sheet: ${templateName}`);
          result.success = false;
        } else {
          result.sheetStatus.push({ name: templateName, status: 'OK' });
        }
      }

      // 3. Verify Headers
      Object.keys(WorkbookConfig.HEADERS).forEach(sheetName => {
        const sheet = ss.getSheetByName(sheetName);
        const expectedHeaders = WorkbookConfig.HEADERS[sheetName];
        
        if (sheet && expectedHeaders.length > 0) {
          const actualHeaders = sheet.getRange(1, 1, 1, expectedHeaders.length).getValues()[0];
          
          let match = true;
          for (let i = 0; i < expectedHeaders.length; i++) {
            if (String(expectedHeaders[i]).trim() !== String(actualHeaders[i]).trim()) {
              match = false;
              break;
            }
          }
          
          if (!match) {
            result.headerStatus.push({ sheet: sheetName, status: 'Mismatch' });
            result.errors.push(`Header Mismatch on Sheet: ${sheetName}`);
            result.success = false;
          } else {
            result.headerStatus.push({ sheet: sheetName, status: 'OK' });
          }
        }
      });

      // 4. Verify Named Ranges
      const existingRanges = ss.getNamedRanges().map(nr => nr.getName());
      WorkbookConfig.NAMED_RANGES.forEach(config => {
        if (!existingRanges.includes(config.name)) {
          result.namedRangeStatus.push({ name: config.name, status: 'Missing' });
          result.errors.push(`Missing Named Range: ${config.name}`);
          result.success = false;
        } else {
          result.namedRangeStatus.push({ name: config.name, status: 'OK' });
        }
      });

      return result;
    },

    /**
     * Seeds the Settings sheet with default configuration data.
     * Dynamically determines column indexes from the Settings header row.
     * Idempotent: Will not duplicate existing Group + Key combinations.
     * 
     * @returns {number} Number of new settings inserted.
     */
    seedSettings: function() {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName('Settings');
      if (!sheet) throw new Error("Settings sheet not found.");

      if (!WorkbookConfig.SETTINGS_SEED || WorkbookConfig.SETTINGS_SEED.length === 0) {
        return 0;
      }

      // Dynamically determine column indexes
      const headers = sheet.getRange(1, 1, 1, sheet.getMaxColumns()).getValues()[0];
      const groupIdx = headers.indexOf('Setting_Group');
      const keyIdx = headers.indexOf('Setting_Key');
      
      if (groupIdx === -1 || keyIdx === -1) {
        throw new Error("Critical Error: 'Setting_Group' or 'Setting_Key' column not found in Settings sheet.");
      }

      const data = sheet.getDataRange().getValues();
      const existingKeys = new Set();
      
      for (let i = 1; i < data.length; i++) {
        existingKeys.add(`${data[i][groupIdx]}_${data[i][keyIdx]}`);
      }

      const rowsToInsert = [];
      const now = new Date();
      const user = Session.getActiveUser().getEmail();

      // Map seed data to the exact header structure
      WorkbookConfig.SETTINGS_SEED.forEach(seed => {
        const compositeKey = `${seed.group}_${seed.key}`;
        if (!existingKeys.has(compositeKey)) {
          const newRow = new Array(headers.length).fill('');
          
          // Populate known fields based on header index
          headers.forEach((header, idx) => {
            if (header === 'Setting_ID') newRow[idx] = Utilities.getUuid();
            if (header === 'Setting_Group') newRow[idx] = seed.group;
            if (header === 'Setting_Key') newRow[idx] = seed.key;
            if (header === 'Setting_Value') newRow[idx] = seed.value;
            if (header === 'Sort_Order') newRow[idx] = 1;
            if (header === 'Active') newRow[idx] = true;
            if (header === 'Remarks') newRow[idx] = 'System Seed';
            if (header === 'Created_At') newRow[idx] = now;
            if (header === 'Created_By') newRow[idx] = user;
          });

          rowsToInsert.push(newRow);
        }
      });

      if (rowsToInsert.length > 0) {
        sheet.getRange(sheet.getLastRow() + 1, 1, rowsToInsert.length, rowsToInsert[0].length).setValues(rowsToInsert);
      }

      return rowsToInsert.length;
    },

    /**
     * Clears all transaction data while preserving headers, master data, validations, and formatting.
     * Deletes dynamic RC item sheets (except the template).
     * Requires explicit confirmation parameter to prevent accidental data loss.
     * 
     * @param {boolean} confirm - Must be exactly true.
     * @returns {boolean} True if successful.
     * @throws {Error} If confirmation is missing or invalid.
     */
    resetTransactions: function(confirm) {
      if (confirm !== true) {
        throw new Error("CRITICAL: resetTransactions requires explicit 'true' confirmation parameter to execute.");
      }

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      
      // 1. Clear Transaction Registers (Preserve formatting/validation)
      const registersToClear = [
        'PO_Register', 
        'Receipt_Register', 
        'Inspection_Register', 
        'Transaction_Log', 
        'Error_Log'
      ];

      registersToClear.forEach(sheetName => {
        const sheet = ss.getSheetByName(sheetName);
        if (sheet && sheet.getLastRow() > 1) {
          // clearContent() preserves formatting and data validation
          sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getMaxColumns()).clearContent();
        }
      });

      // 2. Clear Entry Ranges (Preserve formatting/validation)
      const entryRangesToClear = [
        'PO_ENTRY_ITEM_ROWS',
        'RECEIPT_ENTRY_ITEM_ROWS',
        'INSPECTION_ITEM_ROWS'
      ];

      entryRangesToClear.forEach(rangeName => {
        const range = ss.getRangeByName(rangeName);
        if (range) {
          range.clearContent();
        }
      });

      // 3. Delete Dynamic RC Item Sheets
      const permanentSheetNames = WorkbookConfig.SHEETS.map(s => s.name);
      const templateName = WorkbookConfig.DYNAMIC_SHEETS ? WorkbookConfig.DYNAMIC_SHEETS.RC_ITEM_TEMPLATE.sheetName : null;
      
      const allSheets = ss.getSheets();
      allSheets.forEach(sheet => {
        const name = sheet.getName();
        // If it's not a permanent sheet and not the template, it's a dynamic RC sheet
        if (!permanentSheetNames.includes(name) && name !== templateName) {
          ss.deleteSheet(sheet);
        }
      });

      return true;
    }
  };

})();
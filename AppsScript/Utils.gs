/**
 * Shared utility module.
 *
 * Intended ownership:
 * - Common validation helpers.
 * - Spreadsheet access wrappers.
 * - Audit metadata helpers.
 * - Error normalization and user-safe messages.
 *
 * No executable utilities are implemented in Phase 1.
 */
/**
 * @file Utils.gs
 * @description Generic utility functions for Google Sheets interactions, validation, conversion, and date handling.
 * This module contains no business logic and is completely agnostic to the specific ERP implementation.
 */

'use strict';

// ============================================================================
// SPREADSHEET HELPER FUNCTIONS
// ============================================================================

/**
 * Retrieves a Google Sheet object by its name.
 * 
 * @param {string} sheetName - The name of the sheet to retrieve.
 * @returns {GoogleAppsScript.Spreadsheet.Sheet} The sheet object.
 * @throws {Error} If the sheet does not exist.
 */
function getSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`Utils.getSheet: Sheet not found - "${sheetName}"`);
  }
  return sheet;
}

/**
 * Finds the last row containing data in a specific column.
 * Optimized to use sheet.getLastRow() as the upper scan limit.
 * 
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet object.
 * @param {number} columnNumber - The 1-based index of the column to check.
 * @returns {number} The row number of the last non-empty cell in the column, or 0 if empty.
 */
function getLastRowWithData(sheet, columnNumber) {
  const lastRow = sheet.getLastRow();
  if (lastRow === 0) return 0;
  
  const values = sheet.getRange(1, columnNumber, lastRow, 1).getValues();
  for (let i = values.length - 1; i >= 0; i--) {
    if (values[i][0] !== "" && values[i][0] !== null) {
      return i + 1;
    }
  }
  return 0;
}

/**
 * Retrieves a 2D array of values from a specified named range.
 * 
 * @param {string} rangeName - The name of the named range.
 * @returns {Array<Array<any>>} A 2D array of values.
 * @throws {Error} If the named range does not exist.
 */
function getNamedRangeValues(rangeName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const range = ss.getRangeByName(rangeName);
  if (!range) {
    throw new Error(`Utils.getNamedRangeValues: Named range not found - "${rangeName}"`);
  }
  return range.getValues();
}

/**
 * Appends a row of data to the bottom of the specified sheet using setValues().
 * Relies on the specified keyColumn to determine the last row with data.
 * 
 * @param {string} sheetName - The name of the sheet.
 * @param {Array<any>} rowData - A 1D array of values representing the row to append.
 * @param {number} [keyColumn=1] - The 1-based index of the column to check for the last row. Defaults to 1.
 * @returns {GoogleAppsScript.Spreadsheet.Sheet} The sheet object, for chaining if needed.
 * @throws {Error} If the sheet does not exist or if rowData is not an array.
 */
function appendRow(sheetName, rowData, keyColumn = 1) {
  if (!Array.isArray(rowData)) {
    throw new Error(`Utils.appendRow: rowData must be an array.`);
  }
  
  const sheet = getSheet(sheetName);
  const lastRow = getLastRowWithData(sheet, keyColumn);
  const targetRow = lastRow + 1;
  
  sheet.getRange(targetRow, 1, 1, rowData.length).setValues([rowData]);
  return sheet;
}

// ============================================================================
// GENERIC VALIDATION HELPERS
// ============================================================================

/**
 * Checks if a value is null, undefined, or an empty string.
 * 
 * @param {any} value - The value to check.
 * @returns {boolean} True if the value is empty, false otherwise.
 */
function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  return false;
}

/**
 * Checks if a value is a valid, finite number.
 * 
 * @param {any} value - The value to check.
 * @returns {boolean} True if the value is a valid number, false otherwise.
 */
function isNumber(value) {
  if (isEmpty(value)) return false;
  const num = Number(value);
  return !isNaN(num) && isFinite(num);
}

/**
 * Checks if a value is a valid JavaScript Date object.
 * 
 * @param {any} value - The value to check.
 * @returns {boolean} True if the value is a valid Date, false otherwise.
 */
function isValidDate(value) {
  return value instanceof Date && !isNaN(value.getTime());
}

// ============================================================================
// GENERIC CONVERSION & STRING HELPERS
// ============================================================================

/**
 * Generates a standard pseudo-random UUID string.
 * 
 * @returns {string} A UUID string.
 */
function generateUUID() {
  return Utilities.getUuid();
}

/**
 * Safely converts a value to a number.
 * 
 * @param {any} value - The value to convert.
 * @returns {number|null} The converted number, or null if conversion fails.
 */
function toNumber(value) {
  if (isEmpty(value)) return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

/**
 * Safely trims a value by converting it to a string first.
 * Returns an empty string if the value is null or undefined.
 * 
 * @param {any} value - The value to trim.
 * @returns {string} The trimmed string.
 */
function safeTrim(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
}

/**
 * Normalizes text by trimming and replacing multiple spaces with a single space.
 * 
 * @param {any} value - The value to normalize.
 * @returns {string} The normalized string, or an empty string if the value is empty.
 */
function normalizeText(value) {
  if (isEmpty(value)) return '';
  return String(value).trim().replace(/\s+/g, ' ');
}

// ============================================================================
// GENERIC DATE/TIME HELPERS
// ============================================================================

/**
 * Returns the current system timestamp.
 * 
 * @returns {Date} The current Date object.
 */
function getSystemTimestamp() {
  return new Date();
}

/**
 * Formats a Date object into a string using the script's timezone.
 * 
 * @param {Date} date - The date to format.
 * @param {string} formatString - The format string (e.g., 'yyyy-MM-dd').
 * @returns {string} The formatted date string.
 * @throws {Error} If the provided date is invalid or format string is empty.
 */
function formatDate(date, formatString) {
  if (!isValidDate(date)) {
    throw new Error(`Utils.formatDate: Invalid date provided for formatting.`);
  }
  if (isEmpty(formatString)) {
    throw new Error(`Utils.formatDate: Format string cannot be empty.`);
  }
  return Utilities.formatDate(date, Session.getScriptTimeZone(), formatString);
}
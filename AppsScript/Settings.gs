/**
 * AIIMS Store ERP — Settings module.
 *
 * Generic loader for the Settings worksheet. Reads, validates, caches, and
 * exposes setting values and groups. Business-specific interpretation belongs
 * in other modules.
 *
 * @fileoverview Settings sheet access layer for AIIMS Store ERP.
 */

/** @const {string} Settings worksheet name. */
var SETTINGS_SHEET_NAME = 'Settings';

/** @const {number} Header row index (1-based). */
var SETTINGS_HEADER_ROW = 1;

/** @const {number} First data row index (1-based). */
var SETTINGS_DATA_START_ROW = 2;

/**
 * Expected Settings sheet column headers in display order.
 * @const {string[]}
 */
var SETTINGS_COLUMNS = [
  'Setting_ID',
  'Setting_Group',
  'Setting_Key',
  'Setting_Value',
  'Display_Label',
  'Sort_Order',
  'Active',
  'Effective_From',
  'Effective_To',
  'Remarks',
  'Created_At',
  'Created_By',
  'Updated_At',
  'Updated_By'
];

/**
 * Settings module error codes.
 * @const {Object<string, string>}
 */
var SETTINGS_ERROR_CODE = {
  SHEET_NOT_FOUND: 'SHEET_NOT_FOUND',
  INVALID_HEADER: 'INVALID_HEADER',
  EMPTY_SETTINGS: 'EMPTY_SETTINGS',
  DUPLICATE_KEY: 'DUPLICATE_KEY',
  INVALID_VALUE: 'INVALID_VALUE',
  INACTIVE_SETTING: 'INACTIVE_SETTING',
  EXPIRED_SETTING: 'EXPIRED_SETTING',
  VALIDATION_FAILED: 'VALIDATION_FAILED'
};

/** @type {Object|null} In-memory cache for the current script run. */
var settingsCache_ = null;

/**
 * Structured error thrown by the Settings module.
 *
 * @param {string} message Human-readable error message.
 * @param {string} code Error code from {@link SETTINGS_ERROR_CODE}.
 * @param {Object=} details Optional diagnostic details.
 * @constructor
 */
function SettingsError(message, code, details) {
  this.name = 'SettingsError';
  this.message = message;
  this.code = code || SETTINGS_ERROR_CODE.VALIDATION_FAILED;
  this.details = details || {};
}

SettingsError.prototype = Object.create(Error.prototype);
SettingsError.prototype.constructor = SettingsError;

/**
 * Clears the in-memory settings cache.
 *
 * @returns {void}
 */
function clearSettingsCache() {
  settingsCache_ = null;
}

/**
 * Clears the cache and reloads settings from the Settings sheet.
 *
 * @param {Object=} options Optional {@link loadSettings} options.
 * @returns {Object} Parsed settings payload.
 * @throws {SettingsError} When loading fails.
 */
function reloadSettings(options) {
  clearSettingsCache();
  return loadSettings(options);
}

/**
 * Loads active, effective settings from the Settings sheet.
 *
 * @param {Object=} options Optional load options.
 * @param {boolean=} options.useCache When true (default), reuse cached settings.
 * @param {boolean=} options.includeInactive When true, include inactive rows.
 * @returns {Object} Parsed settings payload with `loadedAt`, `rowCount`, `index`, and `rows`.
 * @throws {SettingsError} When the sheet is missing, headers are invalid, or row parsing fails.
 */
function loadSettings(options) {
  var opts = options || {};
  var useCache = opts.useCache !== false;

  if (useCache && settingsCache_ !== null) {
    return settingsCache_;
  }

  var rows = readSettingsRows_();
  var filteredRows = opts.includeInactive ? rows : filterActiveSettings_(rows);
  filteredRows = filterEffectiveSettings_(filteredRows);

  var payload = {
    loadedAt: new Date(),
    rowCount: filteredRows.length,
    index: buildSettingsIndex_(filteredRows),
    rows: filteredRows
  };

  if (useCache) {
    settingsCache_ = payload;
  }

  return payload;
}

/**
 * Validates Settings sheet structure and row integrity.
 *
 * @returns {Object} Result with `valid`, `errors`, and `warnings` arrays.
 */
function validateSettingsSheet() {
  var errors = [];
  var warnings = [];

  try {
    getSettingsSheet_();
    getSettingsHeaderMap_();
  } catch (error) {
    return buildValidationResult_(false, [toSettingsError_(error)], warnings);
  }

  var rows;
  try {
    rows = readSettingsRows_();
  } catch (error) {
    return buildValidationResult_(false, [toSettingsError_(error)], warnings);
  }

  if (rows.length === 0) {
    errors.push(new SettingsError(
      'Settings sheet contains no configuration rows.',
      SETTINGS_ERROR_CODE.EMPTY_SETTINGS
    ));
    return buildValidationResult_(false, errors, warnings);
  }

  rows.forEach(function(row, rowIndex) {
    collectRowIssues_(row, rowIndex, errors, warnings);
  });
  collectDuplicateKeyIssues_(rows, errors);

  return buildValidationResult_(errors.length === 0, errors, warnings);
}

/**
 * Returns a setting value by group and key.
 *
 * @param {string} settingGroup Setting_Group value.
 * @param {string} settingKey Setting_Key value.
 * @param {Object=} options Optional {@link loadSettings} options.
 * @returns {string|null} Setting value, or null when not found.
 */
function getSetting(settingGroup, settingKey, options) {
  var settings = loadSettings(options);
  var groupIndex = settings.index[settingGroup];
  var row = groupIndex ? groupIndex[settingKey] : null;
  return row ? row.settingValue : null;
}

/**
 * Returns all settings for a group.
 *
 * @param {string} settingGroup Setting_Group value.
 * @param {Object=} options Optional {@link loadSettings} options.
 * @returns {Object[]} Parsed setting rows for the group.
 */
function getSettingsByGroup(settingGroup, options) {
  var settings = loadSettings(options);
  var groupIndex = settings.index[settingGroup] || {};
  return Object.keys(groupIndex).map(function(key) {
    return groupIndex[key];
  });
}

/**
 * Returns all distinct setting group names from loaded settings.
 *
 * @param {Object=} options Optional {@link loadSettings} options.
 * @returns {string[]} Setting group names sorted alphabetically.
 */
function getSettingGroups(options) {
  var settings = loadSettings(options);
  return Object.keys(settings.index).sort();
}

/**
 * Returns the Settings worksheet.
 *
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 * @throws {SettingsError} When the sheet does not exist.
 * @private
 */
function getSettingsSheet_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SETTINGS_SHEET_NAME);

  if (!sheet) {
    throw new SettingsError(
      'Settings sheet "' + SETTINGS_SHEET_NAME + '" was not found.',
      SETTINGS_ERROR_CODE.SHEET_NOT_FOUND,
      { sheetName: SETTINGS_SHEET_NAME }
    );
  }

  return sheet;
}

/**
 * Builds a header-name to column-index map.
 *
 * @returns {Object<string, number>}
 * @throws {SettingsError} When headers are invalid.
 * @private
 */
function getSettingsHeaderMap_() {
  var sheet = getSettingsSheet_();
  var headerValues = sheet.getRange(SETTINGS_HEADER_ROW, 1, 1, SETTINGS_COLUMNS.length).getValues()[0];
  var headerMap = {};
  var missingHeaders = [];

  SETTINGS_COLUMNS.forEach(function(expectedHeader, index) {
    var actualHeader = String(headerValues[index] || '').trim();

    if (actualHeader !== expectedHeader) {
      missingHeaders.push({ expected: expectedHeader, actual: actualHeader, columnIndex: index + 1 });
      return;
    }

    headerMap[expectedHeader] = index;
  });

  if (missingHeaders.length > 0) {
    throw new SettingsError(
      'Settings sheet header row is invalid.',
      SETTINGS_ERROR_CODE.INVALID_HEADER,
      { missingHeaders: missingHeaders }
    );
  }

  return headerMap;
}

/**
 * Reads and parses all non-empty Settings rows.
 *
 * @returns {Object[]}
 * @throws {SettingsError} When row parsing fails.
 * @private
 */
function readSettingsRows_() {
  var sheet = getSettingsSheet_();
  var headerMap = getSettingsHeaderMap_();
  var lastRow = sheet.getLastRow();

  if (lastRow < SETTINGS_DATA_START_ROW) {
    return [];
  }

  var numRows = lastRow - SETTINGS_DATA_START_ROW + 1;
  var values = sheet.getRange(SETTINGS_DATA_START_ROW, 1, numRows, SETTINGS_COLUMNS.length).getValues();

  return values
    .map(function(rowValues, offset) {
      return parseSettingRow_(rowValues, headerMap, SETTINGS_DATA_START_ROW + offset);
    })
    .filter(function(row) {
      return row !== null;
    });
}

/**
 * Parses a single Settings sheet row.
 *
 * @param {Array} rowValues Raw row values.
 * @param {Object<string, number>} headerMap Header map.
 * @param {number} sheetRowNumber 1-based sheet row number.
 * @returns {Object|null} Parsed row, or null when blank.
 * @throws {SettingsError} When mandatory fields are invalid.
 * @private
 */
function parseSettingRow_(rowValues, headerMap, sheetRowNumber) {
  var settingId = getCellValue_(rowValues, headerMap, 'Setting_ID');
  var settingGroup = getCellValue_(rowValues, headerMap, 'Setting_Group');
  var settingKey = getCellValue_(rowValues, headerMap, 'Setting_Key');

  if (!settingId && !settingGroup && !settingKey) {
    return null;
  }

  if (!settingId || !settingGroup || !settingKey) {
    throw new SettingsError(
      'Settings row ' + sheetRowNumber + ' must contain Setting_ID, Setting_Group, and Setting_Key.',
      SETTINGS_ERROR_CODE.INVALID_VALUE,
      { sheetRowNumber: sheetRowNumber, settingId: settingId, settingGroup: settingGroup, settingKey: settingKey }
    );
  }

  var active = normalizeBoolean_(getCellValue_(rowValues, headerMap, 'Active'), true);
  var settingValue = getCellValue_(rowValues, headerMap, 'Setting_Value');
  var effectiveFrom = normalizeDate_(getCellValue_(rowValues, headerMap, 'Effective_From'));
  var effectiveTo = normalizeDate_(getCellValue_(rowValues, headerMap, 'Effective_To'));

  if (active && !settingValue) {
    throw new SettingsError(
      'Active setting "' + settingGroup + '.' + settingKey + '" must have a Setting_Value.',
      SETTINGS_ERROR_CODE.INVALID_VALUE,
      { sheetRowNumber: sheetRowNumber, settingGroup: settingGroup, settingKey: settingKey }
    );
  }

  if (effectiveFrom && effectiveTo && stripTime_(effectiveFrom) > stripTime_(effectiveTo)) {
    throw new SettingsError(
      'Setting "' + settingGroup + '.' + settingKey + '" has Effective_From later than Effective_To.',
      SETTINGS_ERROR_CODE.INVALID_VALUE,
      { sheetRowNumber: sheetRowNumber, settingGroup: settingGroup, settingKey: settingKey }
    );
  }

  return {
    settingId: settingId,
    settingGroup: settingGroup,
    settingKey: settingKey,
    settingValue: settingValue,
    displayLabel: getCellValue_(rowValues, headerMap, 'Display_Label'),
    sortOrder: normalizeSortOrder_(getCellValue_(rowValues, headerMap, 'Sort_Order')),
    active: active,
    effectiveFrom: effectiveFrom,
    effectiveTo: effectiveTo,
    remarks: getCellValue_(rowValues, headerMap, 'Remarks'),
    createdAt: normalizeDate_(getCellValue_(rowValues, headerMap, 'Created_At')),
    createdBy: getCellValue_(rowValues, headerMap, 'Created_By'),
    updatedAt: normalizeDate_(getCellValue_(rowValues, headerMap, 'Updated_At')),
    updatedBy: getCellValue_(rowValues, headerMap, 'Updated_By'),
    sheetRowNumber: sheetRowNumber
  };
}

/**
 * Builds a nested lookup index: group -> key -> row.
 *
 * @param {Object[]} rows Parsed setting rows.
 * @returns {Object<string, Object<string, Object>>}
 * @private
 */
function buildSettingsIndex_(rows) {
  var index = {};

  rows.forEach(function(row) {
    if (!index[row.settingGroup]) {
      index[row.settingGroup] = {};
    }
    index[row.settingGroup][row.settingKey] = row;
  });

  return index;
}

/**
 * Keeps only rows marked active.
 *
 * @param {Object[]} rows Parsed setting rows.
 * @returns {Object[]}
 * @private
 */
function filterActiveSettings_(rows) {
  return rows.filter(function(row) {
    return row.active === true;
  });
}

/**
 * Keeps only rows effective for the current date.
 *
 * @param {Object[]} rows Parsed setting rows.
 * @param {Date=} referenceDate Reference date for effective-range checks.
 * @returns {Object[]}
 * @private
 */
function filterEffectiveSettings_(rows, referenceDate) {
  var today = referenceDate || new Date();

  return rows.filter(function(row) {
    if (row.effectiveFrom && today < stripTime_(row.effectiveFrom)) {
      return false;
    }
    if (row.effectiveTo && today > stripTime_(row.effectiveTo)) {
      return false;
    }
    return true;
  });
}

/**
 * Collects row-level validation issues.
 *
 * @param {Object} row Parsed setting row.
 * @param {number} rowIndex Zero-based row index.
 * @param {SettingsError[]} errors Collected errors.
 * @param {SettingsError[]} warnings Collected warnings.
 * @returns {void}
 * @private
 */
function collectRowIssues_(row, rowIndex, errors, warnings) {
  if (!row.settingId || !row.settingGroup || !row.settingKey) {
    errors.push(new SettingsError(
      'Settings row ' + (row.sheetRowNumber || rowIndex + SETTINGS_DATA_START_ROW) + ' is missing mandatory fields.',
      SETTINGS_ERROR_CODE.INVALID_VALUE,
      { row: row }
    ));
  }

  if (row.active && !row.settingValue) {
    errors.push(new SettingsError(
      'Active setting "' + row.settingGroup + '.' + row.settingKey + '" has a blank Setting_Value.',
      SETTINGS_ERROR_CODE.INVALID_VALUE,
      { row: row }
    ));
  }

  if (!row.active) {
    warnings.push(new SettingsError(
      'Setting "' + row.settingGroup + '.' + row.settingKey + '" is inactive.',
      SETTINGS_ERROR_CODE.INACTIVE_SETTING,
      { row: row }
    ));
  }

  if (row.effectiveTo && !filterEffectiveSettings_([row]).length) {
    warnings.push(new SettingsError(
      'Setting "' + row.settingGroup + '.' + row.settingKey + '" is outside its effective date range.',
      SETTINGS_ERROR_CODE.EXPIRED_SETTING,
      { row: row }
    ));
  }
}

/**
 * Detects duplicate active Setting_Group + Setting_Key combinations.
 *
 * @param {Object[]} rows Parsed setting rows.
 * @param {SettingsError[]} errors Collected errors.
 * @returns {void}
 * @private
 */
function collectDuplicateKeyIssues_(rows, errors) {
  var seen = {};

  rows.forEach(function(row) {
    if (!row.active) {
      return;
    }

    var compoundKey = row.settingGroup + '\u0000' + row.settingKey;

    if (seen[compoundKey]) {
      errors.push(new SettingsError(
        'Duplicate active setting key "' + row.settingGroup + '.' + row.settingKey + '".',
        SETTINGS_ERROR_CODE.DUPLICATE_KEY,
        {
          settingGroup: row.settingGroup,
          settingKey: row.settingKey,
          firstRowNumber: seen[compoundKey],
          duplicateRowNumber: row.sheetRowNumber
        }
      ));
      return;
    }

    seen[compoundKey] = row.sheetRowNumber;
  });
}

/**
 * Reads a trimmed cell value from a row.
 *
 * @param {Array} rowValues Raw row values.
 * @param {Object<string, number>} headerMap Header map.
 * @param {string} headerName Column header name.
 * @returns {string}
 * @private
 */
function getCellValue_(rowValues, headerMap, headerName) {
  var value = rowValues[headerMap[headerName]];
  return value === null || value === undefined ? '' : String(value).trim();
}

/**
 * Normalizes a boolean-like setting value.
 *
 * @param {string|boolean} value Raw value.
 * @param {boolean=} defaultValue Default when value is blank.
 * @returns {boolean}
 * @throws {SettingsError} When the value is not a recognized boolean.
 * @private
 */
function normalizeBoolean_(value, defaultValue) {
  if (value === '' || value === null || value === undefined) {
    return defaultValue === true;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  var normalized = String(value).trim().toUpperCase();

  if (normalized === 'TRUE' || normalized === 'YES' || normalized === '1') {
    return true;
  }

  if (normalized === 'FALSE' || normalized === 'NO' || normalized === '0') {
    return false;
  }

  throw new SettingsError(
    'Invalid boolean value "' + value + '". Expected TRUE or FALSE.',
    SETTINGS_ERROR_CODE.INVALID_VALUE,
    { value: value }
  );
}

/**
 * Normalizes a date-like cell value.
 *
 * @param {Date|string|number} value Raw value.
 * @returns {Date|null}
 * @throws {SettingsError} When the value is not a valid date.
 * @private
 */
function normalizeDate_(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return value;
  }

  var parsed = new Date(value);

  if (isNaN(parsed.getTime())) {
    throw new SettingsError(
      'Invalid date value "' + value + '".',
      SETTINGS_ERROR_CODE.INVALID_VALUE,
      { value: value }
    );
  }

  return parsed;
}

/**
 * Normalizes Sort_Order to a whole number, defaulting to zero.
 *
 * @param {string|number} value Raw sort order value.
 * @returns {number}
 * @throws {SettingsError} When the value is not a whole number.
 * @private
 */
function normalizeSortOrder_(value) {
  if (value === '' || value === null || value === undefined) {
    return 0;
  }

  var sortOrder = Number(value);

  if (isNaN(sortOrder) || sortOrder % 1 !== 0) {
    throw new SettingsError(
      'Invalid Sort_Order value "' + value + '". Expected a whole number.',
      SETTINGS_ERROR_CODE.INVALID_VALUE,
      { value: value }
    );
  }

  return sortOrder;
}

/**
 * Removes the time component from a date.
 *
 * @param {Date} date Input date.
 * @returns {Date}
 * @private
 */
function stripTime_(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Normalizes unknown errors into {@link SettingsError} objects.
 *
 * @param {*} error Caught error.
 * @returns {SettingsError}
 * @private
 */
function toSettingsError_(error) {
  if (error instanceof SettingsError) {
    return error;
  }

  return new SettingsError(
    error && error.message ? error.message : 'Unexpected settings module error.',
    SETTINGS_ERROR_CODE.VALIDATION_FAILED,
    { originalError: error }
  );
}

/**
 * Builds a validation result object.
 *
 * @param {boolean} valid Whether validation passed.
 * @param {SettingsError[]} errors Error collection.
 * @param {SettingsError[]} warnings Warning collection.
 * @returns {Object}
 * @private
 */
function buildValidationResult_(valid, errors, warnings) {
  return {
    valid: valid,
    errors: errors.map(serializeSettingsError_),
    warnings: warnings.map(serializeSettingsError_)
  };
}

/**
 * Serializes a {@link SettingsError} for structured reporting.
 *
 * @param {SettingsError} error Settings error instance.
 * @returns {Object}
 * @private
 */
function serializeSettingsError_(error) {
  return {
    name: error.name,
    message: error.message,
    code: error.code,
    details: error.details || {}
  };
}

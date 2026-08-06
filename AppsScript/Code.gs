/**
 * AIIMS Store ERP
 *
 * Application entry module for the Google Apps Script project.
 * Phase 1 intentionally defines project architecture only. Runtime workflows,
 * custom menus, triggers, and business operations will be introduced in later
 * implementation phases after the workbook contract is finalized.
 */
/**
 * Run workbook deployment.
 */
function buildWorkbook() {
  return WorkbookBuilder.buildWorkbook();
}

/**
 * Verify workbook structure.
 */
function verifyWorkbook() {
  return WorkbookBuilder.verifyWorkbook();
}

/**
 * Seed Settings sheet.
 */
function seedSettings() {
  return WorkbookBuilder.seedSettings();
}

/**
 * Reset transaction data.
 */
function resetTransactions() {
  return WorkbookBuilder.resetTransactions(true);
}
/**
 * @namespace WordGenerator
 * Document generation engine for AIIMS Store ERP.
 * Strictly adheres to WorkbookDesign.md (Version 1.1).
 * Utilizes DocumentApp and DriveApp for template binding and PDF generation.
 */
const WordGenerator = (function() {

  // --- Constants ---
  const SETTINGS_GROUP = 'TEMPLATE_CONFIG';
  const TABLE_PLACEHOLDER = '{{#ITEM_TABLE#}}';

  const _TEMPLATE_KEYS = {
    RC: 'RC_TEMPLATE_ID',
    PO: 'PO_TEMPLATE_ID',
    RECEIPT: 'RECEIPT_TEMPLATE_ID',
    INSPECTION: 'INSPECTION_TEMPLATE_ID',
    REPORT: 'REPORT_TEMPLATE_ID', // Base template for reports
    FOLDER: 'OUTPUT_FOLDER_ID'
  };

  // --- Private Helper Functions ---

  /**
   * Formats a date object into a standard string (DD-MM-YYYY).
   * @private
   * @param {Date|string} dateObj - The date to format.
   * @returns {string} Formatted date string.
   */
  function _formatDate(dateObj) {
    if (!dateObj) return '';
    const d = new Date(dateObj);
    if (isNaN(d.getTime())) return String(dateObj);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
   * Fetches a configuration value from Settings.gs.
   * @private
   * @param {string} key - The setting key.
   * @returns {string} The setting value (e.g., Drive ID).
   * @throws {Error} If the setting is missing.
   */
  function _getConfig(key) {
    try {
      return Settings.getSettingValue(SETTINGS_GROUP, key);
    } catch (e) {
      throw new Error(`Configuration Error: Missing '${key}' in Settings group '${SETTINGS_GROUP}'.`);
    }
  }

  /**
   * Copies a template file to the designated output folder.
   * @private
   * @param {string} templateId - The Drive ID of the template.
   * @param {string} newFileName - The desired name for the new file.
   * @returns {GoogleAppsScript.Document.Document} The newly created Document object.
   * @throws {Error} If file operations fail.
   */
  function _provisionDocument(templateId, newFileName) {
    const folderId = _getConfig(_TEMPLATE_KEYS.FOLDER);
    
    try {
      const templateFile = DriveApp.getFileById(templateId);
      const outputFolder = DriveApp.getFolderById(folderId);
      const newFile = templateFile.makeCopy(newFileName, outputFolder);
      return DocumentApp.openById(newFile.getId());
    } catch (e) {
      throw new Error(`Failed to provision document from template '${templateId}': ${e.message}`);
    }
  }

  /**
   * Validates that the template contains all required placeholders.
   * Fails fast and deletes the provisioned document if validation fails.
   * @private
   * @param {GoogleAppsScript.Document.Document} doc - The provisioned document.
   * @param {Array<string>} requiredTextTags - Array of required {{Tags}}.
   * @param {boolean} requiresTable - Whether the {{#ITEM_TABLE#}} tag is required.
   * @throws {Error} If validation fails.
   */
  function _validateTemplatePlaceholders(doc, requiredTextTags, requiresTable) {
    const body = doc.getBody();
    const text = body.getText();
    const missingTags = [];

    requiredTextTags.forEach(tag => {
      if (!text.includes(tag)) {
        missingTags.push(tag);
      }
    });

    if (requiresTable && !text.includes(TABLE_PLACEHOLDER)) {
      missingTags.push(TABLE_PLACEHOLDER);
    }

    if (missingTags.length > 0) {
      const docId = doc.getId();
      doc.saveAndClose();
      DriveApp.getFileById(docId).setTrashed(true); // Rollback
      throw new Error(`Template Validation Failed. Missing placeholders: ${missingTags.join(', ')}`);
    }
  }

  /**
   * Replaces text placeholders in the document body, header, and footer.
   * @private
   * @param {GoogleAppsScript.Document.Document} doc - The document.
   * @param {Object} dataObject - Key-value pairs for replacement.
   */
  function _replaceTextPlaceholders(doc, dataObject) {
    const body = doc.getBody();
    const header = doc.getHeader();
    const footer = doc.getFooter();

    Object.keys(dataObject).forEach(key => {
      const placeholder = `{{${key}}}`;
      let value = dataObject[key];
      
      if (value instanceof Date) {
        value = _formatDate(value);
      } else if (value === null || value === undefined) {
        value = '';
      } else {
        value = String(value);
      }

      body.replaceText(placeholder, value);
      if (header) header.replaceText(placeholder, value);
      if (footer) footer.replaceText(placeholder, value);
    });
  }

  /**
   * Finds the table containing the placeholder and populates it with item data.
   * @private
   * @param {GoogleAppsScript.Document.Document} doc - The document.
   * @param {Array<Object>} itemsArray - Array of item objects.
   * @param {Array<string>} columnKeys - Array of object keys mapping to table columns.
   */
  function _populateItemTable(doc, itemsArray, columnKeys) {
    const body = doc.getBody();
    const tables = body.getTables();
    let targetTable = null;
    let templateRowIndex = -1;

    // Find the table and row containing the placeholder
    for (let t = 0; t < tables.length; t++) {
      const table = tables[t];
      for (let r = 0; r < table.getNumRows(); r++) {
        const row = table.getRow(r);
        if (row.getText().includes(TABLE_PLACEHOLDER)) {
          targetTable = table;
          templateRowIndex = r;
          break;
        }
      }
      if (targetTable) break;
    }

    if (!targetTable) return; // Validation should have caught this, but safe fallback

    // Extract formatting from the template row (assuming first cell formatting applies to all)
    const templateRow = targetTable.getRow(templateRowIndex);
    const templateCell = templateRow.getCell(0);
    const attributes = templateCell.getAttributes();

    // Append new rows
    itemsArray.forEach((item, index) => {
      const newRow = targetTable.appendTableRow();
      
      // Add Serial Number column if requested (assuming first column is Sl No if not in keys)
      // For strict mapping, we only map provided keys.
      columnKeys.forEach(key => {
        let val = item[key];
        if (val instanceof Date) val = _formatDate(val);
        if (val === null || val === undefined) val = '';
        
        const cell = newRow.appendTableCell(String(val));
        cell.setAttributes(attributes);
      });
    });

    // Remove the placeholder row
    targetTable.removeRow(templateRowIndex);
  }

  /**
   * Converts a Google Doc to a PDF and saves it in the same folder.
   * @private
   * @param {string} docId - The Google Doc ID.
   * @param {string} pdfName - The desired PDF file name.
   * @returns {string} The URL of the generated PDF.
   */
  function _convertToPDF(docId, pdfName) {
    const docFile = DriveApp.getFileById(docId);
    const folder = docFile.getParents().next();
    const pdfBlob = docFile.getAs('application/pdf');
    pdfBlob.setName(pdfName);
    const pdfFile = folder.createFile(pdfBlob);
    return pdfFile.getUrl();
  }

  // --- Public API ---

  return {
    /**
     * Generates the official Rate Contract document.
     * 
     * @param {string} rcNo - The Rate Contract Number.
     * @returns {Object} { docUrl: string, pdfUrl: string }
     * @throws {Error} If RC is not found or generation fails.
     */
    generateRateContract: function(rcNo) {
      if (!rcNo) throw new Error("rcNo is required.");

      const headerData = RC.getRateContract(rcNo);
      const itemsData = RC.getRateContractItems(rcNo);
      
      const templateId = _getConfig(_TEMPLATE_KEYS.RC);
      const fileName = `RC_${rcNo.replace(/\//g, '_')}`;
      
      const doc = _provisionDocument(templateId, fileName);
      
      try {
        const requiredTags = ['{{RC_No}}', '{{RC_Name}}', '{{Start_Date}}', '{{End_Date}}'];
        _validateTemplatePlaceholders(doc, requiredTags, true);

        _replaceTextPlaceholders(doc, headerData);

        const tableColumns = ['Item_Code', 'Item_Name', 'Item_Specification', 'UOM', 'Make', 'Rate', 'GST', 'Bidder_Name'];
        _populateItemTable(doc, itemsData, tableColumns);

        doc.saveAndClose();
        const pdfUrl = _convertToPDF(doc.getId(), `${fileName}.pdf`);

        return { docUrl: doc.getUrl(), pdfUrl: pdfUrl };
      } catch (error) {
        throw new Error(`Failed to generate Rate Contract document: ${error.message}`);
      }
    },

    /**
     * Generates the official Purchase Order document.
     * 
     * @param {string} poNo - The Purchase Order Number.
     * @returns {Object} { docUrl: string, pdfUrl: string }
     * @throws {Error} If PO is not found or generation fails.
     */
    generatePurchaseOrder: function(poNo) {
      if (!poNo) throw new Error("poNo is required.");

      const itemsData = PO.getPurchaseOrder(poNo);
      const headerData = itemsData[0]; // PO header data is duplicated across lines
      
      // Calculate Grand Total
      const grandTotal = itemsData.reduce((sum, item) => sum + (Number(item.Total_Amount) || 0), 0);
      headerData.Grand_Total = grandTotal.toFixed(2);

      const templateId = _getConfig(_TEMPLATE_KEYS.PO);
      const fileName = `PO_${poNo.replace(/\//g, '_')}`;
      
      const doc = _provisionDocument(templateId, fileName);
      
      try {
        const requiredTags = ['{{PO_No}}', '{{PO_Date}}', '{{Bidder_Name}}', '{{Delivery_Address}}', '{{Grand_Total}}'];
        _validateTemplatePlaceholders(doc, requiredTags, true);

        _replaceTextPlaceholders(doc, headerData);

        const tableColumns = ['Item_ID', 'Item_Name', 'Item_Description', 'Ordered_Quantity', 'Unit', 'Rate', 'GST_Percent', 'Total_Amount'];
        _populateItemTable(doc, itemsData, tableColumns);

        doc.saveAndClose();
        const pdfUrl = _convertToPDF(doc.getId(), `${fileName}.pdf`);

        return { docUrl: doc.getUrl(), pdfUrl: pdfUrl };
      } catch (error) {
        throw new Error(`Failed to generate Purchase Order document: ${error.message}`);
      }
    },

    /**
     * Generates the Goods Receipt Note.
     * 
     * @param {string} receiptNo - The Receipt Number.
     * @returns {Object} { docUrl: string, pdfUrl: string }
     * @throws {Error} If Receipt is not found or generation fails.
     */
    generateReceipt: function(receiptNo) {
      if (!receiptNo) throw new Error("receiptNo is required.");

      const itemsData = Receipt.getReceipt(receiptNo);
      const headerData = itemsData[0];
      
      const templateId = _getConfig(_TEMPLATE_KEYS.RECEIPT);
      const fileName = `GRN_${receiptNo.replace(/\//g, '_')}`;
      
      const doc = _provisionDocument(templateId, fileName);
      
      try {
        const requiredTags = ['{{Receipt_No}}', '{{Receipt_Date}}', '{{PO_No}}', '{{Invoice_No}}'];
        _validateTemplatePlaceholders(doc, requiredTags, true);

        _replaceTextPlaceholders(doc, headerData);

        const tableColumns = ['Item_ID', 'Item_Name', 'Ordered_Quantity', 'Received_Quantity', 'Balance_Quantity'];
        _populateItemTable(doc, itemsData, tableColumns);

        doc.saveAndClose();
        const pdfUrl = _convertToPDF(doc.getId(), `${fileName}.pdf`);

        return { docUrl: doc.getUrl(), pdfUrl: pdfUrl };
      } catch (error) {
        throw new Error(`Failed to generate Receipt document: ${error.message}`);
      }
    },

    /**
     * Generates a single Inspection Note.
     * 
     * @param {string} inspectionNo - The Inspection Number.
     * @returns {Object} { docUrl: string, pdfUrl: string }
     * @throws {Error} If Inspection is not found or generation fails.
     */
    generateInspectionNote: function(inspectionNo) {
      if (!inspectionNo) throw new Error("inspectionNo is required.");

      const itemsData = Inspection.getInspection(inspectionNo);
      const headerData = itemsData[0];
      
      const templateId = _getConfig(_TEMPLATE_KEYS.INSPECTION);
      const fileName = `INSP_${inspectionNo.replace(/\//g, '_')}`;
      
      const doc = _provisionDocument(templateId, fileName);
      
      try {
        const requiredTags = ['{{Inspection_No}}', '{{Inspection_Date}}', '{{PO_No}}', '{{Invoice_No}}', '{{Committee}}'];
        _validateTemplatePlaceholders(doc, requiredTags, true);

        _replaceTextPlaceholders(doc, headerData);

        const tableColumns = ['Item_ID', 'Item_Name', 'Received_Quantity', 'Accepted_Quantity', 'Rejected_Quantity', 'Inspection_Result'];
        _populateItemTable(doc, itemsData, tableColumns);

        doc.saveAndClose();
        const pdfUrl = _convertToPDF(doc.getId(), `${fileName}.pdf`);

        return { docUrl: doc.getUrl(), pdfUrl: pdfUrl };
      } catch (error) {
        throw new Error(`Failed to generate Inspection document: ${error.message}`);
      }
    },

    /**
     * Generates a single Inspection Note combining multiple invoices.
     * 
     * @param {string} poNo - The Purchase Order Number.
     * @param {Array<string>} invoiceNosArray - Array of Invoice Numbers to include.
     * @returns {Object} { docUrl: string, pdfUrl: string }
     * @throws {Error} If data is missing or generation fails.
     */
    generateCombinedInspectionNote: function(poNo, invoiceNosArray) {
      if (!poNo || !Array.isArray(invoiceNosArray) || invoiceNosArray.length === 0) {
        throw new Error("poNo and a non-empty invoiceNosArray are required.");
      }

      let combinedItems = [];
      let headerData = null;

      invoiceNosArray.forEach(invoiceNo => {
        const items = Inspection.getInspectionsByInvoice(poNo, invoiceNo);
        if (items.length > 0) {
          if (!headerData) headerData = items[0]; // Use first record for common header info
          combinedItems = combinedItems.concat(items);
        }
      });

      if (combinedItems.length === 0) {
        throw new Error(`No inspection records found for PO '${poNo}' and the provided invoices.`);
      }

      // Override specific header fields for the combined view
      headerData.Invoice_No = 'Multiple Invoices';
      headerData.Inspection_No = 'Combined Note';

      const templateId = _getConfig(_TEMPLATE_KEYS.INSPECTION);
      const fileName = `COMBINED_INSP_${poNo.replace(/\//g, '_')}`;
      
      const doc = _provisionDocument(templateId, fileName);
      
      try {
        const requiredTags = ['{{PO_No}}', '{{Committee}}'];
        _validateTemplatePlaceholders(doc, requiredTags, true);

        _replaceTextPlaceholders(doc, headerData);

        // Include Invoice_No in the table for clarity in a combined note
        const tableColumns = ['Invoice_No', 'Item_ID', 'Item_Name', 'Received_Quantity', 'Accepted_Quantity', 'Rejected_Quantity', 'Inspection_Result'];
        _populateItemTable(doc, combinedItems, tableColumns);

        doc.saveAndClose();
        const pdfUrl = _convertToPDF(doc.getId(), `${fileName}.pdf`);

        return { docUrl: doc.getUrl(), pdfUrl: pdfUrl };
      } catch (error) {
        throw new Error(`Failed to generate Combined Inspection document: ${error.message}`);
      }
    },

    /**
     * Converts a report generated by Reports.gs into a document.
     * 
     * @param {string} reportName - The name of the report.
     * @param {Object} filters - The active filters.
     * @param {string} format - 'PDF' or 'DOC'.
     * @returns {Object} { url: string } The URL of the generated file.
     * @throws {Error} If report generation fails.
     */
    generateReportDocument: function(reportName, filters, format) {
      if (!reportName || !format) throw new Error("reportName and format are required.");
      const upperFormat = String(format).toUpperCase();
      if (upperFormat !== 'PDF' && upperFormat !== 'DOC') {
        throw new Error("format must be 'PDF' or 'DOC'.");
      }

      const reportData = Reports.getReportData(reportName, filters);
      
      const templateId = _getConfig(_TEMPLATE_KEYS.REPORT);
      const timestamp = _formatDate(new Date());
      const fileName = `Report_${reportName.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}`;
      
      const doc = _provisionDocument(templateId, fileName);
      
      try {
        const requiredTags = ['{{Report_Name}}', '{{Generated_Date}}'];
        _validateTemplatePlaceholders(doc, requiredTags, true);

        _replaceTextPlaceholders(doc, {
          Report_Name: reportName,
          Generated_Date: timestamp
        });

        // For reports, we dynamically build the table rather than mapping specific keys
        const body = doc.getBody();
        const tables = body.getTables();
        let targetTable = null;
        let templateRowIndex = -1;

        for (let t = 0; t < tables.length; t++) {
          const table = tables[t];
          for (let r = 0; r < table.getNumRows(); r++) {
            if (table.getRow(r).getText().includes(TABLE_PLACEHOLDER)) {
              targetTable = table;
              templateRowIndex = r;
              break;
            }
          }
          if (targetTable) break;
        }

        if (targetTable) {
          const templateCell = targetTable.getRow(templateRowIndex).getCell(0);
          const attributes = templateCell.getAttributes();

          // Append Headers
          const headerRow = targetTable.appendTableRow();
          reportData.headers.forEach(header => {
            const cell = headerRow.appendTableCell(String(header));
            cell.setAttributes(attributes);
            cell.setBold(true);
          });

          // Append Data Rows
          reportData.rows.forEach(row => {
            const dataRow = targetTable.appendTableRow();
            row.forEach(val => {
              const cell = dataRow.appendTableCell(String(val));
              cell.setAttributes(attributes);
            });
          });

          // Append Footers
          if (reportData.footers && reportData.footers.length > 0) {
            const footerRow = targetTable.appendTableRow();
            reportData.footers.forEach(val => {
              const cell = footerRow.appendTableCell(String(val));
              cell.setAttributes(attributes);
              cell.setBold(true);
            });
          }

          targetTable.removeRow(templateRowIndex);
        }

        doc.saveAndClose();

        if (upperFormat === 'PDF') {
          const pdfUrl = _convertToPDF(doc.getId(), `${fileName}.pdf`);
          DriveApp.getFileById(doc.getId()).setTrashed(true); // Clean up the temp doc
          return { url: pdfUrl };
        } else {
          return { url: doc.getUrl() };
        }

      } catch (error) {
        throw new Error(`Failed to generate Report document: ${error.message}`);
      }
    }
  };

})();
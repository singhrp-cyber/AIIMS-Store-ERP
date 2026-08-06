/**
 * @namespace WorkbookConfig
 * Configuration-driven blueprint for the AIIMS Store ERP workbook.
 * Strictly adheres to WorkbookDesign.md (Version 1.1).
 * Contains NO execution logic.
 * Strictly separates Business Structure from Presentation.
 */
const WorkbookConfig = {

  // ============================================================================
  // BUSINESS CONFIGURATION
  // Derived strictly from WorkbookDesign.md (Version 1.1)
  // ============================================================================

  // WorkbookDesign.md Section: Document Freeze (Version 1.1)
  METADATA: {
    VERSION: '1.0.0-backend',
    SPEC_VERSION: '1.1'
  },

  // WorkbookDesign.md Section 1 (Workbook Sheet Classification)
  // WorkbookDesign.md Section 6 (Hidden System Sheets)
  // Contains ONLY permanent workbook sheets.
  SHEETS: [
    { name: 'Settings', type: 'Master', hidden: false },
    { name: 'RC_Header', type: 'Master', hidden: false },
    { name: 'PO_Entry', type: 'Transaction', hidden: false },
    { name: 'PO_Register', type: 'Transaction', hidden: false },
    { name: 'Receipt_Entry', type: 'Transaction', hidden: false },
    { name: 'Receipt_Register', type: 'Transaction', hidden: false },
    { name: 'Inspection_Verification', type: 'Transaction', hidden: false },
    { name: 'Inspection_Register', type: 'Transaction', hidden: false },
    { name: 'Dashboard', type: 'Report', hidden: false },
    { name: 'Reports', type: 'Report', hidden: false },
    { name: 'Transaction_Log', type: 'System', hidden: true },
    { name: 'Error_Log', type: 'System', hidden: true }
  ],

  // WorkbookDesign.md Section 3.3 (RC_Item_Sheet)
  // Dynamic template copied by RC.gs during Rate Contract creation.
  DYNAMIC_SHEETS: {
    RC_ITEM_TEMPLATE: {
      sheetName: "_RC_ITEM_TEMPLATE",
      hidden: true,
      headers: [
        'RC_No', 'Item_Code', 'Item_Name', 'Item_Specification', 'UOM', 'Make', 
        'Rate', 'GST', 'Bidder_Name', 'Distributor_Name'
      ],
      presentation: {
        freezeRows: 1,
        headerStyle: { background: '#4a86e8', fontColor: '#ffffff', bold: true }
      }
    }
  },

  // WorkbookDesign.md Sections 3.1 to 6.2 (Columns Tables)
  HEADERS: {
    // WorkbookDesign.md Section 3.1
    'Settings': [
      'Setting_ID', 'Setting_Group', 'Setting_Key', 'Setting_Value', 'Display_Label', 
      'Sort_Order', 'Active', 'Effective_From', 'Effective_To', 'Remarks', 
      'Created_At', 'Created_By', 'Updated_At', 'Updated_By'
    ],
    // WorkbookDesign.md Section 3.2
    'RC_Header': [
      'RC_No', 'RC_Name', 'Sheet_Name', 'RC_Date', 'Start_Date', 'End_Date', 
      'Status', 'Total_Items', 'Total_Bidders', 'Document_Ref', 'Remarks'
    ],
    // WorkbookDesign.md Section 4.1
    'PO_Entry': [
      'Entry_Row_ID', 'PO_No', 'PO_Date', 'Financial_Year', 'RC_No', 'Bidder_ID', 
      'Bidder_Name', 'Distributor_ID', 'Distributor_Name', 'Delivery_Period_Days', 
      'Delivery_Address', 'Consignee', 'Supply_Mode', 'Item_ID', 'Item_Name', 
      'Item_Description', 'Make', 'Unit', 'Quantity', 'Rate', 'Taxable_Amount', 
      'GST_Percent', 'GST_Amount', 'Total_Amount', 'PO_Status', 'Remarks', 
      'Created_At', 'Created_By'
    ],
    // WorkbookDesign.md Section 4.2
    'PO_Register': [
      'PO_Line_ID', 'PO_No', 'PO_Date', 'Financial_Year', 'RC_No', 'Bidder_ID', 
      'Bidder_Name', 'Distributor_ID', 'Distributor_Name', 'Delivery_Period_Days', 
      'Delivery_Address', 'Consignee', 'Supply_Mode', 'Item_ID', 'Item_Name', 
      'Item_Description', 'Make', 'Unit', 'Ordered_Quantity', 'Rate', 'Taxable_Amount', 
      'GST_Percent', 'GST_Amount', 'Total_Amount', 'Received_Quantity', 'Balance_Quantity', 
      'PO_Status', 'Close_Reason', 'PO_Document_Link', 'Locked', 'Created_At', 
      'Created_By', 'Updated_At', 'Updated_By'
    ],
    // WorkbookDesign.md Section 4.3
    'Receipt_Entry': [
      'Receipt_Entry_Row_ID', 'Receipt_No', 'Receipt_Date', 'Financial_Year', 'PO_No', 
      'Invoice_No', 'Invoice_Date', 'Supplier_Invoice_Value', 'RC_No', 'Bidder_Name', 
      'Distributor_Name', 'Item_ID', 'Item_Name', 'Make', 'Unit', 'Ordered_Quantity', 
      'Previously_Received_Quantity', 'Balance_Quantity', 'Received_Quantity', 'Rate', 
      'GST_Percent', 'Taxable_Value', 'GST_Value', 'Total_Value', 'Receipt_Status', 
      'Remarks', 'Created_At', 'Created_By'
    ],
    // WorkbookDesign.md Section 4.4
    'Receipt_Register': [
      'Receipt_Line_ID', 'Receipt_No', 'Receipt_Date', 'Financial_Year', 'PO_No', 
      'Invoice_No', 'Invoice_Date', 'Supplier_Invoice_Value', 'RC_No', 'Bidder_Name', 
      'Distributor_Name', 'Item_ID', 'Item_Name', 'Make', 'Unit', 'Ordered_Quantity', 
      'Received_Quantity', 'Cumulative_Received_Quantity', 'Balance_Quantity', 'Rate', 
      'GST_Percent', 'Taxable_Value', 'GST_Value', 'Total_Value', 'Receipt_Status', 
      'Inspection_Required', 'Inspection_Status', 'Receipt_Document_Link', 'Created_At', 
      'Created_By', 'Updated_At', 'Updated_By'
    ],
    // WorkbookDesign.md Section 4.5
    'Inspection_Verification': [
      'Inspection_Entry_Row_ID', 'Inspection_No', 'Inspection_Date', 'Financial_Year', 
      'PO_No', 'Invoice_No', 'Inspection_Note_No', 'Inspection_Note_Date', 'RC_No', 
      'Bidder_Name', 'Distributor_Name', 'Item_ID', 'Item_Name', 'Make', 'Unit', 
      'Received_Quantity', 'Accepted_Quantity', 'Rejected_Quantity', 'Inspection_Result', 
      'Committee', 'Remarks', 'Created_At', 'Created_By'
    ],
    // WorkbookDesign.md Section 4.6
    'Inspection_Register': [
      'Inspection_Line_ID', 'Inspection_No', 'Inspection_Date', 'Financial_Year', 
      'PO_No', 'Invoice_No', 'Inspection_Note_No', 'Inspection_Note_Date', 'RC_No', 
      'Bidder_Name', 'Distributor_Name', 'Item_ID', 'Item_Name', 'Make', 'Unit', 
      'Received_Quantity', 'Accepted_Quantity', 'Rejected_Quantity', 'Inspection_Result', 
      'Committee', 'Remarks', 'Inspection_Document_Link', 'Created_At', 'Created_By', 
      'Updated_At', 'Updated_By'
    ],
    // WorkbookDesign.md Section 6.1
    'Transaction_Log': [
      'Log_ID', 'Event_Timestamp', 'User', 'Action', 'Sheet_Name', 'Record_Key', 
      'Reference_No', 'Old_Value', 'New_Value', 'Remarks'
    ],
    // WorkbookDesign.md Section 6.2
    'Error_Log': [
      'Error_ID', 'Error_Timestamp', 'User', 'Module', 'Sheet_Name', 'Record_Key', 
      'Error_Type', 'Error_Message', 'Stack_Trace', 'Resolution_Status', 'Resolved_At', 
      'Resolved_By', 'Remarks'
    ],
    // WorkbookDesign.md Section 5.2
    'Reports': [
      'Report_Run_ID', 'Report_Name', 'Financial_Year', 'Quarter', 'Month', 'Date_From', 
      'Date_To', 'RC_No', 'PO_No', 'Bidder', 'Distributor', 'Item', 'Status', 'Output_Area'
    ],
    // WorkbookDesign.md Section 5.1
    'Dashboard': []
  },

  // WorkbookDesign.md Sections 3.1 to 6.2 (Named Ranges Required)
  NAMED_RANGES: [
    // WorkbookDesign.md Section 3.1
    { name: 'SETTINGS_TABLE', sheetName: 'Settings' },
    { name: 'FINANCIAL_YEAR_LIST', sheetName: 'Settings' },
    { name: 'STATUS_LIST', sheetName: 'Settings' },
    { name: 'RC_STATUS_LIST', sheetName: 'Settings' },
    { name: 'PO_STATUS_LIST', sheetName: 'Settings' },
    { name: 'RECEIPT_STATUS_LIST', sheetName: 'Settings' },
    { name: 'INSPECTION_STATUS_LIST', sheetName: 'Settings' },
    { name: 'TRUE_FALSE_LIST', sheetName: 'Settings' },
    { name: 'SUPPLY_MODE_LIST', sheetName: 'Settings' },
    { name: 'GST_RATE_LIST', sheetName: 'Settings' },
    { name: 'COMMITTEE_LIST', sheetName: 'Settings' },
    { name: 'INSPECTION_RESULT_LIST', sheetName: 'Settings' },
    { name: 'REPORT_NAME_LIST', sheetName: 'Settings' },
    { name: 'MONTH_LIST', sheetName: 'Settings' },
    { name: 'QUARTER_LIST', sheetName: 'Settings' },
    { name: 'ACTION_TYPE_LIST', sheetName: 'Settings' },
    { name: 'NUMBERING_CONFIG', sheetName: 'Settings' },
    
    // WorkbookDesign.md Section 3.2
    { name: 'ACTIVE_RC_LIST', sheetName: 'RC_Header' },
    { name: 'RC_HEADER_TABLE', sheetName: 'RC_Header' },
    
    // WorkbookDesign.md Section 3.3
    { name: 'RC_ITEM_TABLE', sheetName: '_RC_ITEM_TEMPLATE' },
    
    // WorkbookDesign.md Section 4.1
    { name: 'PO_ENTRY_TABLE', sheetName: 'PO_Entry' },
    { name: 'PO_ENTRY_RC_CELL', sheetName: 'PO_Entry' },
    { name: 'PO_ENTRY_ITEM_ROWS', sheetName: 'PO_Entry' },
    { name: 'PO_ENTRY_TOTALS', sheetName: 'PO_Entry' },
    
    // WorkbookDesign.md Section 4.2
    { name: 'PO_REGISTER_TABLE', sheetName: 'PO_Register' },
    { name: 'PO_LIST', sheetName: 'PO_Register' },
    { name: 'OPEN_PO_LIST', sheetName: 'PO_Register' },
    { name: 'PO_LINE_ITEM_LIST', sheetName: 'PO_Register' },
    { name: 'PO_STATUS_RANGE', sheetName: 'PO_Register' },
    
    // WorkbookDesign.md Section 4.3
    { name: 'RECEIPT_ENTRY_TABLE', sheetName: 'Receipt_Entry' },
    { name: 'RECEIPT_ENTRY_PO_CELL', sheetName: 'Receipt_Entry' },
    { name: 'RECEIPT_ENTRY_ITEM_ROWS', sheetName: 'Receipt_Entry' },
    
    // WorkbookDesign.md Section 4.4
    { name: 'RECEIPT_REGISTER_TABLE', sheetName: 'Receipt_Register' },
    { name: 'RECEIPT_LIST', sheetName: 'Receipt_Register' },
    { name: 'PENDING_INSPECTION_RECEIPT_LIST', sheetName: 'Receipt_Register' },
    { name: 'RECEIPT_STATUS_RANGE', sheetName: 'Receipt_Register' },
    
    // WorkbookDesign.md Section 4.5
    { name: 'INSPECTION_VERIFICATION_TABLE', sheetName: 'Inspection_Verification' },
    { name: 'INSPECTION_RECEIPT_CELL', sheetName: 'Inspection_Verification' },
    { name: 'INSPECTION_ITEM_ROWS', sheetName: 'Inspection_Verification' },
    
    // WorkbookDesign.md Section 4.6
    { name: 'INSPECTION_REGISTER_TABLE', sheetName: 'Inspection_Register' },
    { name: 'INSPECTION_LIST', sheetName: 'Inspection_Register' },
    { name: 'INSPECTION_STATUS_RANGE', sheetName: 'Inspection_Register' },
    
    // WorkbookDesign.md Section 5.1
    { name: 'DASHBOARD_FILTERS', sheetName: 'Dashboard' },
    { name: 'DASHBOARD_KPI_AREA', sheetName: 'Dashboard' },
    { name: 'DASHBOARD_PENDING_AREA', sheetName: 'Dashboard' },
    { name: 'DASHBOARD_CHART_SOURCE', sheetName: 'Dashboard' },
    
    // WorkbookDesign.md Section 5.2
    { name: 'REPORT_FILTERS', sheetName: 'Reports' },
    { name: 'REPORT_OUTPUT', sheetName: 'Reports' },
    { name: 'REPORT_HELPER_RANGE', sheetName: 'Reports' },
    
    // WorkbookDesign.md Section 6.1
    { name: 'TRANSACTION_LOG_TABLE', sheetName: 'Transaction_Log' },
    
    // WorkbookDesign.md Section 6.2
    { name: 'ERROR_LOG_TABLE', sheetName: 'Error_Log' }
  ],

  // WorkbookDesign.md Sections 3.1 to 6.2 (Protected Ranges)
  PROTECTION: [
    // WorkbookDesign.md Section 3.1
    { sheetName: 'Settings', description: 'Header row. Audit fields. Numbering configuration after production approval.' },
    // WorkbookDesign.md Section 3.2
    { sheetName: 'RC_Header', description: 'Header row. Auto calculated columns.' },
    // WorkbookDesign.md Section 4.1
    { sheetName: 'PO_Entry', description: 'Derived RC fields. Calculated amount fields. Status fields.' },
    // WorkbookDesign.md Section 4.2
    { sheetName: 'PO_Register', description: 'Entire register except controlled system-update ranges. Header row. Primary key, amount, status, document, and audit columns.' },
    // WorkbookDesign.md Section 4.3
    { sheetName: 'Receipt_Entry', description: 'Derived PO fields. Calculated amount fields. Balance Quantity. Receipt Number. Status fields.' },
    // WorkbookDesign.md Section 4.4
    { sheetName: 'Receipt_Register', description: 'Entire register except controlled system-update ranges. Header row. Primary key. Derived fields. Calculated amount fields. Document link. Audit columns.' },
    // WorkbookDesign.md Section 4.5
    { sheetName: 'Inspection_Verification', description: 'Derived PO fields. Derived Receipt fields. Committee field. Inspection Number. Audit fields.' },
    // WorkbookDesign.md Section 4.6
    { sheetName: 'Inspection_Register', description: 'Entire register except controlled system-update ranges. Header row. Primary key. Inspection Note fields. Document link. Audit columns.' },
    // WorkbookDesign.md Section 5.1
    { sheetName: 'Dashboard', description: 'KPI cells. Chart areas. Helper ranges. Header and label cells.' },
    // WorkbookDesign.md Section 5.2
    { sheetName: 'Reports', description: 'Report output area. Helper ranges. Header and label cells.' },
    // WorkbookDesign.md Section 6.1
    { sheetName: 'Transaction_Log', description: 'Entire sheet.' },
    // WorkbookDesign.md Section 6.2
    { sheetName: 'Error_Log', description: 'Entire sheet.' }
  ],

  // WorkbookDesign.md Section 10 (Global Business Rules)
  BUSINESS_RULES: [
    "1. RC is the master source for Purchase Order creation.",
    "2. One Purchase Order shall reference exactly one Rate Contract.",
    "3. Receipt processing shall always be Invoice-wise.",
    "4. Inspection processing shall always be Invoice-wise.",
    "5. Multiple Inspection records may be printed together in one Inspection Note.",
    "6. Inspection printing shall not merge Inspection records.",
    "7. GST in Rate Contract is optional.",
    "8. GST becomes mandatory during Receipt.",
    "9. Distributor is optional for Direct Supply.",
    "10. Receipt Clerk cannot edit saved Receipt records.",
    "11. Inspection Clerk cannot edit saved Inspection records.",
    "12. Only Administrator may reopen or edit saved transactions.",
    "13. Financial Year shall always be calculated using PO Date.",
    "14. Settings shall remain the central configuration source for all modules."
  ],

  // WorkbookDesign.md Explicit Seed Values
  SETTINGS_SEED: [
    // WorkbookDesign.md Section 3.2
    { group: 'RC_STATUS_LIST', key: 'ACTIVE', value: 'Active' },
    { group: 'RC_STATUS_LIST', key: 'EXPIRED', value: 'Expired' },
    { group: 'RC_STATUS_LIST', key: 'CLOSED', value: 'Closed' },
    // WorkbookDesign.md Section 4.2
    { group: 'PO_STATUS_LIST', key: 'PENDING', value: 'Pending' },
    { group: 'PO_STATUS_LIST', key: 'PARTIAL', value: 'Partial' },
    { group: 'PO_STATUS_LIST', key: 'COMPLETED', value: 'Completed' },
    { group: 'PO_STATUS_LIST', key: 'CLOSED', value: 'Closed' },
    // WorkbookDesign.md Section 4.4
    { group: 'TRUE_FALSE_LIST', key: 'TRUE', value: 'TRUE' },
    { group: 'TRUE_FALSE_LIST', key: 'FALSE', value: 'FALSE' },
    // WorkbookDesign.md Section 5.2
    { group: 'REPORT_NAME_LIST', key: 'PO_SUMMARY', value: 'PO Summary' },
    { group: 'REPORT_NAME_LIST', key: 'PO_DETAIL', value: 'PO Detail (Item-wise)' },
    { group: 'REPORT_NAME_LIST', key: 'SUPPLIER_PURCHASE', value: 'Supplier-wise Purchase' },
    { group: 'REPORT_NAME_LIST', key: 'BIDDER_PURCHASE', value: 'Bidder-wise Purchase' },
    { group: 'REPORT_NAME_LIST', key: 'ITEM_PURCHASE', value: 'Item-wise Purchase' },
    { group: 'REPORT_NAME_LIST', key: 'ITEM_PENDING_QTY', value: 'Item Pending Quantity' },
    { group: 'REPORT_NAME_LIST', key: 'ITEM_SUPPLY_HISTORY', value: 'Item Supply History' },
    { group: 'REPORT_NAME_LIST', key: 'PENDING_DELIVERY', value: 'Pending Delivery' },
    { group: 'REPORT_NAME_LIST', key: 'PENDING_RECEIPT', value: 'Pending Receipt' },
    { group: 'REPORT_NAME_LIST', key: 'PENDING_INSPECTION', value: 'Pending Inspection' },
    { group: 'REPORT_NAME_LIST', key: 'RC_REGISTER', value: 'RC Register' },
    { group: 'REPORT_NAME_LIST', key: 'RC_EXPIRY', value: 'RC Expiry' },
    { group: 'REPORT_NAME_LIST', key: 'RC_PURCHASE', value: 'RC-wise Purchase' }
  ],

  // ============================================================================
  // PRESENTATION CONFIGURATION
  // Generated using Google Sheets best practices.
  // Not derived from WorkbookDesign.md.
  // ============================================================================

  PRESENTATION: {
    FREEZE_ROWS: {
      'Settings': 1,
      'RC_Header': 1,
      'PO_Entry': 5,
      'PO_Register': 1,
      'Receipt_Entry': 5,
      'Receipt_Register': 1,
      'Inspection_Verification': 5,
      'Inspection_Register': 1,
      'Dashboard': 4,
      'Reports': 4,
      'Transaction_Log': 1,
      'Error_Log': 1
    },

    HEADER_STYLES: {
      'Settings': { background: '#4a86e8', fontColor: '#ffffff', bold: true },
      'RC_Header': { background: '#4a86e8', fontColor: '#ffffff', bold: true },
      'PO_Register': { background: '#38761d', fontColor: '#ffffff', bold: true },
      'Receipt_Register': { background: '#b45f06', fontColor: '#ffffff', bold: true },
      'Inspection_Register': { background: '#741b47', fontColor: '#ffffff', bold: true },
      'Transaction_Log': { background: '#434343', fontColor: '#ffffff', bold: true },
      'Error_Log': { background: '#cc0000', fontColor: '#ffffff', bold: true }
    },

    DATA_FORMATTING: {
      'PO_Register': {
        dateColumns: [3, 31, 33],
        currencyColumns: [20, 21, 23, 24],
        centerAlignColumns: [2, 4, 5, 19, 25, 26, 27]
      },
      'Receipt_Register': {
        dateColumns: [3, 7, 29, 31],
        currencyColumns: [8, 20, 22, 23, 24],
        centerAlignColumns: [2, 4, 5, 6, 16, 17, 18, 19, 25, 26, 27]
      },
      'Inspection_Register': {
        dateColumns: [3, 8, 23, 25],
        centerAlignColumns: [2, 4, 5, 6, 7, 16, 17, 18, 19]
      }
    },

    DASHBOARD_LAYOUT: {
      headers: [
        { range: 'A1:B1', values: [['Dashboard Filters', 'Value']], background: '#434343', fontColor: '#ffffff' },
        { range: 'D1:E1', values: [['Key Performance Indicators', 'Value']], background: '#434343', fontColor: '#ffffff' },
        { range: 'G1:H1', values: [['Pending Actions', 'Count']], background: '#434343', fontColor: '#ffffff' },
        { range: 'J1:L1', values: [['Chart Data Source', 'Category', 'Value']], background: '#434343', fontColor: '#ffffff' }
      ],
      columnWidths: { A: 150, B: 150, C: 20, D: 250, E: 100, F: 20, G: 200, H: 100, I: 20, J: 150, K: 150, L: 100 }
    },

    REPORTS_LAYOUT: {
      headers: [
        { range: 'A1:B1', values: [['Report Filters', 'Value']], background: '#434343', fontColor: '#ffffff' }
      ],
      columnWidths: { A: 150, B: 150, C: 20 }
    }
  }
};
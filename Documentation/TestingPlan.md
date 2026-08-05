AIIMS Store ERP - Testing Plan

Version: 1.0 Target Release: v1.0.0-backend Reference Specification:
WorkbookDesign.md (Version 1.1)

1. Introduction

This document outlines the comprehensive testing strategy, test cases, and
acceptance criteria for the AIIMS Store ERP backend (v1.0.0-backend). The system
is built entirely on Google Sheets and Google Apps Script. This plan ensures
that all modules strictly adhere to the Single Source of Truth (SSOT) defined in
WorkbookDesign.md.

2. Scope

The scope of this testing plan covers:

  - Structural validation of the Google Sheets workbook.
  - Unit and integration testing of all 9 backend modules (Utils.gs,
    Settings.gs, RC.gs, PO.gs, Receipt.gs, Inspection.gs, Reports.gs,
    Dashboard.gs, WordGenerator.gs).
  - End-to-End (E2E) business workflows.
  - Security, permissions, and performance constraints.

3. Test Environment

  - Platform: Google Workspace (Google Sheets, Google Apps Script, Google
    Drive).
  - Test Accounts:
      - Admin_User (Full access, can edit Settings and unprotect sheets).
      - Standard_User (Restricted access, interacts only via UI/Script
        execution).
  - Browser: Google Chrome (latest stable version).

4. Preconditions

1.  A blank Google Spreadsheet is created and structured exactly as per
    WorkbookDesign.md.
2.  All Master, Transaction, Report, and Hidden System sheets exist.
3.  All Named Ranges are defined.
4.  The Settings sheet is populated with valid baseline data (Financial Years,
    Status Lists, Numbering Config, Committee Members, GST Rates).
5.  Google Drive folders and template documents (with correct placeholders) are
    created, and their IDs are mapped in Settings.
6.  The v1.0.0-backend codebase is deployed to the Apps Script project attached
    to the workbook.

5. Workbook Validation

Test ID: TC-WB-01 Module: Workbook Title: Validate Sheet Existence and
Classification Priority: Critical Preconditions: Workbook is initialized. Test
Steps:

1.  Verify Master Sheets exist (Settings, RC_Header).
2.  Verify Transaction Sheets exist (PO_Entry, PO_Register, Receipt_Entry,
    Receipt_Register, Inspection_Verification, Inspection_Register).
3.  Verify Report Sheets exist (Dashboard, Reports).
4.  Verify System Sheets exist and are hidden (Transaction_Log, Error_Log).
    Expected Result: All sheets exist with exact naming conventions. System
    sheets are hidden. Actual Result: Status: Remarks:

Test ID: TC-WB-02 Module: Workbook Title: Validate Freeze Rows and Headers
Priority: Medium Preconditions: Workbook is initialized. Test Steps:

1.  Open PO_Register, Receipt_Register, and Inspection_Register.
2.  Scroll down vertically. Expected Result: Row 1 (Header row) is frozen on all
    tabular sheets. Actual Result: Status: Remarks:

6. Named Range Validation

Test ID: TC-NR-01 Module: Workbook Title: Validate Critical Named Ranges
Priority: Critical Preconditions: Workbook is initialized. Test Steps:

1.  Open Google Sheets > Data > Named ranges.
2.  Verify existence of SETTINGS_TABLE, RC_HEADER_TABLE, PO_REGISTER_TABLE,
    RECEIPT_REGISTER_TABLE, INSPECTION_REGISTER_TABLE.
3.  Verify Dashboard ranges: DASHBOARD_FILTERS, DASHBOARD_KPI_AREA,
    DASHBOARD_PENDING_AREA, DASHBOARD_CHART_SOURCE.
4.  Verify Report ranges: REPORT_FILTERS, REPORT_OUTPUT. Expected Result: All
    named ranges exist and map to the correct sheet coordinates. Actual Result:
    Status: Remarks:

7. Settings Testing

Test ID: TC-SET-01 Module: Settings.gs Title: Generate Next Document Number
(Concurrency & Increment) Priority: Critical Preconditions: NUMBERING_CONFIG is
set in Settings for 'PO' with prefix 'PO' and running number '0'. Test Steps:

1.  Execute Settings.generateNextDocumentNumber('PO', '2023-24').
2.  Check the returned string.
3.  Check the Settings sheet for the updated running number. Expected Result:
    Returns PO/2023-24/0001. The sheet running number updates to 1. Actual
    Result: Status: Remarks:

Test ID: TC-SET-02 Module: Settings.gs Title: Filter Inactive and Expired
Settings Priority: High Preconditions: Settings contains one Active GST rate and
one Inactive/Expired GST rate. Test Steps:

1.  Execute Settings.getActiveSettingsByGroup('GST_RATE_LIST'). Expected Result:
    Only the active and currently effective GST rate is returned. Actual Result:
    Status: Remarks:

8. Utils Testing

Test ID: TC-UTL-01 Module: Utils.gs Title: UUID Generation Priority: High
Preconditions: None. Test Steps:

1.  Execute Utils.generateUniqueId('POL') multiple times. Expected Result:
    Returns unique strings prefixed with 'POL-'. Actual Result: Status: Remarks:

9. RC Module Testing

Test ID: TC-RC-01 Module: RC.gs Title: Successful Rate Contract Creation
Priority: Critical Preconditions: Valid header and items payload prepared. Test
Steps:

1.  Execute RC.createRateContract(headerPayload, itemsPayload).
2.  Verify RC_Header sheet.
3.  Verify creation of dedicated RC_Item_Sheet. Expected Result: Returns
    generated RC_No. RC_Header has a new row with calculated Total_Items and
    Total_Bidders. A new protected sheet is created containing the items. Actual
    Result: Status: Remarks:

Test ID: TC-RC-02 Module: RC.gs Title: RC Creation Rollback on Item Validation
Failure Priority: Critical Preconditions: Payload contains valid header but
duplicate Item_Code in items. Test Steps:

1.  Execute RC.createRateContract(headerPayload, invalidItemsPayload).
2.  Check RC_Header and sheet tabs. Expected Result: Function throws an error.
    No orphaned row exists in RC_Header. No orphaned item sheet exists. The
    burned RC_No is not reused. Actual Result: Status: Remarks:

10. PO Module Testing

Test ID: TC-PO-01 Module: PO.gs Title: Successful Purchase Order Creation & Math
Validation Priority: Critical Preconditions: Active RC exists. Payload matches
RC items. Test Steps:

1.  Execute PO.createPurchaseOrder(payload).
2.  Check PO_Register. Expected Result: PO is created. Taxable_Amount,
    GST_Amount, and Total_Amount are calculated correctly. Received_Quantity
    is 0, Balance_Quantity equals Ordered_Quantity. Status is 'Pending'. Actual
    Result: Status: Remarks:

Test ID: TC-PO-02 Module: PO.gs Title: PO Validation Failure (Tampered Rate)
Priority: High Preconditions: Active RC exists. Payload contains a rate
different from the RC. Test Steps:

1.  Execute PO.createPurchaseOrder(tamperedPayload). Expected Result: Throws
    error: "Validation Failed... does not match Rate Contract". Rollback
    executes. Actual Result: Status: Remarks:

11. Receipt Module Testing

Test ID: TC-REC-01 Module: Receipt.gs Title: Successful Partial Receipt & PO
Balance Update Priority: Critical Preconditions: Open PO exists with Ordered
Qty 10. Test Steps:

1.  Execute Receipt.createReceipt(payload) with Received Qty 4.
2.  Check Receipt_Register.
3.  Check PO_Register. Expected Result: Receipt created. PO_Register updates:
    Received_Quantity = 4, Balance_Quantity = 6, PO_Status = 'Partial'. Actual
    Result: Status: Remarks:

Test ID: TC-REC-02 Module: Receipt.gs Title: Invoice Uniqueness Validation
Priority: High Preconditions: Receipt exists for PO-001 with Invoice "INV-123".
Test Steps:

1.  Execute Receipt.createReceipt(payload) for PO-001 with Invoice "INV-123".
    Expected Result: Throws error: "Invoice Number 'INV-123' already exists for
    Purchase Order 'PO-001'". Actual Result: Status: Remarks:

Test ID: TC-REC-03 Module: Receipt.gs Title: Over-Receipt Prevention Priority:
Critical Preconditions: Open PO exists with Balance Qty 6. Test Steps:

1.  Execute Receipt.createReceipt(payload) with Received Qty 7. Expected Result:
    Throws error preventing negative balance. Rollback executes. PO balance
    remains 6. Actual Result: Status: Remarks:

12. Inspection Module Testing

Test ID: TC-INS-01 Module: Inspection.gs Title: Successful Inspection & Receipt
Status Update Priority: Critical Preconditions: Pending Receipt exists with
Received Qty 10. Test Steps:

1.  Execute Inspection.createInspection(payload) with Accepted 8, Rejected 2.
2.  Check Inspection_Register.
3.  Check Receipt_Register. Expected Result: Inspection created.
    Receipt_Register Inspection_Status updates to the provided result (e.g.,
    'Accepted'). Actual Result: Status: Remarks:

Test ID: TC-INS-02 Module: Inspection.gs Title: Quantity Reconciliation Failure
Priority: High Preconditions: Pending Receipt exists with Received Qty 10. Test
Steps:

1.  Execute Inspection.createInspection(payload) with Accepted 8, Rejected 1.
    Expected Result: Throws error: "Accepted (8) + Rejected (1) must exactly
    equal Received (10)". Actual Result: Status: Remarks:

Test ID: TC-INS-03 Module: Inspection.gs Title: Transactional Rollback & Status
Restoration Priority: Critical Preconditions: Pending Receipt exists. Test
Steps:

1.  Force a failure during _updateReceiptStatuses (e.g., by mocking an error or
    passing an invalid second item).
2.  Check Receipt_Register. Expected Result: The Inspection_Status of the
    receipt reverts to its original state ('Pending'). Inspection_Register has
    no orphaned rows. Actual Result: Status: Remarks:

13. Reports Testing

Test ID: TC-RPT-01 Module: Reports.gs Title: Financial Year Filter Logic (PO
Date Dependency) Priority: High Preconditions: PO created in FY 2022-23. Receipt
created against it in FY 2023-24. Test Steps:

1.  Execute Reports.getReportData('Pending Inspection', { 'Financial_Year':
    '2022-23' }). Expected Result: The receipt appears in the report because its
    parent PO belongs to 2022-23. Actual Result: Status: Remarks:

Test ID: TC-RPT-02 Module: Reports.gs Title: Generate Report Output (Batch
Write) Priority: Medium Preconditions: Data exists in registers. Test Steps:

1.  Execute Reports.generateReport('PO Summary', {}).
2.  Check Reports sheet REPORT_OUTPUT range. Expected Result: Range is populated
    with headers, data rows, and calculated footers. No transaction sheets are
    modified. Actual Result: Status: Remarks:

14. Dashboard Testing

Test ID: TC-DASH-01 Module: Dashboard.gs Title: KPI Calculation Accuracy
Priority: High Preconditions: 1 Pending PO, 1 Partial PO, 1 Completed PO exist.
Test Steps:

1.  Execute Dashboard.refreshDashboard().
2.  Check DASHBOARD_KPI_AREA. Expected Result: Total POs = 3, Pending = 1,
    Partial = 1, Completed = 1. Actual Result: Status: Remarks:

Test ID: TC-DASH-02 Module: Dashboard.gs Title: Widget Drill-down Navigation
Priority: Medium Preconditions: Dashboard is populated. Test Steps:

1.  Execute Dashboard.handleWidgetClick('Active RC').
2.  Check REPORT_FILTERS and REPORT_OUTPUT. Expected Result: REPORT_FILTERS
    updates to Status: Active. REPORT_OUTPUT displays the 'RC Register' report.
    Actual Result: Status: Remarks:

15. WordGenerator Testing

Test ID: TC-DOC-01 Module: WordGenerator.gs Title: Template Validation
(Fail-Fast) Priority: High Preconditions: A template is configured in Settings
but is missing the {{PO_No}} tag. Test Steps:

1.  Execute WordGenerator.generatePurchaseOrder('PO-001'). Expected Result:
    Throws error: "Template Validation Failed. Missing placeholders: {{PO_No}}".
    The copied temp document is trashed. Actual Result: Status: Remarks:

Test ID: TC-DOC-02 Module: WordGenerator.gs Title: Combined Inspection Note
Generation Priority: High Preconditions: Two inspections exist for PO-001 under
Invoice-A and Invoice-B. Test Steps:

1.  Execute WordGenerator.generateCombinedInspectionNote('PO-001', ['Invoice-A',
    'Invoice-B']). Expected Result: Returns valid docUrl and pdfUrl. The
    generated document contains a single table merging items from both invoices.
    Actual Result: Status: Remarks:

16. Integration Testing

Test ID: TC-INT-01 Module: Cross-Module Title: Strict Module Boundaries (Receipt
-> PO) Priority: Critical Preconditions: None. Test Steps:

1.  Review Receipt.gs codebase. Expected Result: Receipt.gs never calls
    SpreadsheetApp to write to PO_Register. It strictly uses PO.applyReceipt()
    and PO.reverseReceipt(). Actual Result: Status: Remarks:

17. End-to-End Workflow Testing

Test ID: TC-E2E-01 Module: Full System Title: Complete Procure-to-Pay Lifecycle
Priority: Critical Preconditions: Blank system with Settings configured. Test
Steps:

1.  Create RC (RC.createRateContract).
2.  Create PO against RC (PO.createPurchaseOrder).
3.  Create Partial Receipt against PO (Receipt.createReceipt).
4.  Inspect Receipt (Inspection.createInspection).
5.  Refresh Dashboard (Dashboard.refreshDashboard).
6.  Generate PO Document (WordGenerator.generatePurchaseOrder). Expected Result:

  - RC is Active.
  - PO is Partial.
  - Receipt is Accepted.
  - Dashboard reflects 1 Partial PO and 1 Accepted Inspection.
  - PDF URL is generated successfully. Actual Result: Status: Remarks:

18. Security & Permission Testing

Test ID: TC-SEC-01 Module: Security Title: Sheet Protections Priority: High
Preconditions: Standard_User logs in. Test Steps:

1.  Attempt to manually edit a cell in PO_Register.
2.  Attempt to manually edit a cell in Settings. Expected Result: Google Sheets
    blocks the edit. Only Apps Script (running as Admin/System) can modify
    registers. Actual Result: Status: Remarks:

19. Performance Testing

Test ID: TC-PERF-01 Module: Performance Title: Batch Write Efficiency Priority:
Medium Preconditions: Payload with 50 items prepared for PO creation. Test
Steps:

1.  Execute PO.createPurchaseOrder(payload).
2.  Measure execution time. Expected Result: Execution completes well within
    the 6-minute Google Apps Script execution limit (expected < 5 seconds due to
    batch setValues). Actual Result: Status: Remarks:

20. Regression Testing

(To be executed upon any future updates to v1.0.0-backend)

  - Ensure PO.reverseReceipt continues to accurately restore balances if
    Receipt.gs logic is modified.
  - Ensure Reports.gs continues to output exact column structures, as
    WordGenerator.gs depends on them for PDF exports.

21. Release Acceptance Criteria

For v1.0.0-backend to be certified for production release, the following
criteria must be met:

1.  100% Pass Rate on all Critical and High priority test cases.
2.  Zero instances of orphaned data during simulated rollback failures.
3.  Zero instances of burned document numbers being reused.
4.  Strict adherence to WorkbookDesign.md verified by code review (no
    unauthorized columns, sheets, or business rules).
5.  All public functions contain valid JSDoc.

22. Requirement Traceability Matrix (RTM)

| Test ID    | Module           | WorkbookDesign.md Section Reference                               |
| :--------- | :--------------- | :---------------------------------------------------------------- |
| TC-WB-01   | Workbook         | Section 1 (Workbook Sheet Classification)                         |
| TC-WB-02   | Workbook         | Section 2 (Sheet Design Standards)                                |
| TC-NR-01   | Workbook         | Sections 3, 4, 5, 6 (Named Ranges Required)                       |
| TC-SET-01  | Settings.gs      | Section 3.1 (Settings - Numbering Configuration)                  |
| TC-SET-02  | Settings.gs      | Section 3.1 (Settings - Columns / Active)                         |
| TC-UTL-01  | Utils.gs         | Section 2 (Sheet Design Standards - Primary Keys)                 |
| TC-RC-01   | RC.gs            | Section 3.2, 3.3 (RC\_Header, RC\_Item\_Sheet)                    |
| TC-RC-02   | RC.gs            | Section 3.3 (RC\_Item\_Sheet - Validation Rules)                  |
| TC-PO-01   | PO.gs            | Section 4.1, 4.2 (PO\_Entry, PO\_Register)                        |
| TC-PO-02   | PO.gs            | Section 4.1 (PO\_Entry - Validation Rules)                        |
| TC-REC-01  | Receipt.gs       | Section 4.3, 4.4 (Receipt\_Entry, Receipt\_Register)              |
| TC-REC-02  | Receipt.gs       | Section 4.4 (Receipt\_Register - Validation Rules)                |
| TC-REC-03  | Receipt.gs       | Section 4.3, 4.4 (Receipt\_Entry - Validation Rules)              |
| TC-INS-01  | Inspection.gs    | Section 4.5, 4.6 (Inspection\_Verification, Inspection\_Register) |
| TC-INS-02  | Inspection.gs    | Section 4.5 (Inspection\_Verification - Validation Rules)         |
| TC-INS-03  | Inspection.gs    | Section 4.6 (Inspection\_Register - Editing / Rollback)           |
| TC-RPT-01  | Reports.gs       | Section 5.2 (Reports - Financial Year Rule)                       |
| TC-RPT-02  | Reports.gs       | Section 5.2 (Reports - Output Area)                               |
| TC-DASH-01 | Dashboard.gs     | Section 5.1, 11 (Dashboard - Widgets)                             |
| TC-DASH-02 | Dashboard.gs     | Section 5.1 (Dashboard - Drill-down Widgets)                      |
| TC-DOC-01  | WordGenerator.gs | Section 4.2, 4.4, 4.6 (Document Links / Printing)                 |
| TC-DOC-02  | WordGenerator.gs | Section 4.6 (Inspection Note Printing)                            |
| TC-INT-01  | Cross-Module     | Section 10 (Global Business Rules)                                |
| TC-E2E-01  | Full System      | Section 7 (Master Relationships)                                  |
| TC-SEC-01  | Security         | Section 2 (Sheet Design Standards - Protected Ranges)             |
| TC-PERF-01 | Performance      | General / Non-functional                                          |

23. Defect Log Template

Use the following template to log any defects found during test execution.

| Defect ID | Module     | Severity                     | Priority            | Description           | Steps to Reproduce | Expected Result | Actual Result | Status                               | Fixed In Version | Verified By |
| :-------- | :--------- | :--------------------------- | :------------------ | :-------------------- | :----------------- | :-------------- | :------------ | :----------------------------------- | :--------------- | :---------- |
| DEF-001   | \[Module\] | \[Critical/High/Medium/Low\] | \[High/Medium/Low\] | \[Brief description\] | 1\. ...<br>2\. ... | \[Expected\]    | \[Actual\]    | \[Open/In Progress/Resolved/Closed\] | \[Version\]      | \[Name\]    |
|           |            |                              |                     |                       |                    |                 |               |                                      |                  |             |
|           |            |                              |                     |                       |                    |                 |               |                                      |                  |             |

24. Test Execution Summary

| Module           | Total Tests | Passed | Failed | Blocked |
| :--------------- | :---------- | :----- | :----- | :------ |
| Workbook         | 2           |        |        |         |
| Named Ranges     | 1           |        |        |         |
| Settings.gs      | 2           |        |        |         |
| Utils.gs         | 1           |        |        |         |
| RC.gs            | 2           |        |        |         |
| PO.gs            | 2           |        |        |         |
| Receipt.gs       | 3           |        |        |         |
| Inspection.gs    | 3           |        |        |         |
| Reports.gs       | 2           |        |        |         |
| Dashboard.gs     | 2           |        |        |         |
| WordGenerator.gs | 2           |        |        |         |
| Integration      | 1           |        |        |         |
| End-to-End       | 1           |        |        |         |
| Security         | 1           |        |        |         |
| Performance      | 1           |        |        |         |
| **Grand Total**  | **26**      |        |        |         |


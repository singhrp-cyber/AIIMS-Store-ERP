# AIIMS Store ERP Workbook Design Specification

Version: 1.0

This document defines the production Google Spreadsheet workbook design for AIIMS Store ERP. It is a design specification only. It does not contain sample data, Apps Script code, pseudo code, or business rules.

## 1 Workbook Sheet Classification

### Master Sheets

| Sheet | Purpose |
| --- | --- |
| `Settings` | Central configuration, dropdown values, numbering controls, financial year values, status lists, and validation sources. |
| `RC_Master` | Approved Rate Contract, bidder, distributor, and item reference source for Purchase Orders. |

### Transaction Sheets

| Sheet | Purpose |
| --- | --- |
| `PO_Entry` | User-facing Purchase Order entry screen before controlled persistence. |
| `PO_Register` | Locked Purchase Order transaction register. |
| `Receipt_Entry` | User-facing Goods Receipt entry screen before controlled persistence. |
| `Receipt_Register` | Locked Goods Receipt transaction register. |
| `Inspection_Verification` | User-facing inspection verification screen before controlled persistence. |
| `Inspection_Register` | Locked inspection transaction register. |

### Report Sheets

| Sheet | Purpose |
| --- | --- |
| `Dashboard` | Management dashboard containing widgets, charts, KPIs, and pending action summaries. |
| `Reports` | Report output and filter surface for operational and analytical reports. |

### Hidden System Sheets

| Sheet | Purpose |
| --- | --- |
| `Transaction_Log` | System audit log for controlled transaction events. |
| `Error_Log` | System error log for validation, save, document generation, and automation failures. |

## 2 Sheet Design Standards

- Header row: row 1 on register, master, report, and log sheets.
- Entry screens: use top section for header fields and lower section for line-item rows.
- Freeze rows: at least header row on all tabular sheets.
- Register sheets: locked for manual editing except controlled system-managed ranges.
- Master sheets: editable only in defined data-entry columns by authorized users.
- Hidden system sheets: hidden and protected.
- Primary keys: stored in explicit ID columns.
- Audit fields: included on all transaction registers and system logs.
- Dropdown sources: use `Settings` and filtered lists derived from `RC_Master`.

## 3 Master Sheets

### 3.1 Settings

#### Purpose

Central source for workbook configuration, dropdown lists, numbering controls, financial year values, statuses, report filters, protected settings, and named ranges.

#### Columns

| Order | Column | Data Type | Mandatory / Optional | Editable / Locked | Dropdown Source | Validation Rules |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Setting_ID | Text | Mandatory | Locked | None | Unique, nonblank. |
| 2 | Setting_Group | Text | Mandatory | Editable | None | Nonblank. |
| 3 | Setting_Key | Text | Mandatory | Editable | None | Unique within `Setting_Group`. |
| 4 | Setting_Value | Text | Mandatory | Editable | None | Nonblank unless marked inactive. |
| 5 | Display_Label | Text | Optional | Editable | None | Text only. |
| 6 | Sort_Order | Number | Optional | Editable | None | Whole number. |
| 7 | Active | Boolean | Mandatory | Editable | `TRUE_FALSE_LIST` | Must be TRUE or FALSE. |
| 8 | Effective_From | Date | Optional | Editable | None | Valid date. |
| 9 | Effective_To | Date | Optional | Editable | None | Valid date if present. |
| 10 | Remarks | Text | Optional | Editable | None | Free text. |
| 11 | Created_At | DateTime | Mandatory | Locked | None | System timestamp. |
| 12 | Created_By | Text | Mandatory | Locked | None | System user identifier. |
| 13 | Updated_At | DateTime | Optional | Locked | None | System timestamp. |
| 14 | Updated_By | Text | Optional | Locked | None | System user identifier. |

#### Relationships

- Provides dropdown values and control values to all entry, register, dashboard, report, and system sheets.
- Provides financial year and numbering configuration for RC, PO, Receipt, and Inspection numbering.

#### Primary Key

`Setting_ID`

#### Hidden Columns

None.

#### Freeze Rows

Row 1.

#### Protected Ranges

- Header row.
- Audit fields.
- Numbering control rows after production configuration approval.

#### Named Ranges Required

- `SETTINGS_TABLE`
- `FINANCIAL_YEAR_LIST`
- `STATUS_LIST`
- `PO_STATUS_LIST`
- `RECEIPT_STATUS_LIST`
- `INSPECTION_STATUS_LIST`
- `TRUE_FALSE_LIST`
- `NUMBERING_CONFIG`

#### Conditional Formatting Requirements

- Highlight inactive settings.
- Highlight missing mandatory setting values.
- Highlight expired setting values where `Effective_To` is before current date.

### 3.2 RC_Master

#### Purpose

Approved Rate Contract master containing RC, bidder, distributor, and item details used to create Purchase Orders. Item master values are derived from selected Rate Contracts; no standalone Item Master sheet exists.

#### Columns

| Order | Column | Data Type | Mandatory / Optional | Editable / Locked | Dropdown Source | Validation Rules |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | RC_Line_ID | Text | Mandatory | Locked | None | Unique line-level key. |
| 2 | RC_No | Text | Mandatory | Editable | None | Nonblank; grouped across RC lines. |
| 3 | RC_Date | Date | Mandatory | Editable | None | Valid date. |
| 4 | Financial_Year | Text | Mandatory | Editable | `FINANCIAL_YEAR_LIST` | Must exist in Settings. |
| 5 | RC_Status | Text | Mandatory | Editable | `RC_STATUS_LIST` | Must exist in Settings. |
| 6 | Bidder_ID | Text | Mandatory | Editable | None | Nonblank. |
| 7 | Bidder_Name | Text | Mandatory | Editable | None | Nonblank. |
| 8 | Distributor_ID | Text | Optional | Editable | None | Optional for direct supply. |
| 9 | Distributor_Name | Text | Optional | Editable | None | Optional for direct supply. |
| 10 | Supply_Mode | Text | Mandatory | Editable | `SUPPLY_MODE_LIST` | Must identify distributor or direct supply mode. |
| 11 | Item_ID | Text | Mandatory | Editable | None | Unique within RC as applicable. |
| 12 | Item_Name | Text | Mandatory | Editable | None | Nonblank. |
| 13 | Item_Description | Text | Optional | Editable | None | Free text. |
| 14 | Unit | Text | Mandatory | Editable | `UNIT_LIST` | Must exist in Settings. |
| 15 | Category | Text | Optional | Editable | `ITEM_CATEGORY_LIST` | Must exist in Settings if used. |
| 16 | Rate | Number | Mandatory | Editable | None | Number greater than or equal to zero. |
| 17 | GST_Percent | Number | Mandatory | Editable | `GST_RATE_LIST` | Must exist in Settings. |
| 18 | RC_Start_Date | Date | Mandatory | Editable | None | Valid date. |
| 19 | RC_End_Date | Date | Mandatory | Editable | None | Valid date. |
| 20 | RC_Document_Ref | Text | Optional | Editable | None | Document reference or Drive link. |
| 21 | Active | Boolean | Mandatory | Editable | `TRUE_FALSE_LIST` | Must be TRUE or FALSE. |
| 22 | Remarks | Text | Optional | Editable | None | Free text. |
| 23 | Created_At | DateTime | Mandatory | Locked | None | System timestamp. |
| 24 | Created_By | Text | Mandatory | Locked | None | System user identifier. |
| 25 | Updated_At | DateTime | Optional | Locked | None | System timestamp. |
| 26 | Updated_By | Text | Optional | Locked | None | System user identifier. |

#### Relationships

- Parent source for PO item selection.
- `RC_No` links to `PO_Entry` and `PO_Register`.
- Bidder and distributor values are selected through the RC relationship.
- Item values available for PO creation are filtered by selected RC, bidder, and distributor.

#### Primary Key

`RC_Line_ID`

#### Hidden Columns

None required for Version 1.0.

#### Freeze Rows

Row 1.

#### Protected Ranges

- Header row.
- Primary key column.
- Audit columns.
- Locked historical RC rows after administrative approval.

#### Named Ranges Required

- `RC_MASTER_TABLE`
- `RC_LIST`
- `ACTIVE_RC_LIST`
- `RC_BIDDER_LIST`
- `RC_DISTRIBUTOR_LIST`
- `RC_ITEM_LIST`
- `RC_ITEM_RATE_LIST`

#### Conditional Formatting Requirements

- Highlight inactive RC lines.
- Highlight RC lines nearing expiry.
- Highlight expired RC lines.
- Highlight missing mandatory values.

## 4 Transaction Sheets

### 4.1 PO_Entry

#### Purpose

User-facing Purchase Order entry screen for selecting one approved Rate Contract, searching items derived from that Rate Contract, entering quantities, calculating GST and amount fields, and preparing a Purchase Order for controlled save.

#### Columns

| Order | Column | Data Type | Mandatory / Optional | Editable / Locked | Dropdown Source | Validation Rules |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Entry_Row_ID | Text | Mandatory | Locked | None | Unique row key for entry rows. |
| 2 | PO_No | Text | Optional | Locked | None | Assigned during controlled save. |
| 3 | PO_Date | Date | Mandatory | Editable | None | Valid date. |
| 4 | Financial_Year | Text | Mandatory | Locked | `FINANCIAL_YEAR_LIST` | Derived or selected from Settings. |
| 5 | RC_No | Text | Mandatory | Editable | `ACTIVE_RC_LIST` | Must exist in active RC master. |
| 6 | Bidder_ID | Text | Mandatory | Locked | Filtered from RC | Derived from selected RC. |
| 7 | Bidder_Name | Text | Mandatory | Locked | Filtered from RC | Derived from selected RC. |
| 8 | Distributor_ID | Text | Optional | Editable | Filtered from RC and Bidder | Optional for direct supply. |
| 9 | Distributor_Name | Text | Optional | Locked | Filtered from RC and Bidder | Derived from selected distributor. |
| 10 | Supply_Mode | Text | Mandatory | Locked | Filtered from RC | Derived from selected RC/distributor relationship. |
| 11 | Item_ID | Text | Mandatory | Editable | Filtered from RC/Bidder/Distributor | Must exist in filtered RC item list. |
| 12 | Item_Name | Text | Mandatory | Locked | Filtered from RC item | Derived from Item_ID. |
| 13 | Item_Description | Text | Optional | Locked | Filtered from RC item | Derived from Item_ID. |
| 14 | Unit | Text | Mandatory | Locked | Filtered from RC item | Derived from Item_ID. |
| 15 | Quantity | Number | Mandatory | Editable | None | Number greater than zero. |
| 16 | Rate | Number | Mandatory | Locked | Filtered from RC item | Derived from Item_ID. |
| 17 | Taxable_Amount | Number | Mandatory | Locked | None | Calculated amount field. |
| 18 | GST_Percent | Number | Mandatory | Locked | Filtered from RC item | Derived from Item_ID. |
| 19 | GST_Amount | Number | Mandatory | Locked | None | Calculated amount field. |
| 20 | Total_Amount | Number | Mandatory | Locked | None | Calculated amount field. |
| 21 | PO_Status | Text | Mandatory | Locked | `PO_STATUS_LIST` | Initial controlled status. |
| 22 | Remarks | Text | Optional | Editable | None | Free text. |
| 23 | Created_At | DateTime | Optional | Locked | None | System timestamp after save. |
| 24 | Created_By | Text | Optional | Locked | None | System user identifier after save. |

#### Relationships

- Reads RC, bidder, distributor, item, rate, GST, and unit from `RC_Master`.
- Writes controlled records to `PO_Register`.

#### Primary Key

`Entry_Row_ID`

#### Hidden Columns

- `Entry_Row_ID`

#### Freeze Rows

Header row and entry header section.

#### Protected Ranges

- Derived RC fields.
- Calculated amount fields.
- PO number and status fields.

#### Named Ranges Required

- `PO_ENTRY_TABLE`
- `PO_ENTRY_RC_CELL`
- `PO_ENTRY_ITEM_ROWS`
- `PO_ENTRY_TOTALS`

#### Conditional Formatting Requirements

- Highlight missing mandatory entry fields.
- Highlight invalid filtered dropdown selections.
- Highlight calculated total section.

### 4.2 PO_Register

#### Purpose

Authoritative locked register of saved Purchase Orders and line items.

#### Columns

| Order | Column | Data Type | Mandatory / Optional | Editable / Locked | Dropdown Source | Validation Rules |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | PO_Line_ID | Text | Mandatory | Locked | None | Unique line-level key. |
| 2 | PO_No | Text | Mandatory | Locked | None | Nonblank; grouped across PO lines. |
| 3 | PO_Date | Date | Mandatory | Locked | None | Valid date. |
| 4 | Financial_Year | Text | Mandatory | Locked | `FINANCIAL_YEAR_LIST` | Must exist in Settings. |
| 5 | RC_No | Text | Mandatory | Locked | `ACTIVE_RC_LIST` | Must exist in RC master. |
| 6 | Bidder_ID | Text | Mandatory | Locked | None | Derived from RC. |
| 7 | Bidder_Name | Text | Mandatory | Locked | None | Derived from RC. |
| 8 | Distributor_ID | Text | Optional | Locked | None | Optional for direct supply. |
| 9 | Distributor_Name | Text | Optional | Locked | None | Optional for direct supply. |
| 10 | Supply_Mode | Text | Mandatory | Locked | `SUPPLY_MODE_LIST` | Must exist in Settings. |
| 11 | Item_ID | Text | Mandatory | Locked | None | Derived from RC. |
| 12 | Item_Name | Text | Mandatory | Locked | None | Derived from RC. |
| 13 | Item_Description | Text | Optional | Locked | None | Derived from RC. |
| 14 | Unit | Text | Mandatory | Locked | `UNIT_LIST` | Must exist in Settings. |
| 15 | Ordered_Quantity | Number | Mandatory | Locked | None | Number greater than zero. |
| 16 | Rate | Number | Mandatory | Locked | None | Number greater than or equal to zero. |
| 17 | Taxable_Amount | Number | Mandatory | Locked | None | Calculated amount field. |
| 18 | GST_Percent | Number | Mandatory | Locked | `GST_RATE_LIST` | Must exist in Settings. |
| 19 | GST_Amount | Number | Mandatory | Locked | None | Calculated amount field. |
| 20 | Total_Amount | Number | Mandatory | Locked | None | Calculated amount field. |
| 21 | Received_Quantity | Number | Mandatory | Locked | None | Updated from receipt records. |
| 22 | Balance_Quantity | Number | Mandatory | Locked | None | Derived quantity field. |
| 23 | PO_Status | Text | Mandatory | Locked | `PO_STATUS_LIST` | Pending, Partial, Completed, or Closed. |
| 24 | Close_Reason | Text | Optional | Locked | `PO_CLOSE_REASON_LIST` | Required when status is Closed. |
| 25 | PO_Document_Link | Text | Optional | Locked | None | Drive link or document reference. |
| 26 | Locked | Boolean | Mandatory | Locked | `TRUE_FALSE_LIST` | Must be TRUE after controlled save. |
| 27 | Created_At | DateTime | Mandatory | Locked | None | System timestamp. |
| 28 | Created_By | Text | Mandatory | Locked | None | System user identifier. |
| 29 | Updated_At | DateTime | Optional | Locked | None | System timestamp. |
| 30 | Updated_By | Text | Optional | Locked | None | System user identifier. |

#### Relationships

- Child of `RC_Master`.
- Parent source for `Receipt_Entry` and `Receipt_Register`.
- Feeds Dashboard, Reports, and document generation.

#### Primary Key

`PO_Line_ID`

#### Hidden Columns

- `PO_Line_ID`
- Audit columns may be hidden from routine users.

#### Freeze Rows

Row 1.

#### Protected Ranges

- Entire register except controlled system-update ranges.
- Header row.
- Primary key, amount, status, document, and audit columns.

#### Named Ranges Required

- `PO_REGISTER_TABLE`
- `PO_LIST`
- `OPEN_PO_LIST`
- `PO_LINE_ITEM_LIST`
- `PO_STATUS_RANGE`

#### Conditional Formatting Requirements

- Highlight pending POs.
- Highlight partially received POs.
- Highlight completed POs.
- Highlight closed POs.
- Highlight balance quantity greater than zero.

### 4.3 Receipt_Entry

#### Purpose

User-facing Goods Receipt entry screen for selecting Purchase Orders and recording receipt line details before controlled save.

#### Columns

| Order | Column | Data Type | Mandatory / Optional | Editable / Locked | Dropdown Source | Validation Rules |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Receipt_Entry_Row_ID | Text | Mandatory | Locked | None | Unique row key. |
| 2 | Receipt_No | Text | Optional | Locked | None | Assigned during controlled save. |
| 3 | Receipt_Date | Date | Mandatory | Editable | None | Valid date. |
| 4 | Financial_Year | Text | Mandatory | Locked | `FINANCIAL_YEAR_LIST` | Derived or selected from Settings. |
| 5 | PO_No | Text | Mandatory | Editable | `OPEN_PO_LIST` | Must exist in open PO list. |
| 6 | PO_Line_ID | Text | Mandatory | Editable | Filtered from PO_No | Must exist in selected PO. |
| 7 | RC_No | Text | Mandatory | Locked | None | Derived from PO. |
| 8 | Bidder_Name | Text | Mandatory | Locked | None | Derived from PO. |
| 9 | Distributor_Name | Text | Optional | Locked | None | Derived from PO. |
| 10 | Item_ID | Text | Mandatory | Locked | None | Derived from PO line. |
| 11 | Item_Name | Text | Mandatory | Locked | None | Derived from PO line. |
| 12 | Unit | Text | Mandatory | Locked | None | Derived from PO line. |
| 13 | Ordered_Quantity | Number | Mandatory | Locked | None | Derived from PO line. |
| 14 | Previously_Received_Quantity | Number | Mandatory | Locked | None | Derived from receipt register. |
| 15 | Balance_Quantity | Number | Mandatory | Locked | None | Derived quantity field. |
| 16 | Received_Quantity | Number | Mandatory | Editable | None | Number greater than zero. |
| 17 | Invoice_No | Text | Optional | Editable | None | Text reference. |
| 18 | Invoice_Date | Date | Optional | Editable | None | Valid date if present. |
| 19 | Delivery_Challan_No | Text | Optional | Editable | None | Text reference. |
| 20 | Receipt_Status | Text | Mandatory | Locked | `RECEIPT_STATUS_LIST` | Initial controlled status. |
| 21 | Remarks | Text | Optional | Editable | None | Free text. |
| 22 | Created_At | DateTime | Optional | Locked | None | System timestamp after save. |
| 23 | Created_By | Text | Optional | Locked | None | System user identifier after save. |

#### Relationships

- Reads PO, RC, bidder, distributor, and item details from `PO_Register`.
- Writes controlled receipt records to `Receipt_Register`.
- Provides source data for inspection verification.

#### Primary Key

`Receipt_Entry_Row_ID`

#### Hidden Columns

- `Receipt_Entry_Row_ID`

#### Freeze Rows

Header row and entry header section.

#### Protected Ranges

- Derived PO fields.
- Balance and previously received quantity fields.
- Receipt number and status fields.

#### Named Ranges Required

- `RECEIPT_ENTRY_TABLE`
- `RECEIPT_ENTRY_PO_CELL`
- `RECEIPT_ENTRY_ITEM_ROWS`

#### Conditional Formatting Requirements

- Highlight missing mandatory fields.
- Highlight received quantity entry area.
- Highlight selected PO lines with remaining balance.

### 4.4 Receipt_Register

#### Purpose

Authoritative locked register of saved Goods Receipt records and receipt line items.

#### Columns

| Order | Column | Data Type | Mandatory / Optional | Editable / Locked | Dropdown Source | Validation Rules |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Receipt_Line_ID | Text | Mandatory | Locked | None | Unique line-level key. |
| 2 | Receipt_No | Text | Mandatory | Locked | None | Nonblank; grouped across receipt lines. |
| 3 | Receipt_Date | Date | Mandatory | Locked | None | Valid date. |
| 4 | Financial_Year | Text | Mandatory | Locked | `FINANCIAL_YEAR_LIST` | Must exist in Settings. |
| 5 | PO_No | Text | Mandatory | Locked | `PO_LIST` | Must exist in PO register. |
| 6 | PO_Line_ID | Text | Mandatory | Locked | None | Must exist in PO register. |
| 7 | RC_No | Text | Mandatory | Locked | None | Derived from PO. |
| 8 | Bidder_Name | Text | Mandatory | Locked | None | Derived from PO. |
| 9 | Distributor_Name | Text | Optional | Locked | None | Derived from PO. |
| 10 | Item_ID | Text | Mandatory | Locked | None | Derived from PO line. |
| 11 | Item_Name | Text | Mandatory | Locked | None | Derived from PO line. |
| 12 | Unit | Text | Mandatory | Locked | None | Derived from PO line. |
| 13 | Ordered_Quantity | Number | Mandatory | Locked | None | Derived from PO line. |
| 14 | Received_Quantity | Number | Mandatory | Locked | None | Number greater than zero. |
| 15 | Cumulative_Received_Quantity | Number | Mandatory | Locked | None | Derived receipt total by PO line. |
| 16 | Balance_Quantity | Number | Mandatory | Locked | None | Derived quantity field. |
| 17 | Invoice_No | Text | Optional | Locked | None | Text reference. |
| 18 | Invoice_Date | Date | Optional | Locked | None | Valid date if present. |
| 19 | Delivery_Challan_No | Text | Optional | Locked | None | Text reference. |
| 20 | Receipt_Status | Text | Mandatory | Locked | `RECEIPT_STATUS_LIST` | Must exist in Settings. |
| 21 | Inspection_Required | Boolean | Mandatory | Locked | `TRUE_FALSE_LIST` | Must be TRUE or FALSE. |
| 22 | Inspection_Status | Text | Optional | Locked | `INSPECTION_STATUS_LIST` | Updated through inspection process. |
| 23 | Receipt_Document_Link | Text | Optional | Locked | None | Drive link or document reference. |
| 24 | Created_At | DateTime | Mandatory | Locked | None | System timestamp. |
| 25 | Created_By | Text | Mandatory | Locked | None | System user identifier. |
| 26 | Updated_At | DateTime | Optional | Locked | None | System timestamp. |
| 27 | Updated_By | Text | Optional | Locked | None | System user identifier. |

#### Relationships

- Child of `PO_Register`.
- Parent source for `Inspection_Verification` and `Inspection_Register`.
- Feeds Dashboard and Reports.

#### Primary Key

`Receipt_Line_ID`

#### Hidden Columns

- `Receipt_Line_ID`
- Audit columns may be hidden from routine users.

#### Freeze Rows

Row 1.

#### Protected Ranges

- Entire register except controlled system-update ranges.
- Header row.
- Primary key, derived, document, and audit columns.

#### Named Ranges Required

- `RECEIPT_REGISTER_TABLE`
- `RECEIPT_LIST`
- `PENDING_INSPECTION_RECEIPT_LIST`
- `RECEIPT_STATUS_RANGE`

#### Conditional Formatting Requirements

- Highlight receipts pending inspection.
- Highlight partially received PO lines.
- Highlight completed receipt lines.

### 4.5 Inspection_Verification

#### Purpose

User-facing inspection verification screen for selecting receipt lines pending inspection and preparing inspection results before controlled save.

#### Columns

| Order | Column | Data Type | Mandatory / Optional | Editable / Locked | Dropdown Source | Validation Rules |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Inspection_Entry_Row_ID | Text | Mandatory | Locked | None | Unique row key. |
| 2 | Inspection_No | Text | Optional | Locked | None | Assigned during controlled save. |
| 3 | Inspection_Date | Date | Mandatory | Editable | None | Valid date. |
| 4 | Financial_Year | Text | Mandatory | Locked | `FINANCIAL_YEAR_LIST` | Derived or selected from Settings. |
| 5 | Receipt_No | Text | Mandatory | Editable | `PENDING_INSPECTION_RECEIPT_LIST` | Must exist in pending inspection receipt list. |
| 6 | Receipt_Line_ID | Text | Mandatory | Editable | Filtered from Receipt_No | Must exist in selected receipt. |
| 7 | PO_No | Text | Mandatory | Locked | None | Derived from receipt. |
| 8 | RC_No | Text | Mandatory | Locked | None | Derived from receipt. |
| 9 | Bidder_Name | Text | Mandatory | Locked | None | Derived from receipt. |
| 10 | Distributor_Name | Text | Optional | Locked | None | Derived from receipt. |
| 11 | Item_ID | Text | Mandatory | Locked | None | Derived from receipt. |
| 12 | Item_Name | Text | Mandatory | Locked | None | Derived from receipt. |
| 13 | Unit | Text | Mandatory | Locked | None | Derived from receipt. |
| 14 | Received_Quantity | Number | Mandatory | Locked | None | Derived from receipt. |
| 15 | Accepted_Quantity | Number | Optional | Editable | None | Numeric entry. |
| 16 | Rejected_Quantity | Number | Optional | Editable | None | Numeric entry. |
| 17 | Inspection_Result | Text | Mandatory | Editable | `INSPECTION_RESULT_LIST` | Must exist in Settings. |
| 18 | Committee | Text | Optional | Editable | `COMMITTEE_LIST` | Must exist in Settings if used. |
| 19 | Remarks | Text | Optional | Editable | None | Free text. |
| 20 | Created_At | DateTime | Optional | Locked | None | System timestamp after save. |
| 21 | Created_By | Text | Optional | Locked | None | System user identifier after save. |

#### Relationships

- Reads pending inspection receipt lines from `Receipt_Register`.
- Writes controlled inspection records to `Inspection_Register`.

#### Primary Key

`Inspection_Entry_Row_ID`

#### Hidden Columns

- `Inspection_Entry_Row_ID`

#### Freeze Rows

Header row and entry header section.

#### Protected Ranges

- Derived receipt, PO, RC, bidder, distributor, and item fields.
- Inspection number and audit fields.

#### Named Ranges Required

- `INSPECTION_VERIFICATION_TABLE`
- `INSPECTION_RECEIPT_CELL`
- `INSPECTION_ITEM_ROWS`

#### Conditional Formatting Requirements

- Highlight missing mandatory fields.
- Highlight pending inspection lines.
- Highlight rejected quantity entries.

### 4.6 Inspection_Register

#### Purpose

Authoritative locked register of saved inspection verification records.

#### Columns

| Order | Column | Data Type | Mandatory / Optional | Editable / Locked | Dropdown Source | Validation Rules |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Inspection_Line_ID | Text | Mandatory | Locked | None | Unique line-level key. |
| 2 | Inspection_No | Text | Mandatory | Locked | None | Nonblank; grouped across inspection lines. |
| 3 | Inspection_Date | Date | Mandatory | Locked | None | Valid date. |
| 4 | Financial_Year | Text | Mandatory | Locked | `FINANCIAL_YEAR_LIST` | Must exist in Settings. |
| 5 | Receipt_No | Text | Mandatory | Locked | `RECEIPT_LIST` | Must exist in receipt register. |
| 6 | Receipt_Line_ID | Text | Mandatory | Locked | None | Must exist in receipt register. |
| 7 | PO_No | Text | Mandatory | Locked | None | Derived from receipt. |
| 8 | RC_No | Text | Mandatory | Locked | None | Derived from receipt. |
| 9 | Bidder_Name | Text | Mandatory | Locked | None | Derived from receipt. |
| 10 | Distributor_Name | Text | Optional | Locked | None | Derived from receipt. |
| 11 | Item_ID | Text | Mandatory | Locked | None | Derived from receipt. |
| 12 | Item_Name | Text | Mandatory | Locked | None | Derived from receipt. |
| 13 | Unit | Text | Mandatory | Locked | None | Derived from receipt. |
| 14 | Received_Quantity | Number | Mandatory | Locked | None | Derived from receipt. |
| 15 | Accepted_Quantity | Number | Optional | Locked | None | Numeric field. |
| 16 | Rejected_Quantity | Number | Optional | Locked | None | Numeric field. |
| 17 | Inspection_Result | Text | Mandatory | Locked | `INSPECTION_RESULT_LIST` | Must exist in Settings. |
| 18 | Committee | Text | Optional | Locked | `COMMITTEE_LIST` | Must exist in Settings if used. |
| 19 | Remarks | Text | Optional | Locked | None | Free text. |
| 20 | Inspection_Document_Link | Text | Optional | Locked | None | Drive link or document reference. |
| 21 | Created_At | DateTime | Mandatory | Locked | None | System timestamp. |
| 22 | Created_By | Text | Mandatory | Locked | None | System user identifier. |
| 23 | Updated_At | DateTime | Optional | Locked | None | System timestamp. |
| 24 | Updated_By | Text | Optional | Locked | None | System user identifier. |

#### Relationships

- Child of `Receipt_Register`.
- Indirect child of `PO_Register` and `RC_Master`.
- Feeds Dashboard and Reports.

#### Primary Key

`Inspection_Line_ID`

#### Hidden Columns

- `Inspection_Line_ID`
- Audit columns may be hidden from routine users.

#### Freeze Rows

Row 1.

#### Protected Ranges

- Entire register except controlled system-update ranges.
- Header row.
- Primary key, document, and audit columns.

#### Named Ranges Required

- `INSPECTION_REGISTER_TABLE`
- `INSPECTION_LIST`
- `INSPECTION_STATUS_RANGE`

#### Conditional Formatting Requirements

- Highlight pending inspection outcomes if any.
- Highlight rejected quantities.
- Highlight accepted inspection results.

## 5 Report Sheets

### 5.1 Dashboard

#### Purpose

Management dashboard containing widgets, charts, KPIs, and pending action summaries.

#### Columns

Dashboard is a presentation sheet rather than a transaction table. The design uses defined filter cells, widget cells, chart areas, and hidden calculation helper ranges.

| Area | Data Type | Mandatory / Optional | Editable / Locked | Dropdown Source | Validation Rules |
| --- | --- | --- | --- | --- | --- |
| Filter Panel | Text/Date | Optional | Editable | Report filter named ranges | Must use allowed filter values. |
| KPI Widgets | Number/Text | Mandatory | Locked | Registers | Derived from report data. |
| Pending Action Widgets | Number/Text | Mandatory | Locked | Registers | Derived from report data. |
| Chart Areas | Chart/Data Range | Optional | Locked | Registers | Derived from report data. |
| Helper Ranges | Text/Number | Optional | Locked/Hidden | Registers | Internal dashboard calculations. |

#### Relationships

- Reads from `PO_Register`, `Receipt_Register`, `Inspection_Register`, `RC_Master`, and `Settings`.

#### Primary Key

Not applicable.

#### Hidden Columns

Helper columns for chart and widget source data.

#### Freeze Rows

Top dashboard filter/header area.

#### Protected Ranges

- KPI cells.
- Chart areas.
- Helper ranges.
- Header and label cells.

#### Named Ranges Required

- `DASHBOARD_FILTERS`
- `DASHBOARD_KPI_AREA`
- `DASHBOARD_PENDING_AREA`
- `DASHBOARD_CHART_SOURCE`

#### Conditional Formatting Requirements

- Highlight pending action counts.
- Highlight nearing RC expiry.
- Highlight overdue or aging indicators where source data supports them.

#### Dashboard Widgets

- Total Purchase Orders.
- Pending Purchase Orders.
- Partially Received Purchase Orders.
- Completed Purchase Orders.
- Closed Purchase Orders.
- Total Receipt Count.
- Pending Inspection Count.
- Accepted Inspection Count.
- Rejected Inspection Count.
- RC Expiry Alert Count.
- RC-wise Purchase Value.
- Bidder/Distributor-wise Purchase Value.
- Item-wise Purchase Value.
- Financial Year Purchase Summary.
- Month-wise Purchase Summary.

### 5.2 Reports

#### Purpose

Central report selection, filter, and output sheet for operational and analytical reports.

#### Columns

| Order | Column | Data Type | Mandatory / Optional | Editable / Locked | Dropdown Source | Validation Rules |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Report_Run_ID | Text | Optional | Locked | None | Unique report run key if reports are logged. |
| 2 | Report_Name | Text | Mandatory | Editable | `REPORT_NAME_LIST` | Must exist in report list. |
| 3 | Financial_Year | Text | Optional | Editable | `FINANCIAL_YEAR_LIST` | Must exist in Settings. |
| 4 | Quarter | Text | Optional | Editable | `QUARTER_LIST` | Must exist in Settings. |
| 5 | Month | Text | Optional | Editable | `MONTH_LIST` | Must exist in Settings. |
| 6 | Date_From | Date | Optional | Editable | None | Valid date if present. |
| 7 | Date_To | Date | Optional | Editable | None | Valid date if present. |
| 8 | RC_No | Text | Optional | Editable | `RC_LIST` | Must exist in RC master if selected. |
| 9 | PO_No | Text | Optional | Editable | `PO_LIST` | Must exist in PO register if selected. |
| 10 | Bidder | Text | Optional | Editable | `BIDDER_LIST` | Must exist in RC master if selected. |
| 11 | Distributor | Text | Optional | Editable | `DISTRIBUTOR_LIST` | Must exist in RC master if selected. |
| 12 | Item | Text | Optional | Editable | `ITEM_LIST` | Must exist in RC master if selected. |
| 13 | Status | Text | Optional | Editable | `STATUS_LIST` | Must exist in Settings if selected. |
| 14 | Output_Area | Text/Number/Date | Optional | Locked | Registers | Report output area. |

#### Relationships

- Reads from all master and transaction registers.
- Uses filter values from `Settings`, `RC_Master`, `PO_Register`, `Receipt_Register`, and `Inspection_Register`.

#### Primary Key

`Report_Run_ID` if report execution history is retained; otherwise not applicable.

#### Hidden Columns

Helper columns for generated report outputs and filter normalization.

#### Freeze Rows

Report filter section and output header row.

#### Protected Ranges

- Report output area.
- Helper ranges.
- Header and label cells.

#### Named Ranges Required

- `REPORT_FILTERS`
- `REPORT_OUTPUT`
- `REPORT_NAME_LIST`
- `REPORT_HELPER_RANGE`

#### Conditional Formatting Requirements

- Highlight active filters.
- Highlight report output totals.
- Highlight status columns based on selected report type.

## 6 Hidden System Sheets

### 6.1 Transaction_Log

#### Purpose

Hidden system audit log for controlled transaction events across master and transaction sheets.

#### Columns

| Order | Column | Data Type | Mandatory / Optional | Editable / Locked | Dropdown Source | Validation Rules |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Log_ID | Text | Mandatory | Locked | None | Unique log key. |
| 2 | Event_Timestamp | DateTime | Mandatory | Locked | None | System timestamp. |
| 3 | User | Text | Mandatory | Locked | None | System user identifier. |
| 4 | Action | Text | Mandatory | Locked | `ACTION_TYPE_LIST` | Must exist in Settings. |
| 5 | Sheet_Name | Text | Mandatory | Locked | `SHEET_NAME_LIST` | Must identify affected sheet. |
| 6 | Record_Key | Text | Optional | Locked | None | Related primary key if available. |
| 7 | Reference_No | Text | Optional | Locked | None | RC, PO, Receipt, or Inspection reference. |
| 8 | Old_Value | Text | Optional | Locked | None | Prior value if logged. |
| 9 | New_Value | Text | Optional | Locked | None | New value if logged. |
| 10 | Remarks | Text | Optional | Locked | None | Free text. |

#### Relationships

- References records from all master and transaction sheets.

#### Primary Key

`Log_ID`

#### Hidden Columns

Entire sheet hidden.

#### Freeze Rows

Row 1.

#### Protected Ranges

Entire sheet.

#### Named Ranges Required

- `TRANSACTION_LOG_TABLE`

#### Conditional Formatting Requirements

- Highlight failed or exceptional transaction events if action type supports them.

### 6.2 Error_Log

#### Purpose

Hidden system error log for validation, save, document generation, and automation errors.

#### Columns

| Order | Column | Data Type | Mandatory / Optional | Editable / Locked | Dropdown Source | Validation Rules |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Error_ID | Text | Mandatory | Locked | None | Unique error key. |
| 2 | Error_Timestamp | DateTime | Mandatory | Locked | None | System timestamp. |
| 3 | User | Text | Optional | Locked | None | System user identifier if available. |
| 4 | Module | Text | Mandatory | Locked | `MODULE_LIST` | Must identify affected module. |
| 5 | Sheet_Name | Text | Optional | Locked | `SHEET_NAME_LIST` | Must identify affected sheet if available. |
| 6 | Record_Key | Text | Optional | Locked | None | Related primary key if available. |
| 7 | Error_Type | Text | Mandatory | Locked | `ERROR_TYPE_LIST` | Must exist in Settings. |
| 8 | Error_Message | Text | Mandatory | Locked | None | Error message. |
| 9 | Resolution_Status | Text | Mandatory | Locked | `ERROR_RESOLUTION_STATUS_LIST` | Must exist in Settings. |
| 10 | Resolved_At | DateTime | Optional | Locked | None | System timestamp if resolved. |
| 11 | Resolved_By | Text | Optional | Locked | None | System user identifier if resolved. |
| 12 | Remarks | Text | Optional | Locked | None | Free text. |

#### Relationships

- References source records and modules across the workbook.

#### Primary Key

`Error_ID`

#### Hidden Columns

Entire sheet hidden.

#### Freeze Rows

Row 1.

#### Protected Ranges

Entire sheet.

#### Named Ranges Required

- `ERROR_LOG_TABLE`

#### Conditional Formatting Requirements

- Highlight unresolved errors.
- Highlight repeated errors by module if displayed for administrators.

## 7 Master Relationships

### RC

`RC_Master` is the source for approved Rate Contract references, bidder details, distributor details, item details, rates, GST percentages, and active RC status.

### PO

`PO_Register` is created from `PO_Entry` and is linked to exactly one `RC_No`. PO line items are derived from the selected RC item rows in `RC_Master`.

### Receipt

`Receipt_Register` is created from `Receipt_Entry` and is linked to `PO_Register` through `PO_No` and `PO_Line_ID`.

### Inspection

`Inspection_Register` is created from `Inspection_Verification` and is linked to `Receipt_Register` through `Receipt_No` and `Receipt_Line_ID`.

### Bidder

Bidder values are stored in `RC_Master` and are filtered by the selected RC.

### Distributor

Distributor values are stored in `RC_Master` and are filtered by the selected RC and bidder. Distributor is optional where direct supply is recorded through the supply mode.

### Items

Items are stored as RC-linked item rows in `RC_Master`. No standalone Item Master sheet exists.

### Settings

`Settings` provides controlled dropdowns, status values, financial year values, numbering configuration, report names, and system lists used across the workbook.

## 8 Dropdown Design

### Searchable Dropdown Relationship

```text
RC
  -> Bidder
    -> Distributor (optional / Direct Supply)
      -> Items
```

### Dropdown Sources

| Dropdown | Source | Filter Dependency |
| --- | --- | --- |
| RC | `RC_Master` active RC rows | Active RC status. |
| Bidder | `RC_Master` bidder rows | Selected RC. |
| Distributor | `RC_Master` distributor rows | Selected RC and bidder. |
| Items | `RC_Master` item rows | Selected RC, bidder, and distributor or direct supply mode. |
| PO | `PO_Register` | Open PO status where relevant. |
| Receipt | `Receipt_Register` | Pending inspection where relevant. |
| Status | `Settings` | Module-specific status group. |
| Financial Year | `Settings` | Active financial year values. |

### Searchable Dropdown Requirements

- Dropdowns must support typing/searching in Google Sheets.
- Dependent dropdowns must refresh based on the parent selection.
- Item dropdowns must not expose items outside the selected RC relationship.
- Direct Supply must be represented without requiring a distributor value.
- Dropdown named ranges must be maintained from master and register sources.

## 9 Report Filter Design

### Common Filters

| Filter | Source |
| --- | --- |
| Financial Year | `FINANCIAL_YEAR_LIST` |
| Quarter | `QUARTER_LIST` |
| Month | `MONTH_LIST` |
| Date Range | User-entered date cells |
| RC | `RC_LIST` |
| PO | `PO_LIST` |
| Bidder | `BIDDER_LIST` |
| Distributor | `DISTRIBUTOR_LIST` |
| Item | `ITEM_LIST` |
| Status | `STATUS_LIST` |

### Filter Areas

- Dashboard filter panel.
- Reports filter panel.
- Report-specific output headers.
- Hidden helper ranges for normalized selected filter values.

## 10 Dashboard Design

Only dashboard widgets are defined in this version. No formulas, charts, or implementation logic are included.

### Widgets

- Total Purchase Orders.
- Pending Purchase Orders.
- Partially Received Purchase Orders.
- Completed Purchase Orders.
- Closed Purchase Orders.
- Total PO Value.
- Total Receipt Count.
- Total Received Value.
- Pending Delivery Count.
- Pending Inspection Count.
- Accepted Inspection Count.
- Rejected Inspection Count.
- RC Expiry Alert Count.
- RC-wise Purchase Value.
- Bidder-wise Purchase Value.
- Distributor-wise Purchase Value.
- Item-wise Purchase Value.
- Month-wise Purchase Trend.
- Financial Year Purchase Summary.

## 11 Report Design

### PO Summary

Summary report of Purchase Orders by selected filters.

### PO Detail

Line-level Purchase Order report by selected filters.

### Receipt Register

Line-level Goods Receipt report by selected filters.

### Inspection Register

Line-level inspection report by selected filters.

### Pending Delivery

Report of PO lines with pending balance quantity.

### Pending Inspection

Report of receipt lines pending inspection.

### RC Register

Register report of Rate Contract records.

### RC Expiry

Report of Rate Contracts by expiry status or expiry period.

### RC-wise Purchase

Purchase report grouped by Rate Contract.

### Bidder/Distributor-wise Purchase

Purchase report grouped by bidder and distributor.

### Item-wise Purchase

Purchase report grouped by item.

### Item History

Item transaction history across RC, PO, receipt, and inspection records.

### Purchase Analysis

Analytical purchase report using financial year, period, RC, bidder, distributor, item, and status filters.

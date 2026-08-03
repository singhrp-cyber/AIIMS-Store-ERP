# AIIMS Store ERP Workbook Design Specification

Version: 1.1

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

Central source for workbook configuration, dropdown lists, numbering controls, financial year values, statuses, report filters, protected settings and named ranges.

All application modules shall use Settings as the central configuration source.

#### Numbering Configuration

Settings shall maintain configurable numbering for

- Rate Contract
- Purchase Order
- Receipt
- Inspection

Each numbering configuration shall support

- Prefix
- Financial Year
- Running Number

Numbering configuration shall remain editable only by Administrator.

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

- Provides dropdown values and control values to all entry, register, dashboard, report and system sheets.
- Provides Financial Year configuration.
- Provides numbering configuration for Rate Contract, Purchase Order, Receipt and Inspection.
- Provides Committee Members.
- Provides GST Rates.
- Provides Delivery Defaults.
- Provides Consignee Defaults.
- Provides Report Configuration.
- Provides validation lists and named ranges.

#### Primary Key

`Setting_ID`

#### Hidden Columns

None.

#### Freeze Rows

Row 1.

#### Protected Ranges

- Header row.
- Audit fields.
- Numbering configuration after production approval.

#### Named Ranges Required

- `SETTINGS_TABLE`
- `FINANCIAL_YEAR_LIST`
- `STATUS_LIST`
- `RC_STATUS_LIST`
- `PO_STATUS_LIST`
- `RECEIPT_STATUS_LIST`
- `INSPECTION_STATUS_LIST`
- `TRUE_FALSE_LIST`
- `SUPPLY_MODE_LIST`
- `GST_RATE_LIST`
- `COMMITTEE_LIST`
- `INSPECTION_RESULT_LIST`
- `REPORT_NAME_LIST`
- `MONTH_LIST`
- `QUARTER_LIST`
- `ACTION_TYPE_LIST`
- `NUMBERING_CONFIG`

#### Conditional Formatting Requirements

- Highlight inactive settings.
- Highlight missing mandatory setting values.
- Highlight expired setting values where `Effective_To` is before current date.

### 3.2 RC_Master

#### Purpose

Approved Rate Contract master containing RC, bidder, distributor, make, and item details used for Purchase Order creation. Item selection in Purchase Orders is always derived from the selected Rate Contract. No standalone Item Master sheet exists. Distributor is optional where the bidder supplies directly.

#### Columns

| Order | Column           | Data Type | Mandatory / Optional | Editable / Locked | Dropdown Source       | Validation Rules                      |
| ----: | ---------------- | --------- | -------------------- | ----------------- | --------------------- | ------------------------------------- |
|     1 | RC_Line_ID       | Text      | Mandatory            | Locked            | None                  | Unique line-level key.                |
|     2 | RC_No            | Text      | Mandatory            | Editable          | None                  | Nonblank; grouped across RC lines.    |
|     3 | RC_Date          | Date      | Mandatory            | Editable          | None                  | Valid date.                           |
|     4 | Financial_Year   | Text      | Mandatory            | Editable          | `FINANCIAL_YEAR_LIST` | Must exist in Settings.               |
|     5 | RC_Status        | Text      | Mandatory            | Editable          | `RC_STATUS_LIST`      | Must exist in Settings.               |
|     6 | Bidder_ID        | Text      | Mandatory            | Editable          | None                  | Nonblank.                             |
|     7 | Bidder_Name      | Text      | Mandatory            | Editable          | None                  | Nonblank.                             |
|     8 | Distributor_ID   | Text      | Optional             | Editable          | None                  | Optional for Direct Supply.           |
|     9 | Distributor_Name | Text      | Optional             | Editable          | None                  | Optional for Direct Supply.           |
|    10 | Supply_Mode      | Text      | Mandatory            | Editable          | `SUPPLY_MODE_LIST`    | Direct Supply / Through Distributor.  |
|    11 | Item_ID          | Text      | Mandatory            | Editable          | None                  | Unique within RC.                     |
|    12 | Item_Name        | Text      | Mandatory            | Editable          | None                  | Nonblank.                             |
|    13 | Item_Description | Text      | Optional             | Editable          | None                  | Free text.                            |
|    14 | Make             | Text      | Mandatory            | Editable          | None                  | Manufacturer / Brand.                 |
|    15 | Unit             | Text      | Optional             | Editable          | `UNIT_LIST`           | If specified, must exist in Settings. |
|    16 | Category         | Text      | Optional             | Editable          | `ITEM_CATEGORY_LIST`  | Must exist in Settings if used.       |
|    17 | Rate             | Number    | Mandatory            | Editable          | None                  | ≥ 0                                   |
|    18 | GST_Percent      | Number    | Optional             | Editable          | `GST_RATE_LIST`       | If specified, must exist in Settings. |
|    19 | RC_Start_Date    | Date      | Mandatory            | Editable          | None                  | Valid date.                           |
|    20 | RC_End_Date      | Date      | Mandatory            | Editable          | None                  | Valid date.                           |
|    21 | RC_Document_Ref  | Text      | Optional             | Editable          | None                  | Document reference / Drive link.      |
|    22 | Active           | Boolean   | Mandatory            | Editable          | `TRUE_FALSE_LIST`     | TRUE/FALSE                            |
|    23 | Remarks          | Text      | Optional             | Editable          | None                  | Free text.                            |
|    24 | Created_At       | DateTime  | Mandatory            | Locked            | None                  | System timestamp.                     |
|    25 | Created_By       | Text      | Mandatory            | Locked            | None                  | System user identifier.               |
|    26 | Updated_At       | DateTime  | Optional             | Locked            | None                  | System timestamp.                     |
|    27 | Updated_By       | Text      | Optional             | Locked            | None                  | System user identifier.               |


#### Relationships

- Parent source for Purchase Orders.
- One RC may contain multiple items.
- Bidder and Distributor are derived from the selected RC.
- Distributor may remain blank when Supply Mode is Direct Supply.
- Item search shall support both Item_ID and Item_Name.


#### Primary Key

`RC_Line_ID`

#### Hidden Columns

None.

#### Freeze Rows

Row 1.

#### Protected Ranges

- Header row.
- Primary key column.
- Audit columns.
- Locked historical RC rows after approval.

#### Named Ranges Required

- `RC_MASTER_TABLE`
- `RC_LIST`
- `ACTIVE_RC_LIST`
- `RC_BIDDER_LIST`
- `RC_DISTRIBUTOR_LIST`
- `RC_ITEM_LIST`
- `RC_ITEM_RATE_LIST`

#### Conditional Formatting Requirements

- Highlight inactive RC rows.
- Highlight RCs nearing expiry.
- Highlight expired RCs.
- Highlight missing mandatory fields.

## 4 Transaction Sheets

### 4.1 PO_Entry

#### Purpose

User-facing Purchase Order entry screen for creating a Purchase Order against one approved Rate Contract.

PO Number and PO Date are entered manually.

Bidder, Distributor, Item, Make, Unit and Rate are derived from the selected RC.

Delivery Period, Delivery Address and Consignee are automatically loaded from Settings but remain editable before save.

GST is optional in the Purchase Order and is derived from the selected RC.

#### Columns

| Order | Column | Data Type | Mandatory / Optional | Editable / Locked | Dropdown Source | Validation Rules |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Entry_Row_ID | Text | Mandatory | Locked | None | Unique row key for entry rows. |
| 2 | PO_No | Text | **Mandatory** | **Editable** | None | Manual entry. Must be unique. |
| 3 | PO_Date | Date | Mandatory | Editable | None | Valid date. |
| 4 | Financial_Year | Text | Mandatory | Locked | `FINANCIAL_YEAR_LIST` | Derived from PO Date. |
| 5 | RC_No | Text | Mandatory | Editable | `ACTIVE_RC_LIST` | Must exist in active RC master. |
| 6 | Bidder_ID | Text | Mandatory | Locked | Filtered from RC | Derived from selected RC. |
| 7 | Bidder_Name | Text | Mandatory | Locked | Filtered from RC | Derived from selected RC. |
| 8 | Distributor_ID | Text | Optional | Editable | Filtered from RC and Bidder | Optional for Direct Supply. |
| 9 | Distributor_Name | Text | Optional | Locked | Filtered from RC and Bidder | Derived from selected Distributor. |
| 10 | Delivery_Period_Days | Number | Mandatory | Editable | Settings | Default from Settings. |
| 11 | Delivery_Address | Text | Mandatory | Editable | Settings | Default from Settings. |
| 12 | Consignee | Text | Mandatory | Editable | Settings | Default from Settings. |
| 13 | Supply_Mode | Text | Mandatory | Locked | Filtered from RC | Derived from selected RC. |
| 14 | Item_ID | Text | Mandatory | Editable | Filtered from RC | Searchable. |
| 15 | Item_Name | Text | Mandatory | Locked | Filtered from RC | Derived from Item_ID. |
| 16 | Item_Description | Text | Optional | Locked | Filtered from RC | Derived from Item_ID. |
| 17 | Make | Text | Mandatory | Locked | Filtered from RC | Derived from RC. |
| 18 | Unit | Text | Mandatory | Locked | Filtered from RC | Derived from Item_ID. |
| 19 | Quantity | Number | Mandatory | Editable | None | Greater than zero. |
| 20 | Rate | Number | Mandatory | Locked | Filtered from RC | Derived from RC. |
| 21 | Taxable_Amount | Number | Mandatory | Locked | None | Calculated. |
| 22 | GST_Percent | Number | Optional | Editable | `GST_RATE_LIST` | Derived from RC. |
| 23 | GST_Amount | Number | Locked | Locked | None | Calculated. |
| 24 | Total_Amount | Number | Mandatory | Locked | None | Calculated. |
| 25 | PO_Status | Text | Mandatory | Locked | `PO_STATUS_LIST` | Initial Status. |
| 26 | Remarks | Text | Optional | Editable | None | Free text. |
| 27 | Created_At | DateTime | Optional | Locked | None | System timestamp. |
| 28 | Created_By | Text | Optional | Locked | None | System user identifier. |

#### Relationships

- Reads RC, Bidder, Distributor, Item, Make, Unit, Rate and GST from `RC_Master`.
- Writes controlled records to `PO_Register`.

#### Validation Rules

- One PO shall reference exactly one RC.
- PO Number must be unique.
- Distributor may remain blank for Direct Supply.
- Items shall be selected only from the selected RC.
- Item search shall support Item Code and Item Name.
- Delivery details may be edited before Save.
- GST remains optional in PO.

#### Primary Key

`Entry_Row_ID`

#### Hidden Columns

- `Entry_Row_ID`

#### Freeze Rows

Header row and entry header section.

#### Protected Ranges

- Derived RC fields.
- Calculated amount fields.
- Status fields.

#### Named Ranges Required

- `PO_ENTRY_TABLE`
- `PO_ENTRY_RC_CELL`
- `PO_ENTRY_ITEM_ROWS`
- `PO_ENTRY_TOTALS`

#### Conditional Formatting Requirements

- Highlight missing mandatory entry fields.
- Highlight invalid dropdown selections.
- Highlight calculated totals.

---

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
| 10 | Delivery_Period_Days | Number    | Mandatory | Locked            | None            | Stored from PO   |
| 11 | Delivery_Address     | Text      | Mandatory            | Locked            | None            | Stored from PO   |
| 12 | Consignee            | Text      | Mandatory            | Locked            | None            | Stored from PO   |
| 13 | Supply_Mode | Text | Mandatory | Locked | `SUPPLY_MODE_LIST` | Must exist in Settings. |
| 14 | Item_ID | Text | Mandatory | Locked | None | Derived from RC. |
| 15 | Item_Name | Text | Mandatory | Locked | None | Derived from RC. |
| 16 | Item_Description | Text | Optional | Locked | None | Derived from RC. |
| 17 | Make | Text | Mandatory | Locked | Filtered from RC | Derived from RC. |
| 18 | Unit | Text | Mandatory | Locked | `UNIT_LIST` | Must exist in Settings. |
| 19 | Ordered_Quantity | Number | Mandatory | Locked | None | Number greater than zero. |
| 20 | Rate | Number | Mandatory | Locked | None | Number greater than or equal to zero. |
| 21 | Taxable_Amount | Number | Mandatory | Locked | None | Calculated amount field. |
| 22 | GST_Percent | Number | Optional | Locked | `GST_RATE_LIST` | Must exist in GST_RATE_LIST if specified.|
| 23 | GST_Amount | Number | Mandatory | Locked | None | Calculated amount field. |
| 24 | Total_Amount | Number | Mandatory | Locked | None | Calculated amount field. |
| 25 | Received_Quantity | Number | Mandatory | Locked | None | Updated from receipt records. |
| 26 | Balance_Quantity | Number | Mandatory | Locked | None | Derived quantity field. |
| 27 | PO_Status | Text | Mandatory | Locked | `PO_STATUS_LIST` | Pending, Partial, Completed, or Closed. |
| 28 | Close_Reason | Text | Optional | Locked | `PO_CLOSE_REASON_LIST` | Required when status is Closed. |
| 29 | PO_Document_Link | Text | Optional | Locked | None | Drive link or document reference. |
| 30 | Locked | Boolean | Mandatory | Locked | `TRUE_FALSE_LIST` | Must be TRUE after controlled save. |
| 31 | Created_At | DateTime | Mandatory | Locked | None | System timestamp. |
| 33 | Created_By | Text | Mandatory | Locked | None | System user identifier. |
| 34 | Updated_At | DateTime | Optional | Locked | None | System timestamp. |
| 35 | Updated_By | Text | Optional | Locked | None | System user identifier. |

#### Relationships

- Child of `RC_Master`.
- Parent source for `Receipt_Entry` and `Receipt_Register`.
- One Purchase Order shall reference exactly one RC.
- One Purchase Order may contain multiple items.
- All items shall belong only to the selected RC.
- One Purchase Order may receive multiple supplier invoices.
- Feeds Dashboard, Reports and document generation.

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
- Highlight overdue delivery based on Delivery Period.
- Highlight pending balance quantity.

### 4.3 Receipt_Entry

#### Purpose

User-facing Goods Receipt entry screen for recording Goods Receipt against a Purchase Order.

Receipt processing shall always be **Invoice-wise**.

User shall first select a Purchase Order, then enter/select the Supplier Invoice, after which only the items belonging to that invoice shall be available for receipt.

#### Workflow

```text
Select PO
      ↓
Enter / Select Invoice
      ↓
Load Invoice Items
      ↓
Enter Received Quantity
      ↓
Verify Invoice GST
      ↓
Save Receipt
```

#### Columns

| Order | Column | Data Type | Mandatory / Optional | Editable / Locked | Dropdown Source | Validation Rules |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Receipt_Entry_Row_ID | Text | Mandatory | Locked | None | Unique row key. |
| 2 | Receipt_No | Text | Optional | Locked | None | Assigned during controlled save. |
| 3 | Receipt_Date | Date | Mandatory | Editable | None | Valid date. |
| 4 | Financial_Year | Text | Mandatory | Locked | `FINANCIAL_YEAR_LIST` | Derived from Receipt Date. |
| 5 | PO_No | Text | Mandatory | Editable | `OPEN_PO_LIST` | Must exist in open PO list. |
| 6 | Invoice_No | Text | Mandatory | Editable | None | Must be unique within selected PO. |
| 7 | Invoice_Date | Date | Mandatory | Editable | None | Valid date. |
| 8 | Supplier_Invoice_Value | Number | Mandatory | Editable | None | Greater than zero. |
| 9 | RC_No | Text | Mandatory | Locked | None | Derived from PO. |
| 10 | Bidder_Name | Text | Mandatory | Locked | None | Derived from PO. |
| 11 | Distributor_Name | Optional | Locked | None | Derived from PO. |
| 12 | Item_ID | Text | Mandatory | Locked | None | Derived from selected Invoice. |
| 13 | Item_Name | Text | Mandatory | Locked | None | Derived from selected Invoice. |
| 14 | Make | Text | Mandatory | Locked | None | Derived from PO / RC. |
| 15 | Unit | Text | Mandatory | Locked | None | Derived from PO. |
| 16 | Ordered_Quantity | Number | Mandatory | Locked | None | Derived from PO. |
| 17 | Previously_Received_Quantity | Number | Mandatory | Locked | None | Derived from Receipt Register. |
| 18 | Balance_Quantity | Number | Mandatory | Locked | None | Calculated. |
| 19 | Received_Quantity | Number | Mandatory | Editable | None | Cannot exceed Balance Quantity. |
| 20 | Rate | Number | Mandatory | Locked | None | Derived from PO. |
| 21 | GST_Percent | Number | Mandatory | Editable | `GST_RATE_LIST` | Mandatory at Receipt stage. |
| 22 | Taxable_Value | Number | Mandatory | Locked | None | Calculated. |
| 23 | GST_Value | Number | Mandatory | Locked | None | Calculated. |
| 24 | Total_Value | Number | Mandatory | Locked | None | Calculated. |
| 25 | Receipt_Status | Text | Mandatory | Locked | `RECEIPT_STATUS_LIST` | Initial Status. |
| 26 | Remarks | Text | Optional | Editable | None | Free text. |
| 27 | Created_At | DateTime | Optional | Locked | None | System timestamp. |
| 28 | Created_By | Text | Optional | Locked | None | System user identifier. |

#### Relationships

- Reads PO details from `PO_Register`.
- Receipt is always linked to one PO and one Supplier Invoice.
- One PO may contain multiple Supplier Invoices.
- Writes controlled records to `Receipt_Register`.
- Provides source data for `Inspection_Verification`.

#### Validation Rules

- PO is mandatory.
- Invoice Number is mandatory.
- Invoice Number shall be unique within the selected PO.
- Received Quantity cannot exceed Balance Quantity.
- GST details are mandatory before Save.

#### Item Section

Each invoice item shall display:

- Item Code
- Item Name
- Ordered Qty
- Previously Received Qty
- Balance Qty
- Current Receipt Qty
- Rate
- GST %
- Taxable Value
- GST Value
- Total Value

#### Primary Key

`Receipt_Entry_Row_ID`

#### Hidden Columns

- `Receipt_Entry_Row_ID`

#### Freeze Rows

Header row and entry header section.

#### Protected Ranges

- Derived PO fields.
- Calculated amount fields.
- Balance Quantity.
- Receipt Number.
- Status fields.

#### Named Ranges Required

- `RECEIPT_ENTRY_TABLE`
- `RECEIPT_ENTRY_PO_CELL`
- `RECEIPT_ENTRY_ITEM_ROWS`

#### Conditional Formatting Requirements

- Highlight missing mandatory fields.
- Highlight pending balance quantity.
- Highlight invalid GST details.

#### Save Confirmation

After successful save, display

- Receipt Number
- PO Number
- Invoice Number
- Supplier
- Receipt Date
- Item-wise Receipt Summary
- Item-wise GST
- Item-wise Total Value

Buttons

- Print Receipt
- Close

Receipt may be reprinted any time.

### 4.4 Receipt_Register

#### Purpose

Authoritative locked register of saved Goods Receipt records and receipt line items.

Receipt Register is maintained **Invoice-wise**.

One Purchase Order may have multiple Supplier Invoices.

One Supplier Invoice may contain multiple items.

#### Columns

| Order | Column | Data Type | Mandatory / Optional | Editable / Locked | Dropdown Source | Validation Rules |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Receipt_Line_ID | Text | Mandatory | Locked | None | Unique line-level key. |
| 2 | Receipt_No | Text | Mandatory | Locked | None | Nonblank; grouped across receipt lines. |
| 3 | Receipt_Date | Date | Mandatory | Locked | None | Valid date. |
| 4 | Financial_Year | Text | Mandatory | Locked | `FINANCIAL_YEAR_LIST` | Must exist in Settings. |
| 5 | PO_No | Text | Mandatory | Locked | `PO_LIST` | Must exist in PO Register. |
| 6 | Invoice_No | Text | Mandatory | Locked | None | Unique within selected PO. |
| 7 | Invoice_Date | Date | Mandatory | Locked | None | Valid date. |
| 8 | Supplier_Invoice_Value | Number | Mandatory | Locked | None | Greater than zero. |
| 9 | RC_No | Text | Mandatory | Locked | None | Derived from PO. |
| 10 | Bidder_Name | Text | Mandatory | Locked | None | Derived from PO. |
| 11 | Distributor_Name | Text | Optional | Locked | None | Derived from PO. |
| 12 | Item_ID | Text | Mandatory | Locked | None | Derived from PO. |
| 13 | Item_Name | Text | Mandatory | Locked | None | Derived from PO. |
| 14 | Make | Text | Mandatory | Locked | None | Derived from RC. |
| 15 | Unit | Text | Mandatory | Locked | None | Derived from PO. |
| 16 | Ordered_Quantity | Number | Mandatory | Locked | None | Derived from PO. |
| 17 | Received_Quantity | Number | Mandatory | Locked | None | Greater than zero. |
| 18 | Cumulative_Received_Quantity | Number | Mandatory | Locked | None | Updated automatically. |
| 19 | Balance_Quantity | Number | Mandatory | Locked | None | Calculated automatically. |
| 20 | Rate | Number | Mandatory | Locked | None | Derived from PO. |
| 21 | GST_Percent | Number | Mandatory | Locked | `GST_RATE_LIST` | Stored from Receipt Entry. |
| 22 | Taxable_Value | Number | Mandatory | Locked | None | Calculated. |
| 23 | GST_Value | Number | Mandatory | Locked | None | Calculated. |
| 24 | Total_Value | Number | Mandatory | Locked | None | Calculated. |
| 25 | Receipt_Status | Text | Mandatory | Locked | `RECEIPT_STATUS_LIST` | Must exist in Settings. |
| 26 | Inspection_Required | Boolean | Mandatory | Locked | `TRUE_FALSE_LIST` | TRUE/FALSE. |
| 27 | Inspection_Status | Text | Mandatory | Locked | `INSPECTION_STATUS_LIST` | Updated after Inspection. |
| 28 | Receipt_Document_Link | Text | Optional | Locked | None | Drive link or document reference. |
| 29 | Created_At | DateTime | Mandatory | Locked | None | System timestamp. |
| 30 | Created_By | Text | Mandatory | Locked | None | System user identifier. |
| 31 | Updated_At | DateTime | Optional | Locked | None | System timestamp. |
| 32 | Updated_By | Text | Optional | Locked | None | System user identifier. |

#### Relationships

- Child of `PO_Register`.
- Parent source for `Inspection_Verification` and `Inspection_Register`.
- One Purchase Order may have multiple Supplier Invoices.
- One Supplier Invoice may contain multiple items.
- Receipt processing is always Invoice-wise.
- Feeds Dashboard and Reports.

#### Validation Rules

- Duplicate Invoice Number under the same Purchase Order is not allowed.
- Cumulative Received Quantity shall not exceed Ordered Quantity.
- GST details are mandatory for every invoice item.
- Received Quantity shall not exceed Balance Quantity.

#### Receipt Editing

- Receipt Clerk cannot edit saved Receipt records.
- Only Administrator may reopen or edit a saved Receipt.

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
- Primary key.
- Derived fields.
- Calculated amount fields.
- Document link.
- Audit columns.

#### Named Ranges Required

- `RECEIPT_REGISTER_TABLE`
- `RECEIPT_LIST`
- `PENDING_INSPECTION_RECEIPT_LIST`
- `RECEIPT_STATUS_RANGE`

#### Conditional Formatting Requirements

- Highlight pending balance quantity.
- Highlight invoices pending inspection.
- Highlight partially received items.
- Highlight completed receipt lines.

### 4.5 Inspection_Verification

#### Purpose

User-facing Inspection Verification screen for performing inspection against a **single Supplier Invoice**.

Inspection shall always be **Invoice-wise**.

User shall first select a Purchase Order, then select the Supplier Invoice, after which only the items belonging to that invoice shall be available for inspection.

#### Workflow

```text
Select PO
      ↓
Select Invoice
      ↓
Load Invoice Items
      ↓
Enter Inspection Details
      ↓
Save Inspection
```

#### Columns

| Order | Column | Data Type | Mandatory / Optional | Editable / Locked | Dropdown Source | Validation Rules |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Inspection_Entry_Row_ID | Text | Mandatory | Locked | None | Unique row key. |
| 2 | Inspection_No | Text | Optional | Locked | None | Assigned during controlled save. |
| 3 | Inspection_Date | Date | Mandatory | Editable | None | Valid date. |
| 4 | Financial_Year | Text | Mandatory | Locked | `FINANCIAL_YEAR_LIST` | Derived from Inspection Date. |
| 5 | PO_No | Text | Mandatory | Editable | `PO_LIST` | Must exist in PO Register. |
| 6 | Invoice_No | Text | Mandatory | Editable | `PENDING_INSPECTION_RECEIPT_LIST` | Pending Inspection invoices only. |
| 7 | Inspection_Note_No | Text | Mandatory | Editable | None | Manual entry. |
| 8 | Inspection_Note_Date | Date | Mandatory | Editable | None | Valid date. |
| 9 | RC_No | Text | Mandatory | Locked | None | Derived from PO. |
| 10 | Bidder_Name | Text | Mandatory | Locked | None | Derived from PO. |
| 11 | Distributor_Name | Text | Optional | Locked | None | Derived from PO. |
| 12 | Item_ID | Text | Mandatory | Locked | None | Derived from Invoice. |
| 13 | Item_Name | Text | Mandatory | Locked | None | Derived from Invoice. |
| 14 | Make | Text | Mandatory | Locked | None | Derived from RC. |
| 15 | Unit | Text | Mandatory | Locked | None | Derived from Receipt. |
| 16 | Received_Quantity | Number | Mandatory | Locked | None | Derived from Receipt. |
| 17 | Accepted_Quantity | Number | Mandatory | Editable | None | Numeric value. |
| 18 | Rejected_Quantity | Number | Mandatory | Editable | None | Numeric value. |
| 19 | Inspection_Result | Text | Mandatory | Editable | `INSPECTION_RESULT_LIST` | Must exist in Settings. |
| 20 | Committee | Text | Mandatory | Locked | `COMMITTEE_LIST` | Loaded automatically from Settings. |
| 21 | Remarks | Text | Optional | Editable | None | Free text. |
| 22 | Created_At | DateTime | Optional | Locked | None | System timestamp after save. |
| 23 | Created_By | Text | Optional | Locked | None | System user identifier after save. |

#### Relationships

- Reads pending inspection invoices from `Receipt_Register`.
- One Inspection is always linked to one Supplier Invoice.
- Writes controlled inspection records to `Inspection_Register`.

#### Validation Rules

- PO selection is mandatory.
- Invoice selection is mandatory.
- Only Pending Inspection invoices shall be available.
- Accepted Quantity + Rejected Quantity must equal Received Quantity.
- Inspection Result is mandatory.

#### Committee

- Committee members shall be loaded automatically from `Settings`.
- Normal users cannot modify committee members.
- Only Administrator may update Committee members in Settings.

#### Save

After successful save

- Receipt Inspection Status shall update automatically.
- Inspection Register shall update automatically.
- Inspection Note shall be available for printing.
- Inspection may be reprinted at any time.

#### Primary Key

`Inspection_Entry_Row_ID`

#### Hidden Columns

- `Inspection_Entry_Row_ID`

#### Freeze Rows

Header row and entry header section.

#### Protected Ranges

- Derived PO fields.
- Derived Receipt fields.
- Committee field.
- Inspection Number.
- Audit fields.

#### Named Ranges Required

- `INSPECTION_VERIFICATION_TABLE`
- `INSPECTION_RECEIPT_CELL`
- `INSPECTION_ITEM_ROWS`

#### Conditional Formatting Requirements

- Highlight missing mandatory fields.
- Highlight pending inspection invoices.
- Highlight rejected quantity entries.
- Highlight partial acceptance.

### 4.6 Inspection_Register

#### Purpose

Authoritative locked register of completed Inspection records.

Inspection Register is maintained **Invoice-wise**.

One Inspection record always belongs to one Supplier Invoice.

Multiple Inspection records may later be printed together in a single Inspection Note without merging the underlying records.

#### Columns

| Order | Column | Data Type | Mandatory / Optional | Editable / Locked | Dropdown Source | Validation Rules |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Inspection_Line_ID | Text | Mandatory | Locked | None | Unique line-level key. |
| 2 | Inspection_No | Text | Mandatory | Locked | None | Nonblank; grouped across inspection lines. |
| 3 | Inspection_Date | Date | Mandatory | Locked | None | Valid date. |
| 4 | Financial_Year | Text | Mandatory | Locked | `FINANCIAL_YEAR_LIST` | Must exist in Settings. |
| 5 | PO_No | Text | Mandatory | Locked | `PO_LIST` | Must exist in PO Register. |
| 6 | Invoice_No | Text | Mandatory | Locked | `RECEIPT_LIST` | Must exist in Receipt Register. |
| 7 | Inspection_Note_No | Text | Mandatory | Locked | None | Stored as entered. |
| 8 | Inspection_Note_Date | Date | Mandatory | Locked | None | Valid date. |
| 9 | RC_No | Text | Mandatory | Locked | None | Derived from PO. |
| 10 | Bidder_Name | Text | Mandatory | Locked | None | Derived from PO. |
| 11 | Distributor_Name | Text | Optional | Locked | None | Derived from PO. |
| 12 | Item_ID | Text | Mandatory | Locked | None | Derived from Receipt. |
| 13 | Item_Name | Text | Mandatory | Locked | None | Derived from Receipt. |
| 14 | Make | Text | Mandatory | Locked | None | Derived from RC. |
| 15 | Unit | Text | Mandatory | Locked | None | Derived from Receipt. |
| 16 | Received_Quantity | Number | Mandatory | Locked | None | Derived from Receipt. |
| 17 | Accepted_Quantity | Number | Mandatory | Locked | None | Stored Inspection Quantity. |
| 18 | Rejected_Quantity | Number | Mandatory | Locked | None | Stored Inspection Quantity. |
| 19 | Inspection_Result | Text | Mandatory | Locked | `INSPECTION_RESULT_LIST` | Must exist in Settings. |
| 20 | Committee | Text | Mandatory | Locked | `COMMITTEE_LIST` | Loaded from Settings. |
| 21 | Remarks | Text | Optional | Locked | None | Free text. |
| 22 | Inspection_Document_Link | Text | Optional | Locked | None | Drive link or document reference. |
| 23 | Created_At | DateTime | Mandatory | Locked | None | System timestamp. |
| 24 | Created_By | Text | Mandatory | Locked | None | System user identifier. |
| 25 | Updated_At | DateTime | Optional | Locked | None | System timestamp. |
| 26 | Updated_By | Text | Optional | Locked | None | System user identifier. |

#### Relationships

- Child of `Receipt_Register`.
- One Inspection record belongs to one Supplier Invoice.
- Indirect child of `PO_Register` and `RC_Master`.
- Multiple Inspection records may later be combined into a single printable Inspection Note.
- Feeds Dashboard and Reports.

#### Validation Rules

- Inspection Result is mandatory.
- Accepted Quantity + Rejected Quantity shall equal Received Quantity.
- One Invoice shall not be inspected more than once unless reopened by Administrator.

#### Inspection Note Printing

- One Inspection Note may include multiple Supplier Invoices.
- User shall manually select the invoices to include.
- Original Inspection records shall always remain Invoice-wise.
- Combined printing shall not merge Inspection records.
- Inspection Notes may be reprinted at any time.

#### Editing

- Inspection Clerk cannot edit saved Inspection records.
- Only Administrator may reopen or edit a saved Inspection.

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
- Primary key.
- Inspection Note fields.
- Document link.
- Audit columns.

#### Named Ranges Required

- `INSPECTION_REGISTER_TABLE`
- `INSPECTION_LIST`
- `INSPECTION_STATUS_RANGE`

#### Conditional Formatting Requirements

- Highlight pending Inspection.
- Highlight accepted Inspection.
- Highlight rejected Inspection.
- Highlight partial acceptance.
## 5 Report Sheets

### 5.1 Dashboard

#### Purpose

Management dashboard containing real-time KPIs, widgets, charts and pending action summaries.

Dashboard shall provide clickable KPI widgets that open the corresponding filtered reports.

#### Columns

Dashboard is a presentation sheet rather than a transaction table. The design uses defined filter cells, widget cells, chart areas and hidden calculation helper ranges.

| Area | Data Type | Mandatory / Optional | Editable / Locked | Dropdown Source | Validation Rules |
| --- | --- | --- | --- | --- | --- |
| Filter Panel | Text/Date | Optional | Editable | Report filter named ranges | Must use allowed filter values. |
| KPI Widgets | Number/Text | Mandatory | Locked | Registers | Derived from report data. |
| Pending Action Widgets | Number/Text | Mandatory | Locked | Registers | Derived from report data. |
| Chart Areas | Chart/Data Range | Optional | Locked | Registers | Derived from report data. |
| Helper Ranges | Text/Number | Optional | Locked/Hidden | Registers | Internal dashboard calculations. |

#### Relationships

- Reads from `RC_Master`, `PO_Register`, `Receipt_Register`, `Inspection_Register` and `Settings`.

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
- Highlight RCs expiring within 30 days.
- Highlight overdue deliveries.
- Highlight pending inspections.

#### KPI Widgets

- Total Active RC
- RC Expiring Within 30 Days
- Total Purchase Orders
- Pending Delivery Purchase Orders
- Pending Receipt
- Pending Inspection
- Total Purchase Value
- Current Financial Year Purchase Value

#### Drill-down Widgets

Each widget shall open the corresponding filtered report.

| Dashboard Widget | Opens Report |
|------------------|-------------|
| Active RC | RC Register |
| RC Expiry | RC Expiry Report |
| Pending Delivery | Pending Delivery Report |
| Pending Receipt | Pending Receipt Report |
| Pending Inspection | Pending Inspection Report |
| Supplier Purchase | Supplier-wise Purchase Report |
| Item Purchase | Item-wise Purchase Report |
| Purchase Summary | PO Summary Report |

#### Dashboard Rules

- Dashboard data shall refresh automatically.
- Clicking a widget shall open the corresponding report with filters applied.
- Dashboard shall display only current transaction data.
- Dashboard shall not allow manual editing of calculated values.

### 5.2 Reports

#### Purpose

Central report selection, filter and output sheet for operational, analytical and management reports.

Reports shall support on-screen viewing, printing and export.

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
| 8 | RC_No | Text | Optional | Editable | `RC_LIST` | Must exist in RC Master if selected. |
| 9 | PO_No | Text | Optional | Editable | `PO_LIST` | Must exist in PO Register if selected. |
| 10 | Bidder | Text | Optional | Editable | `BIDDER_LIST` | Must exist in RC Master if selected. |
| 11 | Distributor | Text | Optional | Editable | `DISTRIBUTOR_LIST` | Must exist in RC Master if selected. |
| 12 | Item | Text | Optional | Editable | `ITEM_LIST` | Must exist in RC Master if selected. |
| 13 | Status | Text | Optional | Editable | `STATUS_LIST` | Must exist in Settings. |
| 14 | Output_Area | Text / Number / Date | Optional | Locked | Registers | Report output area. |

#### Relationships

- Reads data from `RC_Master`, `PO_Register`, `Receipt_Register`, `Inspection_Register` and `Settings`.
- Uses filter values from Settings and transaction registers.

#### Primary Key

`Report_Run_ID` (if report execution history is retained).

#### Hidden Columns

Helper columns for report generation and filter normalization.

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
- Highlight report totals.
- Highlight status columns where applicable.

---

## Available Reports

### Purchase Order Reports

- PO Summary
- PO Detail (Item-wise)

### Supplier / Bidder Reports

- Supplier-wise Purchase
- Bidder-wise Purchase

Distributor may remain blank for Direct Supply.

### Item Reports

- Item-wise Purchase
- Item Pending Quantity
- Item Supply History

### Pending Reports

- Pending Delivery
- Pending Receipt
- Pending Inspection

### Rate Contract Reports

- RC Register
- RC Expiry
- RC-wise Purchase

---

## Common Report Filters

Every report shall support

- Financial Year
- Quarter
- Month
- Date Range
- RC
- Bidder
- Distributor
- Item
- Status

---

## Financial Year Rule

Financial Year filtering shall always use **PO Date** as the reference date.

---

## PO Summary Report

Display

- PO No
- PO Date
- Bidder
- Distributor
- RC No
- PO Value
- Status

(Item details are not displayed.)

---

## PO Detail Report

Display

- PO No
- PO Date
- Bidder
- Distributor
- RC No
- Item Code
- Item Name
- Ordered Quantity
- Received Quantity
- Balance Quantity
- Rate
- GST
- Total Value

---

## Supplier / Bidder Report

Display

- Bidder
- Distributor
- RC No
- PO No
- Item
- Quantity
- Value

Distributor may remain blank for Direct Supply.

---

## Item Report

Display

- Item Code
- Item Name
- RC No
- PO No
- Ordered Quantity
- Supplied Quantity
- Balance Quantity

---

## Export Options

Every report shall support

- Print
- PDF
- Excel

---

## Dashboard Navigation

Every Dashboard widget shall open its corresponding report with the applied filters.


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
| 9 | Stack_Trace | Text      | System generated stack trace for debugging |

| 10 | Resolution_Status | Text | Mandatory | Locked | `ERROR_RESOLUTION_STATUS_LIST` | Must exist in Settings. |
| 11 | Resolved_At | DateTime | Optional | Locked | None | System timestamp if resolved. |
| 12 | Resolved_By | Text | Optional | Locked | None | System user identifier if resolved. |
| 13 | Remarks | Text | Optional | Locked | None | Free text. |

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

## Global Search

AIIMS Store ERP shall provide a Global Search dialog.

Users shall be able to search by

- RC Number
- PO Number
- Receipt Number
- Inspection Number
- Item Code
- Item Name
- Bidder
- Distributor

Search shall support

- Partial matching
- Case-insensitive search
- Keyboard navigation

Search results shall open the corresponding transaction.

## 7 Master Relationships

### RC

- One Rate Contract contains one or more approved items.
- One Rate Contract is linked to one Bidder.
- One Rate Contract may have one Distributor or Direct Supply.
- Only **Active Rate Contracts** shall be available during Purchase Order creation.
- Bidder, Distributor, Item, Make, Unit, Rate and default GST are derived from the selected RC.

---

### Purchase Order

- One Purchase Order shall always be created against **exactly one Rate Contract**.
- One Purchase Order may contain multiple items.
- Items can be selected **only from the selected Rate Contract**.
- One Purchase Order may receive multiple Supplier Invoices.
- Purchase Order is the parent transaction for Receipt.

---

### Receipt

- One Receipt shall always belong to one Purchase Order.
- Receipt processing shall always be **Invoice-wise**.
- User workflow:

```text
Purchase Order
      ↓
Supplier Invoice
      ↓
Invoice Items
      ↓
Goods Receipt
```

- Multiple Supplier Invoices are allowed against one Purchase Order until ordered quantity is exhausted.
- Receipt is the parent transaction for Inspection.

---

### Inspection

- Inspection shall always be **Invoice-wise**.
- One Inspection belongs to one Supplier Invoice.
- One Supplier Invoice may contain multiple inspected items.
- Multiple Inspection records may later be printed together in a single Inspection Note.
- Printing shall **not** merge Inspection records.
- Inspection updates the Receipt Inspection Status automatically.

---

### Bidder / Distributor

- Bidder is mandatory.
- Distributor is optional.
- Direct Supply is permitted without Distributor.
- Bidder and Distributor are derived from the selected Rate Contract.

---

### Items

- Items exist only inside approved Rate Contracts.
- No standalone Item Master shall be maintained.
- Item search shall support:
  - Item Code
  - Item Name
- Only RC-linked items shall be selectable during Purchase Order creation.

---

### Settings

`Settings` provides

- Financial Year
- Numbering Configuration
- Status Lists
- GST Rates
- Committee Members
- Delivery Defaults
- Consignee Defaults
- Report Configuration
- Validation Lists
- Named Range Sources

All modules shall use Settings as the central configuration source.

## 8 Dropdown Design

### Searchable Dropdown Relationship

```text
Rate Contract
      ↓
Bidder
      ↓
Distributor (Optional)
      ↓
Purchase Order
      ↓
Supplier Invoice
      ↓
Items
```

### Dropdown Sources

| Dropdown | Source | Filter Dependency |
| --- | --- | --- |
| Rate Contract | `RC_Master` | Active RC only |
| Bidder | `RC_Master` | Selected Rate Contract |
| Distributor | `RC_Master` | Selected Rate Contract and Bidder |
| Item | `RC_Master` | Selected Rate Contract |
| Purchase Order | `PO_Register` | Open Purchase Orders |
| Supplier Invoice | `Receipt_Register` | Selected Purchase Order |
| Receipt | `Receipt_Register` | Pending Inspection Receipts |
| Status | `Settings` | Module-specific Status List |
| Financial Year | `Settings` | Active Financial Years |

### Dropdown Rules

- Only **Active Rate Contracts** shall appear.
- Bidder shall be filtered based on the selected Rate Contract.
- Distributor shall be filtered based on the selected Rate Contract and Bidder.
- Distributor dropdown shall remain optional for Direct Supply.
- Item dropdown shall display only items belonging to the selected Rate Contract.
- Item dropdown shall refresh immediately after Rate Contract selection.
- Purchase Order dropdown shall display only Open Purchase Orders.
- Supplier Invoice dropdown shall appear only after Purchase Order selection.
- Inspection Invoice dropdown shall display only Pending Inspection invoices.
- Status dropdowns shall use module-specific status lists from Settings.
- Financial Year dropdown shall display only Active Financial Years.

### Search Behaviour

Every searchable dropdown shall support

- Typing
- Partial search
- Keyboard navigation
- Mouse selection

### Searchable Dropdown Requirements

- Dropdowns shall support Google Sheets searchable dropdowns.
- Dependent dropdowns shall refresh automatically after parent selection.
- Item dropdown shall never display items outside the selected Rate Contract.
- Direct Supply shall be supported without requiring Distributor selection.
- All dropdown named ranges shall be maintained from Settings, RC_Master and transaction registers.


## 9 Report Filter Design

### Common Filters

| Filter | Source |
| --- | --- |
| Financial Year *(Based on PO Date)* | `FINANCIAL_YEAR_LIST` |
| Quarter | `QUARTER_LIST` |
| Month | `MONTH_LIST` |
| Date Range | User-entered date cells |
| RC | `RC_LIST` |
| PO | `PO_LIST` |
| Bidder | `BIDDER_LIST` |
| Distributor | `DISTRIBUTOR_LIST` |
| Item | `ITEM_LIST` |
| Status | `STATUS_LIST` |

### Filter Behaviour

- Multiple filters may be applied simultaneously.
- Financial Year shall always be determined using **PO Date**.
- Blank Distributor shall include **Direct Supply** records.
- Reports opened from Dashboard shall automatically apply the corresponding filter.
- Filters shall remain active until cleared or changed by the user.

### Filter Areas

- Dashboard filter panel.
- Reports filter panel.
- Report-specific output headers.
- Hidden helper ranges for normalized selected filter values.

## 10 Global Business Rules

1. RC is the master source for Purchase Order creation.
2. One Purchase Order shall reference exactly one Rate Contract.
3. Receipt processing shall always be Invoice-wise.
4. Inspection processing shall always be Invoice-wise.
5. Multiple Inspection records may be printed together in one Inspection Note.
6. Inspection printing shall not merge Inspection records.
7. GST in Rate Contract is optional.
8. GST becomes mandatory during Receipt.
9. Distributor is optional for Direct Supply.
10. Receipt Clerk cannot edit saved Receipt records.
11. Inspection Clerk cannot edit saved Inspection records.
12. Only Administrator may reopen or edit saved transactions.
13. Financial Year shall always be calculated using PO Date.
14. Settings shall remain the central configuration source for all modules.

## 11 Dashboard Design

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

## 12 Report Design

### PO Summary

Summary report of Purchase Orders by selected filters.

Footer

- Total Purchase Orders
- Grand Total Value

### PO Detail

Line-level Purchase Order report by selected filters.

Footer

- Total Quantity
- Grand Total Value

### Receipt Register

Line-level Goods Receipt report by selected filters.

Footer

- Total Quantity
- Grand Total Value
### Inspection Register

Line-level inspection report by selected filters.

Footer

- Total Quantity
- Grand Total Value
### Pending Delivery

Report of PO lines with pending balance quantity.

Footer

- Total Quantity
- Grand Total Value

### Pending Inspection

Report of receipt lines pending inspection.

Footer

- Total Quantity
- Grand Total Value

### RC Register

Register report of Rate Contract records.

Footer

- Total Quantity
- Grand Total Value

### RC Expiry

Report of Rate Contracts by expiry status or expiry period.

Footer

- Total Quantity
- Grand Total Value

### RC-wise Purchase

Purchase report grouped by Rate Contract.
Footer

- Total Quantity
- Grand Total Value

### Bidder/Distributor-wise Purchase

Purchase report grouped by bidder and distributor.

Footer

- Total Quantity
- Grand Total Value

### Item-wise Purchase

Purchase report grouped by item.

Footer

- Total Quantity
- Grand Total Value

### Item History

Item transaction history across RC, PO, receipt, and inspection records.

Footer

- Total Quantity
- Grand Total Value

### Purchase Analysis

Analytical purchase report using financial year, period, RC, bidder, distributor, item, and status filters.

Footer

- Total Quantity
- Grand Total Value

## Version History

### Version 1.1

- Updated RC Master structure.
- Added Make field.
- Made Distributor optional for Direct Supply.
- Made GST optional in RC and PO.
- Added Delivery Period, Delivery Address and Consignee in PO.
- Revised Receipt workflow to PO → Invoice → Items.
- Revised Inspection workflow to Invoice-wise inspection.
- Added combined Inspection Note printing.
- Expanded Dashboard KPIs.
- Expanded operational reports.
- Standardized report filters.
- Added consolidated business rules.
## Document Freeze

Version 1.1 is frozen.

No structural changes shall be made after coding begins.

Future modifications shall be introduced only through approved change requests and version-controlled documentation.

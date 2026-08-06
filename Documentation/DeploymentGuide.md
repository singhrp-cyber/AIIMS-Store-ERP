# AIIMS Store ERP Deployment Guide

**Version:** 1.0  
**Applies To:** Backend v1.0.0-backend  
**Based On:** WorkbookDesign.md Version 1.1

---

# 1. Purpose

This document describes the complete deployment procedure for AIIMS Store ERP.

It provides the steps required to configure the Google Spreadsheet, deploy the Apps Script backend, configure Google Drive resources, validate workbook configuration, and prepare the system for integration testing and production use.

This guide complements:

- WorkbookDesign.md
- DatabaseDesign.md
- SRS.md
- Workflow.md
- TestingPlan.md

---

# 2. Scope

This guide covers:

- Repository deployment
- Google Spreadsheet setup
- Apps Script deployment
- Workbook configuration
- Named ranges
- Google Drive templates
- Initial system configuration
- Deployment validation

It does **not** define business rules or functional workflows. Those remain the responsibility of WorkbookDesign.md and SRS.md.

---

# 3. Prerequisites

Before deployment ensure the following are available:

- Google Workspace Account
- Google Sheets
- Google Apps Script
- Google Drive
- Git
- GitHub repository access
- AIIMS Store ERP repository

---

# 4. Repository Structure

The repository should contain the following major folders.

```
AppsScript/
Documentation/
GoogleSheet/
Templates/
TestData/
```

Primary documentation:

```
Documentation/

WorkbookDesign.md
DatabaseDesign.md
SRS.md
Workflow.md
TestingPlan.md
DeploymentGuide.md
```

---

# 5. Google Spreadsheet Creation

Create a new Google Spreadsheet.

The workbook shall follow the structure defined in WorkbookDesign.md.

Do not rename sheets after deployment.

---

# 6. Workbook Sheet Configuration

## 6.1 Master Sheets

Create:

- Settings
- RC_Header

Dedicated RC Item Sheets are created automatically by RC.gs.

---

## 6.2 Transaction Sheets

Create:

- PO_Entry
- PO_Register
- Receipt_Entry
- Receipt_Register
- Inspection_Verification
- Inspection_Register

---

## 6.3 Report Sheets

Create:

- Dashboard
- Reports

---

## 6.4 Hidden System Sheets

Create:

- Transaction_Log
- Error_Log

Both sheets shall be:

- Hidden
- Protected
- Administrator accessible only

---

# 7. Sheet Design Standards

Configure every sheet according to WorkbookDesign.md.

Requirements include:

- Header row at Row 1
- Freeze header row
- Locked register sheets
- Protected hidden sheets
- Explicit primary key columns
- Audit columns
- Dropdowns sourced from Settings

Entry sheets shall use:

- Upper section for header information
- Lower section for line items

---

# 8. Named Range Configuration

Create every Named Range defined in WorkbookDesign.md.

Examples include:

- RC_HEADER_TABLE
- REPORT_FILTERS
- REPORT_OUTPUT

Ensure:

- Range names exactly match WorkbookDesign.md.
- No duplicate Named Ranges exist.
- Named Ranges point to correct cells.

Deployment shall not proceed until all Named Ranges are verified.

---

# 9. Settings Configuration

Populate the Settings sheet.

Minimum required configuration includes:

## Numbering

Configure numbering for:

- Rate Contract
- Purchase Order
- Receipt
- Inspection

Each numbering configuration shall include:

- Prefix
- Financial Year
- Running Number

---

## Status Lists

Populate:

- RC Status
- PO Status
- Receipt Status
- Inspection Status

---

## Financial Years

Populate active Financial Year values.

---

## GST Rates

Populate all approved GST percentages.

---

## Committees

Populate Inspection Committee configuration.

---

## Report Filters

Populate all dropdown values required by Dashboard and Reports.

---

## Template Configuration

Store:

- RC Template ID
- PO Template ID
- Receipt Template ID
- Inspection Template ID
- Output Folder ID

---

# 10. Google Drive Configuration

Create one output folder.

Example:

```
AIIMS Store ERP Documents
```

Copy Folder ID.

Save Folder ID into Settings.

---

# 11. Google Docs Templates

Create Google Docs templates for:

- Rate Contract
- Purchase Order
- Receipt
- Inspection Note

Each template shall contain required placeholders.

Example:

```
{{PO_No}}

{{Supplier_Name}}

{{PO_Date}}

{{#ITEM_TABLE#}}
```

Template placeholders shall match the names expected by WordGenerator.gs.

---

# 12. Apps Script Deployment

Open:

Extensions

→ Apps Script

Import all files from:

```
AppsScript/
```

Required files include:

- Utils.gs
- Settings.gs
- RC.gs
- PO.gs
- Receipt.gs
- Inspection.gs
- Reports.gs
- Dashboard.gs
- WordGenerator.gs
- Search.gs
- Code.gs

Verify:

- No syntax errors
- V8 runtime enabled

---

# 13. Authorization

Execute one simple function from Apps Script.

Grant all requested permissions.

Verify access to:

- Spreadsheet
- Drive
- Docs

---

# 14. Security Configuration

Verify:

- Register sheets protected
- Hidden sheets protected
- Settings restricted
- Administrator-only configuration ranges
- Named ranges protected where applicable

---

# 15. Initial Validation

Verify:

✓ Spreadsheet opens

✓ Apps Script compiles

✓ No runtime errors

✓ Settings loaded

✓ Dashboard opens

✓ Reports sheet opens

---

# 16. Functional Validation

Execute the following sequence.

```
Create Rate Contract

↓

Create Purchase Order

↓

Receive Goods

↓

Inspect Goods

↓

Generate Reports

↓

Refresh Dashboard

↓

Generate Documents
```

Expected result:

All modules execute successfully.

---

# 17. Integration Testing

Execute every test defined in:

```
Documentation/
TestingPlan.md
```

Do not proceed to production until:

- Critical tests passed
- High priority tests passed
- No unresolved blocking defects

---

# 18. Backup Strategy

Before production deployment:

- Export Spreadsheet
- Backup Apps Script project
- Backup Google Docs templates
- Tag repository

Recommended Git tag:

```
v1.0.0
```

---

# 19. Troubleshooting

Verify:

## Number generation

- Prefix configured
- Financial Year active
- Running number available

---

## Missing dropdowns

Verify:

- Settings values
- Named ranges
- Validation rules

---

## Document generation

Verify:

- Template IDs
- Folder ID
- Placeholder names
- Drive permissions

---

## Reports

Verify:

- REPORT_FILTERS
- REPORT_OUTPUT
- Settings configuration

---

## Dashboard

Verify:

- Dashboard filters
- Chart source ranges
- Report availability

---

# 20. Production Readiness Checklist

Before Go-Live verify:

- Workbook configured
- Sheet names verified
- Named ranges verified
- Settings populated
- Apps Script deployed
- Templates configured
- Drive configured
- TestingPlan completed
- No Critical defects
- Backend tag available
- GitHub Release available

---

# 21. Version

| Item | Value |
|------|-------|
| Deployment Guide | 1.0 |
| Backend Version | v1.0.0-backend |
| Workbook Specification | Version 1.1 |

---

# 22. Related Documents

- WorkbookDesign.md
- DatabaseDesign.md
- MRD.md
- SRS.md
- Workflow.md
- RepositoryReview.md
- TestingPlan.md

---

End of Document
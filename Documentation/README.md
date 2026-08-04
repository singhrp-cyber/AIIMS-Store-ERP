# AIIMS Store ERP

AIIMS Store ERP is a Google Sheets and Google Apps Script based store management system for institutional procurement, receipt, inspection, and reporting workflows.

This repository contains the Phase 1 architecture baseline only. It establishes the project structure, workbook modules, Apps Script source boundaries, and documentation framework required for production implementation in later phases.

## Repository Structure

```text
AIIMS-Store-ERP/
  AppsScript/
  Documentation/
  GoogleSheet/
  Templates/
  TestData/
```

## Phase 1 Scope

Phase 1 includes:

- Google Apps Script project manifest.
- Apps Script module files with clear ownership boundaries.
- Documentation for requirements, database design, and workflow architecture.
- Google Sheet workbook module definitions.
- Template and test data governance folders.

Phase 1 does not include:

- Business logic.
- UI logic.
- Trigger logic.
- Sample test records.
- Mock or placeholder implementations.

## Apps Script Modules

| File | Responsibility |
| --- | --- |
| `Code.gs` | Application entry points and orchestration ownership. |
| `Utils.gs` | Shared validation, spreadsheet, audit, and error utilities. |
| `RC.gs` | Rate Contract workflow ownership. |
| `PO.gs` | Purchase order workflow ownership. |
| `Receipt.gs` | Material receipt workflow ownership. |
| `Inspection.gs` | Inspection workflow ownership. |
| `Dashboard.gs` | Dashboard aggregation ownership. |
| `Reports.gs` | Reporting ownership. |
| `WordGenerator.gs` | Google Docs generation ownership. |
| `Search.gs` | Cross-register search ownership. |
| `Settings.gs` | System settings ownership. |

## Workbook Modules

The Google Sheet workbook is designed around these production modules:

- `Settings`
- `RC_Header`
- `RC Item Sheets` (One dedicated sheet per approved Rate Contract)
- `PO_Entry`
- `PO_Register`
- `Receipt_Entry`
- `Receipt_Register`
- `Inspection_Verification`
- `Inspection_Register`
- `Dashboard`
- `Reports`

Each module is documented in the `GoogleSheet` folder.

## Version

Current repository version: `0.1`

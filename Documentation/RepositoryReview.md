# Repository Review

## Review Scope

This review covers every non-Git project file currently present in the repository. No source code or existing documentation was modified during this review.

## Current Repository Structure

```text
AIIMS-Store-ERP/
  .gitattributes
  README.md
  AppsScript/
    appsscript.json
    Code.gs
    RC.gs
    Dashboard.gs
    Inspection.gs
    PO.gs
    Receipt.gs
    Reports.gs
    Search.gs
    Settings.gs
    Utils.gs
    WordGenerator.gs
  Documentation/
    DatabaseDesign.md
    README.md
    SRS.md
    Workflow.md
    RepositoryReview.md
  GoogleSheet/
    Dashboard.md
    Inspection_Register.md
    PO_Entry.md
    PO_Register.md
    RC_Header.md
    RC_ItemSheet.md
    README.md
    Receipt_Entry.md
    Receipt_Register.md
    Settings.md
  Templates/
    README.md
  TestData/
    README.md
```

## Folder Inventory

| Folder | Current purpose |
| --- | --- |
| `AppsScript/` | Google Apps Script project manifest and module boundary files. |
| `Documentation/` | Architecture, requirements, database design, workflow, and repository review documents. |
| `GoogleSheet/` | Workbook module definitions for the planned Google Sheets data layer. |
| `Templates/` | Reserved location for future controlled document templates. |
| `TestData/` | Reserved location for future controlled test data artifacts. |

## Apps Script Files

| File | Current contents |
| --- | --- |
| `AppsScript/appsscript.json` | Apps Script manifest using the `Asia/Kolkata` timezone, V8 runtime, Stackdriver exception logging, and spreadsheet, document, and Drive file scopes. |
| `AppsScript/Code.gs` | Application entry module comment defining future ownership for entry points, orchestration, custom menus, triggers, and workflow wiring. No executable logic exists. |
| `AppsScript/RC.gs` | Rate Contract module defining future ownership for RC Header management, RC Item Sheet management, validation, search, extension, and lifecycle management. No workflows exist. |
| `AppsScript/Dashboard.gs` | Dashboard module comment defining future ownership for metrics aggregation, refresh orchestration, pending actions, and indicators. No calculations exist. |
| `AppsScript/Inspection.gs` | Inspection module comment defining future ownership for inspection validation, status updates, remarks, compliance tracking, and stock-readiness signals. No workflows exist. |
| `AppsScript/PO.gs` | Purchase Order module comment defining future ownership for PO validation, register persistence, status lifecycle, and lookup services. No workflows exist. |
| `AppsScript/Receipt.gs` | Receipt module comment defining future ownership for receipt validation, register persistence, PO reconciliation, and receipt status lifecycle. No workflows exist. |
| `AppsScript/Reports.gs` | Reports module comment defining future ownership for report assembly, filtering, export preparation, period summaries, and compliance reports. No workflows exist. |
| `AppsScript/Search.gs` | Search module comment defining future ownership for cross-register search, filter normalization, result shaping, and fast lookup support. No workflows exist. |
| `AppsScript/Settings.gs` | Settings module comment defining future ownership for configuration loading, validation, deployment metadata, and feature flags. No workflows exist. |
| `AppsScript/Utils.gs` | Shared utility module comment defining future ownership for validation helpers, spreadsheet wrappers, audit helpers, and error normalization. No utilities exist. |
| `AppsScript/WordGenerator.gs` | Word document generation module comment defining future ownership for Google Docs template population, PO, receipt, inspection document generation, and Drive output control. No generation logic exists. |

## Documentation Files

| File | Current contents |
| --- | --- |
| `README.md` | Root project overview describing AIIMS Store ERP as a Phase 1 architecture baseline for Google Sheets and Apps Script. Links to the documentation index. |
| `Documentation/README.md` | Documentation index explaining Phase 1 scope, repository structure, Apps Script module responsibilities, workbook modules, and current version `0.1`. |
| `Documentation/SRS.md` | Software requirements specification defining system purpose, Phase 1 objective, expected user roles, functional areas, non-functional requirements, exclusions, and acceptance criteria. |
| `Documentation/DatabaseDesign.md` | Database design overview for Google Sheets as the data platform, workbook module purposes, design principles, entity groups, and audit expectations. |
| `Documentation/Workflow.md` | Workflow architecture with a Mermaid flow from rate contract master through PO, receipt, inspection, dashboard, reports, and document generation. |
| `GoogleSheet/README.md` | Workbook architecture index listing the planned Google Sheet modules and stating that column-level implementation is deferred. |
| `GoogleSheet/RC_Header.md` | Defines the `RC_Header` sheet as the master index of approved Rate Contracts. |
| `GoogleSheet/RC_ItemSheet.md` | Defines the dedicated RC Item Sheet structure used for each approved Rate Contract. |
| `GoogleSheet/PO_Entry.md` | Defines the `PO_Entry` sheet as the user-facing PO input surface before validation and persistence. No columns or sample data exist. |
| `GoogleSheet/PO_Register.md` | Defines the `PO_Register` sheet as the authoritative auditable PO transaction register. No columns or sample data exist. |
| `GoogleSheet/Receipt_Entry.md` | Defines the `Receipt_Entry` sheet as the user-facing material receipt input surface before validation and persistence. No columns or sample data exist. |
| `GoogleSheet/Receipt_Register.md` | Defines the `Receipt_Register` sheet as the authoritative auditable receipt transaction register. No columns or sample data exist. |
| `GoogleSheet/Inspection_Register.md` | Defines the `Inspection_Register` sheet as the authoritative inspection transaction register. No columns or sample data exist. |
| `GoogleSheet/Dashboard.md` | Defines the `Dashboard` sheet as the management and monitoring surface. No formulas, charts, or metrics exist. |
| `GoogleSheet/Settings.md` | Defines the `Settings` sheet as the centralized configuration source. No settings or validations exist. |
| `Templates/README.md` | States that the folder is reserved for controlled document templates. No templates exist. |
| `TestData/README.md` | States that the folder is reserved for controlled test data. No datasets exist. |
| `Documentation/RepositoryReview.md` | This repository review, created after reading the existing files. |

## Other Files

| File | Current contents |
| --- | --- |
| `.gitattributes` | Normalizes text files to LF line endings, including `.gs`, `.json`, and `.md` files. |

## Existing Modules

| Module | Current state |
| --- | --- |
| Application entry and orchestration | Boundary identified in `Code.gs`; implementation missing. |
| Shared utilities | Boundary identified in `Utils.gs`; implementation missing. |
| Purchase order workflow | Boundary identified in `PO.gs`, `PO_Entry.md`, and `PO_Register.md`; implementation missing. |
| Receipt workflow | Boundary identified in `Receipt.gs`, `Receipt_Entry.md`, and `Receipt_Register.md`; implementation missing. |
| Inspection workflow | Boundary identified in `Inspection.gs` and `Inspection_Register.md`; implementation missing. |
| Dashboard | Boundary identified in `Dashboard.gs` and `Dashboard.md`; implementation missing. |
| Reports | Boundary identified in `Reports.gs`; implementation missing. |
| Document generation | Boundary identified in `WordGenerator.gs` and `Templates/README.md`; implementation missing. |
| Search | Boundary identified in `Search.gs`; implementation missing. |
| Settings and configuration | Boundary identified in `Settings.gs` and `Settings.md`; implementation missing. |
| Rate Contract Header | Boundary identified in `RC_Header.md`; implementation missing. |
| Rate Contract Item Sheets | Boundary identified in `RC_ItemSheet.md`; implementation missing. |
| Test data governance | Folder reserved in `TestData/`; artifacts missing. |

## Missing Modules

The repository is intentionally architecture-only, so the following production modules are not yet present:

- Column-level sheet schemas for all workbook modules.
- Apps Script constants for sheet names, statuses, required columns, and configuration keys.
- Spreadsheet access layer and typed range helpers.
- Validation services for PO entry, receipt entry, inspection records, and settings.
- Persistence services for register append/update workflows.
- Audit metadata handling.
- Status lifecycle definitions and transition rules.
- Custom menu and UI entry points.
- Installable trigger definitions.
- Search implementation across master and register sheets.
- Dashboard metric formulas or refresh logic.
- Report generation and export logic.
- Google Docs template files and template mapping definitions.
- Document numbering and Drive output configuration.
- Test data fixtures.
- Automated tests or manual verification checklists.
- Deployment documentation for clasp or Apps Script project setup.

## Duplicated Or Unnecessary Files

No exact duplicated files were found in the current repository. Several files are deliberately minimal because Phase 1 only defines architecture and ownership boundaries.

Potentially unnecessary files in later phases:

- `Templates/README.md` and `TestData/README.md` are useful placeholders now, but may become redundant once those folders contain real templates and data indexes.
- The workbook module files in `GoogleSheet/` share the same structure and could later be consolidated into a single schema reference if individual files do not gain column-level details.

## Suggested Improvements

- Define column schemas for `RC_Header`, `RC_ItemSheet`, `PO_Entry`, `PO_Register`, `Receipt_Entry`, `Receipt_Register`, `Inspection_Register`, `Dashboard`, and `Settings`.
- Add a central Apps Script constants module for sheet names, column keys, status values, and configuration keys.
- Implement a spreadsheet access utility layer before adding workflow code.
- Define validation rules before persistence functions so register data remains auditable.
- Add audit fields and status lifecycle documentation for each register.
- Add a deployment guide covering Apps Script project creation, manifest scopes, clasp usage, and required Google Drive folders.
- Add template specifications for purchase orders, receipts, and inspection documents before implementing `WordGenerator.gs`.
- Add test data only after schemas are finalized, with clear separation between sample data and production templates.
- Add a verification checklist for each workflow phase.
- Consider adding `LICENSE`, `CHANGELOG.md`, and contribution guidance if the repository will be shared beyond the initial owner.

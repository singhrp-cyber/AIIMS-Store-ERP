# Database Design

## Data Platform

The production data platform is Google Sheets. Each worksheet acts as a controlled table-like module. Apps Script will provide validation, persistence, derived values, reporting, and document generation in later phases.

## Workbook Modules

| Sheet | Purpose |
| --- | --- |
| `RC_Master` | Maintains approved rate contract and item master records. |
| `PO_Entry` | Captures purchase order input before controlled persistence. |
| `PO_Register` | Stores approved purchase order records. |
| `Receipt_Entry` | Captures material receipt input before controlled persistence. |
| `Receipt_Register` | Stores approved receipt records. |
| `Inspection_Register` | Stores inspection outcomes against received materials. |
| `Dashboard` | Presents operational indicators and pending action summaries. |
| `Settings` | Stores controlled system configuration. |

## Design Principles

- Entry sheets are used for controlled input.
- Register sheets are treated as auditable records.
- Master data is separated from transactional data.
- Settings are centralized and not duplicated across scripts.
- Later automation must append or update records through controlled Apps Script services.
- Manual edits to register sheets should be restricted in production deployments.

## Key Entity Groups

### Master Data

- Rate contract records.
- Vendor references.
- Item references.
- Unit and category definitions.
- Valid status values.

### Transaction Data

- Purchase orders.
- Material receipts.
- Inspection outcomes.

### Control Data

- Document numbering rules.
- Approval and status values.
- Drive folder configuration.
- Report period settings.

## Audit Expectations

Production registers should support:

- Created timestamp.
- Created by.
- Updated timestamp.
- Updated by.
- Record status.
- Source transaction reference.

Exact column definitions will be finalized during implementation of each workflow phase.

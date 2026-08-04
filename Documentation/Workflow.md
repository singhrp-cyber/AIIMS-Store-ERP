# Workflow Architecture

## Overview

AIIMS Store ERP is organized around controlled movement from master data to procurement, receipt, inspection, dashboard monitoring, reporting, and document generation.

## High-Level Workflow

```mermaid
flowchart LR
  RCH["RC_Header"] --> RCI["RC_ItemSheets"]
  RCI --> POE["PO_Entry"]
  POE --> POR["PO_Register"]
  POR --> RE["Receipt_Entry"]
  RE --> RR["Receipt_Register"]
  RR --> IR["Inspection_Register"]
  POR --> DB["Dashboard"]
  RR --> DB
  IR --> DB
  POR --> RP["Reports"]
  RR --> RP
  IR --> RP
  POR --> DOC["WordGenerator"]
  RR --> DOC
  IR --> DOC
  ```

## Workflow Stages

1. Rate Contract Header information is maintained in `RC_Header`.
2. Each approved Rate Contract has one dedicated RC Item Sheet.
3. Purchase order input is captured in `PO_Entry`.
4. Valid purchase order records are persisted to `PO_Register`.
5. Receipt input is captured in `Receipt_Entry`.
6. Valid receipt records are persisted to `Receipt_Register`.
7. Inspection outcomes are recorded in `Inspection_Register`.
8. Dashboard metrics are calculated from controlled registers.
9. Reports and generated documents are produced from auditable records.

## Control Expectations

- Entry modules must validate data before register persistence.
- Register modules must preserve auditability.
- Status transitions must be explicit.
- Reports must read from registers, not entry sheets.
- Generated documents must reference source register records.

## Phase 1 Boundary

This document defines workflow ownership only. Runtime workflow implementation is intentionally excluded from Phase 1.

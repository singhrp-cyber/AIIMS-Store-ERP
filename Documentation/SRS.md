# Software Requirements Specification

## System Name

AIIMS Store ERP

## Purpose

The system will support institutional store operations using Google Sheets as the controlled data layer and Google Apps Script as the automation, validation, reporting, and document generation layer.

## Phase 1 Objective

The Phase 1 objective is to create the production project architecture without implementing runtime functionality.

## User Roles

The production system is expected to support role-aware workflows for:

- Store administrators.
- Purchase order operators.
- Receipt entry operators.
- Inspection officers.
- Reporting and audit users.

Role enforcement will be designed in a later phase.

## Functional Areas

The ERP architecture covers:

- Rate contract master management.
- Purchase order entry.
- Purchase order register maintenance.
- Material receipt entry.
- Receipt register maintenance.
- Material inspection tracking.
- Dashboard monitoring.
- Operational reporting.
- Google Docs based document generation.
- System configuration management.

## Non-Functional Requirements

- Data integrity must be prioritized over convenience.
- Register sheets must remain auditable.
- User-facing operations must validate required data before persistence.
- Error messages must be clear and safe for operational users.
- System settings must be centralized.
- Future scripts must be modular and maintainable.
- Document generation must be traceable to source records.

## Phase 1 Exclusions

- No executable workflow logic.
- No sample data.
- No pseudo-code.
- No placeholder functions.
- No deployment automation.

## Acceptance Criteria

Phase 1 is complete when:

- The required folder structure exists.
- All required Apps Script files exist.
- The Apps Script manifest is valid.
- All required documentation files exist.
- All required Google Sheet modules are documented.
- The repository is committed as `Version 0.1`.

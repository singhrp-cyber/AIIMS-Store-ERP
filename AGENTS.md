# AIIMS Store ERP - AI Development Rules

## Source of Truth

- Documentation/WorkbookDesign.md is the Single Source of Truth (SSOT).

## Architecture

- Never redesign the architecture.
- Never rename sheets.
- Never rename columns.
- Never change workflows without approval.

## Technology

- Google Sheets only.
- Google Apps Script only.
- No external database.
- No external backend.

## Coding Standards

- Production-ready code only.
- No placeholder implementations.
- Every public function must include JSDoc.
- Keep modules small and reusable.
- Reuse utilities before creating new functions.

## Development Rules

- Read documentation before writing code.
- Ask before making architectural changes.
- Preserve backward compatibility whenever possible.

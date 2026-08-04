# AIIMS Store ERP - AI Agent Instructions

## Project Overview

AIIMS Store ERP is a Google Sheets and Google Apps Script based ERP system for institutional procurement and inventory management.

This repository is intended for long-term production use.

---

# Single Source of Truth

The following document has the highest priority.

1. Documentation/WorkbookDesign.md

No implementation may contradict WorkbookDesign.md.

If inconsistencies are found in other documents, WorkbookDesign.md always takes precedence.

---

# Documentation Priority

Read documents in this order before writing code.

1. AGENTS.md
2. Documentation/WorkbookDesign.md
3. Documentation/MasterRequirement.md
4. Documentation/DatabaseDesign.md
5. Documentation/Workflow.md
6. Documentation/RepositoryReview.md
7. Documentation/README.md

---

# Technology Stack

Backend
- Google Apps Script

Database
- Google Sheets

Documents
- Google Docs

Storage
- Google Drive

Version Control
- Git + GitHub

No external database shall be introduced.

No external backend shall be introduced.

---

# Architecture Rules

Never redesign the architecture.

Never rename:

- Sheets
- Modules
- Columns
- Named Ranges

unless explicitly instructed.

WorkbookDesign.md is authoritative.

---

# Coding Rules

Always produce production-ready code.

Never generate placeholder implementations.

Avoid TODO comments unless explicitly requested.

Use modular functions.

Reuse utility functions wherever possible.

Every public function must include JSDoc documentation.

Keep functions focused and maintainable.

---

# Google Sheets Rules

Entry sheets are editable.

Register sheets are controlled by Apps Script.

Never allow direct writes to register sheets except through approved services.

Always preserve audit fields.

---

# Business Rules

Never invent business rules.

Never assume workflows.

If a requirement is ambiguous, ask instead of guessing.

---

# Change Management

Before changing:

- architecture
- sheet structure
- workflow
- database design

obtain explicit approval.

---

# Development Workflow

Understand requirements.

Review WorkbookDesign.md.

Review related module documentation.

Implement.

Self-review.

Unit test.

Only then continue to the next module.

---

# Git Rules

Make small logical commits.

Do not modify unrelated files.

Keep commit messages meaningful.

---

# Response Rules

Do not generate code unless requested.

Explain design decisions briefly.

When uncertain, ask clarifying questions before implementation.

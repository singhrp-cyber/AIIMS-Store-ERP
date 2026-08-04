# RC_ItemSheet

## Purpose

Stores approved Rate Contract item details for one Rate Contract.

Each approved Rate Contract has one dedicated Item Sheet.

The corresponding sheet name is maintained in `RC_Header`.

## Ownership

This sheet is maintained by the Store Administration.

## Relationships

- Child of RC_Header.
- Parent source for Purchase Order Entry.
- Contains approved Item, Rate, Bidder and Distributor information.

## Phase 1 Boundary

Only workbook structure and documentation are defined in Phase 1.

No Apps Script automation, formulas, validations, or sample records are implemented.
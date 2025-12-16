# Open Sale – Business Rules & Flow

This document defines the business rules and execution flow
for creating an OPEN sale.

This logic is owned by the service layer.

---

## Purpose

Create a new sale in OPEN state.

This operation:

- creates a Sale
- creates SaleItem records
- snapshots prices
- does NOT handle payments
- does NOT deduct inventory
- does NOT generate invoice/receipt

---

## Preconditions

- User must be authenticated
- User must have role: waiter or cashier

---

## Input Summary

- SaleType (DINE_IN | TAKEAWAY)
- Optional table
- Optional guest
- One or more sale items
- Optional extras per item

---

## Validation Rules

### Sale-level Rules

- `items` must not be empty
- If `sale_type = DINE_IN` → `table_id` is required
- If `sale_type = TAKEAWAY` → `table_id` must be null

---

### Main Item Rules

- `product_id` must exist
- product must be salable
- `quantity > 0`
- price is calculated via menu pricing rules

---

### Extra Item Rules

- must be attached to a main item
- `product_id` must exist
- product must be allowed as extra
- `quantity > 0`
- price is calculated via extra pricing rules

---

## Forbidden Actions

This operation must NOT:

- accept payments
- deduct inventory
- update existing sales
- accept prices from client

---

## Execution Flow

1. Validate user permissions
2. Validate sale-level rules
3. Create Sale (state = OPEN)
4. For each main item:
   - calculate price
   - create SaleItem
5. For each extra:
   - calculate price
   - create SaleItem with parent reference
6. Commit transaction

---

## Failure Behavior

If any step fails:

- transaction is rolled back
- no partial data is saved

---

## Notes

- All prices are immutable once stored
- Sale remains editable until closed
- Inventory impact happens only on close

# Sale Domain

This document defines the Sale domain and its rules.
The Sale domain represents an active commercial transaction
between the café and a guest.

This document intentionally excludes:

- invoicing
- payments
- accounting
- reporting

Those are separate domains.

---

## Core Concept

### Sale

A Sale represents an ongoing order that can be modified
until it is explicitly closed.

A Sale:

- starts in OPEN state
- may be modified while OPEN
- becomes immutable once CLOSED
- may be canceled before closure

---

## Sale States

```
OPEN → CLOSED
↓
CANCELED
```

### OPEN

- items can be added, removed, or modified
- prices are calculated server-side
- no payments are allowed

### CLOSED

- items and prices are frozen
- stock impact is finalized
- sale becomes read-only
- sale is eligible for invoicing and payment

### CANCELED

- sale is terminated
- no further actions allowed
- stock is restored if previously reserved

---

## Sale Creation (Open Sale)

An OPEN Sale may be created by an authorized staff member.

### Required Data

- sale_type: DINE_IN or TAKEAWAY
- at least one sale item

### Conditional Rules

- If sale_type = DINE_IN → table reference is required
- If sale_type = TAKEAWAY → table reference must be null

### Sale Items

- each item has a product and quantity
- quantity must be greater than zero
- pricing is determined by server-side rules

### Extra Items

- extra items must be attached to a main item
- extra items have their own quantity
- extra items follow separate pricing rules

---

## Sale Modification (While OPEN)

An OPEN Sale may be modified.

Allowed operations:

- add sale item
- remove sale item
- change quantity
- add or remove extra items
- update note

Forbidden operations:

- applying payments
- changing prices directly
- modifying a CLOSED or CANCELED sale

---

## Sale Closure

Closing a Sale finalizes the transaction.

### Rules

- only authorized staff may close a sale
- sale must be in OPEN state
- all pricing is recalculated and frozen
- stock consumption is finalized

### Effects

- sale state becomes CLOSED
- sale becomes immutable
- sale becomes eligible for invoicing

---

## Responsibilities by Layer

### Sale Domain

- sale state
- sale items
- pricing snapshot
- stock impact

### Invoice Domain (Future)

- invoice creation
- invoice numbering
- tax calculation

### Payment Domain (Future)

- payment methods
- partial payments
- refunds

---

## Explicit Non-Goals (Phase 1)

The following are intentionally excluded:

- payment processing
- invoice generation
- tax reporting
- accounting exports
- financial reconciliation

---

## Invariants

- A CLOSED Sale cannot be modified
- Prices are never accepted from the client
- All monetary values are calculated server-side
- Stock impact happens at most once per Sale

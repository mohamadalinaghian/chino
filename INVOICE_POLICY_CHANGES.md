# Policy Changes for Invoice Payment Workflow

## Required Changes to `backend/apps/sale/policies.py`

### 1. Update `can_create_invoice` Policy

**Current Implementation (Line 35-56):**
```python
def can_create_invoice(user, sale: Sale) -> None:
    """
    Permission to create an invoice for a sale.

    Rules:
        - Sale must be CLOSED  ← THIS BLOCKS THE NEW WORKFLOW
        - Sale must not already have an invoice
        - User must have sale.close_sale permission
    """
    _require_authenticated(user)

    if sale.state != Sale.State.CLOSED:
        raise PermissionDenied(_("Only CLOSED sales can be invoiced"))

    # ... rest of checks
```

**Proposed New Implementation:**
```python
def can_create_invoice(user, sale: Sale) -> None:
    """
    Permission to create an invoice for a sale.

    Rules:
        - Sale must be OPEN (changed from CLOSED)
        - Sale must have at least one item
        - Sale must not already have an invoice
        - User must have sale.close_sale permission
    """
    _require_authenticated(user)

    # CHANGED: Allow invoice from OPEN sales (new workflow)
    if sale.state != Sale.State.OPEN:
        raise PermissionDenied(_("Only OPEN sales can be invoiced"))

    # NEW: Verify sale has items
    if not sale.items.exists():
        raise PermissionDenied(_("Cannot create invoice for empty sale"))

    # Check if invoice exists without triggering query if table doesn't exist
    try:
        if hasattr(sale, "invoice") and sale.invoice:
            raise PermissionDenied(_("Invoice already exists for this sale"))
    except SaleInvoice.DoesNotExist:
        pass  # No invoice exists, which is what we want

    _require_perm(user, "sale.close_sale")
```

**Why this change?**
- The new workflow creates invoices from OPEN sales
- Payment process then decides whether to close the sale
- Full payment → auto-close sale
- Partial payment → sale stays open

---

### 2. Add `can_cancel_invoice` Policy

**New Policy to Add:**
```python
def can_cancel_invoice(user, invoice: SaleInvoice) -> None:
    """
    Permission to cancel/void an invoice.

    Rules:
        - Invoice must not be VOID already
        - Invoice must not have COMPLETED payments (must refund first)
        - User must have sale.close_sale permission
    """
    _require_authenticated(user)

    if invoice.status == SaleInvoice.InvoiceStatus.VOID:
        raise PermissionDenied(_("Invoice is already voided"))

    # Check for existing completed payments
    if invoice.payments.filter(status=SalePayment.PaymentStatus.COMPLETED).exists():
        raise PermissionDenied(
            _("Cannot cancel invoice with completed payments. Refund payments first.")
        )

    _require_perm(user, "sale.close_sale")
```

**Why this policy?**
- Handles the abort/rollback scenario
- Ensures data integrity (can't cancel if money has been received)
- Safe guard against accidental cancellation

---

### 3. Keep Existing `can_void_invoice` or Remove?

**Current Policy (Line 67-83):**
```python
def can_void_invoice(user, invoice: SaleInvoice) -> None:
    """
    Permission to void an invoice.

    Rules:
        - Invoice must not be PAID
        - Invoice must not be VOID
    """
    # ... implementation
```

**Question:** Is this different from `can_cancel_invoice`?

**Options:**
1. **Keep both:**
   - `can_void_invoice`: Admin-only operation, can void even with payments
   - `can_cancel_invoice`: User operation, safer checks

2. **Merge into one:**
   - Rename `can_void_invoice` to `can_cancel_invoice`
   - Add the payment check

3. **Remove `can_void_invoice`:**
   - Only use `can_cancel_invoice` for the new workflow

**Recommendation:** Keep both with different purposes:
- `can_cancel_invoice`: User-facing (new workflow), strict checks
- `can_void_invoice`: Admin operation, less strict

---

## Summary of Changes

### File: `backend/apps/sale/policies.py`

**Changes Required:**
1. ✏️ **Modify** `can_create_invoice` (line 35-56)
   - Change sale state check from CLOSED to OPEN
   - Add item count validation

2. ➕ **Add** `can_cancel_invoice` (new function)
   - Validate invoice not already void
   - Prevent canceling invoices with completed payments
   - Check permissions

3. ❓ **Decision needed:** Keep or merge `can_void_invoice`

**Impact:**
- **Breaking change** for `can_create_invoice` if anyone is using old workflow
- New `can_cancel_invoice` is additive (no breaking change)

**Migration Strategy:**
1. Update policy to support both OPEN and CLOSED sales initially
2. Log deprecation warning for CLOSED sales
3. After UI is ready, remove CLOSED support

**Alternative (No Breaking Change):**
```python
def can_create_invoice(user, sale: Sale) -> None:
    """Support both old (CLOSED) and new (OPEN) workflows."""
    _require_authenticated(user)

    # Support both workflows during transition
    if sale.state not in [Sale.State.OPEN, Sale.State.CLOSED]:
        raise PermissionDenied(_("Sale must be OPEN or CLOSED to create invoice"))

    if sale.state == Sale.State.CLOSED:
        # TODO: Log deprecation warning
        import logging
        logging.warning(
            f"Creating invoice from CLOSED sale {sale.pk} - "
            "This workflow is deprecated. Use OPEN sales instead."
        )

    if not sale.items.exists():
        raise PermissionDenied(_("Cannot create invoice for empty sale"))

    # ... rest of checks
```

---

## Testing Impact

**Tests to Update:**
1. `test_can_create_invoice_requires_closed_sale` → Change to test OPEN sale
2. Add `test_can_create_invoice_requires_items`
3. Add `test_can_cancel_invoice_success`
4. Add `test_can_cancel_invoice_with_payments_fails`
5. Add `test_can_cancel_invoice_already_void_fails`

**Tests to Add:**
- Integration tests for the new 3-scenario workflow
- Test auto-close on full payment
- Test sale stays open on partial payment
- Test rollback on cancel

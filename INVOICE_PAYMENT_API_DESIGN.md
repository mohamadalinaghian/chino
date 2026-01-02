# Invoice Payment API Design

## Overview

This document describes the new invoice payment workflow that integrates invoice creation and payment processing with the sale lifecycle.

## Current vs New Flow

### Current Flow
```
1. Create Sale (OPEN)
2. Add/Edit Items
3. Close Sale (CLOSED) ← Just marks as closed, no payment
4. Separately: Create Invoice (requires CLOSED sale)
5. Separately: Add Payments
```

### New Flow (Proposed)
```
1. Create Sale (OPEN)
2. Add/Edit Items
3. Initiate Invoice (Sale stays OPEN) ← NEW
4. Process Payment(s):
   a. Full Payment → Invoice PAID → Sale auto-closes (CLOSED)
   b. Partial Payment → Invoice PARTIALLY_PAID → Sale stays OPEN
   c. Cancel → Invoice VOID → Sale stays OPEN
```

## Key Changes

1. **Invoice creation doesn't require CLOSED sale** - Can create invoice from OPEN sale
2. **Sale closes automatically on full payment** - No manual close needed
3. **Support for partial payments** - Sale stays open for more orders or later payment
4. **Cancel/abort scenario** - Rollback without closing sale

## API Endpoints

### 1. Initiate Invoice

**Endpoint:** `POST /api/sales/{sale_id}/initiate-invoice`

**Purpose:** Create an invoice from an OPEN sale to start the payment process.

**Request:**
```json
{
  "tax_amount": "5.00"  // Optional, defaults to 0
}
```

**Response:**
```json
{
  "invoice_id": 123,
  "invoice_number": "INV-2025-000123",
  "sale_id": 456,
  "subtotal_amount": "50.00",
  "discount_amount": "5.00",
  "tax_amount": "5.00",
  "total_amount": "50.00",
  "status": "UNPAID",
  "sale_state": "OPEN"
}
```

**Business Rules:**
- Sale must be in OPEN state
- Sale must have at least one item
- Sale cannot already have an invoice
- Invoice is created with status UNPAID
- Sale remains OPEN

**Errors:**
- 404: Sale not found
- 422: Sale is not OPEN
- 422: Sale has no items
- 422: Invoice already exists for this sale
- 403: User lacks permission

---

### 2. Process Payment

**Endpoint:** `POST /api/invoices/{invoice_id}/process-payment`

**Purpose:** Apply a payment to an invoice. Automatically closes sale if fully paid.

**Request:**
```json
{
  "method": "CASH",           // CASH | POS | CARD_TRANSFER
  "amount_applied": "50.00",  // Amount applied to invoice
  "tip_amount": "5.00",       // Optional, defaults to 0
  "destination_account_id": null  // Required for POS/CARD_TRANSFER
}
```

**Response:**
```json
{
  "payment_id": 789,
  "invoice_id": 123,
  "invoice_number": "INV-2025-000123",
  "invoice_status": "PAID",       // UNPAID | PARTIALLY_PAID | PAID
  "sale_id": 456,
  "sale_state": "CLOSED",         // OPEN or CLOSED (auto-closed if fully paid)
  "total_amount": "50.00",
  "total_paid": "50.00",
  "balance_due": "0.00",
  "payments": [
    {
      "id": 789,
      "method": "CASH",
      "amount_applied": "50.00",
      "tip_amount": "5.00",
      "amount_total": "55.00",
      "received_at": "2025-12-31T12:00:00Z"
    }
  ]
}
```

**Business Rules:**
- Invoice must not be VOID
- amount_applied must be > 0
- tip_amount must be >= 0
- destination_account_id required for POS and CARD_TRANSFER methods
- Payment is recorded with status COMPLETED
- Invoice status updates based on total_paid:
  - total_paid = 0 → UNPAID
  - 0 < total_paid < total_amount → PARTIALLY_PAID
  - total_paid >= total_amount → PAID
- **If invoice becomes PAID, sale automatically closes:**
  - Sale.state = CLOSED
  - Sale.closed_by = current user
  - Sale.closed_at = now
- If invoice is PARTIALLY_PAID, sale stays OPEN

**Scenarios:**

**Scenario 1: Full Payment (Single)**
```
Initial: Invoice $50 UNPAID, Sale OPEN
Payment: $50
Result: Invoice PAID, Sale auto-closed (CLOSED)
```

**Scenario 2: Full Payment (Multiple)**
```
Initial: Invoice $100 UNPAID, Sale OPEN
Payment 1: $40 → Invoice PARTIALLY_PAID, Sale OPEN
Payment 2: $60 → Invoice PAID, Sale auto-closed (CLOSED)
```

**Scenario 3: Partial Payment (Continue ordering)**
```
Initial: Invoice $50 UNPAID, Sale OPEN
Payment: $30 → Invoice PARTIALLY_PAID, Sale OPEN
User can: Continue adding items to sale OR pay remaining $20 later
```

**Errors:**
- 404: Invoice not found
- 422: Invoice is VOID
- 422: amount_applied <= 0
- 422: tip_amount < 0
- 422: Missing destination_account_id for POS/CARD_TRANSFER
- 403: User lacks permission

---

### 3. Cancel Invoice

**Endpoint:** `POST /api/invoices/{invoice_id}/cancel`

**Purpose:** Cancel/abort an invoice. This is the rollback scenario.

**Request:**
```json
{
  "reason": "Customer changed mind"  // Optional
}
```

**Response:**
```json
{
  "invoice_id": 123,
  "invoice_number": "INV-2025-000123",
  "invoice_status": "VOID",
  "sale_id": 456,
  "sale_state": "OPEN",
  "cancellation_reason": "Customer changed mind"
}
```

**Business Rules:**
- Invoice status changes to VOID
- Sale remains OPEN
- User can continue adding items to the sale
- Cannot cancel invoice that already has COMPLETED payments (must refund first)

**Errors:**
- 404: Invoice not found
- 422: Invoice already VOID
- 422: Invoice has completed payments (cannot cancel, must refund)
- 403: User lacks permission

---

### 4. Get Invoice Details

**Endpoint:** `GET /api/invoices/{invoice_id}`

**Purpose:** Retrieve complete invoice details including all payments.

**Response:**
```json
{
  "invoice_id": 123,
  "invoice_number": "INV-2025-000123",
  "sale_id": 456,
  "status": "PARTIALLY_PAID",
  "subtotal_amount": "100.00",
  "discount_amount": "10.00",
  "tax_amount": "9.00",
  "total_amount": "99.00",
  "total_paid": "50.00",
  "balance_due": "49.00",
  "is_fully_paid": false,
  "payments": [
    {
      "id": 789,
      "method": "CASH",
      "amount_applied": "30.00",
      "tip_amount": "5.00",
      "amount_total": "35.00",
      "received_at": "2025-12-31T12:00:00Z"
    },
    {
      "id": 790,
      "method": "POS",
      "amount_applied": "20.00",
      "tip_amount": "0.00",
      "amount_total": "20.00",
      "received_at": "2025-12-31T12:30:00Z"
    }
  ],
  "issued_at": "2025-12-31T11:00:00Z",
  "issued_by_name": "John Doe"
}
```

**Business Rules:**
- Anyone with view_invoice permission can see details
- total_paid is sum of all COMPLETED payment.amount_applied
- balance_due = total_amount - total_paid

---

## Service Layer Changes

### New Services Required

#### 1. InitiateInvoiceService
**File:** `backend/apps/sale/services/invoice/initiate_invoice_service.py`

**Changes from CreateInvoiceService:**
- Remove requirement for sale.state == CLOSED
- Allow creating invoice from OPEN sale
- Same validation otherwise

#### 2. ProcessInvoicePaymentService
**File:** `backend/apps/sale/services/invoice/process_invoice_payment_service.py`

**Responsibilities:**
1. Call IssuePaymentService to record payment
2. Check if invoice is now fully paid
3. If fully paid, automatically close the sale:
   - Set sale.state = CLOSED
   - Set sale.closed_by = current user
   - Set sale.closed_at = now
4. Return updated invoice and sale

**Logic:**
```python
@transaction.atomic
def execute(*, invoice, received_by, method, amount_applied, tip_amount, destination_account):
    # 1. Issue payment (uses existing service)
    payment = IssuePaymentService.execute(
        invoice=invoice,
        received_by=received_by,
        method=method,
        amount_applied=amount_applied,
        tip_amount=tip_amount,
        destination_account=destination_account,
    )

    # 2. Refresh invoice to get updated status
    invoice.refresh_from_db()

    # 3. If invoice is fully paid, auto-close the sale
    if invoice.status == SaleInvoice.InvoiceStatus.PAID:
        sale = invoice.sale
        sale.state = Sale.State.CLOSED
        sale.closed_by = received_by
        sale.closed_at = timezone.now()
        sale.save(update_fields=['state', 'closed_by', 'closed_at', 'updated_at'])

    return payment
```

#### 3. CancelInvoiceService
**File:** `backend/apps/sale/services/invoice/cancel_invoice_service.py`

**Responsibilities:**
1. Validate invoice can be canceled (no COMPLETED payments)
2. Set invoice.status = VOID
3. Sale remains OPEN (no changes to sale)
4. Store cancellation reason (optional)

---

## Migration Path

### Phase 1: Service Layer (No UI Changes Yet)
1. Create InitiateInvoiceService
2. Create ProcessInvoicePaymentService
3. Create CancelInvoiceService
4. Add unit tests

### Phase 2: API Layer (Backend Ready)
1. Add invoice_schemas.py (already created)
2. Create invoice_endpoints.py with 4 endpoints
3. Add integration tests

### Phase 3: UI Implementation (After Approval)
1. Update sale close flow to show invoice payment screen
2. Add payment entry form
3. Add partial payment support
4. Add cancel/abort button

---

## Backward Compatibility

**Question:** What happens to the old `/sales/{sale_id}/close` endpoint?

**Options:**
1. **Keep both flows:** Old endpoint still works (simple close), new flow is optional
2. **Deprecate old endpoint:** Return helpful error pointing to new flow
3. **Remove old endpoint:** Force everyone to use new flow

**Recommendation:** Keep both initially, deprecate old one after UI is ready.

---

## Summary

### Three Payment Scenarios

| Scenario | Actions | Invoice Status | Sale State |
|----------|---------|----------------|------------|
| **Full Payment** | 1. Initiate invoice<br>2. Pay full amount | UNPAID → PAID | OPEN → auto-CLOSED |
| **Partial Payment** | 1. Initiate invoice<br>2. Pay partial amount<br>3. Continue ordering or pay later | UNPAID → PARTIALLY_PAID | OPEN (stays open) |
| **Abort/Cancel** | 1. Initiate invoice<br>2. Cancel invoice | UNPAID → VOID | OPEN (stays open) |

### Key Benefits
1. ✅ Unified invoice+payment flow
2. ✅ Support for partial payments
3. ✅ Safe rollback via cancel
4. ✅ Automatic sale closure on full payment
5. ✅ Sale stays open for partial payments (can add more items)

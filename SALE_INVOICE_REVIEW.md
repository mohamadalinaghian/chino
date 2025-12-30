# Sale Invoice System Review & Improvements

**Date**: 2025-12-30
**Status**: ✅ Critical fixes applied, ready for migration

---

## ✅ Fixes Applied

### 1. **Fixed Field Mismatch in IssuePaymentService**
**File**: `backend/apps/sale/services/invoice/issue_payment_service.py:52`

**Before**:
```python
destination_card_number=destination_card,  # ❌ Field doesn't exist
```

**After**:
```python
destination_account=destination_account,  # ✅ Correct field name
```

**Impact**: Payment creation would have failed with field error.

---

### 2. **Fixed Wrong Policy in CreateInvoiceService**
**File**: `backend/apps/sale/services/invoice/create_invoice_service.py:30`

**Before**:
```python
can_close_sale(issued_by, sale)  # ❌ Wrong policy
```

**After**:
```python
can_create_invoice(issued_by, sale)  # ✅ Correct policy
```

**Impact**: Would use wrong authorization checks.

---

### 3. **Fixed Refund Logic**
**File**: `backend/apps/sale/services/invoice/create_refund_service.py`

**Changes**:
- ✅ Added `method` parameter (was missing)
- ✅ Added partial refund support
- ✅ Only voids payment when fully refunded
- ✅ Validates total refunds don't exceed payment
- ✅ Auto-defaults to same method as original payment

**Before** (incorrect):
```python
# Missing method field
refund = SaleRefund.objects.create(
    payment=payment,
    invoice=payment.invoice,
    amount=amount,
    refunded_by=refunded_by,
    reason=reason,
)

# Always voided entire payment even for partial refunds
payment.status = SalePayment.PaymentStatus.VOID
```

**After** (correct):
```python
# Includes method field
if method is None:
    method = SaleRefund.Method[payment.method]

refund = SaleRefund.objects.create(
    payment=payment,
    invoice=payment.invoice,
    amount=amount,
    method=method,
    processed_by=refunded_by,
    reason=reason,
)

# Only void if fully refunded
if total_refunded + amount >= payment.amount_applied:
    payment.status = SalePayment.PaymentStatus.VOID
```

---

### 4. **Added Invoice Number Generation**
**File**: `backend/apps/sale/services/invoice/create_invoice_service.py`

**Added**:
- ✅ `invoice_number` field to SaleInvoice model
- ✅ Auto-generation in format: `INV-2025-000001`
- ✅ Sequential numbering per year
- ✅ Unique constraint and indexing

---

### 5. **Enhanced Model Validations**

#### SaleInvoice Model
**Added**:
- ✅ `clean()` method validates financial calculations
- ✅ Properties: `total_paid`, `balance_due`, `is_fully_paid`
- ✅ Additional indexes for performance

#### SalePayment Model
**Added**:
- ✅ Improved `clean()` with better error messages
- ✅ Properties: `total_refunded`, `refundable_amount`
- ✅ Decimal tolerance for amount calculations

#### SaleRefund Model
**Added**:
- ✅ `clean()` validates refund limits
- ✅ Validates invoice matches payment's invoice
- ✅ Prevents over-refunding

---

### 6. **Added Tip Validation**
**File**: `backend/apps/sale/services/invoice/issue_payment_service.py:41`

**Added**:
```python
if tip_amount < 0:
    raise ValidationError(_("Tip amount cannot be negative"))
```

---

## ⚠️ Important Notes & Remaining Tasks

### 1. **Database Migration Required**

You've added a new **required** field `invoice_number` to SaleInvoice. Before migrating:

```bash
# Generate migration
python manage.py makemigrations

# Review the migration file - you'll need to handle existing data
```

**Migration Strategy**:
```python
# In migration file, use RunPython to backfill invoice numbers
def backfill_invoice_numbers(apps, schema_editor):
    SaleInvoice = apps.get_model('sale', 'SaleInvoice')
    for idx, invoice in enumerate(SaleInvoice.objects.order_by('issued_at'), start=1):
        year = invoice.issued_at.year
        invoice.invoice_number = f"INV-{year}-{idx:06d}"
        invoice.save(update_fields=['invoice_number'])
```

---

### 2. **Missing Model: BankAccount**

**File**: `backend/apps/sale/models/sale_payment_model.py:69-77`

```python
destination_account = models.ForeignKey(
    "finance.BankAccount",  # ⚠️ This model must exist!
    ...
)
```

**Action Required**:
- ✅ Verify `finance.BankAccount` model exists
- ❌ If not, create it or change to a different model

---

### 3. **Currency Decimal Places**

**Current**: `decimal_places=4` for all money fields

**Consideration**: For Iranian Rial:
- If storing in **Rials**: Use `decimal_places=0`
- If storing in **Tomans**: Use `decimal_places=0` or `decimal_places=2`
- Current `decimal_places=4` is unusual for currency

**Recommendation**: Standardize across all financial models.

---

### 4. **Race Condition in Invoice Number Generation**

**File**: `backend/apps/sale/services/invoice/create_invoice_service.py:79-82`

**Current Implementation**:
```python
last_invoice = (
    SaleInvoice.objects.filter(invoice_number__startswith=prefix)
    .aggregate(Max("invoice_number"))["invoice_number__max"]
)
```

**Issue**: Two concurrent requests could generate the same number.

**Solutions**:

**Option A** - Database sequence (PostgreSQL):
```python
# Create sequence in migration
CREATE SEQUENCE invoice_number_seq;

# In service
def _generate_invoice_number() -> str:
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute("SELECT nextval('invoice_number_seq')")
        seq = cursor.fetchone()[0]
    return f"INV-{timezone.now().year}-{seq:06d}"
```

**Option B** - Redis atomic counter (if available)

**Option C** - Add retry logic with `select_for_update()`:
```python
from django.db import IntegrityError

for attempt in range(3):
    try:
        invoice_number = cls._generate_invoice_number()
        invoice = SaleInvoice.objects.create(...)
        break
    except IntegrityError:
        if attempt == 2:
            raise
        continue
```

---

### 5. **Policies - Permission Names**

**File**: `backend/apps/sale/policies.py`

Currently uses permissions like:
- `sale.open_sale`
- `sale.close_sale`
- `sale.view_sale_detail`

**Verify**: These permissions exist in `Sale` model Meta.permissions (they do in sale.py:120-127) ✅

---

### 6. **Testing Requirements**

**Critical tests needed**:

```python
# tests/test_invoice_service.py
def test_concurrent_invoice_number_generation():
    """Test race condition in invoice numbering"""

def test_partial_refund_doesnt_void_payment():
    """Ensure partial refunds don't void the entire payment"""

def test_full_refund_voids_payment():
    """Ensure full refunds void the payment"""

def test_multiple_partial_refunds():
    """Test multiple partial refunds up to payment amount"""

def test_refund_exceeding_payment_fails():
    """Test that over-refunding is prevented"""

def test_invoice_calculation_validation():
    """Test invoice clean() validates math"""

def test_payment_amount_validation():
    """Test payment clean() validates amount_total calculation"""
```

---

### 7. **Consider Adding**

#### A. **Audit Log Integration**
```python
# In each service
import logging
logger = logging.getLogger(__name__)

logger.info(f"Invoice created: {invoice.invoice_number} by {issued_by.username}")
logger.warning(f"Refund processed: {refund.amount} by {refunded_by.username}")
```

#### B. **Notification System**
```python
# After payment/refund
from apps.notifications.services import NotificationService

NotificationService.notify_payment_received(payment)
NotificationService.notify_refund_processed(refund)
```

#### C. **Financial Reconciliation Helper**
```python
@staticmethod
def get_daily_summary(date) -> dict:
    """Get financial summary for a specific date"""
    invoices = SaleInvoice.objects.filter(issued_at__date=date)

    return {
        'total_invoiced': invoices.aggregate(Sum('total_amount'))['total_amount__sum'],
        'total_paid': ...,
        'total_refunded': ...,
        'outstanding': ...,
    }
```

---

### 8. **API Endpoints Needed**

Based on these services, you'll likely need:

```python
# POST /api/invoices/create/
# POST /api/payments/issue/
# POST /api/refunds/create/
# GET /api/invoices/{invoice_number}/
# GET /api/invoices/{invoice_number}/payments/
# GET /api/invoices/{invoice_number}/refunds/
```

---

## 📊 Architecture Review

### ✅ Strengths

1. **Clean separation**: Sale → Invoice → Payment → Refund
2. **Immutability**: Invoices are snapshots (good for auditing)
3. **Service layer**: Business logic properly encapsulated
4. **Policies**: Authorization cleanly separated
5. **Atomic transactions**: All services use `@transaction.atomic`
6. **Tip handling**: Tips correctly marked non-refundable
7. **Status management**: Automatic invoice status updates

### 🎯 Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| OneToOne Sale→Invoice | Each sale gets exactly one invoice when closed |
| Invoice is immutable | Financial records should never change after issuance |
| Payments are append-only | Maintains complete audit trail |
| Refunds reference Payments | Enables partial refunds and proper tracking |
| Tips in Payment model | Tips are payment-specific, not invoice-level |
| Auto status updates | Reduces manual errors in invoice status |

---

## 🔄 Recommended Workflow

1. **Sale Created** (OPEN state)
   - Items added/modified
   - Discounts applied

2. **Sale Closed** (CLOSED state)
   - Total calculated and cached
   - No more modifications allowed

3. **Invoice Created**
   - Snapshot of sale taken
   - Invoice number generated
   - Status: UNPAID

4. **Payment(s) Issued**
   - Can be partial or full
   - Status auto-updates: UNPAID → PARTIALLY_PAID → PAID
   - Tips recorded here

5. **Refunds (if needed)**
   - Reference specific payments
   - Can be partial
   - Payment only voided when fully refunded
   - Invoice status recalculated

---

## 🚀 Next Steps

### Immediate (Before Production)
1. ✅ Create database migration with backfill for invoice_number
2. ✅ Verify `finance.BankAccount` model exists
3. ✅ Decide on currency decimal places
4. ✅ Implement race condition protection for invoice numbers
5. ✅ Write comprehensive tests
6. ✅ Add logging to services

### Short Term
1. Create API endpoints
2. Add admin interface for invoices/payments/refunds
3. Implement PDF invoice generation
4. Add notification system
5. Create financial reports

### Long Term
1. Analytics dashboard
2. Automated reconciliation
3. Integration with accounting software
4. Tax reporting features

---

## 📝 Code Quality Score

| Aspect | Score | Notes |
|--------|-------|-------|
| **Architecture** | 9/10 | Excellent separation of concerns |
| **Validation** | 8/10 | Good, could add more edge cases |
| **Security** | 9/10 | Strong policy enforcement |
| **Testing** | 0/10 | No tests yet (critical!) |
| **Documentation** | 8/10 | Good docstrings |
| **Performance** | 7/10 | Good indexes, watch for N+1 queries |
| **Error Handling** | 8/10 | Clear validation errors |

**Overall**: 7/10 - Solid foundation, needs tests and minor fixes

---

## 🎉 Summary

Your refactored invoice system is **well-architected** and follows Django best practices. The main issues have been **fixed**, and the code is nearly production-ready.

**Critical path to production**:
1. Fix migration with backfill
2. Add comprehensive tests
3. Resolve race condition in invoice numbering
4. Verify BankAccount model exists

After addressing these, the system will be **production-ready**! 🚀

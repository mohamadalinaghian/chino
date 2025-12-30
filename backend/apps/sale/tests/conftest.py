"""
Pytest fixtures for sale app tests.
"""

from decimal import Decimal

import pytest
from apps.sale.models import Sale
from apps.sale.tests.factories import (
    SaleFactory,
    SaleInvoiceFactory,
    SalePaymentFactory,
    SaleRefundFactory,
)
from apps.user.tests.factories import AccountFactory
from django.contrib.auth.models import Permission

# ============================================================================
# User Fixtures
# ============================================================================


@pytest.fixture
def staff_with_perms(db):
    """Create staff user with all sale permissions."""
    user = AccountFactory(is_staff=True)
    # Add all sale permissions
    perms = Permission.objects.filter(content_type__app_label="sale")
    user.user_permissions.add(*perms)
    return user


@pytest.fixture
def regular_staff(db):
    """Create regular staff user without special permissions."""
    return AccountFactory(is_staff=True)


@pytest.fixture
def non_staff_user(db):
    """Create non-staff user."""
    return AccountFactory(is_staff=False)


# ============================================================================
# Sale Fixtures
# ============================================================================


@pytest.fixture
def open_sale(staff_with_perms):
    """Create an open sale."""
    return SaleFactory(
        state=Sale.State.OPEN,
        sale_type=Sale.SaleType.DINE_IN,
        opened_by=staff_with_perms,
        total_amount=Decimal("100.0000"),
    )


@pytest.fixture
def closed_sale(staff_with_perms):
    """Create a closed sale."""
    return SaleFactory(
        state=Sale.State.CLOSED,
        sale_type=Sale.SaleType.TAKEAWAY,
        opened_by=staff_with_perms,
        closed_by=staff_with_perms,
        total_amount=Decimal("150.0000"),
    )


# ============================================================================
# Invoice Fixtures
# ============================================================================


@pytest.fixture
def unpaid_invoice(closed_sale, staff_with_perms):
    """Create an unpaid invoice."""
    return SaleInvoiceFactory(
        sale=closed_sale,
        issued_by=staff_with_perms,
        subtotal_amount=Decimal("150.0000"),
        discount_amount=Decimal("0.0000"),
        tax_amount=Decimal("13.5000"),
        total_amount=Decimal("163.5000"),
        status="UNPAID",
    )


@pytest.fixture
def partially_paid_invoice(closed_sale, staff_with_perms):
    """Create a partially paid invoice."""
    invoice = SaleInvoiceFactory(
        sale=closed_sale,
        issued_by=staff_with_perms,
        subtotal_amount=Decimal("200.0000"),
        total_amount=Decimal("200.0000"),
        status="PARTIALLY_PAID",
    )
    # Add partial payment
    SalePaymentFactory(
        invoice=invoice,
        amount_applied=Decimal("100.0000"),
        amount_total=Decimal("100.0000"),
    )
    return invoice


@pytest.fixture
def paid_invoice(closed_sale, staff_with_perms):
    """Create a fully paid invoice."""
    invoice = SaleInvoiceFactory(
        sale=closed_sale,
        issued_by=staff_with_perms,
        subtotal_amount=Decimal("100.0000"),
        total_amount=Decimal("100.0000"),
        status="PAID",
    )
    # Add full payment
    SalePaymentFactory(
        invoice=invoice,
        amount_applied=Decimal("100.0000"),
        amount_total=Decimal("100.0000"),
    )
    return invoice


# ============================================================================
# Payment Fixtures
# ============================================================================


@pytest.fixture
def cash_payment(unpaid_invoice, staff_with_perms):
    """Create a cash payment."""
    return SalePaymentFactory(
        invoice=unpaid_invoice,
        method="CASH",
        amount_applied=Decimal("100.0000"),
        amount_total=Decimal("100.0000"),
        received_by=staff_with_perms,
    )


@pytest.fixture
def payment_with_tip(unpaid_invoice, staff_with_perms):
    """Create a payment with tip."""
    return SalePaymentFactory(
        invoice=unpaid_invoice,
        method="CASH",
        amount_applied=Decimal("100.0000"),
        tip_amount=Decimal("10.0000"),
        amount_total=Decimal("110.0000"),
        received_by=staff_with_perms,
    )


# ============================================================================
# Refund Fixtures
# ============================================================================


@pytest.fixture
def refund(cash_payment, staff_with_perms):
    """Create a refund."""
    return SaleRefundFactory(
        payment=cash_payment,
        invoice=cash_payment.invoice,
        amount=Decimal("50.0000"),
        processed_by=staff_with_perms,
        reason="Customer request",
    )

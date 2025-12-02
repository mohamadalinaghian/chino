# apps/sale/tests/factories/__init__.py
"""
Sale app test factories.

Provides factory classes for generating test data for all sale models.

Usage:
    from apps.sale.tests.factories import (
        TransactionFactory,
        PosTransactionFactory,
        SaleInvoiceFactory,
        SaleItemFactory,
    )
"""

from .card_to_card_transaction import CardToCardTransactionFactory
from .cash_transaction import CashTransactionFactory
from .daily_financial_report import (
    DailyFinancialReportFactory,
    FinalizedDailyFinancialReportFactory,
    ReportWithDiscrepanciesFactory,
)
from .pos_transaction import PosTransactionFactory
from .sale_invoice import (
    PaidSaleInvoiceFactory,
    PartiallyPaidSaleInvoiceFactory,
    RefundedSaleInvoiceFactory,
    SaleInvoiceFactory,
)
from .sale_item import (
    DiscountedSaleItemFactory,
    PhantomSaleItemFactory,
    SaleItemFactory,
)
from .transaction import TransactionFactory, UnverifiedTransactionFactory

__all__ = [
    # Transaction factories
    "TransactionFactory",
    "UnverifiedTransactionFactory",
    "PosTransactionFactory",
    "CashTransactionFactory",
    "CardToCardTransactionFactory",
    # Invoice factories
    "SaleInvoiceFactory",
    "PaidSaleInvoiceFactory",
    "PartiallyPaidSaleInvoiceFactory",
    "RefundedSaleInvoiceFactory",
    # Item factories
    "SaleItemFactory",
    "PhantomSaleItemFactory",
    "DiscountedSaleItemFactory",
    # Report factories
    "DailyFinancialReportFactory",
    "FinalizedDailyFinancialReportFactory",
    "ReportWithDiscrepanciesFactory",
]

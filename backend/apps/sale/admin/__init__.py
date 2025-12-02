# apps/sale/admin/__init__.py
"""
Sale app admin configuration subpackage.

This subpackage contains Django admin configurations for all sale models.
Each model's admin is in its own module for better organization and maintainability.
"""

from .daily_financial_report import DailyFinancialReportAdmin
from .sale_invoice import SaleInvoiceAdmin, SaleItemInline
from .transaction import (
    CardToCardTransactionAdmin,
    CashTransactionAdmin,
    PosTransactionAdmin,
    TransactionAdmin,
)

__all__ = [
    "SaleInvoiceAdmin",
    "SaleItemInline",
    "TransactionAdmin",
    "PosTransactionAdmin",
    "CashTransactionAdmin",
    "CardToCardTransactionAdmin",
    "DailyFinancialReportAdmin",
]

from .product import ProductAdmin
from .purchase_invoice import PurchaseInvoiceAdmin
from .supplier import SupplierAdmin
from .supplier_product import SupplierProductAdmin, SupplierProductInline

__all__ = (
    "ProductAdmin",
    "SupplierAdmin",
    "SupplierProductInline",
    "SupplierProductAdmin",
    "PurchaseInvoiceAdmin",
)

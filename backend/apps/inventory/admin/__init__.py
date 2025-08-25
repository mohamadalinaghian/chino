from .product import ProductAdmin
from .supplier import SupplierAdmin
from .supplier_product import SupplierProductAdmin, SupplierProductInline

__all__ = (
    "ProductAdmin",
    "SupplierAdmin",
    "SupplierProductInline",
    "SupplierProductAdmin",
)

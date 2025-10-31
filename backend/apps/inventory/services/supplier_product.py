from __future__ import annotations

from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.translation import gettext_lazy as _

from ..models import Product, PurchaseInvoice, SupplierProduct


class SupplierProductService:
    """Keep ``SupplierProduct`` records in sync with purchases – type-safe."""

    @staticmethod
    def has_supplier(invoice: PurchaseInvoice) -> bool:
        """Return ``True`` if the invoice has a supplier attached."""
        return bool(invoice.supplier_id)

    @staticmethod
    @transaction.atomic
    def update_supplier_product(
        invoice: PurchaseInvoice,
        product: Product,
        price: Decimal,
        brand: str | None = None,
    ) -> None:
        """
        Update (or raise if missing) the ``SupplierProduct`` link.

        Args:
            invoice: The ``PurchaseInvoice`` that contains the price.
            product: The ``Product`` being purchased.
            price: Unit price from the invoice.
            brand: Optional brand identifier.
        """
        qs = SupplierProduct.objects.select_for_update()
        try:
            if brand:
                obj = qs.get(supplier=invoice.supplier, product=product, brand=brand)
            else:
                obj = qs.get(supplier=invoice.supplier, product=product)
        except SupplierProduct.DoesNotExist as exc:
            raise ValidationError(
                _("Product is not in the supplier’s list. Add it first or check again.")
            ) from exc

        obj.last_purchase_price = price
        obj.invoice_related = invoice
        obj.brand = brand
        obj.save()

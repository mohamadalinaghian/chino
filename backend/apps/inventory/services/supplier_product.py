from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.translation import gettext_lazy as _

from ..models import SupplierProduct


class SupplierProductService:
    """
    Service layer for keeping SupplierProduct records up to date
    based on purchase invoices.
    """

    @staticmethod
    def has_supplier(invoice) -> bool:
        """Check if the invoice has a supplier assigned (without extra query)."""
        return bool(invoice and invoice.supplier_id)

    @staticmethod
    def update_supplier_product(invoice, product, price, brand=None):

        with transaction.atomic():
            try:
                if brand is None:
                    obj = SupplierProduct.objects.select_for_update().get(
                        supplier=invoice.supplier, product=product
                    )
                else:
                    obj = SupplierProduct.objects.select_for_update().get(
                        supplier=invoice.supplier, product=product, brand=brand
                    )
            except SupplierProduct.DoesNotExist:
                raise ValidationError(
                    _(
                        "Product is not in supplier provided list. Check agian or add it first"
                    )
                )

            obj.last_purchase_price = price
            obj.invoice_related = invoice
            obj.brand = brand
            obj.save()

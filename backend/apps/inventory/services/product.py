from __future__ import annotations

from decimal import Decimal

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from ..models import Product


class ProductService:
    """Simple product helpers – type-safe."""

    @staticmethod
    def update_last_price(product: Product, price: Decimal) -> None:
        """Persist the latest purchase price on the product."""
        try:
            obj = Product.objects.select_for_update().get(id=product.pk)
        except Product.DoesNotExist as exc:
            raise ValidationError(_("Product does not exist.")) from exc

        obj.last_purchased_price = price
        obj.save(update_fields=("last_purchased_price",))

    @staticmethod
    def deactivate_product(product: Product) -> int:
        """Soft-deactivate a product. Returns number of rows updated."""
        return Product.objects.filter(id=product.pk).update(is_active=False)

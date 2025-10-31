from __future__ import annotations

from decimal import Decimal, DivisionByZero

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from ..models import Product

ZERO = Decimal("0")
FOUR_DEC = Decimal("0.0001")


class PurchaseItemService:
    """Price calculations for a purchase item – fully type-safe."""

    @staticmethod
    def get_unit_price(final_quantity: Decimal, total_cost: Decimal) -> Decimal:
        """Derive unit price from total cost and quantity."""
        try:
            return (total_cost / final_quantity).quantize(FOUR_DEC)
        except DivisionByZero as exc:
            raise ValidationError(_("Quantity can't be zero")) from exc

    @staticmethod
    def valid_final_quantity(
        simple_quantity: Decimal | None,
        package_quantity: Decimal | None,
        package_count: int | None,
    ) -> Decimal:
        """
        Accept **either** a simple quantity **or** package data.

        Returns the final quantity that will be stored.
        """
        if simple_quantity and simple_quantity != ZERO:
            if package_count or package_quantity:
                raise ValidationError(_("Cannot assign both quantity styles"))
            return simple_quantity

        if not package_quantity or not package_count:
            raise ValidationError(
                _("Package quantity and package count must be assigned together")
            )
        return Decimal(package_quantity) * Decimal(package_count)

    @staticmethod
    def get_last_price_or_zero(product: Product) -> Decimal:
        """Return the last purchased unit price or ``0``."""
        price = product.last_purchased_price
        return Decimal(price) if price is not None else ZERO

    @staticmethod
    def within_change_ratio(
        product: Product, unit_price: Decimal, valid_change_ratio: Decimal
    ) -> bool:
        """Check that the new price is within the allowed percentage change."""
        last = PurchaseItemService.get_last_price_or_zero(product)
        if last == ZERO:
            return True
        change = abs(unit_price - last) / last * 100
        return change <= valid_change_ratio

    @staticmethod
    def valid_unit_price(
        product: Product,
        unit_price: Decimal | None,
        total_cost: Decimal | None,
        final_quantity: Decimal,
    ) -> Decimal:
        """
        Validate input and return the final unit price (rounded to 4 dp).

        * ``total_cost`` → calculate unit price.
        * ``unit_price`` → use it (adjust for non-countable products).
        """
        if total_cost:
            if unit_price and unit_price != ZERO:
                raise ValidationError(_("Enter total cost **or** unit price, not both"))
            price = PurchaseItemService.get_unit_price(final_quantity, total_cost)
        elif not unit_price or unit_price == ZERO:
            raise ValidationError(_("You must provide unit price or total cost"))
        else:
            price = unit_price

        if not product.is_countable:
            price /= Decimal("1000")  # user enters price per 1000 g
        return price.quantize(FOUR_DEC)

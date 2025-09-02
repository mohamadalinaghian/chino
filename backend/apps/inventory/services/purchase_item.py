from decimal import Decimal, DivisionByZero

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

ZERO = Decimal("0")
TWO_DEC = Decimal("0.01")


class PurchaseItemService:
    """
    Calculate unit_price from user total_cost entry.

    Only simple quantity or package maner must provide.

    Get last purchased price or 0 to protect human error

    Check that user invoice is reasonable.

    Check for entring kind of price afterall.

    """

    @staticmethod
    def get_unit_price(final_quantity, total_cost):

        try:
            return Decimal(total_cost / final_quantity)
        except DivisionByZero:
            raise ValidationError(_("Quantity can't be Zero"))

    @staticmethod
    def valid_final_quantity(simple_quantity, package_quantity, package_count):
        """
        Accept either a simple quantity OR a package-based input (qty per package × count).
        Returns the final quantity to be stored on the model.
        """

        if simple_quantity and simple_quantity != ZERO:
            if package_count or package_quantity:
                raise ValidationError(_("Can not assign both quantity styles"))

            return simple_quantity

        if not package_count or not package_quantity:
            raise ValidationError(
                _("Package quantity and package count must assigned together")
            )

        return Decimal(package_quantity * package_count)

    @staticmethod
    def get_last_price_or_zero(product):
        """
        Return last purchased unit price of the product if available, else 0.
        """
        value = product.last_purchased_price
        try:
            return Decimal(value) if value is not None else ZERO
        except Exception:
            return ZERO

    @staticmethod
    def within_change_ratio(product, unit_price, valid_change_ratio: Decimal):
        """
        Check for user number's error.
        """

        last_unit_price = PurchaseItemService.get_last_price_or_zero(product)

        if last_unit_price is None or last_unit_price == ZERO:
            # For first purchase
            return True

        change_ratio = abs(unit_price - last_unit_price) / last_unit_price

        return change_ratio <= valid_change_ratio

    @staticmethod
    def valid_unit_price(unit_price, total_cost, final_quantity):
        """
        Validate price or cost and return correct unit price.
        """

        if total_cost:
            if unit_price and unit_price != Decimal("0"):
                raise ValidationError(_("Enter total cost or unit price not both"))

            _unit_price = PurchaseItemService.get_unit_price(final_quantity, total_cost)

            return _unit_price.quantize(TWO_DEC)

        if not unit_price or unit_price == Decimal("0"):
            raise ValidationError(_("You must assign unit price or total price"))

            # round to 2 decimal
        return unit_price.quantize(TWO_DEC)

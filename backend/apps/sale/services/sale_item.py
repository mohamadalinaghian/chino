from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.translation import gettext_lazy as _

from ...inventory.models import Product
from ...inventory.services import StockService
from ...menu.models import Menu


class SaleItemService:
    """
    Check sale's price.
    Check Stock for remaining quantity of item.
    Reduce quantity of item in Stock by every sale from StockService.
    """

    @staticmethod
    def is_saleable(product_id):
        """
        Only sell_able  product allow to sell.
        """

        obj = Product.objects.only("id", "type").get(id=product_id)

        if obj.type == Product.ProductType.SELLABLE:
            return True

        raise ValidationError(_("Only Sellable product allowed for sale"))

    @staticmethod
    def is_price_reasonable(product_id):
        """
        Check if price of sale at least is:
            sale_price  >=  item_cost * 1.5
        """

        obj = Menu.objects.only("id", "price").get(name_id=product_id)

        price = obj.price
        cost = obj.material_cost

        if cost is None or cost == 0:
            raise ValidationError(_("System can't determine cost of item"))

        if price <= cost * 1.5:
            raise ValidationError(_("Your price is to low"))

        return True

    @staticmethod
    def fifo_consume(product_id, quantity, item_sale_mchanism):
        """
        If it's sale from Stock, we reduce amount of item in Stock.
        If it's a phantom production, we reduce components of item from Stock.
        """
        from ..models import SaleItem

        tp = SaleItem.SaleMethod

        with transaction.atomic():
            if item_sale_mchanism == tp.STOCK:
                StockService.reserve_fifo(product_id, quantity)
            elif item_sale_mchanism == tp.PHANTOM:
                obj = Product.objects.only("id", "active_recipe").get(id=product_id)
                recipe = obj.active_recipe

                if recipe is None:
                    raise ValidationError(_("No active recipe for phantom production"))

                from ...inventory.models import RecipeComponent

                components = RecipeComponent.objects.filter(recipe_id=recipe)
                for cp in components:
                    cp_qt = cp.quantity * Decimal(quantity)
                    StockService.reserve_fifo(cp.consume_product, cp_qt)

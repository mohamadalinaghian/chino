# TODO update fields and refactor code
from apps.inventory.models import Product
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


class ProductService:

    @staticmethod
    def update_last_price(product, price):
        """
        On purchasing item, it will update last price.
        """
        try:
            obj = Product.objects.select_for_update().get(id=product.id)
        except Product.DoesNotExist:
            raise ValidationError(_("Product is not exists."))

        obj.last_purchased_price = price
        obj.save()

    @staticmethod
    def deactivate_product(product_id):
        return Product.objects.filter(id=product_id).update(is_active=False)

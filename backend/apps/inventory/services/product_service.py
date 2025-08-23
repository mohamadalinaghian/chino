# TODO update fields and refactor code
from apps.inventory.models import Product
from django.db import transaction


class ProductService:
    @staticmethod
    @transaction.atomic
    def get_or_create_product(**kwargs):
        """
        Get existing product or create a new one safely.

        Args:
            name (str): product name
            type (str): product type (RAW/PROCESSED/SELLABLE/CONSUMABLE)
            **kwargs: extra fields like expiry_traceable, countable, etc.

        Returns:
            (Product, bool): tuple (object, created)
        """
        name = kwargs.pop("name")
        type = kwargs.pop("type")
        return Product.objects.get_or_create(
            name=name,
            type=type,
            defaults=kwargs,
        )

    @staticmethod
    def get_active_products():
        return Product.objects.filter(is_active=True)

    @staticmethod
    def deactivate_product(product_id):
        return Product.objects.filter(id=product_id).update(is_active=False)

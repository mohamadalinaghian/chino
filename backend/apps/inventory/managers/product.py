from django.db import models

from apps.inventory.models.product import Product


class ProductQuerySet(models.QuerySet):
    """Custom QuerySet for Product model to filter products based on various criteria."""

    def purchased(self):
        """Get all the purchases of product."""
        return self.prefetch_related("purchases")

    def recipes(self):
        """Get all the recipes that use this product."""
        return self.prefetch_related("recipes").prefetch_related("recipes__components")

    def stock_entries(self):
        """Get all stock entries related to this product."""
        return self.prefetch_related("stock_entries")

    ###############################################
    # basic filters #
    def active(self):
        return self.filter(is_active=True)

    def countable(self):
        return self.filter(is_countable=True)

    def raw_products(self):
        return self.filter(product_type=Product.ProductType.RAW)

    def processed_products(self):
        return self.filter(product_type=Product.ProductType.PROCESSED)

    def menu_items(self):
        return self.filter(product_type=Product.ProductType.MENU_ITEM)

    def consumables(self):
        return self.filter(product_type=Product.ProductType.CONSUMABLE)


class ProductManager(models.Manager):
    """Custom manager for Product model to use custom QuerySet."""

    def get_queryset(self):
        return ProductQuerySet(self.model, using=self._db)

    def purchased(self):
        """Get all the purchases of product."""
        return self.get_queryset().purchased()

    def recipes(self):
        """Get all the recipes that use this product."""
        return self.get_queryset().recipes()

    def stock_entries(self):
        """Get all stock entries related to this product."""
        return self.get_queryset().stock_entries()

    ###############################################
    # basic filters #
    def active(self):
        return self.get_queryset().active()

    def countable(self):
        return self.get_queryset().countable()

    def raw_products(self):
        return self.get_queryset().raw_products()

    def processed_products(self):
        return self.get_queryset().processed_products()

    def menu_items(self):
        return self.get_queryset().menu_items()

    def consumables(self):
        return self.get_queryset().consumables()

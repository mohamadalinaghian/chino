from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class SupplierProduct(models.Model):
    """
    This model defines the many-to-many relationship between Supplier and Product.
    It stores supplier-details for each product, such as brand and last recorded
        purchase price.
    """

    # Fields
    supplier = models.ForeignKey(
        "inventory.Supplier",
        on_delete=models.CASCADE,
        verbose_name=_("Supplier"),
        related_name="supplier_products",
    )
    product = models.ForeignKey(
        "inventory.Product",
        models.CASCADE,
        verbose_name=_("Product"),
        related_name="product_suppliers",
    )
    brand = models.CharField(
        verbose_name=_("Brand"),
        max_length=128,
        null=True,
        blank=True,
    )
    last_purchase_price = models.DecimalField(
        _("Last purchase price"), max_digits=10, decimal_places=4, null=True, blank=True
    )
    last_price_date = models.DateField(
        _("Last price date"), default=timezone.localdate, null=True, blank=True
    )
    invoice_related = models.ForeignKey(
        "inventory.PurchaseInvoice",
        models.CASCADE,
        verbose_name=_("Related invoice"),
        related_name="supplied_info",
        null=True,
        blank=True,
    )

    # Methods
    def __str__(self):
        return f"{self.supplier}: {self.product}"

    # Meta
    class Meta:
        verbose_name = _("Supplier Related Product")
        verbose_name_plural = _("Supplier Related Products")
        ordering = ("supplier", "product")
        constraints = (
            models.UniqueConstraint(
                fields=("supplier", "product", "brand"), name="uq_supplier_product"
            ),
            models.UniqueConstraint(
                fields=["supplier", "product"],
                condition=models.Q(brand__isnull=True),
                name="uq_supplier_product_null_brand",
            ),
        )

from django.contrib.auth import get_user_model
from django.db import models
from django.utils.translation import gettext_lazy as _

User = get_user_model()


class SaleDiscount(models.Model):
    """
    Represents a discount applied to a Sale.

    A sale can have multiple discounts (e.g. promotional + manual adjustment).
    Discounts can be either percentage-based or fixed-amount.
    The applied discount value is stored as-is and must be interpreted
    according to `discount_type`.
    """

    class DiscountType(models.TextChoices):
        PERCENTAGE = "PERCENTAGE", _("Percentage")
        FIXED = "FIXED", _("Fixed amount")

    sale = models.ForeignKey(
        "sale.Sale",
        on_delete=models.CASCADE,
        related_name="discounts",
        verbose_name=_("sale"),
        help_text=_(
            "The sale to which this discount is applied. "
            "If the sale is deleted, related discounts will also be removed."
        ),
    )

    discount_type = models.CharField(
        max_length=20,
        choices=DiscountType.choices,
        verbose_name=_("discount type"),
        help_text=_(
            "Determines how the discount value is applied. "
            "Percentage discounts are calculated relative to the sale total, "
            "while fixed discounts are absolute monetary amounts."
        ),
    )

    value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name=_("discount value"),
        help_text=_(
            "The numeric value of the discount. "
            "For percentage discounts, this represents the percentage value "
            "(e.g. 10 for 10%). For fixed discounts, this represents a monetary amount."
        ),
    )

    reason = models.CharField(
        max_length=255,
        verbose_name=_("reason"),
        help_text=_(
            "Human-readable explanation for why this discount was applied "
            "(e.g. promotion, compensation, staff authorization)."
        ),
    )

    applied_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="applied_sale_discounts",
        verbose_name=_("applied by"),
        help_text=_(
            "The user who applied or approved this discount. "
            "Users referenced here cannot be deleted."
        ),
    )

    class Meta:
        verbose_name = _("sale discount")
        verbose_name_plural = _("sale discounts")
        ordering = ("id",)

    def __str__(self) -> str:
        return f"{self.get_discount_type_display()} - {self.value}"

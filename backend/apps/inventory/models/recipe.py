from django.contrib import admin
from django.db import models
from django.utils.translation import gettext_lazy as _
from persiantools.jdatetime import JalaliDate

from ...utils.models import TimeStampedModel
from . import Product


class Recipe(TimeStampedModel):
    """
    Store the metadata about a product's recipe.
    """

    # Fields
    name = models.CharField(
        _("Name"),
        max_length=64,
        unique=True,
        help_text=_("Unique name for recipe to recognizing it"),
    )
    produced_product = models.ForeignKey(
        "inventory.Product",
        models.PROTECT,
        "recipes",
        verbose_name=_("Produced product"),
        limit_choices_to={
            "type__in": (Product.ProductType.PROCESSED, Product.ProductType.SELLABLE)
        },
    )
    # created_at in TimeStampedModel
    # updated_at in TimeStampedModel
    instruction = models.CharField(
        _("Instruction"), max_length=512, null=True, blank=True
    )

    # Methods
    def __str__(self) -> str:
        return str(self.name)

    @admin.display(description=_("Create date"))
    def jalali_created_at(self):
        if not self.created_at:
            return "-"
        return JalaliDate(self.created_at).strftime("%c", locale="fa")

    @admin.display(description=_("Update date"))
    def jalali_updated_at(self):
        if not self.updated_at:
            return "-"
        return JalaliDate(self.updated_at).strftime("%c", locale="fa")

    # Meta
    class Meta:
        verbose_name = _("Recipe")
        verbose_name_plural = _("Recipes")
        ordering = ("-updated_at",)

from django.contrib.auth import get_user_model
from django.db import models
from django.utils.translation import gettext_lazy as _

from ...utils.models import TimeStampedModel


class ItemProduction(TimeStampedModel):
    """
    Every item production in the café is stored in this model.
    """

    # Fields
    used_recipe = models.ForeignKey(
        "inventory.Recipe",
        models.SET_NULL,
        verbose_name=_("Used recipe"),
        null=True,
    )
    used_quantity = models.DecimalField(
        _("Used quantity"), max_digits=10, decimal_places=2
    )
    produced_quantity = models.DecimalField(
        _("Produced quantity"), max_digits=10, decimal_places=2
    )
    unit_cost = models.DecimalField(
        verbose_name=_("Unit Cost"),
        help_text=_("Cost per unit of finished product"),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )
    cooperators = models.ManyToManyField(
        get_user_model(),
        verbose_name=_("Creators"),
        related_name="produced_items",
        limit_choices_to={"is_staff": True},
    )
    notes = models.CharField(
        _("Notes"),
        max_length=128,
        null=True,
        blank=True,
    )

    # Methods
    def __str__(self) -> str:
        return f"{self.used_recipe.name}"

    # Meta
    class Meta:
        verbose_name = _("Item production")
        verbose_name_plural = _("Items Production")

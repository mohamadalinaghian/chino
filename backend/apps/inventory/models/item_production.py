from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
from decimal import Decimal

from apps.inventory.services.stock import consume_and_cost, InsufficientStock
from apps.utils.models import TimeStampedModel

User = get_user_model()


class ItemProduction(TimeStampedModel):
    """
    Store Item produced in system and it's cost and persons who created it.
    """

    usaged_recipe = models.ForeignKey(
        to="inventory.Recipe",
        on_delete=models.PROTECT,
        verbose_name=_("Produced Recipe"),
        help_text=_("The recipe that has been used to produce this item."),
        related_name="productions",
        db_index=True,
    )
    input_quantity = models.DecimalField(
        verbose_name=_("Quantity Used"),
        max_digits=10,
        decimal_places=2,
        help_text=_(
            "Quantity of the components used for this production, regardless of the unit"
        ),
        null=True,
        blank=True,
    )
    output_quantity = models.DecimalField(
        verbose_name=_("Quantity Produced"),
        max_digits=10,
        decimal_places=2,
        help_text=_("Quantity of the final product produced."),
        null=True,
        blank=True,
    )
    unit_cost = models.DecimalField(
        verbose_name=_("Unit Cost (calculated)"),
        max_digits=10,
        decimal_places=2,
        editable=False,
    )
    creators = models.ManyToManyField(
        to=User,
        verbose_name=_("Creators"),
        related_name="produced_items",
        blank=True,
        null=True,
    )

    class Meta:
        verbose_name = _("Item Production")
        verbose_name_plural = _("Item Productions")
        ordering = ["-produced_at"]

    def __str__(self):
        return f"{self.usaged_recipe.name} @ {self.created_at.date()}"

    def get_recipe_components(self):
        """
        Retrieve the components used in the recipe for this production.
        """
        return self.usaged_recipe.recipe_components.all()

    def calculate_unit_cost(self):
        """
        Use FIFO to calculate the unit cost of producing this product based on its recipe.
        """

        if not self.usaged_recipe:
            raise ValueError(_("No recipe defined for this production."))

        total_cost = Decimal("0.0")
        total_input = Decimal("0.0")

        for comp in self.get_recipe_components():
            # ۱. محاسبه مقدار مورد نیاز
            needed = comp.quantity * self.output_quantity

            # ۲. مصرف FIFO و گرفتن هزینه
            try:
                cost = consume_and_cost(comp.component, needed)
            except InsufficientStock as e:
                raise ValueError(str(e))

            total_cost += cost
            total_input += needed

        # ۳. تنظیم input_quantity
        if self.usaged_recipe.is_countable:
            self.input_quantity = None
        else:
            self.input_quantity = total_input

        # ۴. محاسبه unit_cost
        if self.output_quantity is None or self.output_quantity <= 0:
            raise ValueError(_("Output quantity must be positive"))

        unit_cost = total_cost / self.output_quantity
        return unit_cost.quantize(Decimal("0.01"))

    def save(self, *args, **kwargs):
        if not self.unit_cost:
            self.unit_cost = self.calculate_unit_cost()
        super().save(*args, **kwargs)

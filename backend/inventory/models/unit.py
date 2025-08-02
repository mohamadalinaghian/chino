from django.db import models
from django.forms import ValidationError
from django.utils.translation import gettext_lazy as _


class Unit(models.Model):
    """
    Defines a measurement unit and, if needed, how many atomic units it equals.
    All quantities in the system are stored in their atomic unit (e.g. gram, milliliter, piece).
    Example: “kg” → base_unit="g", conversion_ratio=1000.
    """

    name = models.CharField(
        _("Name"),
        max_length=20,
        unique=True,
        help_text=_("E.g. 'g', 'kg', 'ml', 'pc'"),
    )
    base_unit = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        verbose_name=_("Base Unit"),
        help_text=_(
            "If set, this unit converts to base_unit by multiplication with conversion_ratio. "
            "Leave null for atomic units."
        ),
    )
    conversion_ratio = models.PositiveIntegerField(
        _("Conversion Ratio"),
        default=1,
        help_text=_(
            "How many of this unit equal one base_unit. "
            "E.g. for kg, conversion_ratio=1000 (1000 g per kg)."
        ),
    )

    class Meta:
        ordering = ["name"]

    def clean(self):
        # Prevent cycles: a unit cannot be its own ancestor
        ancestor = self.base_unit
        while ancestor:
            if ancestor == self:
                raise ValidationError(_("Unit cannot be its own ancestor"))
            ancestor = ancestor.base_unit

    def __str__(self):
        return self.name

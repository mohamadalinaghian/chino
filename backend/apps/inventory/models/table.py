from django.db import models
from django.utils.translation import gettext_lazy as _


class Table(models.Model):
    """
    Physical table in the cafe.
    """

    name = models.CharField(
        _("Name"),
        max_length=32,
        unique=True,
        help_text=_("Human-readable table identifier"),
    )

    capacity = models.PositiveSmallIntegerField(
        _("Capacity"),
        help_text=_("Maximum number of guests"),
    )

    is_active = models.BooleanField(
        _("Is active"),
        default=True,
        help_text=_("Inactive tables cannot be assigned to sales"),
    )

    class Meta:
        ordering = ("name",)
        verbose_name = _("Table")
        verbose_name_plural = _("Tables")

    def __str__(self) -> str:
        return self.name

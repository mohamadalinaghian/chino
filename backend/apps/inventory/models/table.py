from django.db import models
from django.utils.translation import gettext_lazy as _


class Table(models.Model):
    """
    Physical table in the cafe.
    """

    name = models.CharField(
        max_length=32,
        unique=True,
        help_text=_("Human-readable table identifier"),
    )

    capacity = models.PositiveSmallIntegerField(
        help_text=_("Maximum number of guests"),
    )

    is_active = models.BooleanField(
        default=True,
        help_text=_("Inactive tables cannot be assigned to sales"),
    )

    class Meta:
        ordering = ("name",)

    def __str__(self) -> str:
        return self.name

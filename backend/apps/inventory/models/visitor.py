from django.core.validators import RegexValidator
from django.db import models
from django.utils.translation import gettext_lazy as _


class Visitor(models.Model):
    """
    Store suppliers Visitor data.
    """

    # Fields
    phone_number_validate = RegexValidator(
        regex=r"^0\d{10}$",
        message=_("Phone number must be in the format 0XXXXXXXXXX"),
        code="invalid_number",
    )

    phone_number = models.CharField(
        verbose_name=_("Mobile"),
        unique=True,
        db_index=True,
        validators=[phone_number_validate],
        max_length=11,
    )
    name = models.CharField(
        _("Name"),
        max_length=32,
        db_index=True,
    )
    notes = models.CharField(_("Notes"), max_length=128, null=True, blank=True)
    related_supplier = models.ForeignKey(
        "inventory.Supplier",
        models.CASCADE,
        related_name="visitors",
        verbose_name=_("supplier"),
    )

    # Method
    def __str__(self) -> str:
        return str(self.name)

    # Meta
    class Meta:
        verbose_name = _("Visitor")
        verbose_name_plural = _("Visitors")

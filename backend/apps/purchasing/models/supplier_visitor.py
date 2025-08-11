from django.core.validators import RegexValidator
from django.db import models
from django.utils.translation import gettext_lazy as _
from ..managers import SupplierVisitorManager


class SupplierVisitor(models.Model):
    """
    Store supplier visitor info neither mobile or office number.
    """

    phone_number_validate = RegexValidator(
        regex=r"^0\d{10}$",
        message=_("Phone number must be in the format 0XXXXXXXXXX"),
        code="invalid_phone",
    )
    name = models.CharField(
        _("Name"), max_length=64, help_text=_("Visitor name or company name")
    )
    phone_numbers = models.JSONField(
        _("Phone Numbers"),
        default=list,
        blank=True,
        validators=[phone_number_validate],
    )

    is_active = models.BooleanField(_("Active"), default=True)

    objects = SupplierVisitorManager()

    class Meta:
        verbose_name = _("Supplier Visitor")
        verbose_name_plural = _("Supplier Visitors")

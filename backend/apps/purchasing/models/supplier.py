from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator


class Supplier(models.Model):
    """
    Represents a supplier entity for purchase transactions.
    """

    phone_number_validate = RegexValidator(
        regex=r"^0\d{10}$",
        message=_("Phone number must be in the format 0XXXXXXXXXX"),
        code="invalid_phone",
    )

    name = models.CharField(_("Supplier Name"), max_length=64, unique=True)
    contact_person = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        verbose_name=_("Contact Person"),
    )

    mobile = models.CharField(
        verbose_name=_("Mobile"),
        unique=True,
        db_index=True,
        validators=[phone_number_validate],
        max_length=11,
    )
    extra_phone_number = models.JSONField(
        _("Extra Phone Number"),
        default=list,
        blank=True,
        validators=[phone_number_validate],
    )
    is_active = models.BooleanField(_("Active"), default=True)
    address = models.TextField(_("Address"), blank=True)
    note = models.CharField(_("Note"), blank=True, max_length=255)

    class Meta:
        verbose_name = _("Supplier")
        verbose_name_plural = _("Suppliers")
        ordering = ["name"]

    def __str__(self):
        return self.name

    def clean(self):
        super().clean()
        # validate extra_phone_number is list of valid phones
        if self.extra_phone_number:
            if not isinstance(self.extra_phone_number, list):
                raise ValidationError(
                    {"extra_phone_number": _("Must be a list of phone numbers.")}
                )
            for num in self.extra_phone_number:
                try:
                    self.phone_number_validate(num)
                except ValidationError as e:
                    raise ValidationError(
                        {
                            "extra_phone_number": _(
                                "One or more phone numbers are invalid."
                            )
                        }
                    )

from decimal import Decimal

from apps.utils.models import TimeStampedModel
from django.db import models
from django.utils.translation import gettext_lazy as _


class Profile(TimeStampedModel):
    """
    Extra info about user.
    """

    class Meta:
        verbose_name = _("Profile")
        verbose_name_plural = _("Profiles")

    SEX_CHOICES = ((True, _("Male")), (False, _("Female")))

    user = models.OneToOneField(
        "user.Account",
        verbose_name=_("User"),
        on_delete=models.CASCADE,
        related_name="profile",
    )
    email = models.EmailField(
        verbose_name=_("Email"), blank=True, null=True, unique=True
    )
    is_email_verified = models.BooleanField(
        verbose_name=_("Is Email Verified?"), default=False
    )
    address = models.CharField(
        verbose_name=_("Address"), max_length=120, blank=True, null=True
    )
    birth_date = models.DateField(
        verbose_name=_("Birth Day"), blank=True, null=True, db_index=True
    )
    sex = models.BooleanField(
        verbose_name=_("Sex"),
        choices=SEX_CHOICES,
        default=True,
    )

    # Financial tracking fields
    total_debt = models.DecimalField(
        verbose_name=_("Total Debt"),
        max_digits=12,
        decimal_places=2,
        default=Decimal("0"),
        help_text=_("Total amount owed by this user"),
    )
    total_payment = models.DecimalField(
        verbose_name=_("Total Payment"),
        max_digits=12,
        decimal_places=2,
        default=Decimal("0"),
        help_text=_("Total amount paid by this user"),
    )

    @property
    def account_balance(self) -> Decimal:
        """Calculate remaining balance (total_debt - total_payment)"""
        return self.total_debt - self.total_payment

    def __str__(self):
        return f"{self.user.name}: ({self.user.mobile})"

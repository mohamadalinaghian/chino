from __future__ import annotations

from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models, transaction
from django.utils.functional import cached_property
from django.utils.translation import gettext_lazy as _
from persiantools.jdatetime import JalaliDate


def pct_0_to_100_exclusive(value: Decimal):
    if value < 0 or value >= 100:
        raise ValidationError("Must be in [0, 100).")


class SiteSettings(models.Model):
    singleton_key = models.CharField(
        _("Singleton key"), max_length=16, unique=True, default="default"
    )

    # pricing
    profit_margin = models.PositiveSmallIntegerField(
        _("Profit margin"),
        default=30,
        validators=[pct_0_to_100_exclusive],
    )
    tax_rate = models.PositiveSmallIntegerField(
        _("Tax rate"),
        default=10,
        validators=[pct_0_to_100_exclusive],
    )

    overhead_bar_value = models.DecimalField(
        _("Overhead bar value"),
        max_digits=10,
        decimal_places=4,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    overhead_food_value = models.DecimalField(
        _("Overhead food value"),
        max_digits=10,
        decimal_places=4,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    purchase_valid_change_ratio = models.PositiveSmallIntegerField(
        _("Purchase valid change ratio"), default=0
    )

    thumbnail_quality = models.PositiveSmallIntegerField(
        _("Thumbnail quality"),
        default=75,
        validators=[MinValueValidator(1), MaxValueValidator(95)],
    )
    thumbnail_max_width = models.PositiveSmallIntegerField(
        _("Thumbnail max width"), default=200, validators=[MinValueValidator(50)]
    )
    thumbnail_max_height = models.PositiveSmallIntegerField(
        _("Thumbnail max height"), default=200, validators=[MinValueValidator(50)]
    )

    # Payment settings
    default_pos_account = models.ForeignKey(
        "user.BankAccount",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_("Default POS terminal account"),
        help_text=_("Default bank account for POS terminal payments"),
        related_name="pos_settings",
    )

    updated_at = models.DateTimeField(auto_now=True)

    # Property
    @cached_property
    def jalali_update_date(self):
        # updated_at is None on add form (unsaved instance)
        if not self.updated_at:
            return None
        return JalaliDate(self.updated_at).strftime("%c", locale="fa")

    class Meta:
        verbose_name = _("Site Settings")
        verbose_name_plural = _("Site Settings")

    @classmethod
    def get(cls) -> "SiteSettings":
        obj, _ = cls.objects.get_or_create(singleton_key="default")
        return obj

    @classmethod
    def get_for_update(cls) -> "SiteSettings":
        with transaction.atomic():
            obj, _ = cls.objects.select_for_update().get_or_create(
                singleton_key="default"
            )
            return obj

    def __str__(self):
        return f"{self.singleton_key}"

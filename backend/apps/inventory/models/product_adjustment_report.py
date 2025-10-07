from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from django.utils.functional import cached_property
from django.utils.translation import gettext_lazy as _
from persiantools.jdatetime import JalaliDate


class ProductAdjustmentReport(models.Model):
    """
    If any adjustment reported by human, this model will store it.
    """

    # Fields
    product = models.ForeignKey(
        "inventory.Product",
        models.SET_NULL,
        null=True,
        related_name="adjustments",
        verbose_name=_("Product"),
        db_index=True,
    )
    report_date = models.DateField(_("Report Date"), default=timezone.now)
    staff = models.ForeignKey(
        get_user_model(), models.SET_NULL, verbose_name=_("Staff"), null=True
    )
    previous_quantity = models.DecimalField(
        _("Previous quantity"), decimal_places=2, max_digits=10
    )
    current_quantity = models.DecimalField(
        verbose_name=_("Current quantity"), max_digits=10, decimal_places=2
    )
    cost = models.DecimalField(
        _("Cost"), max_digits=10, decimal_places=4, null=True, blank=True
    )

    # Property
    @cached_property
    def jalali_report_date(self):
        return JalaliDate(self.report_date).strftime("%c", locale="fa")

    # Method
    def __str__(self) -> str:
        return f"{self.product}: #{self.jalali_report_date}"

    def clean(self) -> None:
        super().clean()
        if self.previous_quantity == self.current_quantity:
            raise ValidationError(_("No change no report!"))

    # Meta:
    class Meta:
        verbose_name = _("Product Adjustment Report")
        verbose_name_plural = _("Products Adjustment Report")

from django.db import models
from django.utils.functional import cached_property
from django.utils.translation import gettext_lazy as _
from persiantools.jdatetime import JalaliDate


class ProductAdjusmentReport(models.Model):
    """
    If any adjustment reported by human, this model will store it.
    """

    # Fields
    product = models.ForeignKey(
        "inventory.Product",
        models.DO_NOTHING,
        related_name="adjustments",
        verbose_name=_("Product"),
        db_index=True,
    )
    report_date = models.DateField(
        _("Report Date"),
        auto_now=True,
    )
    previouse_quantity = models.DecimalField(
        _("Previouse quantity"),
        max_digits=10,
        decimal_places=2,
    )
    current_quantity = models.DecimalField(
        verbose_name=_("Current quantity"), max_digits=10, decimal_places=2
    )

    # Property
    @cached_property
    def jalali_report_date(self):
        return JalaliDate(self.report_date).strftime("%c", locale="fa")

    # Method
    def __str__(self) -> str:
        return f"{self.product}: #{self.jalali_report_date}"

    # Meta:
    class Meta:
        verbose_name = _("Product Adjustment Report")
        verbose_name_plural = _("Products Adjustment Report")

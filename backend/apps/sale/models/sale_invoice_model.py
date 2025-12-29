from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone
from django.utils.functional import cached_property
from django.utils.translation import gettext_lazy as _
from persiantools.jdatetime import JalaliDateTime

User = get_user_model()


class SaleInvoice(models.Model):
    """
    Invoice of every CLOSED sale.
    money managament goes here.
    """

    class InvoiceStatus(models.TextChoices):
        UNPAID = "UNPAID", _("Unpaid")
        PARTIALY_PAID = "PARTIALY_PAID", _("Partialy paid")
        PAID = "PAID", _("Paid")
        VOID = "VOID", _("Void")

    # Fields
    sale = models.OneToOneField(
        "sale.Sale",
        models.PROTECT,
        verbose_name=_("Sale"),
        related_name="invoice",
        db_index=True,
    )
    subtotal_amount = models.DecimalField(
        _("Subtotal amount"),
        max_digits=12,
        decimal_places=3,
        help_text=_("Sale final total before applying tax and discount"),
    )
    discount_amount = models.DecimalField(
        _("Discount total"),
        max_digits=10,
        decimal_places=3,
        help_text=_("Snapshot of discount applied to this sale"),
    )
    tax_amount = models.DecimalField(_("Tax amount"), decimal_places=3, max_digits=10)
    issued_at = models.DateTimeField(_("Issued at"), default=timezone.now)
    issued_by = models.ForeignKey(
        User, models.PROTECT, verbose_name=_("Issued by"), related_name="invoices"
    )

    # Property
    @cached_property
    def jalali_issue_date(self):
        return JalaliDateTime(self.issued_at).strftime("%c", locale="fa")

    def __str__(self) -> str:
        return f"{self.sale}: issued at {self.jalali_issue_date}"

    class Meta:
        verbose_name = _("Sale invoice")
        verbose_name_plural = _("Sale invoices")
        ordering = ("-issued_at",)

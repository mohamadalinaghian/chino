from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class SaleInvoicePayment(models.Model):
    """
    Indicate payment methods and amount of every pay.
    """

    class PaymentMethod(models.TextChoices):
        POS = "POS", _("POS")
        CASH = "CASH", _("Cash")
        TRANSFER = "TRANSFER", _("Card-to-card/Transfer")

    # Fields
    invoice = models.ForeignKey(
        "sale.SaleInvoice",
        models.CASCADE,
        verbose_name=_("Invoice"),
        db_index=True,
        related_name="payments",
    )
    method = models.CharField(_("Method"), max_length=16, choices=PaymentMethod.choices)
    amount = models.DecimalField(
        _("Amount"),
        max_digits=10,
        decimal_places=4,
        validators=[MinValueValidator(0.0001)],
    )
    pay_day = models.DateTimeField(
        _("Payment date"),
        default=timezone.now,
    )

    # Method
    def __str__(self) -> str:
        return f"{str(self.invoice)}: {self.method}"

    class Meta:
        verbose_name = _("Sale invoice payment")
        verbose_name_plural = _("Sale invoice payments")
        ordering = ("-pay_day",)
        indexes = [
            models.Index(fields=("invoice", "pay_day")),
            models.Index(fields=("method",)),
        ]

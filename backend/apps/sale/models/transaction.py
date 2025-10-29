from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class Transaction(models.Model):
    """
    Abstract base model for payment transactions.
    """

    class PaymentType(models.TextChoices):
        POS = "POS", _("POS")
        CARD_TO_CARD = "CARD_TO_CARD", _("Card to Card")
        CASH = "CASH", _("Cash")

    invoice = models.ForeignKey(
        "sale.SaleInvoice",
        on_delete=models.PROTECT,
        verbose_name=_("Invoice"),
        related_name="%(class)s_transactions",
    )
    amount = models.DecimalField(
        _("Amount"),
        max_digits=10,
        decimal_places=4,
    )
    pay_day = models.DateField(
        _("Pay day"),
        default=timezone.now,
        db_index=True,
    )
    payment_type = models.CharField(
        max_length=16,
        choices=PaymentType.choices,
        editable=False,  # Set in subclasses
    )

    def clean(self):
        """
        Validate amount and pay_day.
        """
        if self.amount <= 0:
            raise ValidationError({"amount": _("Amount must be positive")})
        if self.pay_day > timezone.now().date():
            raise ValidationError({"pay_day": _("Pay day cannot be in the future")})
        super().clean()

    class Meta:
        abstract = True
        ordering = ("-pay_day",)
        verbose_name = _("Transaction")
        verbose_name_plural = _("Transactions")

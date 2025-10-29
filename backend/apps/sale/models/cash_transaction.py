from django.contrib.auth import get_user_model
from django.db import models
from django.utils.translation import gettext_lazy as _

from .transaction import Transaction


class CashTransaction(Transaction):
    """
    Records cash payment transactions.
    """

    staff = models.ForeignKey(
        get_user_model(),
        on_delete=models.PROTECT,
        verbose_name=_("Staff"),
        related_name="cash_transactions",
    )

    def __str__(self) -> str:
        return f"{self.pay_day}: {self.amount}"

    def save(self, *args, **kwargs):
        self.payment_type = self.PaymentType.CASH
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = _("Cash transaction")
        verbose_name_plural = _("Cash transactions")

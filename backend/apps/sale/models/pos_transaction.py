from django.db import models
from django.utils.translation import gettext_lazy as _

from .transaction import Transaction


class PosTransaction(Transaction):
    """
    Records POS terminal transactions.
    """

    target_account = models.ForeignKey(
        "user.BankAccount",
        on_delete=models.PROTECT,
        verbose_name=_("Target account"),
        related_name="pos_transactions",
    )

    def __str__(self) -> str:
        return f"{self.pay_day}: #{self.target_account.account_owner}"

    def save(self, *args, **kwargs):
        self.payment_type = self.PaymentType.POS
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = _("POS transaction")
        verbose_name_plural = _("POS transactions")

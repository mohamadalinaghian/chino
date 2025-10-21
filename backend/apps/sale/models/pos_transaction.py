from django.db import models
from django.utils.translation import gettext_lazy as _


class PosTransactions(models.Model):
    """
    Every pos transaction record will store here.
    """

    # Fields
    payment_record = models.ForeignKey(
        "sale.SaleInvoicePayment",
        models.CASCADE,
        verbose_name=_("Payment record"),
    )
    target_account = models.ForeignKey(
        "user.BankAccount",
        models.PROTECT,
        verbose_name=_("Target account"),
        related_name="pos_transactions",
    )

    # Method
    def __str__(self) -> str:
        return f"{self.payment_record.pay_day}: #{self.target_account.name}"

    # Meta
    class Meta:
        verbose_name = _("Pos transaction")
        verbose_name_plural = _("Pos transactions")
        ordering = ("payment_record__pay_day",)

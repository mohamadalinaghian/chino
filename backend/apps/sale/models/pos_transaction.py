from __future__ import annotations

from django.db import models
from django.utils.translation import gettext_lazy as _


class PosTransaction(models.Model):
    """
    POS-specific transaction details.
    Links to base Transaction.
    """

    transaction = models.OneToOneField(
        "sale.Transaction",
        on_delete=models.CASCADE,
        related_name="pos_details",
        primary_key=True,
    )
    target_account = models.ForeignKey(
        "user.BankAccount",
        on_delete=models.PROTECT,
        verbose_name=_("Target account"),
        related_name="pos_transactions",
    )

    class Meta:
        verbose_name = _("POS Transaction")
        verbose_name_plural = _("POS Transactions")

    def __str__(self) -> str:
        return f"POS: {self.transaction}"

from __future__ import annotations

from django.db import models
from django.utils.translation import gettext_lazy as _


class CardToCardTransaction(models.Model):
    """
    Card-to-card transfer specific details.
    """

    transaction = models.OneToOneField(
        "sale.Transaction",
        on_delete=models.CASCADE,
        related_name="card_transfer_details",
        primary_key=True,
    )
    destination_account = models.ForeignKey(
        "user.BankAccount",
        on_delete=models.PROTECT,
        verbose_name=_("Destination account"),
        related_name="card_transfers_received",
    )

    class Meta:
        verbose_name = _("Card to Card Transaction")
        verbose_name_plural = _("Card to Card Transactions")

    def __str__(self) -> str:
        return f"Transfer: {self.transaction}"

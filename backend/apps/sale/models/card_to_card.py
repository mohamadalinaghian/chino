from django.contrib.auth import get_user_model
from django.db import models
from django.utils.translation import gettext_lazy as _

from .transaction import Transaction


class CardToCard(Transaction):
    """
    Records card-to-card bank transfer transactions.
    """

    transporter = models.ForeignKey(
        get_user_model(),
        on_delete=models.SET_NULL,
        verbose_name=_("Transporter"),
        related_name="transfers",
        null=True,
        blank=True,
    )
    destination = models.ForeignKey(
        "user.BankAccount",
        on_delete=models.PROTECT,
        verbose_name=_("Destination"),
        related_name="card_to_card_inputs",
    )

    def __str__(self) -> str:
        return f"{self.pay_day}: {self.destination.account_owner}"

    def save(self, *args, **kwargs):
        self.payment_type = self.PaymentType.CARD_TO_CARD
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = _("Card to card transaction")
        verbose_name_plural = _("Card to card transactions")

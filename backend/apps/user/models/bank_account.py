from django.db import models
from django.utils.translation import gettext_lazy as _

from ...utils.validators import validate_iran_card_number


class BankAccount(models.Model):
    """
    Cafe bank accounts metadata.
    """

    # Fields
    related_user = models.ForeignKey(
        "user.Account",
        models.PROTECT,
        verbose_name=_("Related user"),
        related_name="bank_accounts",
    )
    name = models.CharField(_("Name"), max_length=16, db_index=True, unique=True)
    card_number = models.CharField(
        _("Card number"),
        max_length=16,
        unique=True,
        validators=[validate_iran_card_number],
    )
    account_owner = models.CharField(
        _("Account owner"),
        max_length=12,
    )

    # Method
    def __str__(self) -> str:
        return f"{self.account_owner}: {self.card_number}"

    # Meta
    class Meta:
        verbose_name = _("Bank account")
        verbose_name_plural = _("Bank accounts")

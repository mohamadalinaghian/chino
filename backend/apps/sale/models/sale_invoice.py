from itertools import chain

from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone
from django.utils.functional import cached_property
from django.utils.translation import gettext_lazy as _
from persiantools.jdatetime import JalaliDate


class SaleInvoice(models.Model):
    """
    Parent of a sale. store meta data about a sale invoice.
    """

    class BillStatus(models.TextChoices):
        OPEN = "OPEN", _("Open")
        PARTIALLY_PAID = "PARTIAL", _("Partially paid")
        PAID = "PAID", _("Paid")
        REFUND = "REFUND", _("Refund")

    # Fields
    issue_date = models.DateTimeField(
        _("Issue date"), default=timezone.now, db_index=True
    )

    staff = models.ForeignKey(
        get_user_model(),
        on_delete=models.PROTECT,
        related_name="sale_invoices",
        verbose_name=_("Staff"),
        limit_choices_to={"is_staff": True},
        help_text=_("Person who sales products"),
    )
    customer = models.ForeignKey(
        get_user_model(),
        on_delete=models.PROTECT,
        related_name="buy_invoices",
        help_text=_("Gest of cafe who buy products"),
        null=True,
        blank=True,
    )
    note = models.CharField(_("Note"), max_length=128, null=True, blank=True)
    bill_status = models.CharField(
        _("Bill status"),
        max_length=16,
        choices=BillStatus.choices,
        default=BillStatus.OPEN,
    )

    # Property
    @cached_property
    def jalali_issue_date(self):
        return JalaliDate(self.issue_date.date()).strftime("%c", locale="fa")

    @cached_property
    def total_revenue(self):
        result = self.items.aggregate(
            total=models.Sum(models.F("sold_unit_price") * models.F("quantity"))
        )
        return result["total"]

    @property
    def transactions(self):
        """
        Unified list of ALL payment transactions.
        """
        return sorted(
            chain(
                self.pos_transaction_transactions.all(),
                self.cash_transaction_transactions.all(),
                self.card_to_card_transactions.all(),
            ),
            key=lambda t: t.pay_day,
            reverse=True,
        )

    @property
    def total_paid(self):
        return sum(t.amount for t in self.transactions)

    # Method
    def __str__(self) -> str:
        return f"{self.jalali_issue_date}"

    def clean(self):
        """
        Check for staff.
        """
        if self.staff.is_staff is False:
            from django.core.exceptions import ValidationError

            raise ValidationError({"staff": _("Chosen staff must be a staff member.")})

        super().clean()

    # Meta
    class Meta:
        verbose_name = _("Sale Invoice")
        verbose_name_plural = _("Sale Invoices")
        ordering = ("-issue_date",)
        indexes = [
            models.Index(fields=("issue_date",)),
            models.Index(fields=("bill_status",)),
        ]

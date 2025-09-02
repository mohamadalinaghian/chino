from django.db import models
from django.utils import timezone
from django.utils.functional import cached_property
from django.utils.translation import gettext_lazy as _
from persiantools.jdatetime import JalaliDate


class PurchaseInvoice(models.Model):
    """
    Meta data about an invoice.
    """

    # Fields
    issue_date = models.DateField(_("Issue date"), default=timezone.now, db_index=True)
    # Time stamped maybe later
    staff = models.ForeignKey(
        "user.Account",
        on_delete=models.PROTECT,
        related_name="purchase_invoices",
        verbose_name=_("Staff"),
        limit_choices_to={"is_staff": True},
        help_text=_("Person who purchased"),
    )
    # payments method
    supplier = models.ForeignKey(
        "inventory.Supplier",
        models.PROTECT,
        related_name="purchased",
        verbose_name=_("Supplier"),
        null=True,
        blank=True,
    )

    # Property
    @cached_property
    def jalali_issue_date(self):
        return JalaliDate(self.issue_date).strftime("%c", locale="fa")

    @cached_property
    def total_cost(self):
        result = self.items.aggregate(
            total=models.Sum(models.F("purchased_unit_price") * models.F("quantity"))
        )
        return result["total"]

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

    def save(self, *args, **kwargs):
        """For control all ways"""
        self.full_clean()
        super().save(*args, **kwargs)

    # Meta
    class Meta:
        verbose_name = _("Purchase Invoice")
        verbose_name_plural = _("Purchase Invoices")
        ordering = ("-issue_date",)

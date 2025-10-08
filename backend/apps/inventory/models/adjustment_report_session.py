from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone
from django.utils.functional import cached_property
from django.utils.translation import gettext_lazy as _
from persiantools.jdatetime import JalaliDate


class AdjustmentReportSession(models.Model):
    """
    Parent of an adjustment session.
    """

    # Fields

    report_date = models.DateField(_("Report Date"), default=timezone.now)
    staff = models.ForeignKey(
        get_user_model(), models.SET_NULL, verbose_name=_("Staff"), null=True
    )

    # Property
    @cached_property
    def jalali_report_date(self):
        return JalaliDate(self.report_date).strftime("%c", locale="fa")

    # Method
    def __str__(self) -> str:
        return f"{self.report_date}"

    # Meta
    class Meta:
        verbose_name = _("Adjustment report session")
        verbose_name_plural = _("Adjustment report sessions")
        ordering = ("-report_date",)

from apps.utils.models import TimeStampedModel
from django.db import models
from django.utils.translation import gettext_lazy as _


class Profile(TimeStampedModel):
    """
    Extra info about user.
    """

    class Meta:
        verbose_name = _("Profile")
        verbose_name_plural = _("Profiles")

    SEX_CHOICES = ((True, _("Male")), (False, _("Female")))

    user = models.OneToOneField(
        "user.Account",
        verbose_name=_("User"),
        on_delete=models.CASCADE,
        related_name="profile",
    )
    email = models.EmailField(
        verbose_name=_("Email"), blank=True, null=True, unique=True
    )
    is_email_verified = models.BooleanField(
        verbose_name=_("Is Email Verified?"), default=False
    )
    address = models.CharField(
        verbose_name=_("Address"), max_length=120, blank=True, null=True
    )
    birth_date = models.DateField(
        verbose_name=_("Birth Day"), blank=True, null=True, db_index=True
    )
    sex = models.BooleanField(
        verbose_name=_("Sex"),
        choices=SEX_CHOICES,
        default=True,
    )

    def __str__(self):
        return f"{self.user.name}: ({self.user.mobile})"

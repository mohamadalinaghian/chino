from django_code.apps.utils.upload_path import image_path
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

# Create your models here.


class TimeStampedModel(models.Model):
    """
    Base model for set update and create date.
    """

    created_at = models.DateTimeField(
        verbose_name=_("Create Date"), default=timezone.now
    )
    updated_at = models.DateTimeField(verbose_name=_("Update Date"), auto_now=True)

    class Meta:
        abstract = True


class Image(models.Model):
    """
    Manage images.
    """

    title = models.CharField(verbose_name=_("Title"), max_length=50, unique=True)
    alt_text = models.CharField(verbose_name=_("Alt Text"), max_length=50, blank=True)
    image = models.ImageField(verbose_name=_("Image"), upload_to=image_path)
    created_at = models.DateTimeField(
        verbose_name=_("Create Date"), default=timezone.now, editable=False
    )

    class Meta:
        verbose_name = _("Image")
        verbose_name_plural = _("Images")

    def __str__(self):
        return str(self.title)

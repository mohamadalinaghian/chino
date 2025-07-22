from apps.utils.upload_path import image_path
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from io import BytesIO
from PIL import Image as PILImage, UnidentifiedImageError
from django.core.files.base import ContentFile
import os


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(
        verbose_name=_("Create Date"), default=timezone.now
    )
    updated_at = models.DateTimeField(verbose_name=_("Update Date"), auto_now=True)

    class Meta:
        abstract = True


class Image(models.Model):
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

    def save(self, *args, **kwargs):
        is_new = self._state.adding and self.image
        super().save(*args, **kwargs)
        if is_new and self.image:
            try:
                self.image.open()
                self.image.seek(0)
                img = PILImage.open(self.image).convert("RGB")
                img.thumbnail((1200, 1200), PILImage.LANCZOS)
                buffer = BytesIO()
                img.save(buffer, format="WEBP", optimize=True, quality=85)
                buffer.seek(0)
                name_root, _ = os.path.splitext(self.image.name or "image")
                new_name = f"{name_root}.webp"
                self.image.save(new_name, ContentFile(buffer.read()), save=False)
                super().save(update_fields=["image"])
            except (UnidentifiedImageError, AttributeError, ValueError):
                pass

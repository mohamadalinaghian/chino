from django.db import models
from django.utils.translation import gettext_lazy as _
from ordered_model.models import OrderedModel
from slugify import slugify
from io import BytesIO
from PIL import Image as PILImage, UnidentifiedImageError
from django.core.files.base import ContentFile
from apps.utils.upload_path import menu_thumbnail_path


class MenuCategory(OrderedModel):
    title = models.CharField(
        verbose_name=_("Title"), max_length=50, unique=True, db_index=True
    )
    slug = models.SlugField(
        max_length=50, unique=True, verbose_name=_("Slug"), allow_unicode=True
    )

    def save(self, *args, **kwargs):
        new_slug = slugify(self.title, separator="-", allow_unicode=True)
        if self.slug != new_slug:
            self.slug = new_slug
        super().save(*args, **kwargs)

    class Meta(OrderedModel.Meta):
        verbose_name = _("Menu Category")
        verbose_name_plural = _("Menu Categories")
        ordering = ("order",)

    def __str__(self):
        return str(self.title)


class Menu(OrderedModel):
    title = models.CharField(
        verbose_name=_("Title"), max_length=50, unique=True, db_index=True
    )
    price = models.IntegerField(verbose_name=_("Price"), null=True, blank=True)
    description = models.CharField(
        verbose_name=_("Description"), blank=True, null=True, max_length=255
    )
    slug = models.SlugField(
        verbose_name=_("Slug"), max_length=50, unique=True, allow_unicode=True
    )
    category = models.ForeignKey(
        MenuCategory,
        on_delete=models.DO_NOTHING,
        related_name="menus",
        verbose_name=_("Category"),
    )
    thumbnail = models.ImageField(
        upload_to=menu_thumbnail_path,
        verbose_name=_("Thumbnail"),
        blank=True,
        null=True,
    )
    images = models.ManyToManyField(
        "utils.Image",
        blank=True,
        verbose_name=_("Extra Images"),
        related_name="menu_items",
    )
    is_available = models.BooleanField(verbose_name=_("Is Available"), default=True)

    order_with_respect_to = "category"

    def save(self, *args, **kwargs):
        if not self.slug or self.slug != slugify(
            str(self.title), separator="-", allow_unicode=True
        ):
            self.slug = slugify(str(self.title), separator="-", allow_unicode=True)

        initial_thumbnail = self.thumbnail

        super().save(*args, **kwargs)

        if initial_thumbnail and hasattr(initial_thumbnail, "file"):
            try:
                initial_thumbnail.file.seek(0)
                img = PILImage.open(initial_thumbnail.file).convert("RGB")
                img.thumbnail((100, 100), PILImage.LANCZOS)

                buffer = BytesIO()
                img.save(buffer, format="WEBP", optimize=True, quality=75)
                buffer.seek(0)

                path = menu_thumbnail_path(self, "")
                self.thumbnail.save(path, ContentFile(buffer.read()), save=False)
                super().save(update_fields=["thumbnail"])
            except (UnidentifiedImageError, AttributeError, ValueError):
                pass

    class Meta(OrderedModel.Meta):
        verbose_name = _("Menu")
        verbose_name_plural = _("Menus")
        ordering = ("order",)

    def __str__(self):
        return str(self.title)

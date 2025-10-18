from io import BytesIO

from django.core.files.base import ContentFile
from django.db import models
from django.utils.functional import cached_property
from django.utils.translation import gettext_lazy as _
from ordered_model.models import OrderedModel
from PIL import Image as PILImage
from PIL import UnidentifiedImageError
from slugify import slugify

from ...inventory.models import Product
from ...utils.upload_path import menu_thumbnail_path
from ..services import MenuItemService


class Menu(OrderedModel):
    name = models.ForeignKey(
        "inventory.Product",
        models.CASCADE,
        verbose_name=_("Name"),
        null=True,
        limit_choices_to={"type__in": (Product.ProductType.SELLABLE,)},
    )
    price = models.IntegerField(verbose_name=_("Price"), null=True, blank=True)

    description = models.CharField(
        verbose_name=_("Description"), blank=True, null=True, max_length=255
    )
    slug = models.SlugField(
        verbose_name=_("Slug"), max_length=50, unique=True, allow_unicode=True
    )
    category = models.ForeignKey(
        "menu.MenuCategory",
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

    @cached_property
    def suggested_price(self) -> int | None:
        """
        Always-up-to-date computed price. No DB storage.
        Returns int or None if inputs are incomplete.
        """
        if not self.name_id:
            return None
        try:
            return MenuItemService.suggested_price(self.name)
        except Exception:
            return None

    def save(self, *args, **kwargs):
        """
        Save with:
          - stable slug based on product name
          - preserve existing thumbnail post-processing
        """
        if self.name_id:
            wanted_slug = slugify(
                str(self.name.name), separator="-", allow_unicode=True
            )
            if not self.slug or self.slug != wanted_slug:
                self.slug = wanted_slug

        initial_thumbnail = self.thumbnail
        super().save(*args, **kwargs)

        # thumbnail post-processing (unchanged)
        if initial_thumbnail and hasattr(initial_thumbnail, "file"):
            try:
                initial_thumbnail.file.seek(0)
                img = PILImage.open(initial_thumbnail.file).convert("RGB")
                img.thumbnail((200, 200), PILImage.LANCZOS)

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
        return str(self.name)

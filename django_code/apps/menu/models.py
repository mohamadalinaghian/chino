from django.db import models
from django.utils import timezone
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _
from ordered_model.models import OrderedModel


def upload_menu_thumbnail(instance, filename):
    return f"menu/thumbnails/{instance.slug}/{filename}"


class MenuCategory(OrderedModel):
    title = models.CharField(
        verbose_name=_("Title"), max_length=50, unique=True, db_index=True
    )
    slug = models.SlugField(max_length=50, unique=True, verbose_name=_("Slug"))

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)

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

    slug = models.SlugField(verbose_name=_("Slug"), max_length=50, unique=True)
    category = models.ForeignKey(
        MenuCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="menus",
        verbose_name=_("Category"),
    )

    thumbnail = models.ImageField(
        upload_to=upload_menu_thumbnail,
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
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    class Meta(OrderedModel.Meta):
        verbose_name = _("Menu")
        verbose_name_plural = _("Menus")
        ordering = ("order",)

    def __str__(self):
        return str(self.title)

from django.db import models
from django.utils.translation import gettext_lazy as _
from ordered_model.models import OrderedModel
from slugify import slugify


class MenuCategory(OrderedModel):
    title = models.CharField(
        verbose_name=_("Title"), max_length=50, unique=True, db_index=True
    )
    slug = models.SlugField(
        max_length=50, unique=True, verbose_name=_("Slug"), allow_unicode=True
    )
    description = models.CharField(
        verbose_name=_("Description"), max_length=200, null=True, blank=True
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

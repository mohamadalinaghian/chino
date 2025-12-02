"""
Role Management Models

This module implements role-based access control (RBAC) using Django's Group system
with additional metadata.

Architecture:
    Django Group (built-in) = Role
    RoleCategory (custom) = Grouping for roles (admin-defined)
    RoleMetadata (custom) = Additional info for roles

Design Principles:
    - Single Responsibility: Each model has one clear purpose
    - Open/Closed: Easy to add new roles without code changes
    - Dependency Inversion: Uses Django's Group abstraction

"""

from apps.utils.models import TimeStampedModel
from django.contrib.auth.models import Group
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.translation import gettext_lazy as _
from ordered_model.models import OrderedModel


class RoleCategory(TimeStampedModel, OrderedModel):
    """
    Admin-defined categories for organizing roles.

    Examples: Sale Operations, Kitchen Operations, Management

    """

    name = models.CharField(
        _("Category Name"),
        max_length=50,
        unique=True,
        help_text=_("Name of the role category (e.g., 'Sale Operations')"),
    )

    description = models.TextField(
        _("Description"),
        blank=True,
        help_text=_("What types of roles belong to this category?"),
    )

    is_active = models.BooleanField(_("Is Active"), default=True)

    class Meta(OrderedModel.Meta):
        verbose_name = _("Role Category")
        verbose_name_plural = _("Role Categories")
        ordering = ["order"]

    def __str__(self):
        return self.name


class RoleMetadata(TimeStampedModel):
    """
    Additional metadata for Django Groups (roles).

    Extends Django's Group with custom fields.
    """

    group = models.OneToOneField(
        Group,
        on_delete=models.CASCADE,
        related_name="metadata",
        verbose_name=_("Group/Role"),
    )

    category = models.ForeignKey(
        RoleCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="roles",
        verbose_name=_("Category"),
    )

    description = models.CharField(
        _("Description"),
        blank=True,
        help_text=_("What does this role do?"),
        max_length=512,
    )

    is_active = models.BooleanField(_("Is Active"), default=True)

    class Meta:
        verbose_name = _("Role Metadata")
        verbose_name_plural = _("Role Metadata")
        ordering = ["group__name"]

    def __str__(self):
        return f"{self.group.name} ({self.category or 'No category'})"


@receiver(post_save, sender=Group)
def create_role_metadata(sender, instance, created, **kwargs):
    """Auto-create metadata when Group is created."""
    if created:
        RoleMetadata.objects.get_or_create(group=instance)

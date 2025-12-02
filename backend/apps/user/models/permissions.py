"""
User Management Permissions

This module defines custom permissions for user/staff management operations.

These permissions belong in the user app because user management
views and logic are in this app.

"""

from django.db import models
from django.utils.translation import gettext_lazy as _


class UserManagementPermissions(models.Model):
    """
    Container for user and staff management permissions.

    This is NOT a real model - no database table created.
    It exists only to hold custom permissions.

    """

    class Meta:
        managed = False  # Don't create database table
        default_permissions = ()  # Don't auto-create permissions

        permissions = [
            # Staff management
            ("view_staff_list", _("Can view list of staff members")),
            ("manage_staff", _("Can add/edit/remove staff members")),
            ("assign_roles", _("Can assign roles to staff members")),
            ("revoke_roles", _("Can revoke roles from staff members")),
            # Device management
            ("view_devices", _("Can view authorized devices")),
            ("manage_devices", _("Can add/edit/remove authorized devices")),
            ("view_sessions", _("Can view active sessions")),
            ("terminate_sessions", _("Can terminate user sessions")),
            # Role/Permission management
            ("view_roles", _("Can view role definitions")),
            ("manage_roles", _("Can create/edit role metadata")),
            ("manage_categories", _("Can create/edit role categories")),
            # User data
            ("view_user_details", _("Can view detailed user information")),
            ("export_user_data", _("Can export user data")),
        ]

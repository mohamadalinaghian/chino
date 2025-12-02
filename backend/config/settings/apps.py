from .base import DEBUG

INSTALLED_APPS = [
    "nested_admin",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "django_filters",
    "jalali_date",
    "apps.menu",
    "apps.user",
    "ordered_model",
    "apps.utils",
    "apps.inventory",
    "apps.sale",
    "apps.core_setting",
]

if DEBUG:
    INSTALLED_APPS += ["django_extensions"]

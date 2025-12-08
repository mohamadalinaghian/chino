import datetime
import locale
import re
import sys
from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env(DEBUG=(bool, False))
environ.Env.read_env()

SECRET_KEY = env("DJANGO_SECRET_KEY", default="unsecure")
DEBUG = env("DJANGO_DEBUG", default=False, cast=bool)
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=["127.0.0.1"])
AUTH_USER_MODEL = env("DJANGO_AUTH_USER_MODEL", default="user.Account")

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
USE_THOUSAND_SEPARATOR = True
DECIMAL_SEPARATOR = "."
THOUSAND_SEPARATOR = "/"

# CORS Configuration
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

JWT_SECRET = SECRET_KEY
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TTL = datetime.timedelta(minutes=10)
JWT_REFRESH_TTL = datetime.timedelta(hours=7)
JWT_REQUIRE_SECURE = not DEBUG  # only in production

# Authentication Backends
# -----------------------
# Order matters: Django tries each backend in sequence until one succeeds

AUTHENTICATION_BACKENDS = [
    # Custom backend for mobile number authentication
    "apps.user.backends.MobileBackend",
    # Django's default backend (fallback for admin panel)
    "django.contrib.auth.backends.ModelBackend",
]

try:
    locale.setlocale(
        locale.LC_ALL,
        "Persian_Iran.UTF-8" if sys.platform.startswith("win32") else "fa_IR.UTF-8",
    )
except locale.Error:
    locale.setlocale(locale.LC_ALL, "C")

if DEBUG:
    assert SECRET_KEY == "unsecure"
    assert env("ENVIRONMENT") != "production"
else:
    assert re.search(r"[A-Z]", SECRET_KEY)
    assert re.search(r"[0-9]", SECRET_KEY)
    assert len(SECRET_KEY) >= 50


# Business Logics
PURCHASE_VALID_CHANGE_RATIO = env("PURCHASE_VALID_CHANGE_RATIO", default="0.10")
SALE_PROFIT_PRECENTAGE = env("SALE_PROFIT_PRECENTAGE", default=50)

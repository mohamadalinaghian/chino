import locale
import re
import sys
from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(DEBUG=(bool, False))
environ.Env.read_env()

SECRET_KEY = env("DJANGO_SECRET_KEY", default="unsecure")  # pyright: ignore[reportArgumentType]
DEBUG = env("DJANGO_DEBUG", default=False, cast=bool)  # pyright: ignore[reportArgumentType]
ALLOWED_HOSTS = env("DJANGO_ALLOWED_HOSTS", default=("127.0.0.1",), cast=list)  # pyright: ignore[reportArgumentType]
AUTH_USER_MODEL = env("DJANGO_AUTH_USER_MODEL", default=("user.Account"))  # pyright: ignore[reportArgumentType]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "jalali_date",
    "apps.menu",
    "apps.user",
    "ordered_model",
    "apps.utils",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {"default": env.db()}

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "fa-ir"
LANGUAGES = {("fa", "فارسی"), ("en", "انگلیسی")}
TIME_ZONE = "Asia/Tehran"
USE_I18N = True
USE_TZ = True

JALALI_DATE_DEFAULTS = {
    "LIST_DISPLAY_AUTO_CONVERT": True,
    "Strftime": {
        "date": "%Y/%m/%d",
        "datetime": "%H:%M:%S _ %Y/%m/%d",
    },
    "Static": {
        "js": ["admin/js/django_jalali.min.js"],
        "css": {"all": ["admin/css/django_jalali.min.css"]},
    },
}

try:
    locale.setlocale(
        locale.LC_ALL,
        "Persian_Iran.UTF-8" if sys.platform.startswith("win32") else "fa_IR.UTF-8",
    )
except locale.Error:
    locale.setlocale(locale.LC_ALL, "C")

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

LOCALE_PATHS = [BASE_DIR / "locale"]

if DEBUG:
    assert SECRET_KEY == "unsecure"
    assert env("ENVIROMENT") != "production"
else:
    assert re.search(r"[A-Z]", SECRET_KEY)
    assert re.search(r"[0-9]", SECRET_KEY)
    assert len(SECRET_KEY) >= 50

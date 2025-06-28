import locale
import re
import sys
from pathlib import Path

import environ

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DEBUG=(bool, False),
)
environ.Env.read_env()

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = env("DJANGO_SECRET_KEY", default="unsecure")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = env("DJANGO_DEBUG", default=False, cast=bool)

ALLOWED_HOSTS = env("DJANGO_ALLOWED_HOSTS", default=("127.0.0.1",), cast=list)

AUTH_USER_MODEL = env("DJANGO_AUTH_USER_MODEL", default=("user.Account"))

# Application definition

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


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {"default": env.db()}

# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = "fa-ir"

LANGUAGES = {
    ("fa", "فارسی"),
    ("en", "انگلیسی"),
}
TIME_ZONE = "Asia/Tehran"

USE_I18N = True

USE_TZ = True

###################################################################################
JALALI_DATE_DEFAULTS = {
    "LIST_DISPLAY_AUTO_CONVERT": True,
    "Strftime": {
        "date": "%Y/%m/%d",
        "datetime": "%H:%M:%S _ %Y/%m/%d",
    },
    "Static": {
        "js": [
            "admin/js/django_jalali.min.js",
        ],
        "css": {
            "all": [
                "admin/css/django_jalali.min.css",
            ]
        },
    },
}
try:
    if sys.platform.startswith("win32"):
        locale.setlocale(locale.LC_ALL, "Persian_Iran.UTF-8")
    else:
        locale.setlocale(locale.LC_ALL, "fa_IR.UTF-8")
except locale.Error:
    locale.setlocale(locale.LC_ALL, "C")
###############################################################################


STATIC_URL = "/static/"
LOCALE_PATHS = [BASE_DIR / "locale"]

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"


if DEBUG:
    assert SECRET_KEY == "unsecure"
    assert env("ENVIROMENT") != "production"
else:
    assert re.search(
        r"[A-Z]", SECRET_KEY
    ), "❌ SECRET_KEY باید حداقل یک حرف بزرگ داشته باشد."
    assert re.search(
        r"[0-9]", SECRET_KEY
    ), "❌ SECRET_KEY باید حداقل یک عدد داشته باشد."
    assert len(SECRET_KEY) >= 50, "❌ SECRET_KEY باید حداقل 50 کاراکتر باشد."

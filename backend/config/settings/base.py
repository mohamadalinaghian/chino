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
ALLOWED_HOSTS = env("DJANGO_ALLOWED_HOSTS", default=("127.0.0.1",), cast=list)
AUTH_USER_MODEL = env("DJANGO_AUTH_USER_MODEL", default=("user.Account"))

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


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

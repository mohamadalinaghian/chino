from .base import *  # noqa: F403
from .base import BASE_DIR

# -------------------------
# GENERAL
# -------------------------
DEBUG = False
SECRET_KEY = "ci-secret-key"  # در CI اهمیتی نداره

ALLOWED_HOSTS = ["*"]

# -------------------------
# DATABASES
# -------------------------
# 1) برای سرعت و سادگی → sqlite
# 2) برای نزدیکی به prod → postgres (از سرویس‌های CI)
# اینجا گزینه سبک (sqlite) رو میذارم:
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",  # کل دیتابیس داخل RAM
    }
}

# -------------------------
# PASSWORD HASHER
# -------------------------
# سریع‌ترین هش → مناسب تست
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

# -------------------------
# EMAIL BACKEND
# -------------------------
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# -------------------------
# CACHES
# -------------------------
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "ci-cache",
    }
}

# -------------------------
# FIXTURE DIRS
# -------------------------
# تا بتونی راحت fixtureهای json رو لود کنی
FIXTURE_DIRS = [
    BASE_DIR / "fixtures",
]

# -------------------------
# LOGGING (اختیاری)
# -------------------------
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {"class": "logging.StreamHandler"},
    },
    "root": {
        "handlers": ["console"],
        "level": "WARNING",
    },
}

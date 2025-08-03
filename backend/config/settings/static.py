from .base import BASE_DIR, env

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]

MEDIA_URL = env("DJANGO_MEDIA_URL", default="/media/")
MEDIA_ROOT = BASE_DIR / "media"

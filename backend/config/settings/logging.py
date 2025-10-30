from pathlib import Path

from .base import DEBUG

LOG_DIR = Path("/app/logs")  # ← MATCH MOUNT

# Ensure directory exists (safe)
LOG_DIR.mkdir(parents=True, exist_ok=True)

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
            "format": "%(asctime)s %(levelname)s %(name)s %(module)s %(lineno)d %(message)s %(exc_info)s",
        },
        "simple": {"format": "%(levelname)s %(asctime)s %(name)s %(message)s"},
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "json" if not DEBUG else "simple",
        },
        "error_file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": LOG_DIR / "django_errors.log",
            "maxBytes": 5_242_880,
            "backupCount": 10,
            "formatter": "json",
            "level": "ERROR",
        },
    },
    "loggers": {
        "django.request": {
            "level": "ERROR",
            "handlers": ["console", "error_file"],
            "propagate": False,
        },
        "django.server": {
            "level": "ERROR",
            "handlers": ["console", "error_file"],
            "propagate": False,
        },
    },
    "root": {
        "level": "WARNING",
        "handlers": ["console", "error_file"],
    },
}

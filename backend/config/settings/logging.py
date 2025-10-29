import os

from .base import BASE_DIR, DEBUG

LOG_DIR = BASE_DIR / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)
os.chmod(LOG_DIR, 0o777)  # Force writable


def safe_handler(filename, level="INFO", max_bytes=10_485_760, backup_count=7):
    path = LOG_DIR / filename
    try:
        open(path, "a").close()
        return {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": str(path),
            "maxBytes": max_bytes,
            "backupCount": backup_count,
            "formatter": "json",
            "encoding": "utf-8",
            "level": level,
        }
    except:  # noqa: E722
        return None


LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
            "format": "%(asctime)s %(levelname)s %(name)s %(module)s %(lineno)d %(message)s %(exc_info)s",
        },
        "verbose": {"format": "[{levelname}] {asctime} | {name} | {message}"},
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "json" if not DEBUG else "verbose",
        },
    },
    "loggers": {
        "django": {"level": "ERROR", "handlers": ["console"], "propagate": False},
        "django.request": {
            "level": "ERROR",
            "handlers": ["console"],
            "propagate": False,
        },
    },
    "root": {"level": "INFO", "handlers": ["console"]},
}

# Add file handlers safely
for name, args in [
    ("app_file", ("app.log", "INFO")),
    ("error_file", ("errors.log", "ERROR", 5_242_880, 10)),
    ("django_500", ("django_500.log", "ERROR", 5_242_880, 10)),
]:
    h = safe_handler(*args)
    if h:
        LOGGING["handlers"][name] = h
        for logger in ["django", "django.request", "root"]:
            LOGGING["loggers"].setdefault(logger, {})["handlers"] = LOGGING["loggers"][
                logger
            ].get("handlers", []) + [name]

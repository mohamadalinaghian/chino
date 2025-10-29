import sys

from .base import BASE_DIR, DEBUG

# ------------------------------------------------------------------
# LOG DIRECTORY (already created in Dockerfile + host mount)
# ------------------------------------------------------------------
LOG_DIR = BASE_DIR / "logs"

# ------------------------------------------------------------------
# LOGGING CONFIGURATION
# ------------------------------------------------------------------
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    # ====================== FORMATTERS ======================
    "formatters": {
        "json": {
            "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
            "format": "%(asctime)s %(levelname)s %(name)s %(module)s %(funcName)s %(lineno)d %(message)s %(pathname)s %(process)d %(thread)d %(exc_info)s",
            "datefmt": "%Y-%m-%dT%H:%M:%S%z",
        },
        "verbose": {
            "format": "[{levelname}] {asctime} | {name}.{funcName}:{lineno} | {message}",
            "style": "{",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
    },
    # ====================== HANDLERS ======================
    "handlers": {
        # 1. Console → Docker logs (json in prod, readable in dev)
        "console": {
            "class": "logging.StreamHandler",
            "stream": sys.stdout,
            "formatter": "json" if not DEBUG else "verbose",
            "level": "INFO" if DEBUG else "WARNING",
        },
        # 2. All app logs (INFO+) → app.log
        "app_file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": LOG_DIR / "app.log",
            "maxBytes": 10_485_760,  # 10MB
            "backupCount": 7,
            "formatter": "json",
            "encoding": "utf-8",
            "level": "INFO",
        },
        # 3. **ERRORS ONLY** → errors.log (this is your 500 catcher)
        "error_file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": LOG_DIR / "errors.log",
            "maxBytes": 5_242_880,  # 5MB
            "backupCount": 10,
            "formatter": "json",
            "encoding": "utf-8",
            "level": "ERROR",
        },
        # 4. Django server errors (500s) → force to error_file
        "django_server": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": LOG_DIR / "django_500.log",
            "maxBytes": 5_242_880,
            "backupCount": 10,
            "formatter": "json",
            "encoding": "utf-8",
            "level": "ERROR",
        },
    },
    # ====================== LOGGERS ======================
    "loggers": {
        # --- Your apps: log INFO+ to app.log, ERROR+ to errors.log ---
        "apps": {
            "level": "INFO" if DEBUG else "WARNING",
            "handlers": ["console", "app_file", "error_file"],
            "propagate": False,
        },
        # --- Django core: catch 500, DB, template errors ---
        "django": {
            "level": "WARNING",
            "handlers": ["console", "error_file", "django_server"],
            "propagate": False,
        },
        # --- Django request: 500 errors from views ---
        "django.request": {
            "level": "ERROR",
            "handlers": ["console", "error_file", "django_server"],
            "propagate": False,
        },
        # --- Django DB: query errors, timeouts ---
        "django.db.backends": {
            "level": "ERROR",
            "handlers": ["error_file", "django_server"],
            "propagate": False,
        },
        # --- Gunicorn: worker crashes, timeouts ---
        "gunicorn.error": {
            "level": "ERROR",
            "handlers": ["console", "error_file"],
            "propagate": False,
        },
        "gunicorn.access": {
            "level": "INFO",
            "handlers": ["console"],
            "propagate": False,
        },
    },
    # ====================== ROOT ======================
    "root": {
        "level": "WARNING",
        "handlers": ["console", "app_file", "error_file"],
    },
}

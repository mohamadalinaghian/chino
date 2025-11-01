import json
import logging
from pathlib import Path

LOG_DIR = Path("/app/logs")
LOG_DIR.mkdir(parents=True, exist_ok=True)

# Ensure files exist
(LOG_DIR / "django_500.txt").touch(exist_ok=True)


class PrettyJsonFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            "time": self.formatTime(record, "%Y-%m-%d %H:%M:%S"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            log_data["error"] = self.formatException(record.exc_info)
        if hasattr(record, "request"):
            log_data["request"] = record.request
        return json.dumps(log_data, ensure_ascii=False, indent=2)


class CleanTextFormatter(logging.Formatter):
    def format(self, record):
        lines = [
            f"[{record.levelname}] {self.formatTime(
                record, '%Y-%m-%d %H:%M:%S')}",
            f"Logger: {record.name}",
            f"Message: {record.getMessage()}",
        ]
        if record.exc_info:
            lines.append("Traceback:")
            lines.extend(self.formatException(record.exc_info).split("\n"))
        if hasattr(record, "request"):
            lines.append(f"Request: {record.request}")
        return "\n".join(lines) + "\n" + ("─" * 50)


LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "pretty_json": {"()": PrettyJsonFormatter},
        "clean_text": {"()": CleanTextFormatter},
        "console": {"format": "%(levelname)s %(message)s"},
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "console",
        },
        "text_file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": LOG_DIR / "django_500.txt",
            "maxBytes": 5_000_000,
            "backupCount": 5,
            "formatter": "clean_text",
            "level": "ERROR",
        },
    },
    "loggers": {
        "django.request": {
            "level": "ERROR",
            "handlers": ["console", "text_file"],
            "propagate": False,
        },
    },
    "root": {
        "level": "WARNING",
        "handlers": ["console", "text_file"],
    },
}

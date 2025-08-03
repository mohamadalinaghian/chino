from .base import BASE_DIR

LANGUAGE_CODE = "fa-ir"
LANGUAGES = {("fa", "فارسی"), ("en", "انگلیسی")}
TIME_ZONE = "Asia/Tehran"
USE_I18N = True
USE_TZ = True
USE_L10N = True

LOCALE_PATHS = [BASE_DIR / "locale"]

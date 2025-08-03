from .base import DEBUG, env

CSRF_COOKIE_SECURE = env("DJANGO_CSRF_COOKIE_SECURE", default=not DEBUG)
SESSION_COOKIE_SECURE = env("DJANGO_SESSION_COOKIE_SECURE", default=not DEBUG)
SECURE_SSL_REDIRECT = env("DJANGO_SECURE_SSL_REDIRECT", default=not DEBUG)
SECURE_PROXY_SSL_HEADER = env(
    "DJANGO_SECURE_PROXY_SSL_HEADER",
    default=("HTTP_X_FORWARDED_PROTO", "https"),
    cast=tuple,
)

CORS_ALLOWED_ORIGINS = [
    "https://chinocafe.ir",
    "https://www.chinocafe.ir",
]

# -----------------------------
# Stage 1: Build wheels
# -----------------------------
FROM mohamadalinaghian/dj-base AS base

COPY ./requirements.txt .

RUN /venv/bin/pip install -r requirements.txt

# -----------------------------
# Stage 2: Runtime on same slim
# -----------------------------
FROM python:3.13-slim AS runtime

# ۱. ساخت کاربر سیستم با UID مشخص
RUN useradd --system --uid 1000 --no-create-home --shell /usr/sbin/nologin python &&\
    apt-get update && apt-get upgrade -y --no-install-recommends &&\
    apt-get install gettext -y --no-install-recommends &&\
    apt-get clean && rm -rf /var/lib/apt/lists/*

ENV PYTHONUNBUFFERED=1 \
    PYTHONPATH="/app" \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/venv/bin:$PATH"

# ۲. کپی venv و تنظیم مالکیت به کاربر python
COPY --from=base --chown=python:python /venv /venv

# ۳. تنظیم محل اجرای برنامه
WORKDIR /app

# ۴. کپی کردن پروژه با مالک مناسب
COPY --chown=python:python . /app/

# ۵. ساخت دایرکتوری‌های static/media در زمان build
RUN mkdir -p /app/staticfiles /app/media && \
    chown -R python:python /app/staticfiles /app/media

# ۶. اجرای کانتینر با کاربر python
USER python

EXPOSE 8000

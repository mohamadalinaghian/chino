# -----------------------------
# Base image
# -----------------------------
FROM python:3.12-slim AS base

ENV PYTHONUNBUFFERED=1 \
  PYTHONDONTWRITEBYTECODE=1 \
  PYTHONIOENCODING=utf-8 \
  PATH="/venv/bin:$PATH"

WORKDIR /app

# Dependencies needed for both dev/prod
RUN apt-get update && apt-get install --no-install-recommends -y \
  build-essential \
  libjpeg-dev \
  zlib1g-dev \
  libpng-dev \
  gettext \
  && rm -rf /var/lib/apt/lists/*

# Create venv
RUN python -m venv /venv

COPY requirements /requirements

# -----------------------------
# Install production deps
# -----------------------------
FROM base AS deps-prod
RUN /venv/bin/pip install --upgrade pip setuptools wheel \
  && /venv/bin/pip install -r /requirements/prod.txt

# -----------------------------
# Install dev deps
# -----------------------------
FROM base AS deps-dev
RUN /venv/bin/pip install --upgrade pip setuptools wheel \
  && /venv/bin/pip install -r /requirements/prod.txt

# -----------------------------
# Runtime image (prod)
# -----------------------------
FROM base AS prod

COPY --from=deps-prod /venv /venv
COPY . /app

RUN mkdir -p /app/logs && chmod 777 /app/logs
RUN mkdir -p /app/staticfiles /app/media \
  && chown -R 1000:1000 /app

USER 1000

EXPOSE 8000
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]

# -----------------------------
# Runtime image (dev)
# -----------------------------
FROM base AS dev

COPY --from=deps-dev /venv /venv
COPY . /app

RUN mkdir -p /app/staticfiles /app/media \
  && chown -R 1000:1000 /app

# USER 1000

EXPOSE 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

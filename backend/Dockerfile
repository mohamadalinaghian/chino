# -----------------------------
# Stage 1: Build wheel cache
# -----------------------------
FROM python:3.13-slim AS builder

# Install build tools for any packages that need compilation
RUN apt-get update \
    && apt-get install --no-install-recommends -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

# Create a virtualenv and install dependencies into it
RUN python -m venv /venv \
    && /venv/bin/pip install --upgrade pip setuptools wheel \
    && /venv/bin/pip install -r requirements.txt

# -----------------------------
# Stage 2: Runtime
# -----------------------------
FROM python:3.13-slim AS runtime

# Create a non-root user
RUN useradd --system --uid 1000 --no-create-home --shell /usr/sbin/nologin python \
    && apt-get update \
    && apt-get install --no-install-recommends -y gettext \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH="/app" \
    PATH="/venv/bin:$PATH"

WORKDIR /app

# Copy only the venv from the builder
COPY --from=builder /venv /venv

# Copy application code
COPY --chown=python:python . /app/

# Prepare runtime dirs
RUN mkdir -p /app/staticfiles /app/media \
    && chown -R python:python /app/staticfiles /app/media

USER python

EXPOSE 8000

CMD ["gunicorn", "your_project.wsgi:application", "--bind", "0.0.0.0:8000"]

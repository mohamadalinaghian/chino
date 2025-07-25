# -----------------------------
# Stage 1: Build wheels
# -----------------------------
FROM mohamadalinaghian/django-image:0.1 AS base

WORKDIR /
COPY ./requirements.txt .

RUN /venv/bin/pip install -r requirements.txt

# -----------------------------
# Stage 2: Runtime on same slim
# -----------------------------
FROM python:3.13-slim AS runtime

RUN useradd --system --uid 1000 --no-create-home --shell /usr/sbin/nologin python &&\
    apt-get update && apt-get upgrade -y --no-install-recommends &&\
    apt-get install --no-install-recommends -y gettext  &&\
    apt-get clean && rm -rf /var/lib/apt/lists/*

ENV PYTHONUNBUFFERED=1 \
    PYTHONPATH="/app" \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/venv/bin:$PATH"

COPY --from=base --chown=python:python /venv /venv

WORKDIR /app

COPY --chown=python:python . /app/

RUN mkdir -p /app/staticfiles /app/media && \
    chown -R python:python /app/staticfiles /app/media

USER python

EXPOSE 8000

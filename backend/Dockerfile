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

RUN  useradd --system --uid 1000 --no-create-home --shell /usr/sbin/nologin python

ENV PYTHONUNBUFFERED=1 \
    PYTHONPATH="/app" \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/venv/bin:$PATH"



COPY --from=base --chown=python:python /venv /venv

WORKDIR /app
COPY --chown=python:python ./django_code /app

USER python

EXPOSE 8000


SHELL := /bin/bash
include .env.make
DOCKER := docker compose -f compose.$(ENV).yml
PODMAN := podman-compose -f compose.$(ENV).yml

update:
	git pull && make full_down && make up

build:
	$(DOCKER) build

up:
	$(DOCKER) up -d

up_back:
	$(DOCKER) up -d backend

pup_back:
	$(PODMAN) up -d backend

front_bash:
	$(DOCKER) exec frontend bash

reset:
	$(DOCKER) restart
preset:
	$(PODMAN) restart

down:
	$(DOCKER) down
pdown:
	$(PODMAN) down

full_down:
	$(DOCKER) down --rmi local

back_bash:
	$(DOCKER) exec backend bash

pback_bash:
	$(PODMAN) exec backend bash

shell:
	$(DOCKER) exec backend python manage.py shell

dbshell:
	$(DOCKER) exec db sh

log:
	$(DOCKER) logs
plogs:
	$(PODMAN) logs

test_backend:
	$(DOCKER) exec backend pytest

lint_backend:
	$(DOCKER) exec backend ruff check .

format_backend:
	$(DOCKER) exec backend ruff format .

git_reset:
	git pull && make reset



BACKUP_DIR ?= ~/backup

.PHONY: backup backup_rotate backup_restore_notes

# Internal guard: fail if not prod
_guard_prod:
	@if [[ "$(ENV)" != "prod" ]]; then \
		echo "✖ backup allowed only when ENV=prod (current: $(ENV))"; \
		exit 1; \
	fi

backup: _guard_prod
	@set -euo pipefail; \
	DATE="$$(date +%Y%m%d_%H%M%S)"; \
	DEST="$(BACKUP_DIR)/$$DATE"; \
	mkdir -p "$$DEST"; \
	echo "==> [$$DATE] starting backup into $$DEST"; \
	\
	echo "==> dumping GLOBALS (roles/grants)"; \
	$(DOCKER) exec db sh -lc 'PGPASSWORD="$$POSTGRES_PASSWORD" pg_dumpall --globals-only -U "$$POSTGRES_USER"' \
		> "$$DEST/globals.sql"; \
	\
	echo "==> dumping DB (custom format, compressed)"; \
	$(DOCKER) exec db sh -lc 'PGPASSWORD="$$POSTGRES_PASSWORD" pg_dump -U "$$POSTGRES_USER" -d "$$POSTGRES_DB" -Fc -Z9' \
		> "$$DEST/db.custom.dump"; \
	\
	echo "==> dumping DB (plain SQL)"; \
	$(DOCKER) exec db sh -lc 'PGPASSWORD="$$POSTGRES_PASSWORD" pg_dump -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"' \
		> "$$DEST/db.plain.sql"; \
	\
	echo "==> dumping DB (schema only)"; \
	$(DOCKER) exec db sh -lc 'PGPASSWORD="$$POSTGRES_PASSWORD" pg_dump -U "$$POSTGRES_USER" -d "$$POSTGRES_DB" -s' \
		> "$$DEST/db.schema.sql"; \
	\
	echo "==> archiving media directory from backend"; \
	# if /app/media doesn't exist, skip quietly
	$(DOCKER) exec backend sh -lc 'cd /app && test -d media && tar -czf - media || exit 0' \
		> "$$DEST/media.tgz"; \
	\
	echo "==> checksums"; \
	( cd "$$DEST" && sha256sum * > SHA256SUMS.txt ) || true; \
	\
	echo "==> backup completed: $$DEST"

# Remove backups older than KEEP_DAYS (default 7)
KEEP_DAYS ?= 7
backup_rotate:
	@set -euo pipefail; \
	test -d "$(BACKUP_DIR)" || { echo "no $(BACKUP_DIR) to rotate"; exit 0; }; \
	echo "==> pruning backups older than $(KEEP_DAYS) days in $(BACKUP_DIR)"; \
	find "$(BACKUP_DIR)" -maxdepth 1 -type d -mtime +$(KEEP_DAYS) -print -exec rm -rf {} \; || true; \
	echo "==> rotation done"

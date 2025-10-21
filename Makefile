SHELL := /bin/bash
include .env.make
DOCKER := docker compose -f compose.$(ENV).yml
PODMAN := podman-compose -f compose.$(ENV).yml
BACKUP_DIR ?= ~/backup

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



backup_db:
	@set -eu; \
	BD="$(BACKUP_DIR)"; \
	case "$$BD" in \
	  "~") BD="$$HOME";; \
	  "~/"*) BD="$$HOME/$${BD#\~/}";; \
	esac; \
	mkdir -p "$$BD"; \
	E_NOW="$$(TZ=Asia/Tehran date +%s)"; \
	E_Y="$$(expr $$E_NOW - 86400)"; \
	DATE="$$(TZ=Asia/Tehran jdate -d "%s;$$E_Y" +%d-%b-%Y__%H:%M)"; \
	DEST="$$BD/db_$$DATE.sql.gz"; \
	echo "==> writing $$DEST"; \
	docker compose -f compose.prod.yml exec -T db sh -c 'pg_dump -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"' \
	| gzip -c > "$$DEST"; \
	echo "==> done: $$DEST"

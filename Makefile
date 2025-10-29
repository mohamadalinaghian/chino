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
	DATE="$$(TZ=Asia/Tehran jdate -d "%s;$$E_Y" +%d-%b-%Y)"; \
	DEST="$$BD/db_$$DATE.sql.gz"; \
	echo "==> writing $$DEST"; \
	docker compose -f compose.prod.yml exec -T db sh -c 'pg_dump -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"' \
	| gzip -c > "$$DEST"; \
	echo "==> done: $$DEST"


backup_clean:
	@set -eu; \
	BD="$(BACKUP_DIR)"; \
	case "$$BD" in "~") BD="$$HOME";; "~/"*) BD="$$HOME/$${BD#\~/}";; esac; \
	if [ ! -d "$$BD" ]; then \
		echo "✖ No backup directory found at $$BD"; exit 0; \
	fi; \
	echo "==> Removing backup files older than 7 days in $$BD"; \
	find "$$BD" -type f -name 'db_*.sql.gz' -mtime +7 -print -delete || true; \
	echo "==> Cleanup complete"


# -------------------- Short aliases (Docker = d*, Podman = p*) --------------------
.PHONY: \
  d dup dub ddown dfd dlogs drst dbash dfbash dshell dbsh dtest dlint dfmt dgr dbkup dbclean dbuild dupb \
  p pub pdown pfd plogs prst pbash pfbash pshell pdbsh

# ---- Docker (d*) ----
d: up                         # bring up all services (docker)
dup: up                       # alias (same as d)
dub: up_back                  # bring up backend only (docker)
ddown: down                   # stop all (docker)
dfd: full_down                # full down + remove local images (docker)
dlogs: log                    # docker compose logs
drst: reset                   # docker compose restart
dbs: back_bash              # bash into backend (docker)
dfbash: front_bash            # bash into frontend (docker)
dshell: shell                 # Django manage.py shell (docker)
dds: dbshell                 # shell into db container (docker)
dbuild: build                 # docker compose build
dupb: up_back                 # explicit alias spelling

dtest: test_backend           # pytest (docker)
dlint: lint_backend           # ruff check (docker)
dfmt: format_backend          # ruff format (docker)
dgr: git_reset                # git pull && restart (docker)

dbkup: backup_db              # DB backup (docker)
dbclean: backup_clean         # cleanup backups older than 7d

# ---- Podman (p*) ----
p: pup_back                   # bring up backend only (podman)
pub: pup_back                 # alias spelling
pdown: pdown                  # stop all (podman)
pfd: pdown                    # (no full_down for podman in your file; reuse pdown)
plogs: plogs                  # podman-compose logs
prst: preset                  # podman-compose restart
pbs: pback_bash             # bash into backend (podman)
pfbash:                       # (no podman frontend target defined; left empty on purpose)
pshell:                       # (no podman django shell target; define later if needed)
pdbsh:                        # (no podman db shell target defined; define later if needed)

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

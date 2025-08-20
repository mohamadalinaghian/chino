SHELL := /bin/bash
include .env.make
DOCKER := docker compose -f compose.$(ENV).yml
PODMAN := podman-compose -f compose.$(ENV).yml

update:
	git pull && make full_down && make up

build:
	$(PODMAN) build

up:
	$(PODMAN) up -d

up_back:
	$(PODMAN) up -d backend

front_bash:
	$(PODMAN) exec frontend bash

rest:
	$(PODMAN) restart

down:
	$(PODMAN) down

full_down:
	$(PODMAN) down --rmi local

back_bash:
	$(PODMAN) exec backend bash

shell:
	$(PODMAN) exec backend python manage.py shell

dbshell:
	$(PODMAN) exec db sh

log:
	$(PODMAN) logs

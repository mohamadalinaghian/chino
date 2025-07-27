SHELL := /bin/bash
include .env.make
DOCKER := docker compose -f compose.$(ENV).yml

update:
	git pull && make full_down && make up

build:
	$(DOCKER) build

up:
	$(DOCKER) up -d

n_up:
	$(DOCKER) up -d --build frontend

rest:
	$(DOCKER) restart

down:
	$(DOCKER) down

full_down:
	$(DOCKER) down --rmi local

ex_bak:
	$(DOCKER) exec backend bash

run:
	$(DOCKER) exec backend python manage.py runserver 0.0.0.0:8000

shell:
	$(DOCKER) exec backend python manage.py shell

dbshell:
	$(DOCKER) exec db sh

log:
	$(DOCKER) logs

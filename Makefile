SHELL := /bin/bash
DOCKER := docker compose

build:
	${DOCKER} build 

up:
	${DOCKER} up -d

n_up:
	${DOCKER} up -d --build frontend
rest:
	${DOCKER} restart
	
down:
	${DOCKER} down

full_down:
	${DOCKER} down --rmi local

ex_bak:
	${DOCKER} exec backend bash

run:
	${DOCKER} exec web python manage.py runserver 0.0.0.0:8000

shell:
	${DOCKER} exec web python manage.py shell

dbshell:
	${DOCKER} exec db sh

log:
	${DOCKER} logs

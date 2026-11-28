# Local development only; does not deploy to AWS.
.DEFAULT_GOAL := help
IMAGE ?= calculator-frontend:local
CONTAINER ?= calculator-frontend
PORT ?= 3000
API_URL ?= http://localhost:8000
DOCKER_API_URL ?= http://host.docker.internal:8000

.PHONY: help install dev test lint typecheck build-local check build run up start stop restart logs status health shell clean

help:
	@printf '%s\n' 'make install     Install local dependencies' 'make dev         Run locally without Docker' 'make test        Run automated tests' 'make lint        Run lint checks' 'make typecheck   Check TypeScript types' 'make build-local Build Next.js locally' 'make check       Run quality checks' 'make build       Build Docker image' 'make run         Replace local Docker container' 'make up          Build and replace local container' 'make start       Start existing container' 'make stop        Stop container' 'make restart     Restart container' 'make logs        Follow container logs' 'make status      Show container status' 'make health      Check HTTP endpoint' 'make shell       Enter running container' 'make clean       Remove local container'

install:
	npm install

dev:
	API_INTERNAL_URL="$(API_URL)" npm run dev -- --port "$(PORT)"

test:
	npm test

lint:
	npm run lint

typecheck:
	npm run typecheck

build-local:
	npm run build

check:
	$(MAKE) lint
	$(MAKE) typecheck
	$(MAKE) test
	$(MAKE) build-local

build:
	docker build -t "$(IMAGE)" .

run:
	@docker info >/dev/null
	@if docker container inspect "$(CONTAINER)" >/dev/null 2>&1; then \
	  echo "Replacing existing container $(CONTAINER)"; \
	  docker rm -f "$(CONTAINER)"; \
	fi
	docker run --name "$(CONTAINER)" -p "127.0.0.1:$(PORT):3000" -e "API_INTERNAL_URL=$(DOCKER_API_URL)" "$(IMAGE)"

up:
	$(MAKE) build
	$(MAKE) run

start:
	docker start "$(CONTAINER)"

stop:
	docker stop "$(CONTAINER)"

restart:
	docker restart "$(CONTAINER)"

logs:
	docker logs -f "$(CONTAINER)"

status:
	docker ps -a --filter "name=^/$(CONTAINER)$$"

health:
	curl -fsS "http://localhost:$(PORT)/"

shell:
	docker exec -it "$(CONTAINER)" sh

clean:
	@docker info >/dev/null
	@if docker container inspect "$(CONTAINER)" >/dev/null 2>&1; then docker rm -f "$(CONTAINER)"; fi

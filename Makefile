.PHONY: dev install sync-env sync-env-y deploy setup ssh logs destroy clean db-setup help

# Default target
help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Development:"
	@echo "  dev        Start local development servers"
	@echo "  install    Install all dependencies"
	@echo "  db-setup   Create local PostgreSQL role and database"
	@echo "  clean      Clean build artifacts and caches"
	@echo ""
	@echo "Deployment:"
	@echo "  sync-env   Sync local env vars to DigitalOcean server"
	@echo "  sync-env-y Sync env vars (no confirmation prompt)"
	@echo "  deploy     Deploy code to DigitalOcean"
	@echo "  setup      Initial server setup (after 'make infra')"
	@echo "  ssh        SSH into the server"
	@echo "  logs       View server logs"
	@echo ""
	@echo "Infrastructure:"
	@echo "  infra      Create DigitalOcean droplet (terraform apply)"
	@echo "  destroy    Destroy DigitalOcean droplet"

# Development
dev:
	./scripts/dev.sh

install:
	cd backend && uv sync
	npm install

db-setup:
	psql postgres -c "CREATE ROLE app WITH LOGIN PASSWORD 'changeme';" 2>/dev/null || true
	psql postgres -c "CREATE DATABASE egoudaxyz OWNER app;" 2>/dev/null || true
	@echo "Database ready: postgresql://app:changeme@localhost:5432/egoudaxyz"

clean:
	rm -rf backend/.venv
	rm -rf node_modules
	rm -rf .svelte-kit
	rm -rf build

# Deployment
sync-env:
	@./scripts/sync-env.sh

sync-env-y:
	@./scripts/sync-env.sh -y

deploy:
	./scripts/deploy.sh deploy

setup:
	./scripts/deploy.sh setup

ssh:
	./scripts/deploy.sh ssh

logs:
	./scripts/deploy.sh logs

# Infrastructure
infra:
	./scripts/deploy.sh apply

destroy:
	./scripts/deploy.sh destroy

# Project structure
A monorepo with:
- `backend`: A FastAPI backend with AG-UI compatible chat interface for AI agents (pydantic-ai)
- `src`: SvelteKit frontend (admin dashboard)
- `infra`: Infrastructure as code for Digital Ocean deployment (Terraform + Docker)
- `scripts`: Development and deployment scripts

# Vision
Admin dashboard ("World") for:
- **Monitor Agent**: Background agent that polls Reddit for news, markets, and social trends every 15 minutes
- **Query Agent**: Chat interface to query monitoring reports stored in PostgreSQL
- SSH sessions (future)

This is a personal website so it will be simple and minimalistic and no need to overcomplicate it, plus keep it cheap

# Do
- Minimal boilerplate changes, you are my principal staff pair programmer
- For python projects utilize `uv` always
- For frontend projects utilize `npm` always
- For very big changes ensure to write boilerplate code only and a CHANGELOG.md entry so I can review the changes and further develop the project
- Always assume you are writing production code, for development purposes utilize a local flag for local development
- If deep documentation for an architecture decision is needed create/update an AGENTS_DOC.md file in the same directory

# Don't
- Write tests/docs if not asked to
- Don't run the services to confirm they work, instead utilize compiling to detect errors if needed

# Quick Start

```bash
make help        # Show all available commands
make db-setup    # Create local PostgreSQL (first time)
make install     # Install dependencies
make dev         # Start local development
```

# Local Development

## Prerequisites
- PostgreSQL running locally (Homebrew: `brew services start postgresql`)
- Node.js and npm
- Python 3.11+ and uv

## Environment Variables (in ~/.zshrc)
```bash
export PYDANTIC_AI_GATEWAY_API_KEY="your-key"
export PYDANTIC_LOGFIRE_KEY_EGOUDAXYZ="your-logfire-token"
```

## Makefile Commands

| Command | Description |
|---------|-------------|
| `make dev` | Start local development servers |
| `make install` | Install all dependencies |
| `make db-setup` | Create local PostgreSQL role and database |
| `make clean` | Clean build artifacts and caches |
| `make sync-env` | Sync local env vars to DigitalOcean server |
| `make deploy` | Deploy code to DigitalOcean |
| `make setup` | Initial server setup |
| `make ssh` | SSH into the server |
| `make logs` | View server logs |
| `make infra` | Create DigitalOcean droplet |
| `make destroy` | Destroy DigitalOcean droplet |

# Deployment

Single Digital Ocean droplet (~$6/month) with Docker:
- Frontend (SvelteKit SSR)
- Backend (FastAPI) - internal only, not publicly exposed
- PostgreSQL container
- Caddy reverse proxy with auto-SSL
- DNS via Cloudflare

## First Time Setup
```bash
# 1. Configure terraform
cp infra/terraform/terraform.tfvars.example infra/terraform/terraform.tfvars
# Edit terraform.tfvars with DO token and SSH key

# 2. Create droplet
make infra

# 3. Add DNS record in Cloudflare: @ → droplet IP

# 4. Sync environment variables from local machine
make sync-env

# 5. Setup and start services
make setup
```

## Deploying Updates
```bash
make sync-env    # If env vars changed
make deploy      # Push code and restart
make logs        # Verify deployment
```

# Observability

Agent runs are tracked in [Pydantic Logfire](https://logfire.pydantic.dev/). The `PYDANTIC_LOGFIRE_KEY_EGOUDAXYZ` env var is automatically synced to the server via `make sync-env`.

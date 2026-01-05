# Project structure
A monorepo with:
- `backend`: A FastAPI backend with AG-UI compatible chat interface for AI agents (pydantic-ai)
- `src`: SvelteKit frontend (admin dashboard)
- `infra`: Infrastructure as code for Digital Ocean deployment (Terraform + Docker)
- `scripts`: Development and deployment scripts

# Vision
Admin dashboard ("God Mode") for:
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

# Local Development

## Prerequisites
- PostgreSQL running locally (Homebrew: `brew services start postgresql`)
- Node.js and npm
- Python 3.11+ and uv

## Database Setup (first time only)
```bash
psql postgres -c "CREATE ROLE app WITH LOGIN PASSWORD 'changeme';"
psql postgres -c "CREATE DATABASE egoudaxyz OWNER app;"
```

## Scripts
- `./scripts/dev.sh` - Start both frontend and backend for local development
- `./scripts/deploy.sh` - Deploy to Digital Ocean (see commands below)

# Deployment
Single Digital Ocean droplet (~$6/month) with Docker:
- Frontend (SvelteKit SSR)
- Backend (FastAPI) - internal only, not publicly exposed
- PostgreSQL container
- Caddy reverse proxy with auto-SSL
- DNS via Cloudflare

Deploy commands:
```bash
./scripts/deploy.sh apply    # Create droplet
./scripts/deploy.sh setup    # Configure and start services
./scripts/deploy.sh deploy   # Push code updates
./scripts/deploy.sh ssh      # SSH into server
./scripts/deploy.sh logs     # View container logs
./scripts/deploy.sh destroy  # Tear down
```

Setup:
1. Copy `infra/terraform/terraform.tfvars.example` → `terraform.tfvars`
2. Add DO token and SSH key
3. Run `deploy.sh apply`
4. Add A record in Cloudflare: @ → droplet IP
5. Copy `infra/docker/.env.example` → `.env` and fill in secrets
6. Run `deploy.sh setup`

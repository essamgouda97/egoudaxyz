# egouda.xyz

Personal website built with SvelteKit frontend and FastAPI backend, deployed on DigitalOcean.

## Prerequisites

- [Node.js 22+](https://nodejs.org/)
- [uv](https://docs.astral.sh/uv/) (Python package manager for backend)
- [Docker](https://docker.com/) (for deployment)
- [Terraform](https://terraform.io/) (for infrastructure provisioning)

## Local Development

Start both frontend and backend with a single command:

```sh
./scripts/dev.sh
```

This will:
- Install dependencies if needed (frontend: npm, backend: uv)
- Start the backend on http://localhost:8000 (API docs at /docs)
- Start the frontend on http://localhost:5173

Press `Ctrl+C` to stop all services.

### Manual Setup

**Frontend:**
```sh
npm install
npm run dev
```

**Backend:**
```sh
cd backend
uv sync
LOCAL=true uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Infrastructure

The infrastructure runs on a single DigitalOcean droplet (~$12/month) with:
- Docker containers (frontend, backend, postgres)
- Caddy reverse proxy with automatic HTTPS
- DNS via Cloudflare

### Architecture

```
Internet → Cloudflare → Caddy (443) → Frontend (3000)
                                          ↓
                                     Backend (8000) ← [internal only]
                                          ↓
                                     Postgres (5432) ← [internal only]
```

### Security
- Backend and Postgres are NOT publicly exposed (internal Docker network only)
- Only ports 22, 80, 443 open via UFW firewall
- Frontend handles authentication via Better-Auth/Convex

## Deployment

### Initial Setup (First Time)

1. **Configure environment variables:**

   Add to your `~/.zshrc`:
   ```sh
   # Required for infrastructure
   export DO_TOKEN="dop_v1_your_token_here"

   # App secrets (synced to server on deploy)
   export PYDANTIC_AI_GATEWAY_API_KEY="your_key_here"
   export PUBLIC_CONVEX_URL="https://your-convex-url.convex.cloud"
   export PUBLIC_CONVEX_SITE_URL="https://your-site.convex.site"
   export AUTH_GITHUB_ID="your_github_oauth_client_id"
   export AUTH_GITHUB_SECRET="your_github_oauth_client_secret"
   ```
   Then reload: `source ~/.zshrc`

   The SSH key is auto-detected from `~/.ssh/id_ed25519.pub` or `~/.ssh/id_rsa.pub`.

   App secrets are automatically synced to the server on every `deploy`.

2. **Create infrastructure:**
   ```sh
   ./scripts/deploy.sh apply
   ```

3. **Add DNS record in Cloudflare:**
   - Type: A
   - Name: @ (or subdomain)
   - Content: [droplet IP from terraform output]
   - Proxy: ON (orange cloud)

4. **Setup server and deploy:**
   ```sh
   ./scripts/deploy.sh setup
   ```

   This auto-generates secure credentials for Postgres and configures everything.

   To customize environment variables (API keys, etc.), edit `infra/docker/.env` before running setup, or update on the server at `/opt/app/infra/docker/.env`.

### Subsequent Deployments

```sh
./scripts/deploy.sh deploy
```

This builds locally and pushes to the server:
- Builds frontend with `npm run build:node`
- Builds backend Docker image
- Uploads to server and restarts containers

### Other Commands

```sh
./scripts/deploy.sh ssh      # SSH into the server
./scripts/deploy.sh logs     # View container logs
./scripts/deploy.sh status   # Check deployment status
./scripts/deploy.sh destroy  # Destroy infrastructure (careful!)
```

## Project Structure

```
├── src/                    # SvelteKit frontend
├── backend/                # FastAPI backend
├── infra/
│   ├── docker/            # Docker Compose & Dockerfiles
│   │   ├── docker-compose.yml       # Local/build compose
│   │   ├── docker-compose.prod.yml  # Production compose
│   │   └── Caddyfile               # Caddy reverse proxy config
│   └── terraform/         # DigitalOcean infrastructure
└── scripts/
    ├── dev.sh             # Local development
    └── deploy.sh          # Deployment automation
```

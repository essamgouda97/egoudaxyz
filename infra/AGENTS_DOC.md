# Infrastructure Architecture

## Overview
Single Digital Ocean droplet with everything:
- Docker containers (frontend, backend, postgres)
- Caddy reverse proxy with automatic HTTPS
- DNS via Cloudflare

## Cost
- Droplet (s-1vcpu-1gb): ~$6/month
- **Total: ~$6/month**

## Security
- **Backend is NOT publicly exposed** - only accessible within Docker network
- Frontend handles all authentication via Better-Auth/Convex
- Dashboard routes are protected server-side (checks ADMIN_EMAIL)
- Only ports 22, 80, 443 open via UFW firewall
- Postgres only accessible from within Docker network

## Components

### Terraform (`terraform/`)
Provisions a single droplet with Docker pre-installed.

### Docker (`docker/`)
Three services on internal network:
- `postgres` - Database (port 5432, internal only)
- `backend` - FastAPI API (port 8000, internal only)
- `frontend` - SvelteKit SSR (port 3000, exposed to Caddy)

### Traffic Flow
```
Internet → Cloudflare → Caddy (443) → Frontend (3000)
                                          ↓
                                     Backend (8000) ← [internal only]
                                          ↓
                                     Postgres (5432) ← [internal only]
```

## Deployment Flow
1. `deploy.sh apply` - Create droplet
2. Add A record in Cloudflare pointing to droplet IP
3. Edit `infra/docker/.env` with secrets
4. `deploy.sh setup` - Configure and start services
5. `deploy.sh deploy` - Push code updates

## DNS Setup (Cloudflare)
After `deploy.sh apply`, add in Cloudflare DNS:
- Type: A
- Name: @ (or subdomain)
- Content: [droplet IP from terraform output]
- Proxy: ON (orange cloud) for DDoS protection

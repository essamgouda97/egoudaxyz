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

# SEO & Cloudflare Configuration

## SEO Files
- `/static/robots.txt` - Crawler rules, sitemap reference
- `/sitemap.xml` - Dynamic sitemap (generated from pages + blog posts)
- `/static/og-image.svg` - Open Graph image template (convert to PNG for production)

## Generate OG Image
Convert the SVG to PNG (1200x630):
```bash
# Using ImageMagick
convert static/og-image.svg -resize 1200x630 static/og-image.png

# Or use online tool: https://svgtopng.com
```

## Cloudflare Dashboard Settings

### 1. SSL/TLS (Security)
```
SSL/TLS → Overview:
  - Encryption mode: Full (strict)

SSL/TLS → Edge Certificates:
  - Always Use HTTPS: ON
  - HTTP Strict Transport Security (HSTS): Enable
    - Max Age: 12 months
    - Include subdomains: ON
    - Preload: ON
  - Minimum TLS Version: 1.2
  - Automatic HTTPS Rewrites: ON
```

### 2. Security Settings
```
Security → Settings:
  - Security Level: Medium
  - Challenge Passage: 30 minutes
  - Browser Integrity Check: ON

Security → Bots:
  - Bot Fight Mode: ON
```

### 3. WAF Rules (Security → WAF → Custom Rules)

**Rule 1: Block Bad Bots**
```
Name: Block unverified bots
Expression: (cf.client.bot) and not (cf.verified_bot)
Action: Block
```

**Rule 2: Challenge Suspicious Traffic**
```
Name: Challenge high threat score
Expression: (cf.threat_score gt 30)
Action: Managed Challenge
```

**Rule 3: Protect API**
```
Name: Protect API endpoints
Expression: (starts_with(http.request.uri.path, "/api/")) and (cf.threat_score gt 10)
Action: Managed Challenge
```

### 4. Rate Limiting (Security → WAF → Rate limiting rules)
```
Name: API rate limit
Expression: (starts_with(http.request.uri.path, "/api/"))
Characteristics: IP
Period: 1 minute
Requests: 100
Action: Block for 1 hour
```

### 5. Speed Optimization
```
Speed → Optimization:
  - Auto Minify: JS, CSS, HTML (all checked)
  - Brotli: ON
  - Early Hints: ON
  - Rocket Loader: ON (test first, can break some JS)

Caching → Configuration:
  - Browser Cache TTL: 1 month
  - Caching Level: Standard
  - Always Online: ON
```

### 6. Security Headers (Rules → Transform Rules → Modify Response Header)
```
Rule name: Security Headers
Expression: (true)
Headers to add:
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy: geolocation=(), microphone=(), camera=()
  - X-XSS-Protection: 1; mode=block
```

### 7. Page Rules (Optional)
```
URL: egouda.xyz/api/*
Settings:
  - Cache Level: Bypass
  - Security Level: High
```

## Google Search Console
1. Go to https://search.google.com/search-console
2. Add property: egouda.xyz
3. Verify via DNS (add TXT record in Cloudflare)
4. Submit sitemap: https://egouda.xyz/sitemap.xml

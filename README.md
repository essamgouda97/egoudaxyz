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

## Makefile Commands

```sh
make dev          # Start local development (frontend + backend)
make install      # Install all dependencies
make db-setup     # Setup local PostgreSQL database
make sync-env     # Sync environment to server (interactive)
make sync-env-y   # Sync environment to server (auto-confirm)
make deploy       # Build and deploy to production
make setup        # First-time server setup
make ssh          # SSH into server (uses mosh if available)
make logs         # View server container logs
make infra        # Apply Terraform infrastructure changes
```

## Project Structure

```
├── src/                    # SvelteKit frontend
│   ├── lib/
│   │   └── components/    # Reusable components
│   │       └── arabifier/ # Tweet Arabifier feature
│   └── routes/
│       ├── api/           # SvelteKit API routes (proxy to backend)
│       └── dashboard/     # Protected dashboard routes
├── backend/                # FastAPI backend
│   └── app/
│       ├── agent/         # Pydantic AI agents
│       │   ├── arabifier_agent.py  # Tweet arabification agent
│       │   └── tools/     # Agent tools (Twitter API, etc.)
│       ├── routes/        # API endpoints
│       └── core/          # Config, database
├── infra/
│   ├── docker/            # Docker Compose & Dockerfiles
│   └── terraform/         # DigitalOcean infrastructure
└── scripts/
    ├── dev.sh             # Local development
    ├── deploy.sh          # Deployment automation
    └── sync-env.sh        # Environment sync to server
```

## Features

### Tweet Arabifier (`/dashboard/arabifier`)

Converts English tweets to Egyptian Arabic (Masri) with natural code-switching.

**How it works:**
1. User pastes a Twitter/X URL
2. Backend fetches tweet via Twitter API v2
3. Pydantic AI agent converts text to Egyptian Arabic
4. Frontend displays original vs arabified side-by-side
5. User can copy or post directly to Twitter

**Files:**
- `backend/app/agent/arabifier_agent.py` - AI agent with system prompt
- `backend/app/agent/tools/twitter.py` - Twitter API integration
- `backend/app/routes/arabifier.py` - REST API endpoints
- `src/lib/components/arabifier/TweetArabifier.svelte` - UI component
- `src/routes/api/arabify/+server.ts` - SvelteKit proxy to backend

**Customizing style:**
Edit `EXAMPLE_TWEETS` in `arabifier_agent.py` to add your own input/output examples. The agent uses these as few-shot references.

## Adding New Features

### 1. Create a new Pydantic AI Agent

```python
# backend/app/agent/my_agent.py
from pydantic import BaseModel
from pydantic_ai import Agent
from app.core.config import settings

class MyOutput(BaseModel):
    result: str

MY_SYSTEM_PROMPT = """Your instructions here..."""

my_agent = Agent(
    settings.MONITOR_MODEL,  # Uses gateway/google-vertex:gemini-2.5-flash
    output_type=MyOutput,
    system_prompt=MY_SYSTEM_PROMPT,
)

async def run_my_agent(input: str) -> MyOutput:
    result = await my_agent.run(input)
    return result.output
```

### 2. Add API Route

```python
# backend/app/routes/my_feature.py
from fastapi import APIRouter
from app.agent.my_agent import run_my_agent

router = APIRouter()

@router.post("/my-feature")
async def my_endpoint(input: str):
    return await run_my_agent(input)
```

Register in `backend/app/main.py`:
```python
from app.routes.my_feature import router as my_router
app.include_router(my_router, prefix=settings.API_V1_STR, tags=["my-feature"])
```

### 3. Add Frontend Proxy (SvelteKit)

```typescript
// src/routes/api/my-feature/+server.ts
import { json } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";

const backendUrl = () => env.BACKEND_URL || "http://localhost:8000";

export const POST = async ({ request }) => {
  const body = await request.json();
  const response = await fetch(`${backendUrl()}/api/v1/my-feature`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return json(await response.json());
};
```

### 4. Create Svelte Component

```svelte
<!-- src/lib/components/my-feature/MyComponent.svelte -->
<script lang="ts">
  let input = $state("");
  let result = $state<string | null>(null);
  let loading = $state(false);

  async function submit() {
    loading = true;
    const res = await fetch("/api/my-feature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });
    result = (await res.json()).result;
    loading = false;
  }
</script>
```

## Environment Variables

### Required for all features

```sh
PYDANTIC_AI_GATEWAY_API_KEY  # AI model access
PUBLIC_CONVEX_URL            # Convex database
AUTH_GITHUB_ID               # GitHub OAuth
AUTH_GITHUB_SECRET           # GitHub OAuth
```

### Feature-specific

```sh
TWITTER_BEARER_TOKEN         # Arabifier - Twitter API access
TAVILY_API_KEY              # Web search capabilities
FINNHUB_API_KEY             # Financial data
```

### Infrastructure

```sh
DO_TOKEN                    # DigitalOcean API
DOCKERHUB_USERNAME          # Docker Hub for image push
DOCKERHUB_TOKEN             # Docker Hub authentication
```

## Tech Stack

- **Frontend:** SvelteKit 2, Svelte 5 (runes), TailwindCSS, shadcn-svelte
- **Backend:** FastAPI, Pydantic AI, SQLAlchemy (async)
- **Database:** PostgreSQL (local + production)
- **Auth:** Better-Auth with Convex
- **AI:** Pydantic AI with Google Vertex (Gemini 2.5 Flash)
- **Infra:** DigitalOcean, Docker, Caddy, Terraform

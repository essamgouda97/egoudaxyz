"""
Chat routes using pydantic-ai AG-UI adapter.

Supports multiple agents via the agent registry.
"""

from fastapi import APIRouter, Request
from starlette.responses import Response

from pydantic_ai.ui.ag_ui import AGUIAdapter

from app.agent.core import get_agent, list_agents

router = APIRouter()


@router.get("/agents")
def get_available_agents():
    """List all available agents."""
    return list_agents()


@router.options("/chat/{agent_id}")
async def chat_options(agent_id: str) -> Response:
    """Handle CORS preflight for chat endpoint."""
    return Response(status_code=200)


@router.post("/chat/{agent_id}")
async def chat(request: Request, agent_id: str) -> Response:
    """AG-UI compatible chat endpoint for a specific agent."""
    agent = get_agent(agent_id)
    return await AGUIAdapter.dispatch_request(request, agent=agent)


# Keep the default endpoint for backwards compatibility
@router.options("/chat")
async def chat_default_options() -> Response:
    """Handle CORS preflight for default chat endpoint."""
    return Response(status_code=200)


@router.post("/chat")
async def chat_default(request: Request) -> Response:
    """AG-UI compatible chat endpoint using default agent."""
    agent = get_agent("default")
    return await AGUIAdapter.dispatch_request(request, agent=agent)


@router.get("/chat/health")
def chat_health():
    """Chat service health check."""
    return {"status": "ok", "service": "chat"}

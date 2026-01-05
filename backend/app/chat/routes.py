"""
Chat routes using pydantic-ai AG-UI adapter.

Supports the query agent for exploring monitoring reports.
"""

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.responses import Response

from pydantic_ai.ui.ag_ui import AGUIAdapter

from app.agent.core import create_query_deps, get_query_agent, list_agents
from app.core.database import get_db

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
async def chat(
    request: Request,
    agent_id: str,
    db: AsyncSession = Depends(get_db),
) -> Response:
    """AG-UI compatible chat endpoint for a specific agent."""
    if agent_id == "query":
        agent = get_query_agent()
        deps = create_query_deps(db)
        return await AGUIAdapter.dispatch_request(request, agent=agent, deps=deps)
    else:
        # Fallback to query agent for unknown agent IDs
        agent = get_query_agent()
        deps = create_query_deps(db)
        return await AGUIAdapter.dispatch_request(request, agent=agent, deps=deps)


@router.options("/chat")
async def chat_default_options() -> Response:
    """Handle CORS preflight for default chat endpoint."""
    return Response(status_code=200)


@router.post("/chat")
async def chat_default(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Response:
    """AG-UI compatible chat endpoint using query agent."""
    agent = get_query_agent()
    deps = create_query_deps(db)
    return await AGUIAdapter.dispatch_request(request, agent=agent, deps=deps)


@router.get("/chat/health")
def chat_health():
    """Chat service health check."""
    return {"status": "ok", "service": "chat"}

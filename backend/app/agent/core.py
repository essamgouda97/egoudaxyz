"""
Admin Dashboard AI Agent

A conversational agent for the admin dashboard.
Extend with tools as needed for agent management, monitoring, etc.
"""

from dataclasses import dataclass
from typing import AsyncIterator

from pydantic_ai import Agent


@dataclass
class AgentDeps:
    """Dependencies available to the agent."""

    user_id: str | None = None


agent = Agent(
    "gateway/google-vertex:gemini-2.5-flash",
    deps_type=AgentDeps,
    system_prompt=(
        "You are an AI assistant for the egouda.xyz admin dashboard. "
        "Help users with their questions and tasks. "
        "Be concise and helpful."
    ),
)


async def stream_agent_response(message: str, deps: AgentDeps | None = None) -> AsyncIterator[str]:
    """Stream agent response chunks."""
    deps = deps or AgentDeps()
    async with agent.run_stream(message, deps=deps) as result:
        async for chunk in result.stream_text(delta=True):
            yield chunk

"""
Agent Registry for the God Mode monitoring system.

Contains:
- query: Chat agent for querying monitoring reports
"""

from dataclasses import dataclass

from pydantic_ai import Agent
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.query_agent import query_agent, QueryDeps


@dataclass
class AgentConfig:
    """Configuration for a registered agent."""

    id: str
    name: str
    description: str


# Available agents
agents: dict[str, AgentConfig] = {
    "query": AgentConfig(
        id="query",
        name="Monitor Query",
        description="Query and explore monitoring reports. Ask about news, markets, and social trends.",
    ),
}


def get_query_agent() -> Agent:
    """Get the query agent instance."""
    return query_agent


def create_query_deps(db: AsyncSession) -> QueryDeps:
    """Create dependencies for the query agent with a database session."""
    return QueryDeps(db=db)


def list_agents() -> list[dict]:
    """Return list of available agents for the frontend."""
    return [
        {"id": cfg.id, "name": cfg.name, "description": cfg.description}
        for cfg in agents.values()
    ]

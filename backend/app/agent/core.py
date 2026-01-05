"""
Agent Registry - Multiple AI agents for different use cases.

Each agent has a unique ID, name, description, and configuration.
Add new agents here to make them available in the dashboard.
"""

from dataclasses import dataclass
from pydantic_ai import Agent


@dataclass
class AgentConfig:
    id: str
    name: str
    description: str
    agent: Agent


# Define your agents here
agents: dict[str, AgentConfig] = {}


def register_agent(
    id: str,
    name: str,
    description: str,
    model: str = "gateway/google-vertex:gemini-2.5-flash",
    system_prompt: str = "",
) -> AgentConfig:
    """Register a new agent with the given configuration."""
    agent = Agent(model, system_prompt=system_prompt)
    config = AgentConfig(id=id, name=name, description=description, agent=agent)
    agents[id] = config
    return config


# ============================================================
# Register your agents below
# ============================================================

register_agent(
    id="default",
    name="General Assistant",
    description="A helpful general-purpose AI assistant",
    system_prompt=(
        "You are a helpful AI assistant. "
        "Be concise and helpful in your responses."
    ),
)

register_agent(
    id="coder",
    name="Code Assistant",
    description="Specialized in writing and reviewing code",
    system_prompt=(
        "You are an expert software engineer and code assistant. "
        "Help users write clean, efficient, and well-documented code. "
        "When showing code, use appropriate markdown formatting. "
        "Explain your reasoning and suggest best practices."
    ),
)

register_agent(
    id="analyst",
    name="Data Analyst",
    description="Helps analyze data and create insights",
    system_prompt=(
        "You are a data analyst expert. "
        "Help users understand their data, create analyses, and derive insights. "
        "Be precise with numbers and statistical concepts. "
        "Suggest visualizations and further analyses when appropriate."
    ),
)

register_agent(
    id="writer",
    name="Content Writer",
    description="Assists with writing and editing content",
    system_prompt=(
        "You are a professional content writer and editor. "
        "Help users create clear, engaging, and well-structured content. "
        "Offer suggestions for improving clarity, tone, and style. "
        "Adapt your writing style to match the user's needs."
    ),
)


def get_agent(agent_id: str) -> Agent:
    """Get an agent by ID, falling back to default if not found."""
    config = agents.get(agent_id, agents.get("default"))
    if config is None:
        raise ValueError(f"No agent found with ID: {agent_id}")
    return config.agent


def list_agents() -> list[dict]:
    """Return list of available agents for the frontend."""
    return [
        {"id": cfg.id, "name": cfg.name, "description": cfg.description}
        for cfg in agents.values()
    ]

"""
Monitor Agent - Background agent that fetches and synthesizes data.

Runs on a schedule to collect news, markets, and social trends,
then uses AI to synthesize findings into a structured report.
"""

import logging

from pydantic import BaseModel
from pydantic_ai import Agent, RunContext

from app.agent.tools.markets import fetch_markets
from app.agent.tools.news import fetch_news
from app.agent.tools.social import fetch_social
from app.core.config import settings

logger = logging.getLogger(__name__)


class MonitorDeps(BaseModel):
    """Dependencies for the monitor agent."""

    class Config:
        arbitrary_types_allowed = True


class TopicSection(BaseModel):
    """A section of the monitoring report."""

    title: str
    summary: str
    key_points: list[str]
    sentiment: str  # 'positive' | 'negative' | 'neutral' | 'mixed'


class MonitorOutput(BaseModel):
    """Structured output from the monitor agent."""

    executive_summary: str
    news: TopicSection
    markets: TopicSection
    social: TopicSection


monitor_agent = Agent(
    settings.MONITOR_MODEL,
    deps_type=MonitorDeps,
    output_type=MonitorOutput,
    system_prompt="""You are an intelligence monitoring agent. Your job is to analyze data from multiple sources and create a comprehensive monitoring report.

For each topic section (news, markets, social), you should:
1. Identify the most important/trending items
2. Summarize key themes and patterns
3. Note any significant developments or anomalies
4. Assess overall sentiment (positive, negative, neutral, or mixed)

Your executive summary should:
- Highlight the 2-3 most significant developments across all topics
- Note any cross-topic connections or trends
- Be concise but informative (2-3 sentences)

Be objective and factual. Flag anything unusual or potentially significant.""",
)


@monitor_agent.tool
async def get_news_data(ctx: RunContext[MonitorDeps]) -> dict:
    """Fetch the latest news from Reddit news subreddits."""
    logger.info("Fetching news data...")
    return await fetch_news()


@monitor_agent.tool
async def get_market_data(ctx: RunContext[MonitorDeps]) -> dict:
    """Fetch market discussions and sentiment from Reddit finance subreddits."""
    logger.info("Fetching market data...")
    return await fetch_markets()


@monitor_agent.tool
async def get_social_trends(ctx: RunContext[MonitorDeps]) -> dict:
    """Fetch technology and social trends from Reddit."""
    logger.info("Fetching social trends...")
    return await fetch_social()


async def run_monitor() -> MonitorOutput:
    """
    Execute the monitor agent and return the synthesized report.

    This is called by the scheduler task.
    """
    logger.info("Starting monitor agent run...")

    deps = MonitorDeps()
    result = await monitor_agent.run(
        "Perform a comprehensive scan. Use your tools to fetch news, market data, "
        "and social trends. Then synthesize the findings into a structured report "
        "with an executive summary and section breakdowns.",
        deps=deps,
    )

    logger.info("Monitor agent run completed")
    return result.output

"""
Monitor Agent - Background agent that fetches and synthesizes data.

Runs on a schedule to collect news (Tavily), markets (Finnhub), and tech trends (HackerNews),
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


class NewsItem(BaseModel):
    """Individual news item."""
    title: str
    url: str
    source: str
    summary: str | None = None


class MarketQuote(BaseModel):
    """Stock quote data."""
    symbol: str
    name: str = ""
    category: str = "holding"  # "index" or "holding"
    price: float
    change: float
    change_percent: float
    sentiment: str


class TechItem(BaseModel):
    """HackerNews/tech item."""
    title: str
    url: str
    score: int
    comments: int
    is_hot: bool = False


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
    # Rich data for dashboard
    top_news: list[NewsItem] = []
    market_quotes: list[MarketQuote] = []
    top_tech: list[TechItem] = []
    market_sentiment: str = "neutral"


monitor_agent = Agent(
    settings.MONITOR_MODEL,
    deps_type=MonitorDeps,
    output_type=MonitorOutput,
    system_prompt="""You are an intelligence monitoring agent. Your job is to analyze data from multiple sources and create a comprehensive monitoring report.

Data Sources:
- News: Tavily AI-powered search (real-time news from multiple sources)
- Markets: Finnhub API (real stock prices, market news)
- Social/Tech: HackerNews (trending tech discussions)

For each topic section (news, markets, social), you should:
1. Identify the most important/trending items
2. Summarize key themes and patterns
3. Note any significant developments or anomalies
4. Assess overall sentiment (positive, negative, neutral, or mixed)

IMPORTANT: Populate the rich data fields:
- top_news: Extract 5-8 most important news items with title, url, source, summary
- market_quotes: Include stock quotes from the market data (symbol, price, change, change_percent, sentiment)
- top_tech: Extract 5-8 top HackerNews stories with title, url, score, comments, is_hot
- market_sentiment: Overall market sentiment based on price changes

Your executive summary should:
- Highlight the 2-3 most significant developments across all topics
- Note any cross-topic connections or trends
- Be concise but informative (2-3 sentences)

Be objective and factual. Flag anything unusual or potentially significant.""",
)


@monitor_agent.tool
async def get_news_data(ctx: RunContext[MonitorDeps]) -> dict:
    """Fetch latest news using Tavily AI-powered search. Returns headlines from multiple sources."""
    logger.info("Fetching news data from Tavily...")
    return await fetch_news()


@monitor_agent.tool
async def get_market_data(ctx: RunContext[MonitorDeps]) -> dict:
    """Fetch real market data from Finnhub. Returns stock quotes (SPY, QQQ, AAPL, etc.) and market news."""
    logger.info("Fetching market data from Finnhub...")
    return await fetch_markets()


@monitor_agent.tool
async def get_social_trends(ctx: RunContext[MonitorDeps]) -> dict:
    """Fetch trending tech stories from HackerNews. Returns top stories with scores and comment counts."""
    logger.info("Fetching tech trends from HackerNews...")
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
        "and social/tech trends. Then synthesize the findings into a structured report "
        "with an executive summary, section breakdowns, AND populate the rich data fields "
        "(top_news, market_quotes, top_tech, market_sentiment) for the dashboard.",
        deps=deps,
    )

    logger.info("Monitor agent run completed")
    return result.output

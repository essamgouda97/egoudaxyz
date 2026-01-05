"""Data fetching tools for the monitoring agent."""

from app.agent.tools.news import fetch_news
from app.agent.tools.markets import fetch_markets
from app.agent.tools.social import fetch_social

__all__ = ["fetch_news", "fetch_markets", "fetch_social"]

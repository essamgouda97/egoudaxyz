"""
News fetching tool - uses Tavily API for AI-optimized search.

Tavily provides clean, structured search results optimized for AI agents.
"""

import logging
from datetime import datetime

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

TAVILY_API_URL = "https://api.tavily.com/search"


async def fetch_news() -> dict:
    """
    Fetch latest news using Tavily search API.

    Returns:
        dict with news items including titles, URLs, content, and scores
    """
    if not settings.TAVILY_API_KEY:
        logger.warning("TAVILY_API_KEY not set, returning empty results")
        return {"source": "tavily", "items": [], "count": 0, "error": "API key not configured"}

    items = []

    # Search queries for different news categories
    queries = [
        "breaking news today",
        "world news headlines",
        "technology news today",
    ]

    async with httpx.AsyncClient(timeout=30.0) as client:
        for query in queries:
            try:
                response = await client.post(
                    TAVILY_API_URL,
                    json={
                        "api_key": settings.TAVILY_API_KEY,
                        "query": query,
                        "search_depth": "basic",
                        "include_answer": False,
                        "include_images": False,
                        "max_results": 5,
                    },
                )

                if response.status_code == 200:
                    data = response.json()
                    results = data.get("results", [])

                    for result in results:
                        items.append({
                            "source": "tavily",
                            "title": result.get("title", ""),
                            "url": result.get("url", ""),
                            "content": result.get("content", "")[:500],
                            "score": result.get("score", 0),
                            "published_date": result.get("published_date"),
                            "domain": _extract_domain(result.get("url", "")),
                            "query": query,
                        })
                else:
                    logger.warning(f"Tavily search failed: {response.status_code}")

            except Exception as e:
                logger.error(f"Error fetching news for '{query}': {e}")
                continue

    # Sort by score (relevance)
    items.sort(key=lambda x: x.get("score", 0), reverse=True)

    # Deduplicate by URL
    seen_urls = set()
    unique_items = []
    for item in items:
        if item["url"] not in seen_urls:
            seen_urls.add(item["url"])
            unique_items.append(item)

    return {
        "source": "tavily",
        "fetched_at": datetime.utcnow().isoformat(),
        "items": unique_items[:15],
        "count": len(unique_items),
    }


def _extract_domain(url: str) -> str:
    """Extract domain from URL."""
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        return parsed.netloc.replace("www.", "")
    except Exception:
        return ""

"""
Social/Tech trends fetching tool - uses HackerNews API.

HackerNews official API is free, reliable, and never blocked.
"""

import asyncio
import logging
from datetime import datetime

import httpx

logger = logging.getLogger(__name__)

HN_API_BASE = "https://hacker-news.firebaseio.com/v0"


async def fetch_social() -> dict:
    """
    Fetch top stories from HackerNews.

    Returns:
        dict with trending tech stories including titles, URLs, scores, and comments
    """
    items = []

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # Get top story IDs
            response = await client.get(f"{HN_API_BASE}/topstories.json")
            if response.status_code != 200:
                logger.error(f"Failed to fetch HN top stories: {response.status_code}")
                return {"source": "hackernews", "items": [], "count": 0}

            story_ids = response.json()[:30]  # Top 30 stories

            # Fetch story details concurrently
            tasks = [_fetch_story(client, story_id) for story_id in story_ids]
            stories = await asyncio.gather(*tasks)

            # Filter out None results and sort by score
            items = [s for s in stories if s is not None]
            items.sort(key=lambda x: x.get("score", 0), reverse=True)

        except Exception as e:
            logger.error(f"Error fetching HackerNews: {e}")

    return {
        "source": "hackernews",
        "fetched_at": datetime.utcnow().isoformat(),
        "items": items[:20],
        "count": len(items),
    }


async def _fetch_story(client: httpx.AsyncClient, story_id: int) -> dict | None:
    """Fetch a single story's details."""
    try:
        response = await client.get(f"{HN_API_BASE}/item/{story_id}.json")
        if response.status_code != 200:
            return None

        data = response.json()
        if not data or data.get("type") != "story":
            return None

        # Calculate time ago
        timestamp = data.get("time", 0)
        time_ago = _time_ago(timestamp) if timestamp else ""

        return {
            "source": "hackernews",
            "id": data.get("id"),
            "title": data.get("title", ""),
            "url": data.get("url", f"https://news.ycombinator.com/item?id={story_id}"),
            "score": data.get("score", 0),
            "by": data.get("by", ""),
            "num_comments": data.get("descendants", 0),
            "time": timestamp,
            "time_ago": time_ago,
            "hn_url": f"https://news.ycombinator.com/item?id={story_id}",
            "domain": _extract_domain(data.get("url", "")),
            "is_hot": data.get("score", 0) > 200,
        }
    except Exception as e:
        logger.error(f"Error fetching story {story_id}: {e}")
        return None


def _extract_domain(url: str) -> str:
    """Extract domain from URL."""
    if not url:
        return "news.ycombinator.com"
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        return parsed.netloc.replace("www.", "")
    except Exception:
        return ""


def _time_ago(timestamp: int) -> str:
    """Convert Unix timestamp to human-readable time ago."""
    try:
        now = datetime.utcnow()
        dt = datetime.utcfromtimestamp(timestamp)
        diff = now - dt

        seconds = int(diff.total_seconds())
        if seconds < 60:
            return "just now"
        minutes = seconds // 60
        if minutes < 60:
            return f"{minutes}m ago"
        hours = minutes // 60
        if hours < 24:
            return f"{hours}h ago"
        days = hours // 24
        return f"{days}d ago"
    except Exception:
        return ""

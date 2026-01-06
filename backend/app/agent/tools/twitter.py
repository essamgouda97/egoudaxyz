"""
Twitter/X API tool for fetching tweet content.
Uses Twitter API v2 with Bearer Token authentication.
"""

import logging
import re
from urllib.parse import urlparse

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

TWITTER_API_BASE = "https://api.twitter.com/2"


def extract_tweet_id(url: str) -> str | None:
    """
    Extract tweet ID from various Twitter/X URL formats.

    Supported formats:
    - https://twitter.com/user/status/1234567890
    - https://x.com/user/status/1234567890
    - https://mobile.twitter.com/user/status/1234567890
    - With query params: https://x.com/user/status/1234567890?s=20
    """
    patterns = [
        r"(?:twitter\.com|x\.com)/\w+/status/(\d+)",
        r"(?:mobile\.twitter\.com)/\w+/status/(\d+)",
    ]

    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


async def fetch_tweet(url: str) -> dict:
    """
    Fetch tweet content from Twitter API v2.

    Args:
        url: Twitter/X URL

    Returns:
        dict with tweet text, author info, and metadata
    """
    if not settings.TWITTER_BEARER_TOKEN:
        logger.error("TWITTER_BEARER_TOKEN not configured")
        return {"error": "Twitter API not configured"}

    tweet_id = extract_tweet_id(url)
    if not tweet_id:
        return {"error": "Invalid Twitter/X URL format"}

    headers = {
        "Authorization": f"Bearer {settings.TWITTER_BEARER_TOKEN}",
    }

    params = {
        "tweet.fields": "text,author_id,created_at,public_metrics,entities,attachments",
        "expansions": "author_id,attachments.media_keys",
        "user.fields": "name,username,profile_image_url",
        "media.fields": "url,preview_image_url,type,width,height,alt_text",
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(
                f"{TWITTER_API_BASE}/tweets/{tweet_id}",
                headers=headers,
                params=params,
            )

            if response.status_code == 401:
                return {"error": "Invalid Twitter API credentials"}
            elif response.status_code == 404:
                return {"error": "Tweet not found or deleted"}
            elif response.status_code == 429:
                return {"error": "Twitter rate limit exceeded. Please wait 15 minutes and try again."}
            elif response.status_code != 200:
                logger.error(
                    f"Twitter API error: {response.status_code} - {response.text}"
                )
                return {"error": f"Twitter API error: {response.status_code}"}

            data = response.json()
            tweet_data = data.get("data", {})
            includes = data.get("includes", {})
            users = includes.get("users", [])
            media_list = includes.get("media", [])

            author = users[0] if users else {}

            # Build media array with URLs
            media = []
            for m in media_list:
                media_item = {
                    "type": m.get("type"),  # "photo", "video", "animated_gif"
                    "url": m.get("url") or m.get("preview_image_url"),
                    "width": m.get("width"),
                    "height": m.get("height"),
                    "alt_text": m.get("alt_text"),
                }
                if media_item["url"]:
                    media.append(media_item)

            return {
                "id": tweet_data.get("id"),
                "text": tweet_data.get("text", ""),
                "author": {
                    "name": author.get("name", ""),
                    "username": author.get("username", ""),
                    "profile_image": author.get("profile_image_url", ""),
                },
                "created_at": tweet_data.get("created_at"),
                "metrics": tweet_data.get("public_metrics", {}),
                "entities": tweet_data.get("entities", {}),
                "media": media,
                "original_url": url,
            }

        except httpx.TimeoutException:
            return {"error": "Twitter API timeout"}
        except Exception as e:
            logger.error(f"Error fetching tweet: {e}")
            return {"error": str(e)}

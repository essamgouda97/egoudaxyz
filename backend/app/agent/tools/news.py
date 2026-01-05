"""
News fetching tool - scrapes Reddit news subreddits.

Uses Reddit's public JSON API (no authentication required).
"""

import logging

import httpx

logger = logging.getLogger(__name__)

REDDIT_USER_AGENT = "MonitorAgent/1.0 (personal monitoring bot)"
NEWS_SUBREDDITS = ["news", "worldnews", "technews"]


async def fetch_news() -> dict:
    """
    Fetch news from Reddit news subreddits.

    Returns:
        dict with 'items' list containing news posts
    """
    items = []

    async with httpx.AsyncClient(timeout=30.0) as client:
        for subreddit in NEWS_SUBREDDITS:
            try:
                response = await client.get(
                    f"https://www.reddit.com/r/{subreddit}/hot.json",
                    params={"limit": 15},
                    headers={"User-Agent": REDDIT_USER_AGENT},
                )

                if response.status_code == 200:
                    data = response.json()
                    posts = data.get("data", {}).get("children", [])

                    for post in posts:
                        p = post.get("data", {})
                        # Skip stickied posts and self posts without content
                        if p.get("stickied"):
                            continue

                        items.append({
                            "source": f"reddit/r/{subreddit}",
                            "title": p.get("title", ""),
                            "url": p.get("url", ""),
                            "score": p.get("score", 0),
                            "num_comments": p.get("num_comments", 0),
                            "created_utc": p.get("created_utc"),
                            "permalink": f"https://reddit.com{p.get('permalink', '')}",
                            "domain": p.get("domain", ""),
                        })
                else:
                    logger.warning(f"Reddit r/{subreddit} returned {response.status_code}")

            except Exception as e:
                logger.error(f"Error fetching r/{subreddit}: {e}")
                continue

    # Sort by score (popularity)
    items.sort(key=lambda x: x.get("score", 0), reverse=True)

    return {
        "source": "reddit_news",
        "subreddits": NEWS_SUBREDDITS,
        "items": items[:20],  # Top 20 across all subreddits
        "count": len(items),
    }

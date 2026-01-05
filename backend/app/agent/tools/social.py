"""
Social/trends fetching tool - scrapes Reddit for trending topics.

Uses Reddit's public JSON API for technology and trending discussions.
"""

import logging

import httpx

logger = logging.getLogger(__name__)

REDDIT_USER_AGENT = "MonitorAgent/1.0 (personal monitoring bot)"
SOCIAL_SUBREDDITS = ["technology", "futurology", "science", "programming", "artificial"]


async def fetch_social() -> dict:
    """
    Fetch social trends and technology discussions from Reddit.

    Returns:
        dict with 'items' list containing trending tech/social posts
    """
    items = []

    async with httpx.AsyncClient(timeout=30.0) as client:
        for subreddit in SOCIAL_SUBREDDITS:
            try:
                response = await client.get(
                    f"https://www.reddit.com/r/{subreddit}/hot.json",
                    params={"limit": 10},
                    headers={"User-Agent": REDDIT_USER_AGENT},
                )

                if response.status_code == 200:
                    data = response.json()
                    posts = data.get("data", {}).get("children", [])

                    for post in posts:
                        p = post.get("data", {})
                        if p.get("stickied"):
                            continue

                        items.append({
                            "source": f"reddit/r/{subreddit}",
                            "title": p.get("title", ""),
                            "selftext": p.get("selftext", "")[:500] if p.get("selftext") else "",
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

    # Sort by engagement
    items.sort(key=lambda x: x.get("score", 0), reverse=True)

    return {
        "source": "reddit_social",
        "subreddits": SOCIAL_SUBREDDITS,
        "items": items[:20],
        "count": len(items),
    }

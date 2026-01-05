"""
Markets fetching tool - scrapes Reddit finance subreddits.

Uses Reddit's public JSON API for market sentiment and discussions.
"""

import logging

import httpx

logger = logging.getLogger(__name__)

REDDIT_USER_AGENT = "MonitorAgent/1.0 (personal monitoring bot)"
MARKET_SUBREDDITS = ["stocks", "investing", "wallstreetbets", "finance", "stockmarket"]


async def fetch_markets() -> dict:
    """
    Fetch market discussions and sentiment from Reddit finance subreddits.

    Returns:
        dict with 'items' list containing market-related posts
    """
    items = []

    async with httpx.AsyncClient(timeout=30.0) as client:
        for subreddit in MARKET_SUBREDDITS:
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

                        # Extract potential ticker symbols from title
                        title = p.get("title", "")

                        items.append({
                            "source": f"reddit/r/{subreddit}",
                            "title": title,
                            "selftext": p.get("selftext", "")[:500] if p.get("selftext") else "",
                            "url": p.get("url", ""),
                            "score": p.get("score", 0),
                            "num_comments": p.get("num_comments", 0),
                            "created_utc": p.get("created_utc"),
                            "permalink": f"https://reddit.com{p.get('permalink', '')}",
                            "upvote_ratio": p.get("upvote_ratio", 0),
                        })
                else:
                    logger.warning(f"Reddit r/{subreddit} returned {response.status_code}")

            except Exception as e:
                logger.error(f"Error fetching r/{subreddit}: {e}")
                continue

    # Sort by engagement (score + comments)
    items.sort(key=lambda x: x.get("score", 0) + x.get("num_comments", 0), reverse=True)

    return {
        "source": "reddit_markets",
        "subreddits": MARKET_SUBREDDITS,
        "items": items[:20],
        "count": len(items),
    }

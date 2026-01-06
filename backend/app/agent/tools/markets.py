"""
Markets fetching tool - uses Finnhub API for real market data.

Provides stock quotes, market news, and market status.
"""

import logging
from datetime import datetime

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

FINNHUB_BASE_URL = "https://finnhub.io/api/v1"

# Symbols to track with category tags
SYMBOLS = {
    # World Indices
    "SPY": {"name": "S&P 500", "category": "index"},
    "QQQ": {"name": "Nasdaq 100", "category": "index"},
    "DIA": {"name": "Dow Jones", "category": "index"},
    "GLD": {"name": "Gold", "category": "index"},
    "USO": {"name": "Oil", "category": "index"},
    # User Holdings
    "VOO": {"name": "Vanguard S&P", "category": "holding"},
    "GOOGL": {"name": "Alphabet", "category": "holding"},
    "AMZN": {"name": "Amazon", "category": "holding"},
    "AAPL": {"name": "Apple", "category": "holding"},
    "AMD": {"name": "AMD", "category": "holding"},
    "NVDA": {"name": "NVIDIA", "category": "holding"},
    "F": {"name": "Ford", "category": "holding"},
    "SU": {"name": "Suncor", "category": "holding"},
    "CVE": {"name": "Cenovus", "category": "holding"},
}


async def fetch_markets() -> dict:
    """
    Fetch market data from Finnhub API.

    Returns:
        dict with market quotes, news, and status
    """
    if not settings.FINNHUB_API_KEY:
        logger.warning("FINNHUB_API_KEY not set, returning empty results")
        return {"source": "finnhub", "quotes": [], "news": [], "error": "API key not configured"}

    headers = {"X-Finnhub-Token": settings.FINNHUB_API_KEY}
    quotes = []
    news = []
    market_status = None

    async with httpx.AsyncClient(timeout=30.0, headers=headers) as client:
        # Fetch market status
        try:
            response = await client.get(f"{FINNHUB_BASE_URL}/stock/market-status", params={"exchange": "US"})
            if response.status_code == 200:
                market_status = response.json()
        except Exception as e:
            logger.error(f"Error fetching market status: {e}")

        # Fetch quotes for key symbols
        for symbol, meta in SYMBOLS.items():
            try:
                response = await client.get(f"{FINNHUB_BASE_URL}/quote", params={"symbol": symbol})
                if response.status_code == 200:
                    data = response.json()
                    if data.get("c"):  # Current price exists
                        change = data.get("d", 0) or 0
                        change_percent = data.get("dp", 0) or 0
                        quotes.append({
                            "symbol": symbol,
                            "name": meta["name"],
                            "category": meta["category"],
                            "price": round(data.get("c", 0), 2),
                            "change": round(change, 2),
                            "change_percent": round(change_percent, 2),
                            "high": round(data.get("h", 0), 2),
                            "low": round(data.get("l", 0), 2),
                            "open": round(data.get("o", 0), 2),
                            "prev_close": round(data.get("pc", 0), 2),
                            "sentiment": "positive" if change > 0 else "negative" if change < 0 else "neutral",
                        })
            except Exception as e:
                logger.error(f"Error fetching quote for {symbol}: {e}")

        # Fetch general market news
        try:
            response = await client.get(f"{FINNHUB_BASE_URL}/news", params={"category": "general"})
            if response.status_code == 200:
                news_data = response.json()
                for item in news_data[:10]:
                    news.append({
                        "source": item.get("source", ""),
                        "title": item.get("headline", ""),
                        "summary": item.get("summary", "")[:300],
                        "url": item.get("url", ""),
                        "image": item.get("image", ""),
                        "datetime": item.get("datetime"),
                        "related": item.get("related", ""),
                    })
        except Exception as e:
            logger.error(f"Error fetching market news: {e}")

    # Calculate market summary
    total_change = sum(q.get("change_percent", 0) for q in quotes)
    avg_change = total_change / len(quotes) if quotes else 0
    market_sentiment = "positive" if avg_change > 0.5 else "negative" if avg_change < -0.5 else "neutral"

    return {
        "source": "finnhub",
        "fetched_at": datetime.utcnow().isoformat(),
        "market_status": market_status,
        "market_sentiment": market_sentiment,
        "avg_change_percent": round(avg_change, 2),
        "quotes": quotes,
        "news": news,
        "count": len(quotes),
    }

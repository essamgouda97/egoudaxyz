"""
REST API routes for Tweet Arabifier.
"""

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.agent.arabifier_agent import arabify_text, arabify_tweet
from app.agent.tools.twitter import extract_tweet_id, fetch_tweet

logger = logging.getLogger(__name__)

router = APIRouter()


class ArabifyTweetRequest(BaseModel):
    """Request body for arabifying a tweet URL."""

    url: str


class ArabifyTextRequest(BaseModel):
    """Request body for arabifying raw text."""

    text: str


class ArabifyResponse(BaseModel):
    """Response from arabify endpoints."""

    original_text: str
    arabified_text: str
    author_name: str | None = None
    author_username: str | None = None
    note: str | None = None


@router.post("/arabify/tweet", response_model=ArabifyResponse)
async def arabify_tweet_endpoint(request: ArabifyTweetRequest):
    """
    Arabify a tweet from its URL.

    Fetches the tweet content and converts it to Egyptian Arabic.
    """
    tweet_id = extract_tweet_id(request.url)
    if not tweet_id:
        raise HTTPException(400, "Invalid Twitter/X URL format")

    try:
        result = await arabify_tweet(request.url)
        return ArabifyResponse(
            original_text=result.original_text,
            arabified_text=result.arabified_text,
            author_name=result.author_name,
            author_username=result.author_username,
            note=result.note,
        )
    except Exception as e:
        logger.error(f"Failed to arabify tweet: {e}")
        raise HTTPException(500, f"Failed to arabify tweet: {str(e)}")


@router.post("/arabify/text", response_model=ArabifyResponse)
async def arabify_text_endpoint(request: ArabifyTextRequest):
    """
    Arabify raw text directly.

    Useful for testing or arabifying non-tweet content.
    """
    if not request.text.strip():
        raise HTTPException(400, "Text cannot be empty")

    try:
        result = await arabify_text(request.text)
        return ArabifyResponse(
            original_text=result.original_text,
            arabified_text=result.arabified_text,
            note=result.note,
        )
    except Exception as e:
        logger.error(f"Failed to arabify text: {e}")
        raise HTTPException(500, f"Failed to arabify text: {str(e)}")


@router.get("/arabify/preview")
async def preview_tweet(url: str):
    """
    Preview tweet content without arabifying.

    Useful for validating the URL and showing tweet preview.
    """
    tweet_id = extract_tweet_id(url)
    if not tweet_id:
        raise HTTPException(400, "Invalid Twitter/X URL format")

    tweet_data = await fetch_tweet(url)
    if "error" in tweet_data:
        raise HTTPException(400, tweet_data["error"])

    return tweet_data

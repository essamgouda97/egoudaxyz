"""
Arabifier Agent - Converts text to modern Egyptian Arabic.

Uses AI to translate/convert text to casual Egyptian Arabic (Masri)
with natural English code-switching, as commonly used on social media.
"""

import logging

from pydantic import BaseModel
from pydantic_ai import Agent, RunContext

from app.agent.tools.twitter import fetch_tweet
from app.core.config import settings

logger = logging.getLogger(__name__)


class ArabifierDeps(BaseModel):
    """Dependencies for the arabifier agent."""

    class Config:
        arbitrary_types_allowed = True


class ArabifiedOutput(BaseModel):
    """Output from the arabifier agent."""

    original_text: str
    arabified_text: str
    author_name: str | None = None
    author_username: str | None = None
    note: str | None = None


ARABIFIER_SYSTEM_PROMPT = """You are an expert in Egyptian Arabic (Masri/العامية المصرية) and social media language. Your task is to "Arabify" English tweets - converting them to modern, casual Egyptian Arabic as it's naturally written on social media.

CRITICAL GUIDELINES FOR ARABIFICATION:

1. **Egyptian Dialect ONLY**: Use Egyptian Arabic (Masri), NEVER Modern Standard Arabic (Fusha). Examples:
   - "What" = "ايه" NOT "ماذا"
   - "Why" = "ليه" NOT "لماذا"
   - "Like this" = "كده" NOT "هكذا"
   - "Now" = "دلوقتي" NOT "الآن"
   - "Want" = "عايز/عايزة" NOT "أريد"
   - "Good" = "كويس" NOT "جيد"
   - "A lot" = "كتير" NOT "كثير"
   - "He/She says" = "بيقول/بتقول" NOT "يقول"
   - "Going to" = "هـ" prefix (هروح، هعمل) NOT "سوف"

2. **Natural Code-Switching**: Egyptians naturally mix English words in casual speech. KEEP certain English words when they feel natural:
   - Tech terms: post, tweet, like, share, app, phone, laptop, code, bug, feature, API, stack
   - Common borrowed words: okay, cool, nice, thanks, sorry, literally, actually, basically
   - Brand names and proper nouns (Claude, Pydantic, FastAPI, etc.)
   - Words without natural Egyptian equivalents
   - Example: "الـpost ده literally killed me" NOT "المنشور ده قتلني حرفيا"
   - Example: "الـstack ده actually insane" NOT "المجموعة دي مجنونة"

3. **Tone & Style**:
   - Match the original tweet's energy and emotion exactly
   - Preserve humor, sarcasm, enthusiasm, and intent
   - Use appropriate Egyptian expressions and idioms when fitting
   - Keep emojis exactly as they are
   - Make it sound like a real Egyptian developer/tech person wrote it

4. **Script Rules**:
   - Write Arabic words in Arabic script
   - Keep English words in Latin script when mixing (this is how Egyptians actually write online)
   - Use "الـ" before English nouns when appropriate (الـAPI, الـcode, الـstack)

5. **Preserve Structure**:
   - Maintain numbered lists, bullet points
   - Keep hashtags as-is
   - Keep mentions (@username) as-is
   - Preserve line breaks and formatting

EXAMPLES:

Input: "Claude code + pydantic ai + fastapi + nextjs + pydantic logfire is actually an insane stack, I have a solid overview over the full market right now."
Output: "Claude code + pydantic ai + fastapi + nextjs + pydantic logfire الـstack ده actually insane، عندي overview كامل على الـmarket دلوقتي."

Input: "1. I can check my research polymarket trading bot as it thinks"
Output: "1. اقدر اشوف الـresearch polymarket trading bot بتاعي وهو بيفكر"

Input: "2. I can track all my trades (paper trading mode only now)"
Output: "2. اقدر اتابع كل الـtrades بتاعتي (paper trading mode بس دلوقتي)"

Input: "This is so funny I'm crying"
Output: "ده funny اوي انا هموت من الضحك 😭"

Input: "Just posted a new video, check it out!"
Output: "لسه نازل video جديد، شوفوه!"

Input: "Why is everyone talking about this?"
Output: "ليه كل الناس بتتكلم عن الموضوع ده؟"

Input: "I can't believe this actually works"
Output: "مش مصدق ان ده actually شغال"

When you receive text to arabify, convert it following these guidelines while maintaining the original meaning, vibe, and technical accuracy."""


arabifier_agent = Agent(
    settings.MONITOR_MODEL,
    deps_type=ArabifierDeps,
    output_type=ArabifiedOutput,
    system_prompt=ARABIFIER_SYSTEM_PROMPT,
)


@arabifier_agent.tool
async def get_tweet_content(ctx: RunContext[ArabifierDeps], tweet_url: str) -> dict:
    """
    Fetch tweet content from a Twitter/X URL.

    Args:
        tweet_url: The URL of the tweet to fetch

    Returns:
        Tweet data including text, author, and metadata
    """
    logger.info(f"Fetching tweet: {tweet_url}")
    return await fetch_tweet(tweet_url)


async def arabify_tweet(tweet_url: str) -> ArabifiedOutput:
    """
    Arabify a tweet given its URL.

    Args:
        tweet_url: Twitter/X URL

    Returns:
        ArabifiedOutput with original and arabified text
    """
    logger.info(f"Arabifying tweet: {tweet_url}")

    deps = ArabifierDeps()
    result = await arabifier_agent.run(
        f"Fetch the tweet from this URL using the get_tweet_content tool, then arabify the tweet text: {tweet_url}",
        deps=deps,
    )

    return result.output


async def arabify_text(text: str) -> ArabifiedOutput:
    """
    Arabify raw text (for direct text input without URL).

    Args:
        text: Text to arabify

    Returns:
        ArabifiedOutput with original and arabified text
    """
    logger.info("Arabifying direct text input")

    deps = ArabifierDeps()
    result = await arabifier_agent.run(
        f"Arabify this text (no need to fetch anything, just convert it directly). "
        f"Set original_text to the input and arabified_text to your conversion:\n\n{text}",
        deps=deps,
    )

    return result.output

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

# =============================================================================
# EXAMPLE TWEETS - Edit these to match your personal style
# Format: (original_english, arabified_egyptian)
# These are used as few-shot examples to guide the AI's arabification style
# =============================================================================
EXAMPLE_TWEETS: list[tuple[str, str]] = [
    # Tech announcement - shows code-switching with Arabic sentence structure
    (
        "Just shipped a new feature that I've been working on for weeks. The API is so clean now.",
        "لسه نازل feature جديدة كنت شغال عليها من اسابيع. الـAPI بقى clean جداً دلوقتي.",
    ),
    # Casual reaction - Egyptian expressions
    (
        "This is literally the funniest thing I've seen all day",
        "ده literally أضحك حاجة شوفتها النهاردة",
    ),
    # Question/engagement - natural flow
    (
        "What's your favorite tool for building APIs? I've been using FastAPI and it's amazing",
        "ايه أحسن tool بتستخدموها لبناء APIs؟ انا بستخدم FastAPI وهي amazing",
    ),
    # Excitement/hype
    (
        "The new Claude model is insane. I can't believe how good it is at coding.",
        "الـClaude model الجديد ده insane. مش مصدق قد ايه هو كويس في الـcoding.",
    ),
    # Sharing work
    (
        "Been working on this project for months and it's finally live! Check it out",
        "شغال على الـproject ده من شهور واخيراً live! شوفوه",
    ),
    # Add your own examples below - the more examples, the better the style matching
]


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


def _build_examples_section() -> str:
    """Build the examples section from EXAMPLE_TWEETS."""
    if not EXAMPLE_TWEETS:
        return ""

    lines = ["REFERENCE EXAMPLES (match this style closely):"]
    for i, (english, arabic) in enumerate(EXAMPLE_TWEETS, 1):
        lines.append(f"\nExample {i}:")
        lines.append(f'English: "{english}"')
        lines.append(f'Egyptian: "{arabic}"')

    return "\n".join(lines)


ARABIFIER_SYSTEM_PROMPT = f"""You are an expert in Egyptian Arabic (Masri/العامية المصرية). Your task is to "Arabify" English tweets into natural Egyptian Arabic as written on social media.

IMPORTANT: Convert AS MUCH AS POSSIBLE to Arabic. The output should be primarily Arabic with only selective English.

## DIALECT RULES (Egyptian Arabic ONLY - NO Fusha):
- "What" = "ايه" (NOT ماذا)
- "Why" = "ليه" (NOT لماذا)
- "Now" = "دلوقتي" (NOT الآن)
- "Want" = "عايز" (NOT أريد)
- "Good" = "كويس" (NOT جيد)
- "A lot" = "كتير" (NOT كثير)
- "Going to" = "هـ" prefix (هروح، هعمل) (NOT سوف)
- "Can" = "اقدر" (NOT أستطيع)
- "Because" = "عشان" (NOT لأن)
- "Thing" = "حاجة" (NOT شيء)

## WHAT TO CONVERT TO ARABIC (do this!):
- Common verbs: working → شغال, believe → مصدق, check → شوف, see → شوف
- Common nouns: people → ناس, time → وقت, way → طريقة
- Adjectives: good → كويس, new → جديد, amazing → رهيب
- Adverbs: really → فعلاً, finally → اخيراً, already → خلاص
- Pronouns & connectors: this → ده/دي, that → ده, I → انا, we → احنا

## WHAT TO KEEP IN ENGLISH (only these):
- Brand names: Claude, Pydantic, FastAPI, React, etc.
- Technical nouns with no good equivalent: API, stack, code, bug, feature, bot, model
- A few common borrowed words that Egyptians actually use: cool, nice, literally, actually, insane
- Hashtags and @mentions

## FORMATTING:
- Arabic words in Arabic script
- English words in Latin script
- Use "الـ" before English nouns (الـAPI, الـstack, الـfeature)
- Preserve emojis, line breaks, numbered lists

{_build_examples_section()}

## BAD vs GOOD:
BAD (too much English): "I've been working on this project for months"
GOOD: "شغال على الـproject ده من شهور"

BAD (Fusha): "أنا سعيد جداً بهذا"
GOOD: "انا مبسوط اوي بده"

Convert the text to Egyptian Arabic following these guidelines. Match the style of the reference examples closely."""


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

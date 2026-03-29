---
name: arabify
description: Translate a blog post to Egyptian Arabic (Masri). Creates or updates the Arabic version at src/lib/blog/ar/{slug}.md
argument-hint: "[slug]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Blog Arabifier

Translate a blog post from English to natural Egyptian Arabic.

## Arguments

- `/arabify coding-bible` → Translate the post with that slug
- `/arabify` (no args) → List available English posts and ask which to translate

Arguments received: `$ARGUMENTS`

## Workflow

1. Read the English post from `src/lib/blog/{slug}.md`
2. Translate the prose to Egyptian Arabic following the dialect rules below
3. Write the Arabic version to `src/lib/blog/ar/{slug}.md`
4. Keep the same frontmatter but add `lang: ar`
5. Run `npm run check` to verify

## Egyptian Arabic Dialect Rules — CRITICAL

You MUST use Egyptian Arabic (Masri/العامية المصرية). NEVER use Modern Standard Arabic (Fusha).

### Dialect vocabulary:
- "What" = "ايه" (NOT ماذا)
- "Why" = "ليه" (NOT لماذا)
- "Now" = "دلوقتي" (NOT الآن)
- "Want" = "عايز" (NOT أريد)
- "Good" = "كويس" (NOT جيد)
- "A lot" = "كتير" (NOT كثير)
- "Going to" = "هـ" prefix like هروح، هعمل (NOT سوف)
- "Can" = "اقدر" (NOT أستطيع)
- "Because" = "عشان" (NOT لأن)
- "Thing" = "حاجة" (NOT شيء)

### Convert to Arabic:
- Common verbs: working → شغال, believe → مصدق, check → شوف, see → شوف
- Common nouns: people → ناس, time → وقت, way → طريقة
- Adjectives: good → كويس, new → جديد, amazing → رهيب
- Adverbs: really → فعلاً, finally → اخيراً, already → خلاص
- Pronouns & connectors: this → ده/دي, that → ده, I → انا, we → احنا

### Keep in English:
- Brand names: Claude, Pydantic, FastAPI, React, etc.
- Technical nouns with no good equivalent: API, stack, code, bug, feature, bot, model
- A few common borrowed words that Egyptians actually use: cool, nice, literally, actually, insane
- Hashtags and @mentions

### Formatting:
- Arabic words in Arabic script, English words in Latin script
- Use "الـ" before English nouns (الـAPI, الـstack, الـfeature)
- Preserve emojis, line breaks, numbered lists
- START each sentence with Arabic words when possible (helps RTL rendering)
- Group English terms together rather than scattering them

## Style Examples

These show the target style:

| English | Egyptian Arabic |
|---------|----------------|
| "Claude code + pydantic ai + fastapi is actually an insane stack" | "الـstack ده بتاع Claude code + pydantic ai + fastapi فعلاً insane" |
| "Just shipped a new feature I've been working on for weeks" | "لسه نازل feature جديدة كنت شغال عليها من اسابيع" |
| "This is literally the funniest thing I've seen all day" | "ده literally أضحك حاجة شوفتها النهاردة" |
| "Been working on this project for months and it's finally live!" | "شغال على الـproject ده من شهور واخيراً live! شوفوه" |

## What to translate vs preserve

- **Translate**: all prose, headings, descriptions, list items
- **Preserve as-is**: code blocks, inline code, mermaid diagrams, URLs, image paths, frontmatter keys
- **Heading structure**: keep the same heading levels (## → ##), just translate the text

## Author style reference

@Gouda_of_Alex on Twitter — terse, punchy, direct. Short fragments. The Arabic should match that energy. No fluff, no formal greetings, no unnecessary padding.

## BAD vs GOOD examples

BAD (too much English): "I've been working on this project for months"
GOOD: "شغال على الـproject ده من شهور"

BAD (Fusha): "أنا سعيد جداً بهذا المشروع"
GOOD: "انا مبسوط اوي بالـproject ده"

BAD (Weird/unnatural): "هذا المقال يتحدث عن"
GOOD: "المقال ده عن"

---
name: arabify
description: Translate egouda.xyz English blog posts to natural Egyptian Arabic. Use when the user invokes /arabify or $arabify, asks to translate a post, update a Masri version, or create src/lib/blog/ar/{slug}.md from src/lib/blog/{slug}.md.
---

# Blog Arabifier

Translate an English blog post from `src/lib/blog/{slug}.md` into natural Egyptian Arabic at `src/lib/blog/ar/{slug}.md`.

## Request Parsing

Treat these as equivalent:

- `/arabify coding-bible`
- `$arabify coding-bible`
- `arabify coding-bible`

If no slug is provided, list English posts in `src/lib/blog/` and ask which one to translate.

## Workflow

1. Read the English post from `src/lib/blog/{slug}.md`.
2. Translate prose to Egyptian Arabic using the dialect rules below.
3. Write or update `src/lib/blog/ar/{slug}.md`.
4. Keep the same frontmatter keys, translate human-readable values such as `title`, `description`, and `excerpt`, and add `lang: ar`.
5. Preserve code blocks, inline code, URLs, image paths, and Mermaid diagrams.
6. Run `npm run check` unless the user explicitly asks not to.

## Egyptian Arabic Rules

Use Egyptian Arabic, Masri, العامية المصرية. Never use Modern Standard Arabic, Fusha.

Use these words:

- What: "ايه", not "ماذا"
- Why: "ليه", not "لماذا"
- Now: "دلوقتي", not "الآن"
- Want: "عايز", not "أريد"
- Good: "كويس", not "جيد"
- A lot: "كتير", not "كثير"
- Going to: "هـ" prefix like "هروح" and "هعمل", not "سوف"
- Can: "اقدر", not "أستطيع"
- Because: "عشان", not "لأن"
- Thing: "حاجة", not "شيء"

Prefer these natural conversions:

- working -> شغال
- believe -> مصدق
- check or see -> شوف
- people -> ناس
- time -> وقت
- way -> طريقة
- really -> فعلاً
- finally -> اخيراً
- already -> خلاص
- this -> ده or دي
- we -> احنا

## Keep In English

Keep brand names and technical terms that Egyptians naturally leave in English, such as Claude, Pydantic, FastAPI, React, API, stack, code, bug, feature, bot, and model.

Use `الـ` before English nouns when it sounds natural, such as `الـAPI`, `الـstack`, and `الـfeature`.

Preserve hashtags, mentions, URLs, code, image paths, and Markdown structure.

## Style

The target voice is terse, punchy, and direct. No formal greetings, no padding, and no Fusha. Start sentences with Arabic words when possible to help RTL rendering. Group English technical terms together rather than scattering them.

Examples:

| English | Egyptian Arabic |
| --- | --- |
| "Claude code + pydantic ai + fastapi is actually an insane stack" | "الـstack ده بتاع Claude code + pydantic ai + fastapi فعلاً insane" |
| "Just shipped a new feature I've been working on for weeks" | "لسه نازل feature جديدة كنت شغال عليها من اسابيع" |
| "This is literally the funniest thing I've seen all day" | "ده literally أضحك حاجة شوفتها النهاردة" |
| "Been working on this project for months and it's finally live!" | "شغال على الـproject ده من شهور واخيراً live! شوفوه" |

Bad vs good:

- Bad: "أنا سعيد جداً بهذا المشروع"
- Good: "انا مبسوط اوي بالـproject ده"
- Bad: "هذا المقال يتحدث عن"
- Good: "المقال ده عن"

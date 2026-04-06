---
title: 'Mizan: AI data visual layer'
date: '2026-04-06'
description: 'Building a civic transparency platform for Egyptian government data — budget, debt, parliament, constitution — all cited, all open.'
tags: [mizan, civic-tech, egypt, open-data]
---

> الإِسْنَادُ مِنَ الدِّينِ، وَلَوْلَا الإِسْنَادُ لَقَالَ مَنْ شَاءَ مَا شَاءَ
>
> — عبد الله بن المبارك (ت. 181 هـ / 797 م)

> "The isnad is part of the religion; were it not for the isnad, whoever wished would say whatever they wished."
>
> — Abdullah ibn al-Mubarak (d. 181 AH / 797 CE)

The isnad tradition is simple: every claim must have a chain of sources. No chain, no trust.

1,400 years ago, Islamic scholars solved the misinformation problem. They didn't trust what someone said — they asked *who told you, and who told them*. A hadith without a chain of narrators was worthless. The chain was the proof.

That principle is the backbone of [Mizan](https://github.com/Ba3lisa/mizan).

## The problem

Egyptian government data exists. Budget numbers, debt figures, parliament members, constitutional text. But it's scattered across government PDFs, JavaScript-rendered portals, and websites that change without notice. No APIs. No structured formats. No single place to look. No chain of custody for the numbers.

Mizan (ميزان — "scales") makes it visible. All cited. All searchable. Arabic and English.

## Three layers

<iframe src="https://link.excalidraw.com/readonly/x42SpU7K9nrKqvhJ8PTx?darkMode=true" width="100%" height="100%" style="border: none;"></iframe>

The [architecture](https://github.com/Ba3lisa/mizan/blob/main/docs/architecture.md) is three layers:

**Visual** — Next.js 15 + React 19 frontend. Sankey charts for budget flows, hemicycle for parliament, full-text constitution search, governorate maps. Bilingual by design. Currency toggle between EGP and USD.

**Data** — [26 Convex tables](https://github.com/Ba3lisa/mizan/blob/main/app/convex/schema.ts). Every record carries a `sourceUrl`. No hardcoded numbers. Budget items, debt records, 896 parliament members, 247 constitutional articles (with 2019 amendments), election results by governorate. Recently expanded to include ministry sectors with employee counts and 128+ live constitution articles wired from the database.

**Agentic** — the [data agent](https://github.com/Ba3lisa/mizan/blob/main/app/convex/agents/dataAgent.ts) runs every 6 hours. Fetches from official sources, parses with Claude when needed, validates with [deterministic checks](https://github.com/Ba3lisa/mizan/blob/main/app/convex/agents/validators.ts), and writes only if the data passes. Every refresh is logged in the [transparency page](https://github.com/Ba3lisa/mizan/blob/main/docs/architecture.md).

## The data pipeline

Not all sources are equal. The agent treats them differently:

| Source | Method | Trust |
|--------|--------|-------|
| World Bank API | Automated JSON | High — structured API |
| Ministry of Finance | Claude parses HTML | Medium — human reviews |
| Cabinet portal | Claude parses HTML | Medium — never auto-writes |
| Parliament | Manual curation | High — but stale (JS SPA) |
| Constitution | Static | Highest — changes need referendum |

Validation is deterministic. Budget items must sum to the total (±0.01). Parliament must have exactly 596 House + 300 Senate members. Debt-to-GDP ratios must stay under 200%. If validation fails, the update is rejected and flagged.

## The LLM Council — isnad for the modern age

This is where isnad meets AI.

The scholars had a [science of narrator criticism](https://en.wikipedia.org/wiki/Biographical_evaluation) (*ilm al-jarh wa al-ta'dil*) — they graded narrators as trustworthy, weak, or rejected. Mizan applies the same logic to data sources, with LLMs as the evaluators.

When a citizen submits a correction via [GitHub Issues](https://github.com/Ba3lisa/mizan/issues), the [council system](https://github.com/Ba3lisa/mizan/blob/main/app/convex/council.ts) kicks in:

1. The [GitHub agent](https://github.com/Ba3lisa/mizan/blob/main/app/convex/agents/githubAgent.ts) classifies the issue, runs spam checks
2. A council session is created — LLM providers evaluate the claim against its source
3. Votes are tallied based on **source classification**:

| Source tier | Example | Threshold |
|-------------|---------|-----------|
| `.gov.eg` | mof.gov.eg | Single approval |
| International org | World Bank, IMF | Majority |
| Media | Reuters, Al-Ahram | Unanimous |
| Other | Unknown | Advisory only — human decides |

High-sensitivity changes (cabinet, elections, constitution, 10+ records) always require human approval, even if the council unanimously agrees.

Currently it's Claude 3.5 Haiku as the sole [provider](https://github.com/Ba3lisa/mizan/blob/main/app/convex/agents/providers/anthropic.ts). The roadmap is multi-model consensus — Claude + OpenAI + Google + Grok + open source models — because a single narrator is never enough.

## What's live

- **Budget explorer** — Sankey diagrams tracing revenue to expenditure, plus a personal breakdown showing where your tax money goes
- **Debt tracker** — time-series from World Bank data, breakdown by creditor
- **Parliament** — all 896 members, party breakdown, committee assignments
- **Government** — cabinet, ministries with sector breakdowns and employee counts, 27 governorates
- **Constitution** — 128+ articles searchable, full 2014 text with amendments
- **Elections** — results with interactive governorate maps
- **Transparency page** — audit trail of every data refresh

## Where this is going

The full [roadmap](https://github.com/Ba3lisa/mizan/blob/main/docs/ROADMAP.md) is on GitHub. The short version:

**Next up** — economic indicators dashboard (GDP, inflation, reserves, exchange rates) and expanding the LLM council to multiple model providers.

**After that** — government promises tracker (Vision 2030, campaign commitments, megaprojects), per-governorate dashboards, legislation tracker, corruption indices from Transparency International.

**The bigger vision** — the LLM council + isnad model isn't limited to government data. It's a general fact-checking system. Any claim, any source chain, evaluated by multiple models with weighted trust based on source credibility. The scholars built the methodology for authenticating knowledge. LLMs can scale it to everything.

Community contributes data corrections through [issues](https://github.com/Ba3lisa/mizan/issues). Code is agent-written, human-approved. See the [contributing guide](https://github.com/Ba3lisa/mizan/blob/main/CONTRIBUTING.md).

---

Every number has a source. Every source has a URL. Every correction goes through a council. The isnad scholars figured this out 1,400 years ago. We're just adding LLMs.

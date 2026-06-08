# Codex Instructions

This is Essam Gouda's personal SvelteKit 5 site: blog, portfolio, and services pages.

Use `CLAUDE.md` as shared repo context when you need broader architecture, deployment, or project conventions. Codex-specific instructions in this file take precedence.

## Repo Rules

- Use `npm` for frontend commands.
- Do not push, deploy, or promote changes to production unless explicitly asked.
- Do not start the dev server unless the user asks. Prefer compile and check commands for validation.
- Keep boilerplate and unrelated refactors minimal.

## Codex Skills

Repo-local Codex skills live in `.codex/skills/`.

- Blog writing: when the user invokes `/blog`, `$blog`, `blog new`, `blog edit`, or asks to create, draft, proofread, or edit a site blog post, read and follow `.codex/skills/blog/SKILL.md`.
- Arabify: when the user invokes `/arabify`, `$arabify`, or asks to translate a blog post to Egyptian Arabic, read and follow `.codex/skills/arabify/SKILL.md`.

## Blog Paths

- English posts: `src/lib/blog/*.md`
- Arabic translations: `src/lib/blog/ar/*.md`
- The app supports both `description` and older `excerpt` frontmatter fields.

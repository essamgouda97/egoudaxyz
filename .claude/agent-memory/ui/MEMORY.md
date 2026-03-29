# UI Agent Memory

## Conventions
- SvelteKit 5 with Svelte 5 runes ($state, $derived, $effect)
- Tailwind CSS 4 utility-first
- bits-ui for headless components
- Server-side data loading via +page.server.ts
- Space Grotesk font (English), Cairo font (Arabic)
- Theme: "Space Dark" + "Beige" via CSS variables in app.css

## Patterns
- Blog posts rendered via markdown-it with mermaid/KaTeX/highlight.js
- Arabic translations in src/lib/blog/ar/ with language toggle
- RTL support via dir="rtl" attribute + Cairo font
- Mermaid diagrams loaded via dynamic import (code-split)

## Active State
- Blog + portfolio site (dashboard removed 2026-03-26)

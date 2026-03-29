import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import matter from "gray-matter";

/**
 * Normalize tags to string[]
 */
function normalizeTags(tags: unknown): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map((t) => String(t));
  if (typeof tags === "string") {
    // Try JSON array first, else fallback to comma-separated values
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) return parsed.map((t) => String(t));
    } catch {
      /* not JSON */
    }
    return tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Simple reading time estimation (200 wpm)
 */
function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/**
 * Normalize various date inputs to YYYY-MM-DD (timezone agnostic).
 * Accepts:
 *  - "YYYY-MM-DD" (returned as-is)
 *  - Any Date-parsable string (converted via toISOString().slice(0,10))
 *  - number (timestamp)
 *  - Date instance
 */
function normalizeDate(input: unknown): string | undefined {
  if (!input) return undefined;

  if (typeof input === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
    const d = new Date(input);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return undefined;
  }

  if (typeof input === "number") {
    const d = new Date(input);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return undefined;
  }

  if (input instanceof Date && !isNaN(input.getTime())) {
    return input.toISOString().slice(0, 10);
  }

  return undefined;
}

/**
 * Create a Markdown-It instance with KaTeX and highlight.js configured.
 * Also rewrites relative image src paths to serve from /blog/.
 *
 * Note: dynamic imports are used to avoid TypeScript type issues for these libs
 * in environments without their type declarations installed.
 */
/**
 * markdown-it plugin for KaTeX math using the modern katex package.
 * Handles both inline ($...$) and display ($$...$$) math.
 * katexLib must be passed in since we can't use require() in ESM.
 */
function mathPlugin(md: any, katexLib: any) {
  // Inline math: $...$
  md.inline.ruler.after("escape", "math_inline", (state: any, silent: boolean) => {
    if (state.src[state.pos] !== "$") return false;
    // Don't match $$
    if (state.src[state.pos + 1] === "$") return false;

    const start = state.pos + 1;
    let end = start;
    while (end < state.posMax && state.src[end] !== "$") {
      if (state.src[end] === "\\") end++; // skip escaped chars
      end++;
    }
    if (end >= state.posMax) return false;

    if (!silent) {
      const token = state.push("math_inline", "math", 0);
      token.markup = "$";
      token.content = state.src.slice(start, end);
    }
    state.pos = end + 1;
    return true;
  });

  // Display math: $$...$$
  md.block.ruler.after("blockquote", "math_block", (state: any, startLine: number, endLine: number, silent: boolean) => {
    const startPos = state.bMarks[startLine] + state.tShift[startLine];
    if (startPos + 2 > state.eMarks[startLine]) return false;
    if (state.src.slice(startPos, startPos + 2) !== "$$") return false;

    if (silent) return true;

    let nextLine = startLine;
    let found = false;
    while (++nextLine < endLine) {
      const lineStart = state.bMarks[nextLine] + state.tShift[nextLine];
      const lineEnd = state.eMarks[nextLine];
      const line = state.src.slice(lineStart, lineEnd).trim();
      if (line === "$$") {
        found = true;
        break;
      }
    }
    if (!found) return false;

    const token = state.push("math_block", "math", 0);
    token.block = true;
    token.content = state.getLines(startLine + 1, nextLine, state.tShift[startLine], true).trim();
    token.map = [startLine, nextLine + 1];
    token.markup = "$$";
    state.line = nextLine + 1;
    return true;
  });

  md.renderer.rules.math_inline = (tokens: any[], idx: number) => {
    const katex = katexLib;
    try {
      return katex.renderToString(tokens[idx].content, { throwOnError: false });
    } catch {
      return `<code>${md.utils.escapeHtml(tokens[idx].content)}</code>`;
    }
  };

  md.renderer.rules.math_block = (tokens: any[], idx: number) => {
    const katex = katexLib;
    try {
      return `<div class="katex-display">${katex.renderToString(tokens[idx].content, { displayMode: true, throwOnError: false })}</div>`;
    } catch {
      return `<pre><code>${md.utils.escapeHtml(tokens[idx].content)}</code></pre>`;
    }
  };
}

async function createMarkdownRenderer() {
  const [{ default: MarkdownIt }, hljsMod, katexMod] =
    await Promise.all([
      import("markdown-it"),
      import("highlight.js"),
      import("katex"),
    ]);

  const katexLib = (katexMod as any).default ?? katexMod;

  // Some bundlers expose highlight.js under default, others not
  const hljs = (hljsMod as any).default ?? hljsMod;

  const md = new MarkdownIt({
    html: true,
    linkify: true,
    breaks: false,
    highlight(str: string, lang?: string) {
      // Mermaid: output raw content in a div for client-side rendering
      if (lang === "mermaid") {
        return `<div class="mermaid">${(md as any).utils.escapeHtml(str)}</div>`;
      }
      try {
        if (lang && hljs.getLanguage(lang)) {
          return `<pre><code class="hljs language-${lang}">${hljs.highlight(str, { language: lang }).value}</code></pre>`;
        }
        // Auto-detect
        return `<pre><code class="hljs">${hljs.highlightAuto(str).value}</code></pre>`;
      } catch {
        // Fallback
        return `<pre><code>${(md as any).utils.escapeHtml(str)}</code></pre>`;
      }
    },
  });

  mathPlugin(md, katexLib);

  // Rewrite relative image sources to /blog/<path>
  const defaultImageRule =
    (md.renderer.rules.image as any) ??
    function (tokens: any, idx: number, options: any, _env: any, self: any) {
      return self.renderToken(tokens, idx, options);
    };

  (md.renderer.rules as any).image = function (
    tokens: any,
    idx: number,
    options: any,
    env: any,
    self: any,
  ) {
    const token = tokens[idx];
    const srcIdx = token.attrIndex("src");
    if (srcIdx >= 0 && token.attrs) {
      const src = token.attrs[srcIdx][1] || "";
      const isAbsolute = src.startsWith("/") || /^[a-z]+:\/\//i.test(src);
      if (!isAbsolute) {
        // Normalize leading ./ if present
        const normalized = src.replace(/^\.\//, "");
        token.attrs[srcIdx][1] = `/blog/${normalized}`;
      }
    }
    return defaultImageRule(tokens, idx, options, env, self);
  };

  return md;
}

export const load: PageServerLoad = async ({ params }) => {
  const { slug } = params;

  // Sanitize slug and explicitly skip disallowed items
  const safeSlug = slug.replace(/[^a-z0-9\-]/gi, "");
  if (safeSlug !== slug || safeSlug.toLowerCase() === "agents") {
    throw error(404, "Blog post not found");
  }

  // Eagerly import raw markdown files from the source tree (no fs/path).
  const modules = import.meta.glob("/src/lib/blog/*.md", {
    query: "?raw",
    import: "default",
    eager: true,
  }) as Record<string, string>;

  const match = Object.entries(modules).find(([fp]) =>
    fp.endsWith(`/${safeSlug}.md`),
  );
  if (!match) {
    throw error(404, `Blog post not found: ${safeSlug}`);
  }

  const raw = match[1];

  // Parse frontmatter
  const { data: fm, content: mdContent } = matter(raw);

  // Render markdown to HTML via our configured renderer
  const md = await createMarkdownRenderer();
  let html: string;
  try {
    html = md.render(mdContent);
  } catch {
    // If a single post fails to render, do not bring down the site:
    throw error(404, `Blog post could not be rendered: ${safeSlug}`);
  }

  const title = (fm?.title as string) || safeSlug.replace(/-/g, " ");
  const description =
    (fm?.description as string) || (fm?.excerpt as string) || "";
  const date = normalizeDate(fm?.date);
  const tags = normalizeTags(fm?.tags);
  const readingTime =
    typeof (fm as any)?.readingTime === "number" &&
    isFinite((fm as any).readingTime)
      ? Math.max(1, Math.ceil((fm as any).readingTime))
      : typeof (fm as any)?.readingTime === "string" &&
          isFinite(Number((fm as any).readingTime))
        ? Math.max(1, Math.ceil(Number((fm as any).readingTime)))
        : estimateReadingTime(mdContent);

  // Check for Arabic translation
  const arModules = import.meta.glob("/src/lib/blog/ar/*.md", {
    query: "?raw",
    import: "default",
    eager: true,
  }) as Record<string, string>;

  const arMatch = Object.entries(arModules).find(([fp]) =>
    fp.endsWith(`/${safeSlug}.md`),
  );

  let contentAr: string | null = null;
  let titleAr: string | null = null;
  let hasArabic = false;

  if (arMatch) {
    try {
      const { data: arFm, content: arMdContent } = matter(arMatch[1]);
      contentAr = md.render(arMdContent);
      titleAr = (arFm?.title as string) || null;
      hasArabic = true;
    } catch {
      // Arabic version failed to render, skip it
    }
  }

  return {
    slug: safeSlug,
    title,
    titleAr,
    description,
    date,
    tags,
    readingTime,
    content: html,
    contentAr,
    hasArabic,
  };
};

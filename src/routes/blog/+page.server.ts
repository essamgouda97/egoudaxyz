import type { PageServerLoad } from "./$types";
import matter from "gray-matter";

type PostListItem = {
  slug: string;
  title: string;
  description?: string;
  date?: string;
  tags: string[];
  readingTime: number;
};

/**
 * Normalize tags frontmatter into a string array.
 * Supports array, comma-separated string, and JSON string array.
 */
function normalizeTags(tags: unknown): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map((t) => String(t));
  if (typeof tags === "string") {
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) return parsed.map((t) => String(t));
    } catch {
      // not JSON - fall through to comma-separated parsing
    }
    return tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
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
 * Simple reading time estimate at ~200 words per minute.
 */
function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export const load: PageServerLoad = async () => {
  // Use Vite to eagerly import raw markdown from the source tree.
  // This avoids Node.js 'fs'/'path' types on the server and keeps TS happy.
  const modules = import.meta.glob("/src/lib/blog/*.md", {
    query: "?raw",
    import: "default",
    eager: true,
  }) as Record<string, string>;

  const posts: PostListItem[] = Object.entries(modules)
    .map(([filepath, raw]) => {
      // Derive slug from filename
      const filename = filepath.split("/").pop() ?? "";
      const slug = filename.replace(/\.md$/i, "");

      // Parse frontmatter
      const { data: fm, content } = matter(raw);

      const title = (fm?.title as string) || slug;
      const description =
        (fm?.description as string) || (fm?.excerpt as string) || undefined;
      const date = normalizeDate(fm?.date);
      const tags = normalizeTags(fm?.tags);

      let readingTime = estimateReadingTime(content);
      if (typeof fm?.readingTime === "number" && isFinite(fm.readingTime)) {
        readingTime = Math.max(1, Math.ceil(fm.readingTime));
      } else if (
        typeof fm?.readingTime === "string" &&
        isFinite(Number(fm.readingTime))
      ) {
        readingTime = Math.max(1, Math.ceil(Number(fm.readingTime)));
      }

      return { slug, title, description, date, tags, readingTime };
    })
    // Filter out any malformed entries just in case
    .filter((p) => Boolean(p?.slug && p?.title))
    // Newest first
    .sort((a, b) => {
      const ta = a.date ? Date.parse(a.date) : 0;
      const tb = b.date ? Date.parse(b.date) : 0;
      return tb - ta;
    });

  return { posts };
};

import type { RequestHandler } from "./$types";
import { json, error } from "@sveltejs/kit";
import matter from "gray-matter";

function coerceTags(input: unknown): string[] | undefined {
  if (input == null) return undefined;
  if (Array.isArray(input)) return input.map(String);
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {}
    return input.split(",").map((t) => t.trim()).filter(Boolean);
  }
  return undefined;
}

export const GET: RequestHandler = async ({ params }) => {
  const { slug } = params;

  if (!slug || !/^[a-z0-9-]+$/i.test(slug)) {
    throw error(400, "Invalid slug");
  }

  const modules = import.meta.glob("/src/lib/blog/*.md", {
    query: "?raw",
    import: "default",
    eager: true,
  }) as Record<string, string>;

  const entry = Object.entries(modules).find(([filepath]) => {
    const name = filepath.split("/").pop()?.replace(/\.md$/i, "");
    return name?.toLowerCase() === slug.toLowerCase();
  });

  if (!entry) {
    throw error(404, "Post not found");
  }

  const [, raw] = entry;
  const { data, content } = matter(raw);

  const title = (data?.title as string) ?? slug;
  const description =
    (data?.description as string) || (data?.excerpt as string) || undefined;
  const date = (data?.date as string) || undefined;
  const tags = coerceTags(data?.tags);

  return json(
    { slug, title, description, date, tags, content },
    {
      headers: {
        "Cache-Control": "public, max-age=300",
      },
    },
  );
};

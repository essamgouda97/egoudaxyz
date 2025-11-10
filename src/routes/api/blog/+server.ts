import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";
import matter from "gray-matter";

type PostListItem = {
  slug: string;
  title: string;
  description?: string;
  date?: string;
  tags?: string[] | string;
};

function toSlugFromPath(filepath: string): string {
  const name = filepath.split("/").pop() ?? filepath;
  return name.replace(/\.md$/i, "");
}

function coerceTags(input: unknown): string[] | string | undefined {
  if (input == null) return undefined;
  if (Array.isArray(input)) return input.map(String);
  if (typeof input === "string") return input;
  return undefined;
}

export const GET: RequestHandler = async () => {
  // Eagerly import raw markdown files from the source tree.
  // This avoids Node 'fs'/'path' usage and works in both dev and build.
  const modules = import.meta.glob("/src/lib/blog/*.md", {
    query: "?raw",
    import: "default",
    eager: true,
  }) as Record<string, string>;

  const parsed = Object.entries(modules).map(([filepath, raw]) => {
    const { data } = matter(raw);

    const slug = toSlugFromPath(filepath);
    const title = (data?.title as string) ?? slug;
    const description =
      (data?.description as string) || (data?.excerpt as string) || undefined;
    const date = (data?.date as string) || undefined;
    const tags = coerceTags(data?.tags);

    const post: PostListItem = { slug, title, description, date, tags };
    return post;
  });

  const posts = parsed
    .filter((p) => Boolean(p?.slug))
    .sort((a, b) => {
      const ta = a.date ? Date.parse(a.date) : 0;
      const tb = b.date ? Date.parse(b.date) : 0;

      return tb - ta;
    });

  return json(
    { posts },
    {
      headers: {
        "Cache-Control": "public, max-age=60",
      },
    },
  );
};

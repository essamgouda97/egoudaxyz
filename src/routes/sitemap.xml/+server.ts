import type { RequestHandler } from './$types';
import matter from 'gray-matter';

const SITE_URL = 'https://egouda.xyz';

// Static pages with their priority and change frequency
const staticPages = [
  { path: '/', priority: 1.0, changefreq: 'weekly' },
  { path: '/blog', priority: 0.8, changefreq: 'daily' },
  { path: '/portfolio', priority: 0.9, changefreq: 'monthly' },
];

export const GET: RequestHandler = async () => {
  // Get blog posts dynamically
  const modules = import.meta.glob('/src/lib/blog/*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>;

  const blogPosts = Object.entries(modules).map(([filepath, raw]) => {
    const filename = filepath.split('/').pop() ?? '';
    const slug = filename.replace(/\.md$/i, '');
    const { data: fm } = matter(raw);

    // Get date for lastmod
    let lastmod: string | undefined;
    if (fm?.date) {
      const d = new Date(fm.date);
      if (!isNaN(d.getTime())) {
        lastmod = d.toISOString().split('T')[0];
      }
    }

    return {
      path: `/blog/${slug}`,
      priority: 0.7,
      changefreq: 'monthly',
      lastmod,
    };
  });

  const allPages = [...staticPages, ...blogPosts];
  const today = new Date().toISOString().split('T')[0];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${page.lastmod || today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'max-age=3600', // Cache for 1 hour
    },
  });
};

import { getPublishedArticles } from "@/lib/repositories/platformRepository";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const items = (await getPublishedArticles())
    .map(
      (article) => `<item>
  <title>${escapeXml(article.title)}</title>
  <link>${absoluteUrl(`/news/${article.slug}`)}</link>
  <guid>${absoluteUrl(`/news/${article.slug}`)}</guid>
  <description>${escapeXml(article.metaDescription)}</description>
  <pubDate>${new Date(article.publishedAt ?? article.createdAt).toUTCString()}</pubDate>
</item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>QuickGist</title>
  <link>${absoluteUrl("/")}</link>
  <description>Breaking stories and in-depth explainers from trusted global sources, curated by QuickGist editors.</description>
${items}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8"
    }
  });
}

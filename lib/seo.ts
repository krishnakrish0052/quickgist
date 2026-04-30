import { config } from "@/lib/config";
import type { Article } from "@/lib/types";

export function absoluteUrl(path: string): string {
  return new URL(path, config.siteUrl).toString();
}

export function articleJsonLd(article: Article) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.metaDescription,
    articleSection: article.category,
    keywords: article.tags?.join(", "),
    wordCount: article.contentMarkdown?.split(/\s+/).length ?? 0,
    datePublished: article.publishedAt ?? article.createdAt,
    dateModified: article.updatedAt,
    author: { "@type": "Organization", name: article.authorName ?? "QuickGist Editorial AI" },
    publisher: {
      "@type": "Organization",
      name: "QuickGist",
      logo: { "@type": "ImageObject", url: absoluteUrl("/quickgist-logo.png") }
    },
    image: article.heroImageUrl
      ? [{ "@type": "ImageObject", url: article.heroImageUrl, width: 1400, height: 788 }]
      : undefined,
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(`/news/${article.slug}`) },
    url: absoluteUrl(`/news/${article.slug}`),
    inLanguage: "en"
  };
}

export * from "@/lib/seo/schema";

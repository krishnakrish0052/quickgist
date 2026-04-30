/**
 * Typed JSON-LD schema builders for every QuickGist page type.
 * Reference: https://schema.org / Google Rich Results requirements.
 */

import { config } from "@/lib/config";
import type { Article } from "@/lib/types";

function abs(path: string): string {
  return new URL(path, config.siteUrl).toString();
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "QuickGist",
    url: config.siteUrl,
    description: "Source-grounded news summaries, explained clearly.",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${config.siteUrl}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string"
    }
  };
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "QuickGist",
    url: config.siteUrl,
    logo: { "@type": "ImageObject", url: abs("/quickgist-logo.png") },
    sameAs: []
  };
}

export function homeItemListSchema(articles: Pick<Article, "title" | "slug" | "metaDescription" | "heroImageUrl" | "publishedAt" | "createdAt">[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Top Stories",
    itemListElement: articles.slice(0, 10).map((a, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: abs(`/news/${a.slug}`),
      name: a.title
    }))
  };
}

export function newsArticleSchema(article: Article) {
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
      logo: { "@type": "ImageObject", url: abs("/quickgist-logo.png") }
    },
    image: article.heroImageUrl ? [{ "@type": "ImageObject", url: article.heroImageUrl, width: 1400, height: 788 }] : undefined,
    mainEntityOfPage: { "@type": "WebPage", "@id": abs(`/news/${article.slug}`) },
    url: abs(`/news/${article.slug}`),
    inLanguage: "en"
  };
}

export function collectionPageSchema(name: string, description: string, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: abs(url),
    breadcrumb: breadcrumbSchema([
      { name: "Home", url: "/" },
      { name, url }
    ])
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: abs(item.url)
    }))
  };
}

export function faqPageSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer }
    }))
  };
}

export function aboutPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About QuickGist",
    description: "QuickGist is a source-grounded news Content Operating Service (COS) that clusters signals, extracts verified facts, and synthesises human-quality articles.",
    url: abs("/about"),
    publisher: organizationSchema()
  };
}

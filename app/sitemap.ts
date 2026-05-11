import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { getArticles, getPublishedArticles } from "@/lib/repositories/platformRepository";
import { locales } from "@/i18n/routing";

export const dynamic = "force-dynamic";

function isHomepage(route: string): boolean {
  return route === "" || route === "/";
}

function isArticleOrExplainer(route: string): boolean {
  return route.startsWith("/news/") || route.startsWith("/explain/");
}

function isCategory(route: string): boolean {
  return route.startsWith("/category/");
}

function buildEntry(route: string) {
  const entry: MetadataRoute.Sitemap[number] = {
    url: absoluteUrl(route || "/"),
    lastModified: new Date(),
    alternates: {
      languages: Object.fromEntries(
        locales.map((locale) => [locale, absoluteUrl(`/${locale}${route}`)]),
      ),
    },
  };

  if (isHomepage(route)) {
    entry.changeFrequency = "daily";
    entry.priority = 1.0;
  } else if (isArticleOrExplainer(route)) {
    entry.changeFrequency = "hourly";
    entry.priority = 0.8;
  } else if (isCategory(route)) {
    entry.changeFrequency = "daily";
    entry.priority = 0.6;
  } else {
    entry.changeFrequency = "weekly";
    entry.priority = 0.4;
  }

  return entry;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/trending",
    "/tools",
    "/tools/summarize",
    "/newsletter",
    "/about",
    "/contact",
    "/privacy",
    "/disclaimer",
    "/terms",
  ];
  const categoryRoutes = Array.from(
    new Set((await getArticles()).map((article) => article.category)),
  ).map((category) => `/category/${category}`);
  const articleRoutes = (await getPublishedArticles()).flatMap((article) => [
    `/news/${article.slug}`,
    `/explain/${article.slug}`,
  ]);

  return [...staticRoutes, ...categoryRoutes, ...articleRoutes].map(buildEntry);
}

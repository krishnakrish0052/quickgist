import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { getArticles, getPublishedArticles } from "@/lib/repositories/platformRepository";

export const dynamic = "force-dynamic";

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
    "/terms"
  ];
  const categoryRoutes = Array.from(new Set((await getArticles()).map((article) => article.category))).map(
    (category) => `/category/${category}`
  );
  const articleRoutes = (await getPublishedArticles()).flatMap((article) => [
    `/news/${article.slug}`,
    `/explain/${article.slug}`
  ]);

  return [...staticRoutes, ...categoryRoutes, ...articleRoutes].map((route) => ({
    url: absoluteUrl(route || "/"),
    lastModified: new Date()
  }));
}

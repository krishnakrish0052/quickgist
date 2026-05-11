import { getPlatformState } from "@/lib/store";
import { nowIso } from "@/lib/utils";

export interface ArticleView {
  articleId: string;
  timestamp: string;
  referrer: string;
  country: string;
}

const globalForAnalytics = globalThis as unknown as {
  quickgistAnalyticsViews?: ArticleView[];
};

function getViews(): ArticleView[] {
  if (!globalForAnalytics.quickgistAnalyticsViews) {
    globalForAnalytics.quickgistAnalyticsViews = [];
  }
  return globalForAnalytics.quickgistAnalyticsViews;
}

export async function trackArticleView(
  articleId: string,
  headers: { referer?: string; country?: string }
): Promise<void> {
  const views = getViews();
  views.push({
    articleId,
    timestamp: nowIso(),
    referrer: headers.referer ?? "direct",
    country: headers.country ?? "unknown"
  });
}

export async function getArticleViews(articleId: string): Promise<number> {
  return getViews().filter((v) => v.articleId === articleId).length;
}

export async function getTopArticlesByViews(
  limit = 10
): Promise<{ articleId: string; slug: string; title: string; views: number }[]> {
  const views = getViews();
  const counts = new Map<string, number>();
  for (const v of views) {
    counts.set(v.articleId, (counts.get(v.articleId) ?? 0) + 1);
  }

  const state = getPlatformState();
  const results: { articleId: string; slug: string; title: string; views: number }[] = [];

  for (const [articleId, viewCount] of counts.entries()) {
    const article = state.articles.find((a) => a.id === articleId);
    results.push({
      articleId,
      slug: article?.slug ?? articleId,
      title: article?.title ?? "(unknown)",
      views: viewCount
    });
  }

  results.sort((a, b) => b.views - a.views);
  return results.slice(0, limit);
}

export async function getDailyViewCount(): Promise<number> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();

  return getViews().filter((v) => v.timestamp >= todayIso).length;
}

import type { ContentRisk, RawItem, Topic } from "@/lib/types";
import { clamp, jaccardSimilarity, nowIso, pickTopKeywords, slugify, stableHash, unique } from "@/lib/utils";
import { getRawItems, getTopics, upsertTopics } from "@/lib/repositories/platformRepository";

export interface TrendDetectionResult {
  topics: Topic[];
  inserted: Topic[];
  skipped: number;
}

function inferCategory(text: string): string {
  const lower = text.toLowerCase();
  if (/(market|stock|bank|economy|startup|funding|tax|budget)/.test(lower)) return "finance";
  if (/(health|medical|doctor|drug|hospital|disease)/.test(lower)) return "health";
  if (/(election|court|policy|minister|government|war|conflict)/.test(lower)) return "politics";
  if (/(school|college|student|exam|career|university)/.test(lower)) return "education";
  if (/(ai|software|app|chip|cyber|data|tech)/.test(lower)) return "technology";
  return "world";
}

function inferRisk(category: string, text: string): ContentRisk {
  const lower = text.toLowerCase();
  if (/(war|attack|election|court|disease|medical|drug|stock|investment|loan|tax)/.test(lower)) return "high";
  if (["finance", "health", "politics"].includes(category)) return "high";
  if (/(policy|privacy|student|education|safety)/.test(lower)) return "medium";
  return "low";
}

function scoreItem(item: RawItem): number {
  return clamp(
    45 +
      (item.signals.shareVelocity ?? 0) * 0.4 +
      (item.signals.comments ?? 0) * 0.12 +
      (item.signals.trendRank ? 25 - item.signals.trendRank : 0),
    0,
    100
  );
}

function clusterRawItems(items: RawItem[]): RawItem[][] {
  const clusters: RawItem[][] = [];

  items.forEach((item) => {
    const text = `${item.title} ${item.summary}`;
    const cluster = clusters.find((candidate) =>
      candidate.some((existing) => jaccardSimilarity(text, `${existing.title} ${existing.summary}`) >= 0.12)
    );

    if (cluster) {
      cluster.push(item);
    } else {
      clusters.push([item]);
    }
  });

  return clusters.filter((cluster) => unique(cluster.map((item) => item.sourceId)).length >= 2);
}

export async function detectTrendingTopics(rawItems?: RawItem[]): Promise<TrendDetectionResult> {
  const inputItems = rawItems ?? (await getRawItems());
  const now = nowIso();
  const clusters = clusterRawItems(inputItems);
  const topics = clusters.map((cluster) => {
    const sorted = cluster.slice().sort((a, b) => scoreItem(b) - scoreItem(a));
    const topItem = sorted[0];
    const allText = cluster.map((item) => `${item.title}. ${item.summary}`).join(" ");
    const keywords = pickTopKeywords(allText, 8);
    const category = inferCategory(allText);
    const risk = inferRisk(category, allText);
    const headline = topItem.title;
    const summary = topItem.summary.trim().slice(0, 280);

    return {
      id: `topic-${stableHash(allText)}`,
      slug: slugify(headline),
      title: headline,
      summary,
      category,
      keywords,
      status: "clustered" as const,
      sourceIds: unique(cluster.map((item) => item.sourceId)),
      rawItemIds: cluster.map((item) => item.id),
      trendScore: Math.round(cluster.reduce((total, item) => total + scoreItem(item), 0) / cluster.length),
      noveltyScore: Math.max(40, 100 - cluster.length * 8),
      risk,
      createdAt: now,
      updatedAt: now
    } satisfies Topic;
  });

  const existingTopics = await getTopics();
  const activeSlugs = new Set(
    existingTopics
      .filter((topic) => !topic.cooldownUntil || topic.cooldownUntil > now)
      .map((topic) => topic.slug)
  );
  const novelTopics = topics.filter((topic) => !activeSlugs.has(topic.slug));
  const inserted = await upsertTopics(novelTopics);

  return {
    topics: novelTopics,
    inserted,
    skipped: topics.length - novelTopics.length
  };
}

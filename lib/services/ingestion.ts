import Parser from "rss-parser";
import { seedRawItems } from "@/lib/seed";
import type { RawItem, Source } from "@/lib/types";
import { nowIso, stableHash } from "@/lib/utils";
import { extractFirstImageUrl, stripHtml } from "@/lib/utils/htmlClean";
import {
  curatedFeeds,
  curatedFeedsToSources,
  getCuratedFeed,
  type CuratedFeed
} from "@/lib/sources/curated";
import {
  findSourceByHomepageUrl,
  getRawItems,
  upsertRawItems,
  upsertSources
} from "@/lib/repositories/platformRepository";

interface IngestionInput {
  rssUrls?: string[];
  /** When provided, ingest only these curated feed ids. */
  feedIds?: string[];
  /** Per-feed item limit. */
  limit?: number;
  dryRun?: boolean;
  /** Skip the network and fall back to seed fixtures. Useful for tests. */
  offline?: boolean;
}

export interface IngestionResult {
  fetched: RawItem[];
  inserted: RawItem[];
  skippedDuplicates: number;
  feedsAttempted: number;
  feedsSucceeded: number;
  logs: string[];
}

/**
 * `rss-parser` is generic — extend the typed item shape with the optional
 * fields we read for image extraction so we don't repeatedly cast to any.
 */
type FeedItem = Parser.Item & {
  enclosure?: { url?: string };
  "media:content"?: unknown;
  "content:encoded"?: string;
};

const parser = new Parser<{}, FeedItem>({
  customFields: {
    item: ["media:content", "content:encoded"]
  },
  timeout: 12_000,
  headers: {
    "user-agent": "QuickGistCOS/0.2 (+https://quickgist.local)"
  }
});

async function ensureSourceForCuratedFeed(feed: CuratedFeed): Promise<Source> {
  const existing = await findSourceByHomepageUrl(feed.homepageUrl);
  if (existing) return existing;
  const source: Source = {
    id: feed.id,
    name: feed.name,
    kind: "rss",
    homepageUrl: feed.homepageUrl,
    reliabilityScore: feed.reliability,
    language: feed.language,
    country: feed.country,
    enabled: true
  };
  await upsertSources([source]);
  return source;
}

async function ensureSourceForRawUrl(url: string): Promise<Source> {
  const existing = await findSourceByHomepageUrl(url);
  if (existing) return existing;
  const source: Source = {
    id: `src-rss-${stableHash(url)}`,
    name: new URL(url).hostname.replace(/^www\./, ""),
    kind: "rss",
    homepageUrl: url,
    reliabilityScore: 65,
    language: "en",
    country: "GLOBAL",
    enabled: true
  };
  await upsertSources([source]);
  return source;
}

function rawItemFromFeedEntry(item: FeedItem, source: Source, fetchedAt: string): RawItem {
  const title = (item.title ?? "Untitled story").trim();
  const link = item.link ?? source.homepageUrl;
  const summarySource = item.contentSnippet || item.summary || item["content:encoded"] || item.content || title;
  const summary = stripHtml(typeof summarySource === "string" ? summarySource : "").slice(0, 1100);
  const imageUrl = extractFirstImageUrl(item);

  return {
    id: `raw-${stableHash(`${source.id}:${link}:${title}`)}`,
    sourceId: source.id,
    sourceName: source.name,
    title,
    url: link,
    summary,
    publishedAt: item.isoDate ?? item.pubDate ?? fetchedAt,
    fetchedAt,
    author: item.creator ?? (item as any).author ?? undefined,
    imageUrl,
    contentHash: stableHash(`${title}:${link}`),
    signals: {
      shareVelocity: Math.max(1, Math.round(source.reliabilityScore / 12)),
      region: source.country
    }
  };
}

async function fetchFromRssUrl(url: string, limit: number): Promise<RawItem[]> {
  const fetchedAt = nowIso();
  const feed = await parser.parseURL(url);
  // Detect whether this URL maps to a curated feed (so we use its rich metadata).
  const curated = curatedFeeds.find((f) => f.rssUrl === url);
  const source = curated ? await ensureSourceForCuratedFeed(curated) : await ensureSourceForRawUrl(url);
  return (feed.items ?? []).slice(0, limit).map((item) => rawItemFromFeedEntry(item, source, fetchedAt));
}

async function fetchFromCuratedFeed(feed: CuratedFeed, limit: number): Promise<RawItem[]> {
  return fetchFromRssUrl(feed.rssUrl, limit);
}

/**
 * Default ingestion run. With no input, hits every curated feed in parallel.
 * `OFFLINE=1` env or `offline: true` short-circuits to seed fixtures.
 */
export async function runIngestion(input: IngestionInput = {}): Promise<IngestionResult> {
  const limit = input.limit ?? 12;
  const offline = input.offline ?? process.env.OFFLINE === "1";
  const logs: string[] = [];
  let fetched: RawItem[] = [];
  let feedsAttempted = 0;
  let feedsSucceeded = 0;

  if (offline) {
    fetched = seedRawItems;
    logs.push("OFFLINE mode — using seed fixtures, no network calls.");
  } else if (input.rssUrls?.length) {
    feedsAttempted = input.rssUrls.length;
    const batches = await Promise.allSettled(input.rssUrls.map((url) => fetchFromRssUrl(url, limit)));
    batches.forEach((batch, index) => {
      const url = input.rssUrls?.[index] ?? "?";
      if (batch.status === "fulfilled") {
        fetched.push(...batch.value);
        feedsSucceeded += 1;
        logs.push(`  ✓ ${batch.value.length} items from ${url}`);
      } else {
        const reason = (batch.reason as Error)?.message ?? String(batch.reason);
        logs.push(`  ✗ ${url}: ${reason.slice(0, 140)}`);
      }
    });
  } else {
    // Default: pull every curated feed.
    const targetFeeds = input.feedIds?.length
      ? input.feedIds.map(getCuratedFeed).filter((f): f is CuratedFeed => Boolean(f))
      : curatedFeeds;
    feedsAttempted = targetFeeds.length;

    // Pre-register every curated source so the inventory is populated even
    // when individual fetches fail.
    await upsertSources(curatedFeedsToSources());

    const batches = await Promise.allSettled(targetFeeds.map((feed) => fetchFromCuratedFeed(feed, limit)));
    batches.forEach((batch, index) => {
      const feed = targetFeeds[index];
      if (batch.status === "fulfilled") {
        fetched.push(...batch.value);
        feedsSucceeded += 1;
        logs.push(`  ✓ ${batch.value.length} items from ${feed.name}`);
      } else {
        const reason = (batch.reason as Error)?.message ?? String(batch.reason);
        logs.push(`  ✗ ${feed.name}: ${reason.slice(0, 140)}`);
      }
    });

    // If everything failed (offline laptop, blocked network), fall back to seeds
    // so the rest of the pipeline still has something to work with.
    if (feedsSucceeded === 0) {
      fetched = seedRawItems;
      logs.push("All curated feeds failed; falling back to seed fixtures.");
    }
  }

  if (input.dryRun) {
    return {
      fetched,
      inserted: fetched,
      skippedDuplicates: 0,
      feedsAttempted,
      feedsSucceeded,
      logs: [...logs, "Dry run enabled; fetched records were not persisted."]
    };
  }

  const before = (await getRawItems()).length;
  const inserted = await upsertRawItems(fetched);
  const after = (await getRawItems()).length;

  return {
    fetched,
    inserted,
    skippedDuplicates: fetched.length - inserted.length,
    feedsAttempted,
    feedsSucceeded,
    logs: [...logs, `Inserted ${after - before} new raw items (total now ${after}).`]
  };
}

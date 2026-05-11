import type { ContentRisk, RawItem, Topic } from "@/lib/types";
import { clamp, jaccardSimilarity, nowIso, pickTopKeywords, slugify, stableHash, unique } from "@/lib/utils";
import { getRawItems, upsertTopics } from "@/lib/repositories/platformRepository";

export interface TrendDetectionResult {
  topics: Topic[];
  inserted: Topic[];
  skipped: number;
}

function inferCategory(text: string): string {
  const lower = text.toLowerCase();

  // Count keyword matches per category to pick the strongest signal
  const patterns: [string, RegExp][] = [
    ["banking", /(bank|banking|central bank|interest rate|monetary|loan|mortgage|lending|credit union|deposit|savings account|checking|rbi|federal reserve|ecb|imf|credit score|debt|foreclosure|overdraft|branch|atm|digital banking|neo.?bank|fintech|payment|remittance|wire transfer)/],
    ["business", /(company|corp|inc|ltd|ceo|cfo|executive|merger|acquisition|ipo|quarterly|earnings|revenue|profit|loss|quarter|fiscal|dividend|buyback|layoff?|hire|expansion|contract|supply chain|retail|wholesale|e.?commerce|market share|competition|monopoly|antitrust|regulation|deregulation)/],
    ["finance", /\b(market|stock|bank|economy|startup|funding|tax|budget|tariffs?|trade|federal reserve|inflation|gdp|recession|investment|wall street|nasdaq|dow jones|s&p 500|crypto|bitcoin|fintech)\b/],
    ["health", /\b(health|medical|doctor|drug|hospital|disease|cancer|vaccine|patient|diagnosis|surgery|pharma|nih|cdc|who|fda|clinical trial|mental health|therapy|epidemic|outbreak|hantavirus|infection)\b/],
    ["politics", /\b(election|minister|government|parliament|congress|senate|governor|mayor|president|prime minister|diplomat|embassy|sanctions?|legislation|bipartisan|referendum|ballot|impeachment|impeach|subpoena|campaign trail)\b/],
    ["education", /\b(school|college|university|student|exam|career|campus|academic|scholarship|degree|professor|curriculum|literacy|learning|teaching|classroom|education)\b/],
    ["technology", /\b(ai\b|artificial intelligence|machine learning|software|app\b|chip|cyber|data breach|tech\b|startup|silicon valley|algorithm|cloud computing|api\b|encryption|privacy|blockchain|iot|robotics|autonomous|electric vehicle|semiconductor)\b/],
    ["sports", /\b(sports?|football|soccer|basketball|baseball|cricket|tennis|championship|tournament|la.?liga|premier league|nfl|nba|mlb|nhl|ufc|boxing|olympics?|athlete|coach|stadium|goal|match|playoffs?|final|medal|title race|clinched)\b/],
    ["entertainment", /\b(movie|film|music|album|singer|actor|actress|celebrity|hollywood|netflix|spotify|youtube|tiktok|award|oscars?|grammy|emmy|concert|festival|tv show|series|streaming|sued|sues|lawsuit|copyright|trademark)\b/],
    ["banking", /\b(bank\b|banking|fintech|digital payment|neobank|lending\b|mortgage\b|interest rate|central bank|fed\b|ecb\b|imf\b|world bank|swift|wire transfer|cryptocurrency|crypto exchange|stablecoin|defi\b)\b/],
    ["automotive", /\b(car\b|cars|electric vehicle|ev\b|auto\b|tesla|autonomous driving|self.driving|ride.sharing|uber|lyft|charging station|supercharger|battery technology|automaker|suv\b|sedan\b)\b/],
    ["energy", /\b(oil\b|gas\b|renewable|solar\b|wind\b|nuclear|climate|carbon|emissions?|fossil fuel|clean energy|pipeline|opec|petroleum|natural gas|power plant|electricity|grid\b|offshore|hydrogen)\b/],
    ["legal", /\b(lawsuit|court\b|ruling|judge\b|legislation|law\b|attorney|doj\b|supreme court|appeal\b|verdict|jury\b|prosecutor|defendant|plaintiff|constitutional|unconstitutional|sued|sues\b|fine\b|penalty|regulation|regulatory|compliance\b)\b/],
    ["science", /\b(research|study\b|nasa|space\b|discovery|journal\b|scientist|breakthrough|experiment|particle|cern\b|telescope|webb telescope|mars\b|moon\b|asteroid|genetic|dna\b|crispr|protein|quantum|physics|chemistry|biology|astronomy)\b/],
    ["real-estate", /\b(housing|property|mortgage|rental|commercial real estate|reit\b|home price|real estate|homebuyer|homeowner|foreclosure|zoning|construction\b|apartment|condo|listing\b|broker\b)\b/],
  ];

  let bestCategory = "general";
  let bestScore = 0;

  for (const [category, pattern] of patterns) {
    const matches = lower.match(new RegExp(pattern.source, "g"));
    const score = matches ? matches.length : 0;
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
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
      candidate.some((existing) => jaccardSimilarity(text, `${existing.title} ${existing.summary}`) >= 0.08)
    );

    if (cluster) {
      cluster.push(item);
    } else {
      clusters.push([item]);
    }
  });

  // Require 2+ distinct sources for cross-source fact verification.
  // Single-source clusters don't provide enough signal for reliable topics.
  return clusters.filter((cluster) => unique(cluster.map((item) => item.sourceId)).length >= 2);
}

export async function detectTrendingTopics(rawItems?: RawItem[], dryRun = false): Promise<TrendDetectionResult> {
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

  if (dryRun) {
    return { topics, inserted: [], skipped: 0 };
  }

  // Topics are always fresh — upsert handles slug-based dedup internally
  const inserted = await upsertTopics(topics);

  return {
    topics,
    inserted,
    skipped: 0
  };
}

export async function detectTrendingTopicsIncremental(
  newRawItems: RawItem[],
  existingTopics: Topic[]
): Promise<TrendDetectionResult> {
  const now = nowIso();
  const clusters = clusterRawItems(newRawItems);
  const candidateTopics = clusters.map((cluster) => {
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

  // Dedup: filter out topics whose slug already exists
  const existingSlugs = new Set(existingTopics.map((t) => t.slug));
  const newTopics = candidateTopics.filter((t) => !existingSlugs.has(t.slug));
  const skipped = candidateTopics.length - newTopics.length;

  if (newTopics.length === 0) {
    return { topics: candidateTopics, inserted: [], skipped };
  }

  const inserted = await upsertTopics(newTopics);

  return {
    topics: candidateTopics,
    inserted,
    skipped
  };
}

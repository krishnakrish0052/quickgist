import type {
  Article,
  AuditLog,
  DistributionJob,
  FactClaim,
  MediaAsset,
  QualityReport,
  RawItem,
  ReviewTask,
  Source,
  Subscriber,
  Topic
} from "@/lib/types";

function iso(value: string | Date | null | undefined): string | undefined {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function mapSource(row: any): Source {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    homepageUrl: row.homepage_url,
    reliabilityScore: row.reliability_score,
    language: row.language,
    country: row.country,
    enabled: row.enabled
  };
}

export function mapRawItem(row: any): RawItem {
  return {
    id: row.id,
    sourceId: row.source_id,
    sourceName: row.source_name,
    title: row.title,
    url: row.url,
    summary: row.summary,
    publishedAt: iso(row.published_at) ?? new Date().toISOString(),
    fetchedAt: iso(row.fetched_at) ?? new Date().toISOString(),
    author: row.author ?? undefined,
    imageUrl: row.image_url ?? undefined,
    contentHash: row.content_hash,
    signals: row.signals ?? {}
  };
}

export function mapTopic(row: any): Topic {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    category: row.category,
    keywords: row.keywords ?? [],
    status: row.status,
    sourceIds: row.source_ids ?? [],
    rawItemIds: row.raw_item_ids ?? [],
    trendScore: row.trend_score,
    noveltyScore: row.novelty_score,
    risk: row.risk,
    cooldownUntil: iso(row.cooldown_until),
    createdAt: iso(row.created_at) ?? new Date().toISOString(),
    updatedAt: iso(row.updated_at) ?? new Date().toISOString()
  };
}

export function mapFactClaim(row: any): FactClaim {
  return {
    id: row.id,
    topicId: row.topic_id,
    claim: row.claim,
    sourceRawItemIds: row.source_raw_item_ids ?? [],
    confidence: Number(row.confidence),
    risk: row.risk,
    createdAt: iso(row.created_at) ?? new Date().toISOString()
  };
}

export function mapArticle(row: any): Article {
  return {
    id: row.id,
    topicId: row.topic_id,
    slug: row.slug,
    title: row.title,
    metaDescription: row.meta_description,
    dek: row.dek,
    contentMarkdown: row.content_markdown,
    summaryBullets: row.summary_bullets ?? [],
    eli5Markdown: row.eli5_markdown,
    socialPack: row.social_pack ?? { xThread: [], instagramCaption: "", linkedinPost: "", whatsappSummary: [] },
    videoScript: row.video_script,
    imagePrompt: row.image_prompt,
    tags: row.tags ?? [],
    category: row.category,
    authorName: row.author_name,
    status: row.status,
    risk: row.risk,
    qualityScore: row.quality_score,
    sources: row.sources ?? [],
    readingMinutes: row.reading_minutes,
    heroImageUrl: row.hero_image_url ?? undefined,
    canonicalUrl: row.canonical_url ?? undefined,
    publishedAt: iso(row.published_at),
    createdAt: iso(row.created_at) ?? new Date().toISOString(),
    updatedAt: iso(row.updated_at) ?? new Date().toISOString()
  };
}

export function mapQualityReport(row: any): QualityReport {
  return {
    id: row.id,
    articleId: row.article_id,
    topicId: row.topic_id,
    score: row.score,
    passed: row.passed,
    reasons: row.reasons ?? [],
    checks: row.checks ?? {},
    createdAt: iso(row.created_at) ?? new Date().toISOString()
  };
}

export function mapReviewTask(row: any): ReviewTask {
  return {
    id: row.id,
    articleId: row.article_id,
    topicId: row.topic_id,
    title: row.title,
    reason: row.reason,
    status: row.status,
    priority: row.priority,
    createdAt: iso(row.created_at) ?? new Date().toISOString()
  };
}

export function mapMediaAsset(row: any): MediaAsset {
  return {
    id: row.id,
    articleId: row.article_id ?? undefined,
    topicId: row.topic_id ?? undefined,
    kind: row.kind,
    prompt: row.prompt,
    url: row.url,
    provider: row.provider,
    attribution: row.attribution,
    createdAt: iso(row.created_at) ?? new Date().toISOString()
  };
}

export function mapDistributionJob(row: any): DistributionJob {
  return {
    id: row.id,
    articleId: row.article_id,
    channel: row.channel,
    payload: row.payload ?? {},
    scheduledFor: iso(row.scheduled_for) ?? new Date().toISOString(),
    status: row.status,
    utmUrl: row.utm_url,
    createdAt: iso(row.created_at) ?? new Date().toISOString()
  };
}

export function mapSubscriber(row: any): Subscriber {
  return {
    id: row.id,
    email: row.email,
    topics: row.topics ?? [],
    status: row.status,
    createdAt: iso(row.created_at) ?? new Date().toISOString()
  };
}

export function mapAuditLog(row: any): AuditLog {
  return {
    id: row.id,
    actor: row.actor,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    metadata: row.metadata ?? {},
    createdAt: iso(row.created_at) ?? new Date().toISOString()
  };
}

import { seedArticles, seedFactClaims, seedRawItems, seedSources, seedTopics } from "@/lib/seed";
import {
  addAuditLog as addMemoryAuditLog,
  addDistributionJobs as addMemoryDistributionJobs,
  addQualityReport as addMemoryQualityReport,
  addReviewTask as addMemoryReviewTask,
  getArticleBySlug as getMemoryArticleBySlug,
  getPlatformState,
  getPublishedArticles as getMemoryPublishedArticles,
  resetPlatformState,
  upsertArticle as upsertMemoryArticle,
  upsertFactClaims as upsertMemoryFactClaims,
  upsertRawItems as upsertMemoryRawItems,
  upsertTopics as upsertMemoryTopics
} from "@/lib/store";
import type {
  Article,
  AuditLog,
  DistributionJob,
  FactClaim,
  MediaAsset,
  PlatformState,
  QualityReport,
  RawItem,
  ReviewTask,
  Source,
  Subscriber,
  Topic
} from "@/lib/types";
import { nowIso, stableHash } from "@/lib/utils";
import { query, isPostgresEnabled } from "@/lib/db/client";
import {
  mapArticle,
  mapAuditLog,
  mapDistributionJob,
  mapFactClaim,
  mapMediaAsset,
  mapQualityReport,
  mapRawItem,
  mapReviewTask,
  mapSource,
  mapSubscriber,
  mapTopic
} from "@/lib/db/mappers";

function memoryState(): PlatformState {
  return getPlatformState();
}

export async function getPlatformSnapshot(): Promise<PlatformState> {
  if (!isPostgresEnabled()) return memoryState();

  const [
    sources,
    rawItems,
    topics,
    topicSources,
    factClaims,
    articles,
    qualityReports,
    reviewTasks,
    mediaAssets,
    distributionJobs,
    subscribers,
    auditLogs
  ] = await Promise.all([
    query("select * from sources order by name").then((rows) => rows.map(mapSource)),
    query("select * from raw_items order by published_at desc").then((rows) => rows.map(mapRawItem)),
    query("select * from topics order by trend_score desc, updated_at desc").then((rows) => rows.map(mapTopic)),
    query("select * from topic_sources").then((rows) =>
      rows.map((row: any) => ({
        topicId: row.topic_id,
        rawItemId: row.raw_item_id,
        sourceId: row.source_id,
        confidence: Number(row.confidence)
      }))
    ),
    query("select * from fact_claims order by created_at desc").then((rows) => rows.map(mapFactClaim)),
    query("select * from articles order by coalesce(published_at, updated_at) desc").then((rows) => rows.map(mapArticle)),
    query("select * from quality_reports order by created_at desc").then((rows) => rows.map(mapQualityReport)),
    query("select * from review_tasks order by created_at desc").then((rows) => rows.map(mapReviewTask)),
    query("select * from media_assets order by created_at desc").then((rows) => rows.map(mapMediaAsset)),
    query("select * from distribution_jobs order by scheduled_for desc").then((rows) => rows.map(mapDistributionJob)),
    query("select * from subscribers order by created_at desc").then((rows) => rows.map(mapSubscriber)),
    query("select * from audit_logs order by created_at desc limit 500").then((rows) => rows.map(mapAuditLog))
  ]);

  return {
    sources,
    rawItems,
    topics,
    topicSources,
    factClaims,
    articles,
    qualityReports,
    reviewTasks,
    mediaAssets,
    distributionJobs,
    subscribers,
    auditLogs
  };
}

export async function upsertSources(sources: Source[]): Promise<Source[]> {
  if (!isPostgresEnabled()) {
    const state = memoryState();
    sources.forEach((source) => {
      const existingIndex = state.sources.findIndex((candidate) => candidate.id === source.id);
      if (existingIndex >= 0) state.sources[existingIndex] = source;
      else state.sources.push(source);
    });
    return sources;
  }

  for (const source of sources) {
    await query(
      `insert into sources (id, name, kind, homepage_url, reliability_score, language, country, enabled)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       on conflict (id) do update set
         name = excluded.name,
         kind = excluded.kind,
         homepage_url = excluded.homepage_url,
         reliability_score = excluded.reliability_score,
         language = excluded.language,
         country = excluded.country,
         enabled = excluded.enabled`,
      [
        source.id,
        source.name,
        source.kind,
        source.homepageUrl,
        source.reliabilityScore,
        source.language,
        source.country,
        source.enabled
      ]
    );
  }

  return sources;
}

export async function getSources(): Promise<Source[]> {
  if (!isPostgresEnabled()) return memoryState().sources;
  return query("select * from sources order by name").then((rows) => rows.map(mapSource));
}

export async function findSourceByHomepageUrl(url: string): Promise<Source | undefined> {
  if (!isPostgresEnabled()) return memoryState().sources.find((source) => source.homepageUrl === url);
  const rows = await query("select * from sources where homepage_url = $1 limit 1", [url]);
  return rows[0] ? mapSource(rows[0]) : undefined;
}

export async function getRawItems(): Promise<RawItem[]> {
  if (!isPostgresEnabled()) return memoryState().rawItems;
  return query("select * from raw_items order by published_at desc").then((rows) => rows.map(mapRawItem));
}

export async function upsertRawItems(items: RawItem[]): Promise<RawItem[]> {
  if (!isPostgresEnabled()) return upsertMemoryRawItems(items);

  const inserted: RawItem[] = [];
  for (const item of items) {
    const rows = await query<{ id: string }>(
      `insert into raw_items
       (id, source_id, source_name, title, url, summary, published_at, fetched_at, author, image_url, content_hash, signals)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)
       on conflict (content_hash) do nothing
       returning id`,
      [
        item.id,
        item.sourceId,
        item.sourceName,
        item.title,
        item.url,
        item.summary,
        item.publishedAt,
        item.fetchedAt,
        item.author ?? null,
        item.imageUrl ?? null,
        item.contentHash,
        JSON.stringify(item.signals)
      ]
    );
    if (rows.length) inserted.push(item);
  }
  return inserted;
}

export async function getTopics(): Promise<Topic[]> {
  if (!isPostgresEnabled()) return memoryState().topics;
  return query("select * from topics order by trend_score desc, updated_at desc").then((rows) => rows.map(mapTopic));
}

export async function getTopicById(id: string): Promise<Topic | undefined> {
  if (!isPostgresEnabled()) return memoryState().topics.find((topic) => topic.id === id);
  const rows = await query("select * from topics where id = $1 limit 1", [id]);
  return rows[0] ? mapTopic(rows[0]) : undefined;
}

export async function getTopicBySlug(slug: string): Promise<Topic | undefined> {
  if (!isPostgresEnabled()) return memoryState().topics.find((topic) => topic.slug === slug);
  const rows = await query("select * from topics where slug = $1 limit 1", [slug]);
  return rows[0] ? mapTopic(rows[0]) : undefined;
}

export async function upsertTopics(topics: Topic[]): Promise<Topic[]> {
  if (!isPostgresEnabled()) return upsertMemoryTopics(topics);

  const inserted: Topic[] = [];
  for (const topic of topics) {
    const rows = await query<{ inserted: boolean }>(
      `insert into topics
       (id, slug, title, summary, category, keywords, status, source_ids, raw_item_ids, trend_score, novelty_score, risk, cooldown_until, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       on conflict (slug) do update set
         source_ids = (select array(select distinct unnest(topics.source_ids || excluded.source_ids))),
         raw_item_ids = (select array(select distinct unnest(topics.raw_item_ids || excluded.raw_item_ids))),
         trend_score = greatest(topics.trend_score, excluded.trend_score),
         updated_at = excluded.updated_at
       returning (xmax = 0) as inserted`,
      [
        topic.id,
        topic.slug,
        topic.title,
        topic.summary,
        topic.category,
        topic.keywords,
        topic.status,
        topic.sourceIds,
        topic.rawItemIds,
        topic.trendScore,
        topic.noveltyScore,
        topic.risk,
        topic.cooldownUntil ?? null,
        topic.createdAt,
        topic.updatedAt
      ]
    );

    for (const rawItemId of topic.rawItemIds) {
      const rawItem = (await getRawItemById(rawItemId)) ?? null;
      if (!rawItem) continue;
      await query(
        `insert into topic_sources (topic_id, raw_item_id, source_id, confidence)
         values ($1, $2, $3, $4)
         on conflict (topic_id, raw_item_id) do update set confidence = excluded.confidence`,
        [topic.id, rawItemId, rawItem.sourceId, 0.84]
      );
    }

    if (rows[0]?.inserted) inserted.push(topic);
  }
  return inserted;
}

export async function getRawItemById(id: string): Promise<RawItem | undefined> {
  if (!isPostgresEnabled()) return memoryState().rawItems.find((item) => item.id === id);
  const rows = await query("select * from raw_items where id = $1 limit 1", [id]);
  return rows[0] ? mapRawItem(rows[0]) : undefined;
}

export async function getFactClaims(topicId?: string): Promise<FactClaim[]> {
  if (!isPostgresEnabled()) {
    return topicId ? memoryState().factClaims.filter((claim) => claim.topicId === topicId) : memoryState().factClaims;
  }
  const rows = await query(
    topicId ? "select * from fact_claims where topic_id = $1 order by created_at desc" : "select * from fact_claims order by created_at desc",
    topicId ? [topicId] : []
  );
  return rows.map(mapFactClaim);
}

export async function upsertFactClaims(claims: FactClaim[]): Promise<FactClaim[]> {
  if (!isPostgresEnabled()) return upsertMemoryFactClaims(claims);

  const inserted: FactClaim[] = [];
  for (const claim of claims) {
    const rows = await query<{ id: string }>(
      `insert into fact_claims (id, topic_id, claim, source_raw_item_ids, confidence, risk, created_at)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (id) do nothing
       returning id`,
      [claim.id, claim.topicId, claim.claim, claim.sourceRawItemIds, claim.confidence, claim.risk, claim.createdAt]
    );
    if (rows.length) inserted.push(claim);
  }
  return inserted;
}

export async function getArticles(): Promise<Article[]> {
  if (!isPostgresEnabled()) return memoryState().articles;
  return query("select * from articles order by coalesce(published_at, updated_at) desc").then((rows) => rows.map(mapArticle));
}

export async function getPublishedArticles(): Promise<Article[]> {
  if (!isPostgresEnabled()) return getMemoryPublishedArticles();
  return query("select * from articles where status = 'published' order by published_at desc nulls last, updated_at desc").then((rows) =>
    rows.map(mapArticle)
  );
}

export async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  if (!isPostgresEnabled()) return getMemoryArticleBySlug(slug);
  const rows = await query("select * from articles where slug = $1 limit 1", [slug]);
  return rows[0] ? mapArticle(rows[0]) : undefined;
}

export async function getArticleById(id: string): Promise<Article | undefined> {
  if (!isPostgresEnabled()) return memoryState().articles.find((article) => article.id === id);
  const rows = await query("select * from articles where id = $1 limit 1", [id]);
  return rows[0] ? mapArticle(rows[0]) : undefined;
}

export async function upsertArticle(article: Article): Promise<Article> {
  if (!isPostgresEnabled()) return upsertMemoryArticle(article);

  await query(
    `insert into articles
     (id, topic_id, slug, title, meta_description, dek, content_markdown, summary_bullets, eli5_markdown, social_pack,
      video_script, image_prompt, tags, category, author_name, status, risk, quality_score, sources, reading_minutes,
      hero_image_url, canonical_url, published_at, created_at, updated_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13, $14, $15, $16, $17, $18, $19::jsonb, $20, $21, $22, $23, $24, $25)
     on conflict (id) do update set
       topic_id = excluded.topic_id,
       slug = excluded.slug,
       title = excluded.title,
       meta_description = excluded.meta_description,
       dek = excluded.dek,
       content_markdown = excluded.content_markdown,
       summary_bullets = excluded.summary_bullets,
       eli5_markdown = excluded.eli5_markdown,
       social_pack = excluded.social_pack,
       video_script = excluded.video_script,
       image_prompt = excluded.image_prompt,
       tags = excluded.tags,
       category = excluded.category,
       author_name = excluded.author_name,
       status = excluded.status,
       risk = excluded.risk,
       quality_score = excluded.quality_score,
       sources = excluded.sources,
       reading_minutes = excluded.reading_minutes,
       hero_image_url = excluded.hero_image_url,
       canonical_url = excluded.canonical_url,
       published_at = excluded.published_at,
       updated_at = excluded.updated_at`,
    [
      article.id,
      article.topicId,
      article.slug,
      article.title,
      article.metaDescription,
      article.dek,
      article.contentMarkdown,
      article.summaryBullets,
      article.eli5Markdown,
      JSON.stringify(article.socialPack),
      article.videoScript,
      article.imagePrompt,
      article.tags,
      article.category,
      article.authorName,
      article.status,
      article.risk,
      article.qualityScore,
      JSON.stringify(article.sources),
      article.readingMinutes,
      article.heroImageUrl ?? null,
      article.canonicalUrl ?? null,
      article.publishedAt ?? null,
      article.createdAt,
      article.updatedAt
    ]
  );

  return article;
}

export async function addQualityReport(report: QualityReport): Promise<QualityReport> {
  if (!isPostgresEnabled()) return addMemoryQualityReport(report);
  await query(
    `insert into quality_reports (id, article_id, topic_id, score, passed, reasons, checks, created_at)
     values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
     on conflict (id) do update set score = excluded.score, passed = excluded.passed, reasons = excluded.reasons, checks = excluded.checks`,
    [
      report.id,
      report.articleId,
      report.topicId,
      report.score,
      report.passed,
      report.reasons,
      JSON.stringify(report.checks),
      report.createdAt
    ]
  );
  return report;
}

export async function getLatestQualityReport(articleId: string): Promise<QualityReport | undefined> {
  if (!isPostgresEnabled()) {
    return [...memoryState().qualityReports].reverse().find((report) => report.articleId === articleId);
  }
  const rows = await query("select * from quality_reports where article_id = $1 order by created_at desc limit 1", [articleId]);
  return rows[0] ? mapQualityReport(rows[0]) : undefined;
}

export async function addReviewTask(task: ReviewTask): Promise<ReviewTask> {
  if (!isPostgresEnabled()) return addMemoryReviewTask(task);
  await query(
    `insert into review_tasks (id, article_id, topic_id, title, reason, status, priority, created_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     on conflict (id) do update set reason = excluded.reason, status = excluded.status, priority = excluded.priority`,
    [task.id, task.articleId, task.topicId, task.title, task.reason, task.status, task.priority, task.createdAt]
  );
  return task;
}

export async function addMediaAsset(asset: MediaAsset): Promise<MediaAsset> {
  if (!isPostgresEnabled()) {
    const state = memoryState();
    if (!state.mediaAssets.some((candidate) => candidate.id === asset.id)) state.mediaAssets.push(asset);
    return asset;
  }
  await query(
    `insert into media_assets (id, article_id, topic_id, kind, prompt, url, provider, attribution, created_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     on conflict (id) do update set url = excluded.url, attribution = excluded.attribution`,
    [
      asset.id,
      asset.articleId ?? null,
      asset.topicId ?? null,
      asset.kind,
      asset.prompt,
      asset.url,
      asset.provider,
      asset.attribution,
      asset.createdAt
    ]
  );
  return asset;
}

export async function addDistributionJobs(jobs: DistributionJob[]): Promise<DistributionJob[]> {
  if (!isPostgresEnabled()) return addMemoryDistributionJobs(jobs);
  for (const job of jobs) {
    await query(
      `insert into distribution_jobs (id, article_id, channel, payload, scheduled_for, status, utm_url, created_at)
       values ($1, $2, $3, $4::jsonb, $5, $6, $7, $8)
       on conflict (id) do update set payload = excluded.payload, status = excluded.status, scheduled_for = excluded.scheduled_for`,
      [
        job.id,
        job.articleId,
        job.channel,
        JSON.stringify(job.payload),
        job.scheduledFor,
        job.status,
        job.utmUrl,
        job.createdAt
      ]
    );
  }
  return jobs;
}

export async function addAuditLog(log: Omit<AuditLog, "id" | "createdAt">): Promise<AuditLog> {
  const auditLog: AuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: nowIso(),
    ...log
  };
  if (!isPostgresEnabled()) return addMemoryAuditLog(auditLog);
  await query(
    `insert into audit_logs (id, actor, action, entity_type, entity_id, metadata, created_at)
     values ($1, $2, $3, $4, $5, $6::jsonb, $7)`,
    [
      auditLog.id,
      auditLog.actor,
      auditLog.action,
      auditLog.entityType,
      auditLog.entityId,
      JSON.stringify(auditLog.metadata),
      auditLog.createdAt
    ]
  );
  return auditLog;
}

export async function subscribe(email: string, topics: string[] = ["top-stories"]): Promise<Subscriber> {
  if (!isPostgresEnabled()) {
    const state = memoryState();
    const existing = state.subscribers.find((subscriber) => subscriber.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      existing.status = "active";
      existing.topics = Array.from(new Set([...existing.topics, ...topics]));
      return existing;
    }
    const subscriber: Subscriber = {
      id: `sub-${stableHash(email.toLowerCase())}`,
      email,
      topics,
      status: "active",
      createdAt: nowIso()
    };
    state.subscribers.push(subscriber);
    return subscriber;
  }

  const id = `sub-${stableHash(email.toLowerCase())}`;
  const rows = await query(
    `insert into subscribers (id, email, topics, status, created_at)
     values ($1, $2, $3, 'active', $4)
     on conflict (email) do update set
       topics = (select array(select distinct unnest(subscribers.topics || excluded.topics))),
       status = 'active'
     returning *`,
    [id, email, topics, nowIso()]
  );
  return mapSubscriber(rows[0]);
}

export async function seedRepository(): Promise<void> {
  await upsertSources(seedSources);
  await upsertRawItems(seedRawItems);
  await upsertTopics(seedTopics);
  await upsertFactClaims(seedFactClaims);
  for (const article of seedArticles) {
    await upsertArticle(article);
  }
}

export async function resetMemoryRepository(): Promise<void> {
  resetPlatformState();
}

export async function publishArticle(articleId: string): Promise<void> {
  if (!isPostgresEnabled()) {
    const state = getPlatformState();
    const article = state.articles.find((a) => a.id === articleId);
    if (article) {
      article.status = "published";
      article.publishedAt = article.publishedAt ?? nowIso();
      article.updatedAt = nowIso();
    }
    return;
  }
  await query(
    `update articles set status = 'published', published_at = coalesce(published_at, now()), updated_at = now() where id = $1`,
    [articleId]
  );
}

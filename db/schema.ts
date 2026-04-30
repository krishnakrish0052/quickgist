import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid
} from "drizzle-orm/pg-core";

export const sources = pgTable("sources", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  kind: text("kind").notNull(),
  homepageUrl: text("homepage_url").notNull(),
  reliabilityScore: integer("reliability_score").notNull(),
  language: text("language").notNull().default("en"),
  country: text("country").notNull().default("GLOBAL"),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const rawItems = pgTable("raw_items", {
  id: text("id").primaryKey(),
  sourceId: text("source_id").notNull().references(() => sources.id),
  sourceName: text("source_name").notNull(),
  title: text("title").notNull(),
  url: text("url").notNull().unique(),
  summary: text("summary").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  author: text("author"),
  imageUrl: text("image_url"),
  contentHash: text("content_hash").notNull().unique(),
  signals: jsonb("signals").notNull().default({})
});

export const topics = pgTable("topics", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  category: text("category").notNull(),
  keywords: text("keywords").array().notNull().default([]),
  status: text("status").notNull().default("new"),
  sourceIds: text("source_ids").array().notNull().default([]),
  rawItemIds: text("raw_item_ids").array().notNull().default([]),
  trendScore: integer("trend_score").notNull().default(0),
  noveltyScore: integer("novelty_score").notNull().default(0),
  risk: text("risk").notNull().default("low"),
  cooldownUntil: timestamp("cooldown_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const topicSources = pgTable(
  "topic_sources",
  {
    topicId: text("topic_id").notNull().references(() => topics.id),
    rawItemId: text("raw_item_id").notNull().references(() => rawItems.id),
    sourceId: text("source_id").notNull().references(() => sources.id),
    confidence: numeric("confidence", { precision: 4, scale: 3 }).notNull().default("0.7")
  },
  (table) => ({
    pk: primaryKey({ columns: [table.topicId, table.rawItemId] })
  })
);

export const factClaims = pgTable("fact_claims", {
  id: text("id").primaryKey(),
  topicId: text("topic_id").notNull().references(() => topics.id),
  claim: text("claim").notNull(),
  sourceRawItemIds: text("source_raw_item_ids").array().notNull(),
  confidence: numeric("confidence", { precision: 4, scale: 3 }).notNull(),
  risk: text("risk").notNull().default("low"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const articles = pgTable("articles", {
  id: text("id").primaryKey(),
  topicId: text("topic_id").notNull().references(() => topics.id),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  metaDescription: text("meta_description").notNull(),
  dek: text("dek").notNull(),
  contentMarkdown: text("content_markdown").notNull(),
  summaryBullets: text("summary_bullets").array().notNull().default([]),
  eli5Markdown: text("eli5_markdown").notNull(),
  socialPack: jsonb("social_pack").notNull().default({}),
  videoScript: text("video_script").notNull().default(""),
  imagePrompt: text("image_prompt").notNull().default(""),
  tags: text("tags").array().notNull().default([]),
  category: text("category").notNull(),
  authorName: text("author_name").notNull(),
  status: text("status").notNull().default("draft"),
  risk: text("risk").notNull().default("low"),
  qualityScore: integer("quality_score").notNull().default(0),
  sources: jsonb("sources").notNull().default([]),
  readingMinutes: integer("reading_minutes").notNull().default(1),
  heroImageUrl: text("hero_image_url"),
  canonicalUrl: text("canonical_url"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const contentVersions = pgTable("content_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  articleId: text("article_id").notNull().references(() => articles.id),
  title: text("title").notNull(),
  contentMarkdown: text("content_markdown").notNull(),
  changeReason: text("change_reason").notNull(),
  createdBy: text("created_by").notNull().default("system"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const qualityReports = pgTable("quality_reports", {
  id: text("id").primaryKey(),
  articleId: text("article_id").notNull().references(() => articles.id),
  topicId: text("topic_id").notNull().references(() => topics.id),
  score: integer("score").notNull(),
  passed: boolean("passed").notNull(),
  reasons: text("reasons").array().notNull().default([]),
  checks: jsonb("checks").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const reviewTasks = pgTable("review_tasks", {
  id: text("id").primaryKey(),
  articleId: text("article_id").notNull().references(() => articles.id),
  topicId: text("topic_id").notNull().references(() => topics.id),
  title: text("title").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("open"),
  priority: text("priority").notNull().default("normal"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const mediaAssets = pgTable("media_assets", {
  id: text("id").primaryKey(),
  articleId: text("article_id").references(() => articles.id),
  topicId: text("topic_id").references(() => topics.id),
  kind: text("kind").notNull(),
  prompt: text("prompt").notNull(),
  url: text("url").notNull(),
  provider: text("provider").notNull(),
  attribution: text("attribution").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const distributionJobs = pgTable("distribution_jobs", {
  id: text("id").primaryKey(),
  articleId: text("article_id").notNull().references(() => articles.id),
  channel: text("channel").notNull(),
  payload: jsonb("payload").notNull().default({}),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
  status: text("status").notNull().default("dry_run"),
  utmUrl: text("utm_url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const subscribers = pgTable("subscribers", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  topics: text("topics").array().notNull().default([]),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

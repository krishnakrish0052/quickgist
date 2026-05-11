export type SourceKind =
  | "rss"
  | "newsapi"
  | "gnews"
  | "thenewsapi"
  | "google_trends"
  | "reddit"
  | "youtube"
  | "manual";

export type ContentRisk = "low" | "medium" | "high";
export type TopicStatus = "new" | "clustered" | "generating" | "review" | "published" | "blocked";
export type ArticleStatus = "draft" | "review" | "published" | "rejected";
export type DistributionChannel =
  | "telegram"
  | "x"
  | "instagram"
  | "linkedin"
  | "youtube"
  | "newsletter"
  | "rss";

export interface Source {
  id: string;
  name: string;
  kind: SourceKind;
  homepageUrl: string;
  reliabilityScore: number;
  language: string;
  country: string;
  enabled: boolean;
}

export interface RawItem {
  id: string;
  sourceId: string;
  sourceName: string;
  title: string;
  url: string;
  summary: string;
  publishedAt: string;
  fetchedAt: string;
  author?: string;
  imageUrl?: string;
  contentHash: string;
  signals: {
    trendRank?: number;
    shareVelocity?: number;
    comments?: number;
    region?: string;
  };
}

export interface TopicSource {
  topicId: string;
  rawItemId: string;
  sourceId: string;
  confidence: number;
}

export interface Topic {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  keywords: string[];
  status: TopicStatus;
  sourceIds: string[];
  rawItemIds: string[];
  trendScore: number;
  noveltyScore: number;
  risk: ContentRisk;
  cooldownUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FactClaim {
  id: string;
  topicId: string;
  claim: string;
  sourceRawItemIds: string[];
  confidence: number;
  risk: ContentRisk;
  createdAt: string;
}

export interface SocialPack {
  xThread: string[];
  instagramCaption: string;
  linkedinPost: string;
  whatsappSummary: string[];
}

export interface ArticleSourceRef {
  title: string;
  publisher: string;
  url: string;
  publishedAt: string;
}

export interface Article {
  id: string;
  topicId: string;
  slug: string;
  title: string;
  metaDescription: string;
  dek: string;
  contentMarkdown: string;
  summaryBullets: string[];
  eli5Markdown: string;
  socialPack: SocialPack;
  videoScript: string;
  imagePrompt: string;
  tags: string[];
  category: string;
  authorName: string;
  status: ArticleStatus;
  risk: ContentRisk;
  qualityScore: number;
  sources: ArticleSourceRef[];
  readingMinutes: number;
  heroImageUrl?: string;
  canonicalUrl?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QualityReport {
  id: string;
  articleId: string;
  topicId: string;
  score: number;
  passed: boolean;
  reasons: string[];
  checks: Record<string, boolean>;
  createdAt: string;
}

export interface ReviewTask {
  id: string;
  articleId: string;
  topicId: string;
  title: string;
  reason: string;
  status: "open" | "approved" | "rejected";
  priority: "normal" | "high";
  createdAt: string;
}

export interface MediaAsset {
  id: string;
  articleId?: string;
  topicId?: string;
  kind: "hero" | "og" | "social" | "thumbnail";
  prompt: string;
  url: string;
  provider: "r2" | "remote" | "placeholder";
  attribution: string;
  generatedBy?: "ai" | "stock";
  createdAt: string;
}

export interface DistributionJob {
  id: string;
  articleId: string;
  channel: DistributionChannel;
  payload: Record<string, string | string[]>;
  scheduledFor: string;
  status: "dry_run" | "scheduled" | "posted" | "failed";
  utmUrl: string;
  createdAt: string;
}

export interface Subscriber {
  id: string;
  email: string;
  topics: string[];
  status: "active" | "paused" | "unsubscribed";
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actor: "system" | "admin" | "worker";
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface PipelineRun {
  runId: string;
  startedAt: string;
  completedAt?: string;
  dryRun: boolean;
  rawItemsFetched: number;
  topicsClustered: number;
  articlesGenerated: number;
  articlesPublished: number;
  qualityFailures: number;
  logs: string[];
}

export interface PlatformState {
  sources: Source[];
  rawItems: RawItem[];
  topics: Topic[];
  topicSources: TopicSource[];
  factClaims: FactClaim[];
  articles: Article[];
  qualityReports: QualityReport[];
  reviewTasks: ReviewTask[];
  mediaAssets: MediaAsset[];
  distributionJobs: DistributionJob[];
  subscribers: Subscriber[];
  auditLogs: AuditLog[];
}

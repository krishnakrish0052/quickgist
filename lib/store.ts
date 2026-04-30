import { createSeedState } from "@/lib/seed";
import type {
  Article,
  AuditLog,
  DistributionJob,
  FactClaim,
  PlatformState,
  QualityReport,
  RawItem,
  ReviewTask,
  Topic
} from "@/lib/types";
import { nowIso } from "@/lib/utils";

const globalForStore = globalThis as unknown as {
  quickgistState?: PlatformState;
};

export function getPlatformState(): PlatformState {
  if (!globalForStore.quickgistState) {
    globalForStore.quickgistState = createSeedState();
  }
  return globalForStore.quickgistState;
}

export function resetPlatformState(): PlatformState {
  globalForStore.quickgistState = createSeedState();
  return globalForStore.quickgistState;
}

export function upsertRawItems(items: RawItem[]): RawItem[] {
  const state = getPlatformState();
  const existingHashes = new Set(state.rawItems.map((item) => item.contentHash));
  const inserted = items.filter((item) => !existingHashes.has(item.contentHash));
  state.rawItems.push(...inserted);
  return inserted;
}

export function upsertTopics(topics: Topic[]): Topic[] {
  const state = getPlatformState();
  const inserted: Topic[] = [];

  topics.forEach((topic) => {
    const existing = state.topics.find((candidate) => candidate.slug === topic.slug);
    if (existing) {
      existing.rawItemIds = Array.from(new Set([...existing.rawItemIds, ...topic.rawItemIds]));
      existing.sourceIds = Array.from(new Set([...existing.sourceIds, ...topic.sourceIds]));
      existing.trendScore = Math.max(existing.trendScore, topic.trendScore);
      existing.updatedAt = nowIso();
    } else {
      state.topics.push(topic);
      inserted.push(topic);
    }
  });

  return inserted;
}

export function upsertFactClaims(claims: FactClaim[]): FactClaim[] {
  const state = getPlatformState();
  const existingClaims = new Set(state.factClaims.map((claim) => claim.claim.toLowerCase()));
  const inserted = claims.filter((claim) => !existingClaims.has(claim.claim.toLowerCase()));
  state.factClaims.push(...inserted);
  return inserted;
}

export function upsertArticle(article: Article): Article {
  const state = getPlatformState();
  const existingIndex = state.articles.findIndex((candidate) => candidate.id === article.id);
  if (existingIndex >= 0) {
    state.articles[existingIndex] = article;
  } else {
    state.articles.push(article);
  }
  return article;
}

export function addQualityReport(report: QualityReport): QualityReport {
  getPlatformState().qualityReports.push(report);
  return report;
}

export function addReviewTask(task: ReviewTask): ReviewTask {
  const state = getPlatformState();
  const exists = state.reviewTasks.some((candidate) => candidate.articleId === task.articleId && candidate.status === "open");
  if (!exists) state.reviewTasks.push(task);
  return task;
}

export function addDistributionJobs(jobs: DistributionJob[]): DistributionJob[] {
  getPlatformState().distributionJobs.push(...jobs);
  return jobs;
}

export function addAuditLog(log: Omit<AuditLog, "id" | "createdAt">): AuditLog {
  const auditLog: AuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: nowIso(),
    ...log
  };
  getPlatformState().auditLogs.push(auditLog);
  return auditLog;
}

export function getPublishedArticles(): Article[] {
  return getPlatformState()
    .articles.filter((article) => article.status === "published")
    .sort((a, b) => (b.publishedAt ?? b.updatedAt).localeCompare(a.publishedAt ?? a.updatedAt));
}

export function getArticleBySlug(slug: string): Article | undefined {
  return getPlatformState().articles.find((article) => article.slug === slug);
}

export function getTopicBySlug(slug: string): Topic | undefined {
  return getPlatformState().topics.find((topic) => topic.slug === slug);
}

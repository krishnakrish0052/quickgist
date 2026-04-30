import type { DistributionChannel } from "@/lib/types";

export const queueEvents = {
  rawItemFetched: "raw_item.fetched",
  topicClustered: "topic.clustered",
  contentRequested: "content.requested",
  contentGenerated: "content.generated",
  qualityPassed: "quality.passed",
  qualityFailed: "quality.failed",
  articlePublished: "article.published",
  distributionScheduled: "distribution.scheduled"
} as const;

export type QueueEventName = (typeof queueEvents)[keyof typeof queueEvents];

export interface QueueEventPayload {
  event: QueueEventName;
  entityId: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export const defaultDistributionChannels: DistributionChannel[] = [
  "telegram",
  "x",
  "linkedin",
  "newsletter",
  "rss"
];

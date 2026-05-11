import { z } from "zod";

const configSchema = z.object({
  siteUrl: z.string().url(),
  adminApiKey: z.string(),
  pipelineDryRun: z.boolean(),
  pipelineAutoPublish: z.boolean(),
  storageDriver: z.enum(["postgres", "memory"]),
  databaseUrl: z.string(),
  autoPublishQualityThreshold: z.number().int().min(0).max(100),
  autoPublishConfidenceThreshold: z.number().min(0).max(1),
  reviewConfidenceThreshold: z.number().min(0).max(1),
  minSourcesForPublish: z.number().int().min(1),
  highRiskCategories: z.array(z.string()),
  modelDailyTokenBudget: z.number().int().positive(),
  redisUrl: z.string().optional(),
  queueDriver: z.enum(["bullmq", "inline"]),
  r2PublicBaseUrl: z.string().optional(),
  brandName: z.string(),
  isProduction: z.boolean(),
  aiProvider: z.enum(["auto", "deepseek", "groq", "openai", "gemini"]),
  aiModel: z.string().optional(),
  pipelineAgentConcurrency: z.number().int().min(1).max(16)
});

function booleanFromEnv(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

const isProduction = process.env.NODE_ENV === "production";
const explicitStorageDriver = process.env.STORAGE_DRIVER as "postgres" | "memory" | undefined;
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const inferredStorageDriver: "postgres" | "memory" =
  explicitStorageDriver ?? (process.env.NODE_ENV === "test" || !hasDatabaseUrl ? "memory" : "postgres");

const explicitQueueDriver = process.env.QUEUE_DRIVER as "bullmq" | "inline" | undefined;
const hasRedisUrl = Boolean(process.env.REDIS_URL);
const inferredQueueDriver: "bullmq" | "inline" = explicitQueueDriver ?? (hasRedisUrl ? "bullmq" : "inline");

export const config = configSchema.parse({
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  adminApiKey: process.env.ADMIN_API_KEY ?? (isProduction ? "" : "dev-admin-key"),
  pipelineDryRun: booleanFromEnv(process.env.PIPELINE_DRY_RUN, true),
  pipelineAutoPublish: booleanFromEnv(process.env.PIPELINE_AUTO_PUBLISH, false),
  storageDriver: inferredStorageDriver,
  databaseUrl: process.env.DATABASE_URL ?? "postgres://quickgist:quickgist@localhost:5432/quickgist",
  autoPublishQualityThreshold: Number(process.env.AUTO_PUBLISH_QUALITY_THRESHOLD ?? 60),
  autoPublishConfidenceThreshold: Number(process.env.AUTO_PUBLISH_CONFIDENCE_THRESHOLD ?? 0.60),
  reviewConfidenceThreshold: Number(process.env.REVIEW_CONFIDENCE_THRESHOLD ?? 0.40),
  minSourcesForPublish: Number(process.env.MIN_SOURCES_FOR_PUBLISH ?? 1),
  highRiskCategories: (process.env.HIGH_RISK_CATEGORIES ?? "legal,conflict,elections")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
  modelDailyTokenBudget: Number(process.env.MODEL_DAILY_TOKEN_BUDGET ?? 2000000),
  redisUrl: process.env.REDIS_URL || undefined,
  queueDriver: inferredQueueDriver,
  r2PublicBaseUrl: process.env.R2_PUBLIC_BASE_URL || undefined,
  brandName: process.env.NEXT_PUBLIC_BRAND_NAME ?? "QuickGist",
  isProduction,
  aiProvider: (process.env.AI_PROVIDER as "auto" | "deepseek" | "groq" | "openai" | "gemini" | undefined) ?? "auto",
  aiModel: process.env.AI_MODEL || undefined,
  pipelineAgentConcurrency: Number(process.env.PIPELINE_AGENT_CONCURRENCY ?? 8)
});

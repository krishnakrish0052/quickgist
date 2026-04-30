import { Worker } from "bullmq";
import { runIngestion } from "@/lib/services/ingestion";
import { detectTrendingTopics } from "@/lib/services/trend";
import { extractFactClaims } from "@/lib/services/factExtraction";
import { generateArticlePackage } from "@/lib/services/generation";
import { evaluateQuality } from "@/lib/services/quality";
import { publishArticle } from "@/lib/services/publishing";
import { scheduleDistribution } from "@/lib/services/distribution";
import { getArticleById, getTopicById } from "@/lib/repositories/platformRepository";
import { getRedisConnection, isQueueEnabled, queueNames } from "@/workers/queues";
import { runContentPipeline } from "@/workers/pipeline";

if (!isQueueEnabled()) {
  console.warn(
    "[workers] REDIS_URL not configured. Workers cannot start in inline mode. " +
      "Set REDIS_URL and QUEUE_DRIVER=bullmq to use BullMQ workers, or run `npm run pipeline:local` for an inline run."
  );
  if (process.argv.includes("--once")) {
    await runContentPipeline({ dryRun: process.env.PIPELINE_DRY_RUN !== "false" });
    process.exit(0);
  }
  process.exit(0);
}

const connection = getRedisConnection();

function log(name: string) {
  return {
    completed: (jobId: string | undefined) => console.log(`[${name}] completed ${jobId}`),
    failed: (jobId: string | undefined, error: Error) => console.error(`[${name}] failed ${jobId}`, error)
  };
}

const workers = [
  new Worker(
    queueNames.ingest,
    async (job) => runIngestion(job.data as { rssUrls?: string[]; limit?: number; dryRun?: boolean }),
    { connection }
  ),
  new Worker(queueNames.cluster, async () => detectTrendingTopics(), { connection }),
  new Worker(
    queueNames.generate,
    async (job) => {
      const topic = await getTopicById(String(job.data.topicId));
      if (!topic) throw new Error("Topic not found");
      await extractFactClaims(topic);
      return generateArticlePackage(topic);
    },
    { connection }
  ),
  new Worker(
    queueNames.quality,
    async (job) => {
      const article = await getArticleById(String(job.data.articleId));
      if (!article) throw new Error("Article not found");
      return evaluateQuality(article);
    },
    { connection }
  ),
  new Worker(queueNames.publish, async (job) => publishArticle(String(job.data.articleId), "worker"), { connection }),
  new Worker(
    queueNames.distribution,
    async (job) => {
      const article = await getArticleById(String(job.data.articleId));
      if (!article) throw new Error("Article not found");
      return scheduleDistribution({ article, dryRun: job.data.dryRun !== false });
    },
    { connection }
  )
];

workers.forEach((worker) => {
  const logger = log(worker.name);
  worker.on("completed", (job) => logger.completed(job?.id));
  worker.on("failed", (job, error) => logger.failed(job?.id, error));
});

console.log(`QuickGist workers running: ${workers.map((worker) => worker.name).join(", ")}`);

if (process.argv.includes("--once")) {
  await runContentPipeline({ dryRun: process.env.PIPELINE_DRY_RUN !== "false" });
  await Promise.all(workers.map((worker) => worker.close()));
  await connection.quit();
}

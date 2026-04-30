import { config } from "@/lib/config";
import type { PipelineRun } from "@/lib/types";
import { nowIso } from "@/lib/utils";
import { runIngestion } from "@/lib/services/ingestion";
import { detectTrendingTopics } from "@/lib/services/trend";
import { extractFactClaims } from "@/lib/services/factExtraction";
import { generateArticlePackage } from "@/lib/services/generation";
import { evaluateQuality } from "@/lib/services/quality";
import { createMediaAsset } from "@/lib/services/media";
import { publishArticle } from "@/lib/services/publishing";
import { scheduleDistribution } from "@/lib/services/distribution";
import { addAuditLog, getRawItems, seedRepository } from "@/lib/repositories/platformRepository";

export interface PipelineOptions {
  dryRun?: boolean;
  rssUrls?: string[];
  autoPublish?: boolean;
}

export async function runContentPipeline(options: PipelineOptions = {}): Promise<PipelineRun> {
  const dryRun = options.dryRun ?? config.pipelineDryRun;
  await seedRepository();
  const run: PipelineRun = {
    runId: `run-${Date.now()}`,
    startedAt: nowIso(),
    dryRun,
    rawItemsFetched: 0,
    topicsClustered: 0,
    articlesGenerated: 0,
    articlesPublished: 0,
    qualityFailures: 0,
    logs: []
  };

  const ingestion = await runIngestion({ rssUrls: options.rssUrls, dryRun });
  run.rawItemsFetched = ingestion.fetched.length;
  run.logs.push(...ingestion.logs);

  const trend = await detectTrendingTopics(dryRun ? ingestion.fetched : await getRawItems());
  run.topicsClustered = trend.topics.length;
  run.logs.push(`Detected ${trend.topics.length} novel topic clusters; skipped ${trend.skipped}.`);

  for (const topic of trend.topics) {
    await extractFactClaims(topic);
    const { article } = await generateArticlePackage(topic);
    await createMediaAsset(topic, article.id);
    run.articlesGenerated += 1;

    const report = await evaluateQuality(article);
    const decision = report.confidence.decision;
    run.logs.push(
      `Quality for ${article.slug}: ${Math.round(report.confidence.confidence * 100)}/100 → ${decision} ` +
        `(SEO ${report.seo.overall}, structural ${report.confidence.weights.structuralScore}).`
    );

    if (decision === "regenerate") {
      run.qualityFailures += 1;
      continue;
    }

    if (
      decision === "auto_publish" &&
      (options.autoPublish ?? false) &&
      !dryRun &&
      article.risk !== "high"
    ) {
      const publishResult = await publishArticle(article.id);
      if (publishResult.published) {
        run.articlesPublished += 1;
        await scheduleDistribution({ article: publishResult.article, dryRun });
      }
    } else {
      run.logs.push(`Article ${article.slug} is ready for review.`);
    }
  }

  run.completedAt = nowIso();
  await addAuditLog({
    actor: "worker",
    action: "pipeline.completed",
    entityType: "pipeline_run",
    entityId: run.runId,
    metadata: { run }
  });

  return run;
}

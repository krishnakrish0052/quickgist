import { ok } from "@/lib/api";
import { config } from "@/lib/config";
import { pingDatabase } from "@/lib/db/client";
import { getOperationsSnapshot } from "@/lib/services/observability";
import { getPipelineRunState } from "@/lib/services/pipelineTracker";
import { getPlatformSnapshot } from "@/lib/repositories/platformRepository";

export const dynamic = "force-dynamic";

export async function GET() {
  const database = await pingDatabase();
  const snapshot = database.ok ? await getOperationsSnapshot().catch(() => null) : null;

  const pipeline = getPipelineRunState();
  const platform = await getPlatformSnapshot().catch(() => null);

  const recentErrors = pipeline.agents.filter((a) => a.aiFailures > 0).length;

  const sourceFreshness = {
    totalFeeds: platform?.sources?.length ?? 0,
    lastSuccessfulFetch: pipeline.startedAt ?? platform?.auditLogs?.find(
      (l) => l.action === "ingest.rss.success",
    )?.createdAt ?? null,
  };

  return ok({
    ok: database.ok,
    storageDriver: config.storageDriver,
    database,
    snapshot,
    pipeline: {
      status: pipeline.status,
      runId: pipeline.runId || null,
      articlesGenerated: pipeline.articlesGenerated,
      articlesPublished: pipeline.articlesPublished,
      qualityFailures: pipeline.qualityFailures,
    },
    recentErrors,
    sourceFreshness,
    articles: platform?.articles?.length ?? 0,
    topics: platform?.topics?.length ?? 0,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
}

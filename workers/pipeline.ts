import { config } from "@/lib/config";
import type { PipelineRun, Topic } from "@/lib/types";
import { nowIso } from "@/lib/utils";
import { runIngestion } from "@/lib/services/ingestion";
import { detectTrendingTopics } from "@/lib/services/trend";
import { addAuditLog, getRawItems, seedRepository } from "@/lib/repositories/platformRepository";
import {
  startPipelineRun,
  stepStart,
  stepDone,
  updateCounts,
  updateStep,
  initNamedAgents,
  setPendingTopics,
  getPipelineRunState,
  completePipelineRun,
  failPipelineRun,
  completeNamedAgentTopic,
  failNamedAgentTopic,
  updateLifecycleStage,
  setIdleNamedAgent,
  incrementCount,
  claimNextTopic,
  AGENT_NAMES,
} from "@/lib/services/pipelineTracker";
import type { LifecycleStage } from "@/lib/services/pipelineTracker";
import { extractFactClaims } from "@/lib/services/factExtraction";
import { generateArticlePackage } from "@/lib/services/generation";
import { evaluateQuality } from "@/lib/services/quality";
import { publishArticle } from "@/lib/services/publishing";
import { scheduleDistribution } from "@/lib/services/distribution";
import { createConcurrencyLimiter } from "@/lib/services/concurrency";

export interface PipelineOptions {
  dryRun?: boolean;
  rssUrls?: string[];
  autoPublish?: boolean;
}

export async function runContentPipeline(options: PipelineOptions = {}): Promise<PipelineRun> {
  const dryRun = options.dryRun ?? config.pipelineDryRun;
  const autoPublish = options.autoPublish ?? false;
  const runId = `run-${Date.now()}`;
  const runLogs: string[] = [];
  const log = (msg: string) => runLogs.push(msg);

  startPipelineRun(runId, dryRun, autoPublish);

  const run: PipelineRun = {
    runId,
    startedAt: nowIso(),
    dryRun,
    rawItemsFetched: 0,
    topicsClustered: 0,
    articlesGenerated: 0,
    articlesPublished: 0,
    qualityFailures: 0,
    logs: runLogs,
  };

  try {
    // Phase 1: Seed repository
    stepStart("seed");
    await seedRepository();
    stepDone("seed", "Repository seeded with sources and demo topics", 0);

    // Phase 2: Ingest RSS feeds
    stepStart("ingest");
    const ingestion = await runIngestion({ rssUrls: options.rssUrls, dryRun });
    run.rawItemsFetched = ingestion.fetched.length;
    for (const line of ingestion.logs) log(line);
    updateCounts({
      feedsAttempted: ingestion.feedsAttempted,
      feedsSucceeded: ingestion.feedsSucceeded,
      rawItemsFetched: ingestion.fetched.length,
    });
    stepDone(
      "ingest",
      `Fetched ${ingestion.fetched.length} raw items from ${ingestion.feedsSucceeded}/${ingestion.feedsAttempted} feeds`,
      ingestion.feedsSucceeded,
    );

    // Phase 3: Cluster into topics
    stepStart("cluster");
    const trend = await detectTrendingTopics(dryRun ? ingestion.fetched : await getRawItems(), dryRun);
    run.topicsClustered = trend.topics.length;
    log(`Detected ${trend.topics.length} novel topic clusters; skipped ${trend.skipped}.`);
    updateCounts({ topicsClustered: trend.topics.length });
    stepDone("cluster", `Clustered into ${trend.topics.length} topics`, trend.topics.length);

    // Phase 4: Concurrent topic processing — agents run in-process, share memory
    stepStart("dispatch");
    initNamedAgents();
    const topics = trend.topics;
    setPendingTopics(topics);

    if (topics.length === 0) {
      stepDone("dispatch", "No topics to process", 0);
    } else {
      // Each worker pulls topics via claimNextTopic() so faster workers naturally
      // handle more topics — matching the old subprocess work-steal pattern.
      const agentCount = Math.min(topics.length, config.pipelineAgentConcurrency);
      const limiter = createConcurrencyLimiter(agentCount);

      const progressInterval = setInterval(() => {
        const state = getPipelineRunState();
        updateStep("dispatch", {
          detail: `${state.articlesGenerated}/${topics.length} articles · ${state.agents.filter((a) => a.status === "working").length} agents active`,
          count: state.articlesGenerated,
        });
      }, 1000);

      const workers = Array.from({ length: agentCount }, (_, i) => {
        const agentId = `agent-${AGENT_NAMES[i].toLowerCase()}`;
        return limiter(async () => {
          while (true) {
            if (config.storageDriver === "memory") {
              // In memory mode, topics are claimed directly from the shared array
              // since all agents share the same process memory.
              const topic = claimNextTopic(agentId);
              if (!topic) break;
              await processTopic(agentId, topic, dryRun, autoPublish, log, runId);
            } else {
              const topic = claimNextTopic(agentId);
              if (!topic) break;
              await processTopic(agentId, topic, dryRun, autoPublish, log, runId);
            }
          }
        });
      });

      await Promise.all(workers);
      clearInterval(progressInterval);

      // Aggregate final counts
      const state = getPipelineRunState();
      run.articlesGenerated = state.articlesGenerated;
      run.articlesPublished = state.articlesPublished;
      run.qualityFailures = state.qualityFailures;

      // Mark agents that were assigned but did no work as idle
      for (const agent of state.agents) {
        if (agent.status === "assigned" && agent.topicsCompleted === 0 && agent.topicsFailed === 0) {
          setIdleNamedAgent(agent.agentId);
        }
      }

      for (const agent of state.agents) {
        log(`${agent.agentId}: ${agent.topicsCompleted} completed, ${agent.topicsFailed} failed`);
      }
      stepDone(
        "dispatch",
        `${run.articlesGenerated}/${topics.length} articles · ${state.agents.filter((a) => a.topicsCompleted > 0 || a.topicsFailed > 0).length} agents active`,
        run.articlesGenerated,
      );
    }

    run.completedAt = nowIso();
    completePipelineRun();
    await addAuditLog({
      actor: "worker",
      action: "pipeline.completed",
      entityType: "pipeline_run",
      entityId: run.runId,
      metadata: { run },
    });

    return run;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    failPipelineRun(message);
    log(`Pipeline failed: ${message}`);
    run.completedAt = nowIso();
    await addAuditLog({
      actor: "worker",
      action: "pipeline.failed",
      entityType: "pipeline_run",
      entityId: run.runId,
      metadata: { error: message },
    });
    return run;
  }
}

/**
 * Process a single topic through the full generate → quality → publish lifecycle.
 * This replaces the old subprocess-based workers/agent.ts for pipeline runs.
 */
async function processTopic(
  agentId: string,
  topic: Topic,
  dryRun: boolean,
  autoPublish: boolean,
  log: (msg: string) => void,
  _runId: string,
): Promise<void> {
  const TOPIC_TIMEOUT_MS = Number(process.env.TOPIC_TIMEOUT_MS ?? 900000);
  const startedAt = new Date().toISOString();
  const label = topic.title.slice(0, 60);
  const tag = `[${agentId}]`;

  try {
    await Promise.race([
      (async () => {
        // ── Stage 1: Fact Extraction ──────────────────────────────
        updateLifecycleStage(agentId, "fact_extractor", { status: "running", startedAt });
        await extractFactClaims(topic);
        updateLifecycleStage(agentId, "fact_extractor", {
          status: "done",
          completedAt: new Date().toISOString(),
          detail: label,
        });

        // ── Stage 2: Article Generation ───────────────────────────
        updateLifecycleStage(agentId, "writer", { status: "running", startedAt: new Date().toISOString() });
        const { article } = await generateArticlePackage(topic);
        updateLifecycleStage(agentId, "writer", {
          status: "done",
          completedAt: new Date().toISOString(),
          detail: article.title.slice(0, 40) + "…",
        });
        // ── Stage 3: Social / Video / FAQ generation ──────────────
        updateLifecycleStage(agentId, "social_composer", { status: "running", startedAt: new Date().toISOString() });
        const { generateShortsScript, generateVideoLongScript, generateFaqSection } = await import(
          "@/lib/services/generation"
        );
        // Per-call 45s timeout so one hang does not block the agent
        const STAGE_TIMEOUT = 45_000;
        const socialResults = await Promise.allSettled([
          Promise.race([
            generateShortsScript(topic),
            new Promise((_, reject) => setTimeout(() => reject(new Error("shorts_script timeout")), STAGE_TIMEOUT)),
          ]).catch((e) => { log(`${tag} shorts_script: ${e.message}`); return null; }),
          Promise.race([
            generateVideoLongScript(topic),
            new Promise((_, reject) => setTimeout(() => reject(new Error("video_long_script timeout")), STAGE_TIMEOUT)),
          ]).catch((e) => { log(`${tag} video_long_script: ${e.message}`); return null; }),
          Promise.race([
            generateFaqSection(topic),
            new Promise((_, reject) => setTimeout(() => reject(new Error("faq_section timeout")), STAGE_TIMEOUT)),
          ]).catch((e) => { log(`${tag} faq_section: ${e.message}`); return null; }),
        ]);
        const socialOk = socialResults.filter((r) => r.status === "fulfilled" && r.value !== null).length;
        log(`${tag} Social: ${socialOk}/3 sub-tasks completed`);
        updateLifecycleStage(agentId, "social_composer", {
          status: "done",
          completedAt: new Date().toISOString(),
          detail: socialOk < 3 ? `${socialOk}/3 ok` : "done",
        });

        // ── Stage 4: Media ────────────────────────────────────────
        updateLifecycleStage(agentId, "media_scout", { status: "running", startedAt: new Date().toISOString() });
        const { createMediaAsset } = await import("@/lib/services/media");
        await createMediaAsset(topic, article.id);
        updateLifecycleStage(agentId, "media_scout", {
          status: "done",
          completedAt: new Date().toISOString(),
        });

        // ── Stage 5: Quality ──────────────────────────────────────
        updateLifecycleStage(agentId, "quality_inspector", { status: "running", startedAt: new Date().toISOString() });
        const report = await evaluateQuality(article);
        const decision = report.confidence.decision;
        updateLifecycleStage(agentId, "quality_inspector", {
          status: "done",
          completedAt: new Date().toISOString(),
          detail:
            decision === "regenerate"
              ? "regenerate"
              : decision === "auto_publish"
                ? "auto"
                : "review",
        });

        // ── Stage 6: Publish / Distribute ─────────────────────────
        if (decision !== "regenerate") {
          updateLifecycleStage(agentId, "publisher", { status: "running", startedAt: new Date().toISOString() });
          if (decision === "auto_publish" && autoPublish && !dryRun && article.risk !== "high") {
            const pubResult = await publishArticle(article.id, "worker", false, agentId);
            if (pubResult.published) {
              await scheduleDistribution({ article: pubResult.article, dryRun });
              updateLifecycleStage(agentId, "publisher", {
                status: "done",
                completedAt: new Date().toISOString(),
                detail: "published",
              });
            } else {
              updateLifecycleStage(agentId, "publisher", {
                status: "done",
                completedAt: new Date().toISOString(),
                detail: `not published: ${pubResult.reason}`,
              });
            }
          } else {
            updateLifecycleStage(agentId, "publisher", {
              status: "done",
              completedAt: new Date().toISOString(),
              detail: "review",
            });
          }
        } else {
          updateLifecycleStage(agentId, "publisher", { status: "pending", detail: "skipped (regenerate)" });
        }

        completeNamedAgentTopic(agentId);
        incrementCount("articlesGenerated");
        log(`${tag} Completed topic: ${label}`);
      })(),
      new Promise<void>((_, reject) =>
        setTimeout(
          () => reject(new Error("Topic processing timed out after 15 minutes")),
          TOPIC_TIMEOUT_MS,
        ),
      ),
    ]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log(`${tag} Failed topic ${topic.id}: ${msg}`);

    // Update each lifecycle stage to error so the admin dashboard shows
    // which stages were affected by the failure / timeout.
    const lifecycleStages: LifecycleStage[] = [
      "fact_extractor",
      "writer",
      "social_composer",
      "media_scout",
      "quality_inspector",
      "publisher",
    ];
    for (const stage of lifecycleStages) {
      updateLifecycleStage(agentId, stage, {
        status: "error",
        detail: err instanceof Error && err.message.includes("timed out")
          ? "Topic timed out"
          : msg.slice(0, 80),
      });
    }

    failNamedAgentTopic(agentId, msg);
  }
}

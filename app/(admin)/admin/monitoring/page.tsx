import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Layers,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import {
  getPipelineRunState,
  AGENT_NAMES,
  STAGE_LABELS,
  type LifecycleStage,
} from "@/lib/services/pipelineTracker";
import { getPlatformSnapshot } from "@/lib/repositories/platformRepository";
import { getOperationsSnapshot } from "@/lib/services/observability";
import { AdminNav } from "@/components/AdminNav";

export const metadata = {
  title: "System Monitoring — QuickGist",
  description:
    "Comprehensive pipeline monitoring, agent health, content quality, and system metrics.",
};

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function statusColor(status: string): string {
  switch (status) {
    case "working":
    case "running":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "assigned":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "idle":
    case "published":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "error":
    case "blocked":
    case "rejected":
      return "bg-red-50 text-red-700 border-red-200";
    case "review":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-[var(--bg)] text-[var(--ink-muted)] border-[var(--line)]";
  }
}

function stagePill(stage: {
  type: LifecycleStage;
  status: string;
}) {
  const base =
    "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.10em]";

  if (stage.status === "done") {
    return (
      <span className={`${base} bg-emerald-50 text-emerald-700 border-emerald-200`}>
        <CheckCircle2 size={9} />
        {STAGE_LABELS[stage.type].slice(0, 4)}
      </span>
    );
  }
  if (stage.status === "running") {
    return (
      <span className={`${base} bg-blue-50 text-blue-700 border-blue-200`}>
        <Activity size={9} className="animate-pulse" />
        {STAGE_LABELS[stage.type].slice(0, 4)}
      </span>
    );
  }
  if (stage.status === "error") {
    return (
      <span className={`${base} bg-red-50 text-red-700 border-red-200`}>
        <XCircle size={9} />
        {STAGE_LABELS[stage.type].slice(0, 4)}
      </span>
    );
  }
  return (
    <span className={`${base} bg-[var(--bg)] text-[var(--ink-faint)] border-[var(--line)]`}>
      <Clock size={9} />
      {STAGE_LABELS[stage.type].slice(0, 4)}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function MonitoringPage() {
  const pipelineState = getPipelineRunState();
  const snap = await getPlatformSnapshot();
  const ops = await getOperationsSnapshot();

  // ── Derived stats ──────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const articlesToday = snap.articles.filter(
    (a) => a.createdAt.slice(0, 10) === today || a.updatedAt.slice(0, 10) === today,
  ).length;

  const qualityBins = {
    high: snap.articles.filter((a) => a.qualityScore >= 60).length,
    medium: snap.articles.filter((a) => a.qualityScore >= 40 && a.qualityScore < 60).length,
    low: snap.articles.filter((a) => a.qualityScore < 40).length,
  };

  const recentArticles = [...snap.articles]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 10);

  const recentAuditActivity = snap.auditLogs
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const agentsWithErrors = pipelineState.agents.filter(
    (a) => a.aiFailures > 0,
  ).length;

  return (
    <main className="container-shell py-8">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-signal">
            QuickGist
          </p>
          <h1 className="mt-0.5 text-3xl font-bold tracking-tight text-[var(--ink)]">
            System Monitoring
          </h1>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold border ${
            pipelineState.status === "running"
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : pipelineState.status === "error"
                ? "bg-red-50 text-red-700 border-red-200"
                : pipelineState.status === "completed"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-[var(--bg)] text-[var(--ink-soft)] border-[var(--line)]"
          }`}
        >
          {pipelineState.status === "running"
            ? "● Running"
            : pipelineState.status === "error"
              ? "● Error"
              : pipelineState.status === "completed"
                ? "● Completed"
                : "● Idle"}
        </span>
      </div>

      <AdminNav />

      {/* ── Pipeline status card ────────────────────────────────── */}
      <section className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
          <Activity size={15} className="text-signal" />
          Pipeline Status
        </h2>

        {/* Run metadata */}
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-[var(--ink-soft)]">
          <span>
            Run ID:{" "}
            <code className="rounded bg-[var(--bg)] px-1.5 py-0.5 font-mono text-[var(--ink)]">
              {pipelineState.runId?.slice(-12) ?? "—"}
            </code>
          </span>
          <span>
            Started:{" "}
            <span className="font-semibold text-[var(--ink)]">
              {pipelineState.startedAt
                ? new Date(pipelineState.startedAt).toLocaleString()
                : "—"}
            </span>
          </span>
          <span>
            Completed:{" "}
            <span className="font-semibold text-[var(--ink)]">
              {pipelineState.completedAt
                ? new Date(pipelineState.completedAt).toLocaleString()
                : "—"}
            </span>
          </span>
        </div>

        {/* Pipeline counters */}
        <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          <MetricCard
            label="Articles Generated"
            value={String(pipelineState.articlesGenerated)}
          />
          <MetricCard
            label="Articles Published"
            value={String(pipelineState.articlesPublished)}
          />
          <MetricCard
            label="Quality Failures"
            value={String(pipelineState.qualityFailures)}
          />
          <MetricCard
            label="Run Mode"
            value={
              pipelineState.dryRun
                ? pipelineState.autoPublish
                  ? "Dry Run + Auto"
                  : "Dry Run"
                : "Live"
            }
          />
        </div>

        {/* Pipeline steps */}
        {pipelineState.steps.length > 0 && (
          <div className="mt-4 grid gap-1.5">
            {pipelineState.steps.map((step) => (
              <div
                key={step.id}
                className="flex items-center gap-3 rounded-md bg-[var(--bg)] px-3 py-2 text-xs"
              >
                {step.status === "running" ? (
                  <Activity size={12} className="animate-pulse text-blue-500 shrink-0" />
                ) : step.status === "done" ? (
                  <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                ) : step.status === "error" ? (
                  <XCircle size={12} className="text-red-500 shrink-0" />
                ) : (
                  <Clock size={12} className="text-[var(--ink-faint)] shrink-0" />
                )}
                <span className="font-medium text-[var(--ink)] min-w-[140px]">
                  {step.label}
                </span>
                <span className="flex-1 text-[var(--ink-faint)]">
                  {step.detail || "Waiting..."}
                </span>
                {step.count > 0 && (
                  <span className="font-semibold text-[var(--ink)]">{step.count}</span>
                )}
                {step.subDetail && (
                  <span className="text-[var(--ink-faint)]">{step.subDetail}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {pipelineState.error && (
          <div className="mt-3 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            <AlertCircle size={12} className="inline-block mr-1" />
            {pipelineState.error}
          </div>
        )}
      </section>

      {/* ── Agent Health Grid ───────────────────────────────────── */}
      <section className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
          <Layers size={15} className="text-signal" />
          Agent Health
          {agentsWithErrors > 0 && (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600 border border-red-200">
              {agentsWithErrors} with errors
            </span>
          )}
        </h2>

        {pipelineState.agents.length === 0 ? (
          <p className="mt-3 text-xs text-[var(--ink-faint)]">
            No agents initialized — start a pipeline run to populate agent states.
          </p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {pipelineState.agents.map((agent) => (
              <div
                key={agent.agentId}
                className="rounded-lg border border-[var(--line)] bg-[var(--bg)] p-3"
              >
                {/* Agent header */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-[var(--ink)]">
                    {agent.agentName}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${statusColor(agent.status)}`}
                  >
                    {agent.status}
                  </span>
                </div>

                {/* Current topic */}
                {agent.currentTopicTitle && (
                  <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-[var(--ink-soft)]">
                    {agent.currentTopicTitle}
                  </p>
                )}

                {/* Metrics */}
                <div className="mt-2 flex items-center gap-3 text-[10px] text-[var(--ink-faint)]">
                  <span>
                    <span className="font-semibold text-emerald-600">
                      {agent.topicsCompleted}
                    </span>{" "}
                    done
                  </span>
                  <span>
                    <span className="font-semibold text-red-500">
                      {agent.topicsFailed}
                    </span>{" "}
                    failed
                  </span>
                  {agent.aiFailures > 0 && (
                    <span>
                      <span className="font-semibold text-red-500">
                        {agent.aiFailures}
                      </span>{" "}
                      AI err
                    </span>
                  )}
                </div>

                {/* Lifecycle stages */}
                {agent.lifecycle.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {agent.lifecycle.map((stage) => (
                      <span key={stage.type}>{stagePill(stage)}</span>
                    ))}
                  </div>
                )}

                {/* Last error */}
                {agent.error && (
                  <p className="mt-2 rounded bg-red-50 px-2 py-1 text-[10px] leading-snug text-red-600 line-clamp-2">
                    {agent.error}
                  </p>
                )}
                {agent.lastError && !agent.error && (
                  <p className="mt-2 rounded bg-red-50 px-2 py-1 text-[10px] leading-snug text-red-600 line-clamp-1">
                    {agent.lastError}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Content Health ──────────────────────────────────────── */}
      <section className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
          <FileText size={15} className="text-signal" />
          Content Health
        </h2>

        {/* Article counts by status */}
        <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          <MetricCard label="Total Articles" value={String(snap.articles.length)} />
          <MetricCard
            label="Published"
            value={String(
              snap.articles.filter((a) => a.status === "published").length,
            )}
          />
          <MetricCard
            label="In Review"
            value={String(
              snap.articles.filter((a) => a.status === "review").length,
            )}
          />
          <MetricCard
            label="Drafts"
            value={String(
              snap.articles.filter((a) => a.status === "draft").length,
            )}
          />
        </div>

        {/* Quality score distribution */}
        {snap.articles.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
              Quality Score Distribution
            </h3>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <div className="rounded-md border border-emerald-200 bg-emerald-50/50 px-3 py-2 text-center">
                <div className="text-lg font-bold text-emerald-700">{qualityBins.high}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                  Score &ge; 60
                </div>
              </div>
              <div className="rounded-md border border-amber-200 bg-amber-50/50 px-3 py-2 text-center">
                <div className="text-lg font-bold text-amber-700">{qualityBins.medium}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">
                  Score 40&ndash;59
                </div>
              </div>
              <div className="rounded-md border border-red-200 bg-red-50/50 px-3 py-2 text-center">
                <div className="text-lg font-bold text-red-700">{qualityBins.low}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-red-600">
                  Score &lt; 40
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent articles with quality scores */}
        {recentArticles.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
              Recent Articles
            </h3>
            <div className="mt-2 max-h-60 overflow-y-auto rounded-md border border-[var(--line)]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-[var(--bg-elevated)]">
                  <tr className="border-b border-[var(--line)] text-left text-[var(--ink-muted)]">
                    <th className="px-2 py-1.5 font-medium">Title</th>
                    <th className="px-2 py-1.5 font-medium w-[64px]">Score</th>
                    <th className="px-2 py-1.5 font-medium w-[80px]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentArticles.map((article) => (
                    <tr
                      key={article.id}
                      className="border-b border-[var(--line)] last:border-0"
                    >
                      <td className="px-2 py-1.5">
                        <span className="line-clamp-1 text-[var(--ink)]">
                          {article.title}
                        </span>
                      </td>
                      <td className="px-2 py-1.5">
                        <span
                          className={`font-semibold ${
                            article.qualityScore >= 60
                              ? "text-emerald-600"
                              : article.qualityScore >= 40
                                ? "text-amber-600"
                                : "text-red-600"
                          }`}
                        >
                          {article.qualityScore}
                        </span>
                      </td>
                      <td className="px-2 py-1.5">
                        <span
                          className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${statusColor(
                            article.status,
                          )}`}
                        >
                          {article.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ── System Stats ────────────────────────────────────────── */}
      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
          <div className="text-2xl font-semibold text-[var(--ink)]">
            {snap.sources.length}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-[var(--ink-muted)]">
            <TrendingUp size={13} className="text-signal" />
            Sources
          </div>
        </div>

        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
          <div className="text-2xl font-semibold text-[var(--ink)]">
            {snap.topics.length}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-[var(--ink-muted)]">
            <Layers size={13} className="text-signal" />
            Topics
          </div>
        </div>

        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
          <div className="text-2xl font-semibold text-[var(--ink)]">
            {articlesToday}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-[var(--ink-muted)]">
            <FileText size={13} className="text-signal" />
            Articles Today
          </div>
        </div>

        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
          <div className="text-2xl font-semibold text-[var(--ink)]">
            {ops.auditEvents}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-[var(--ink-muted)]">
            <Clock size={13} className="text-signal" />
            Audit Events
          </div>
        </div>
      </section>

      {/* ── Recent Audit Activity ───────────────────────────────── */}
      {recentAuditActivity.length > 0 && (
        <section className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
            <AlertCircle size={15} className="text-signal" />
            Recent Activity
            <span className="ml-auto text-xs font-normal text-[var(--ink-faint)]">
              Last {recentAuditActivity.length} events
            </span>
          </h2>
          <div className="mt-3 max-h-56 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--line)] text-left text-[var(--ink-muted)]">
                  <th className="px-2 py-1.5 font-medium">Time</th>
                  <th className="px-2 py-1.5 font-medium">Action</th>
                  <th className="px-2 py-1.5 font-medium">Entity</th>
                  <th className="px-2 py-1.5 font-medium">Actor</th>
                </tr>
              </thead>
              <tbody>
                {recentAuditActivity.map((event, i) => (
                  <tr
                    key={i}
                    className="border-b border-[var(--line)] last:border-0"
                  >
                    <td className="px-2 py-1.5 text-[var(--ink-soft)]">
                      {new Date(event.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="px-2 py-1.5">
                      <span
                        className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.10em] ${
                          event.action.startsWith("article.publish")
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : event.action.startsWith("article.delete")
                              ? "bg-red-50 text-red-700 border-red-200"
                              : event.action.includes("quality")
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-[var(--bg)] text-[var(--ink-muted)] border-[var(--line)]"
                        }`}
                      >
                        {event.action.replace("article.", "")}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-[var(--ink-faint)]">
                      {event.entityType}
                    </td>
                    <td className="px-2 py-1.5 text-[var(--ink-soft)]">
                      {event.actor}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}

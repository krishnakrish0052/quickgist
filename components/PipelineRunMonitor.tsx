"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import type { NamedAgentState, PipelineRunState, PipelineStep, LifecycleStage } from "@/lib/services/pipelineTracker";
import { STAGE_LABELS } from "@/lib/services/pipelineTracker";

function StepIcon({ step }: { step: PipelineStep }) {
  switch (step.status) {
    case "running":
      return <Loader2 size={14} className="animate-spin text-blue-500" />;
    case "done":
      return <CheckCircle2 size={14} className="text-emerald-500" />;
    case "error":
      return <XCircle size={14} className="text-red-500" />;
    default:
      return <Clock size={14} className="text-[var(--ink-faint)]" />;
  }
}

function formatDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt) return "—";
  const end = completedAt ? new Date(completedAt) : new Date();
  const seconds = Math.round((end.getTime() - new Date(startedAt).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export function PipelineRunMonitor() {
  const [state, setState] = useState<PipelineRunState | null>(null);

  useEffect(() => {
    let lastRunId = "";

    const timer = setInterval(async () => {
      try {
        const res = await fetch("/api/admin/pipeline/status");
        if (!res.ok) return;
        const data: PipelineRunState = await res.json();

        // Track run transitions for logs but never auto-hide.
        // New run starts clear anything stale.
        if (data.runId !== lastRunId && data.status === "running") {
          lastRunId = data.runId;
        }
        if (data.status !== "idle") {
          lastRunId = data.runId;
        }

        setState(data);
      } catch {
        // endpoint not ready yet
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!state || state.status === "idle") return null;

  const elapsed = formatDuration(state.startedAt, state.completedAt);

  return (
    <section className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] p-5 shadow-lg">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {state.status === "running" ? (
            <Loader2 size={18} className="animate-spin text-blue-500" />
          ) : state.status === "completed" ? (
            <CheckCircle2 size={18} className="text-emerald-500" />
          ) : (
            <AlertCircle size={18} className="text-red-500" />
          )}
          <div>
            <h3 className="text-sm font-bold text-[var(--ink)]">
              Pipeline run {state.runId ? `#${state.runId.slice(-8)}` : ""}
            </h3>
            <p className="text-xs text-[var(--ink-faint)]">
              {state.status === "running" ? "Running" : state.status === "completed" ? "Completed" : "Failed"}
              {" · "}{elapsed}
              {state.dryRun ? " · dry run" : ""}
              {state.autoPublish ? " · auto-publish" : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-xs">
          <Counter label="Feeds" value={`${state.feedsSucceeded}/${state.feedsAttempted}`} />
          <Counter label="Items" value={String(state.rawItemsFetched)} />
          <Counter label="Topics" value={String(state.topicsClustered)} />
          <Counter label="Articles" value={String(state.articlesGenerated)} />
          {state.articlesPublished > 0 && <Counter label="Published" value={String(state.articlesPublished)} />}
          {state.qualityFailures > 0 && <Counter label="Failed QA" value={String(state.qualityFailures)} danger />}
        </div>
      </div>

      {/* Steps */}
      <div className="mt-4 grid gap-1">
        {state.steps.map((step, i) => (
          <div
            key={step.id}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
              step.status === "running" ? "bg-blue-500/5" : step.status === "error" ? "bg-red-500/5" : ""
            }`}
          >
            <StepIcon step={step} />
            <span className="min-w-[140px] font-medium text-[var(--ink)]">{step.label}</span>
            <span className="flex-1 text-xs text-[var(--ink-soft)]">
              {step.status === "running" && !step.detail && "In progress…"}
              {step.detail || (step.status === "pending" && i > 0 ? "Waiting…" : "")}
            </span>
            {step.count > 0 && (
              <span className="text-xs font-semibold text-[var(--ink)]">{step.count}</span>
            )}
            {step.subDetail && (
              <span className="hidden text-xs text-[var(--ink-faint)] sm:inline">{step.subDetail}</span>
            )}
          </div>
        ))}
      </div>

      {/* Agent-level tracking */}
      {state.agents && state.agents.length > 0 && (
        <div className="mt-3 border-t border-[var(--line)] pt-3">
          <p className="mb-2 text-xs font-semibold text-[var(--ink-muted)]">
            Agents ({state.agents.filter(a => a.status === "working").length} active)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {state.agents.map((agent) => (
              <div key={agent.agentId} className="rounded-md bg-[var(--bg)] p-2.5 text-xs">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <AgentStatusIcon status={agent.status} />
                  <span className="font-semibold text-[var(--ink)]">{agent.agentName}</span>
                  {agent.topicsCompleted > 0 && (
                    <span className="ml-auto font-semibold text-emerald-500">{agent.topicsCompleted}</span>
                  )}
                </div>
                {agent.currentTopicTitle && (
                  <p className="truncate text-[var(--ink-faint)] mb-2 leading-relaxed">{agent.currentTopicTitle}</p>
                )}
                {agent.status === "working" && (
                  <div className="space-y-0.5">
                    {agent.lifecycle.map((sa) => (
                      <div key={sa.type} className="flex items-center gap-1.5">
                        <SubIcon status={sa.status} />
                        <span className={`flex-1 ${
                          sa.status === "running" ? "text-[var(--ink)]" :
                          sa.status === "done" ? "text-emerald-600" :
                          sa.status === "error" ? "text-red-500" :
                          "text-[var(--ink-faint)]"
                        }`}>
                          {STAGE_LABELS[sa.type]}
                        </span>
                        {sa.detail && (
                          <span className="text-[10px] text-[var(--ink-faint)] truncate max-w-[100px]">{sa.detail}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {agent.status === "idle" && (
                  <p className="text-[var(--ink-faint)]">Standing by</p>
                )}
                {agent.aiFailures > 0 && (
                  <p className="text-amber-500 truncate mt-1">AI failures: {agent.aiFailures}</p>
                )}
                {agent.lastError && agent.aiFailures > 0 && (
                  <p className="text-amber-600/70 truncate text-[10px]">{agent.lastError}</p>
                )}
                {agent.error && (
                  <p className="text-red-500 truncate mt-1">{agent.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {state.error && (
        <div className="mt-3 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-600">{state.error}</div>
      )}
    </section>
  );
}

function SubIcon({ status }: { status: string }) {
  switch (status) {
    case "running":
      return <Loader2 size={10} className="animate-spin text-blue-500 shrink-0" />;
    case "done":
      return <CheckCircle2 size={10} className="text-emerald-500 shrink-0" />;
    case "error":
      return <XCircle size={10} className="text-red-500 shrink-0" />;
    default:
      return <span className="block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--line)]" />;
  }
}

function Counter({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className={`rounded-md bg-[var(--bg)] px-2.5 py-1 ${danger ? "text-red-500" : ""}`}>
      <span className="text-[var(--ink-faint)]">{label} </span>
      <span className="font-semibold text-[var(--ink)]">{value}</span>
    </div>
  );
}

function AgentStatusIcon({ status }: { status: NamedAgentState["status"] }) {
  switch (status) {
    case "working":
      return <Loader2 size={12} className="animate-spin text-blue-500 shrink-0" />;
    case "error":
      return <XCircle size={12} className="text-red-500 shrink-0" />;
    case "assigned":
      return <Clock size={12} className="text-amber-500 shrink-0" />;
    default:
      return <span className="block h-2 w-2 shrink-0 rounded-full bg-[var(--line)]" />;
  }
}

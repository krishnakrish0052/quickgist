"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Loader2, XCircle } from "lucide-react";
import type { NamedAgentState, PipelineRunState, PipelineStep, LifecycleStage } from "@/lib/services/pipelineTracker";
import { STAGE_SHORT } from "@/lib/services/pipelineTracker";

function StepDot({ step }: { step: PipelineStep }) {
  switch (step.status) {
    case "running":
      return <Loader2 size={12} className="animate-spin text-blue-400 shrink-0" />;
    case "done":
      return <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />;
    case "error":
      return <XCircle size={12} className="text-red-400 shrink-0" />;
    default:
      return <span className="block h-2 w-2 shrink-0 rounded-full bg-[var(--ink-faint)]" />;
  }
}

export function PipelineStatusBar() {
  const [state, setState] = useState<PipelineRunState | null>(null);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Refs for dismiss logic — avoids useEffect dependency churn
  const dismissCountRef = useRef(0);
  const lastRunIdRef = useRef("");
  const userCollapsedRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await fetch("/api/admin/pipeline/status");
        if (!res.ok) return;
        const data: PipelineRunState = await res.json();

        const isNewRun = data.runId !== lastRunIdRef.current;
        if (isNewRun) {
          userCollapsedRef.current = false;
          dismissCountRef.current = 0;
        }

        if (data.status === "running") {
          setVisible(true);
          if (isNewRun || !userCollapsedRef.current) {
            setExpanded(true);
          }
        } else if (data.status === "completed" || data.status === "error") {
          if (isNewRun) {
            setVisible(true);
            setExpanded(false);
          }
          if (!isNewRun) {
            dismissCountRef.current += 1;
          }
          if (dismissCountRef.current >= 8) {
            setVisible(false);
            setExpanded(false);
          }
        } else {
          setVisible(false);
          setExpanded(false);
        }

        lastRunIdRef.current = data.runId;
        setState(data);
      } catch {
        // endpoint not ready
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!visible || !state || state.status === "idle") return null;

  const completedSteps = state.steps.filter((s) => s.status === "done").length;
  const totalSteps = state.steps.length;
  const running = state.status === "running";

  const activeCount = state.agents?.filter(a => a.status === "working").length ?? 0;
  const totalAgents = state.agents?.length ?? 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Compact bar */}
      <button
        onClick={() => {
          const next = !expanded;
          if (!next) userCollapsedRef.current = true;
          setExpanded(next);
        }}
        className={`flex w-full items-center gap-3 border-t px-6 py-2.5 text-xs backdrop-blur-sm transition ${
          running
            ? "border-blue-500/30 bg-blue-950/90 text-blue-100"
            : state.status === "completed"
              ? "border-emerald-500/30 bg-emerald-950/90 text-emerald-100"
              : "border-red-500/30 bg-red-950/90 text-red-100"
        }`}
      >
        {running ? (
          <Loader2 size={14} className="animate-spin shrink-0" />
        ) : state.status === "completed" ? (
          <CheckCircle2 size={14} className="shrink-0" />
        ) : (
          <XCircle size={14} className="shrink-0" />
        )}

        <span className="font-semibold">
          {running ? "Pipeline running" : state.status === "completed" ? "Pipeline complete" : "Pipeline failed"}
        </span>

        <span className="text-white/50">
          {completedSteps}/{totalSteps} steps
        </span>

        {running && (
          <span className="hidden text-white/40 sm:inline">
            · {activeCount}/{totalAgents} agents active
            {state.articlesGenerated > 0 && ` · ${state.articlesGenerated} generated`}
          </span>
        )}

        <span className="ml-auto flex items-center gap-2 text-white/40">
          {state.feedsSucceeded > 0 && <span>{state.feedsSucceeded} feeds</span>}
          {state.topicsClustered > 0 && <span>· {state.topicsClustered} topics</span>}
          {state.articlesGenerated > 0 && <span>· {state.articlesGenerated} articles</span>}
        </span>

        {expanded ? <ChevronDown size={14} className="shrink-0" /> : <ChevronUp size={14} className="shrink-0" />}
      </button>

      {/* Expanded step details */}
      {expanded && (
        <div
          className={`border-t px-6 py-3 backdrop-blur-sm ${
            running
              ? "border-blue-500/20 bg-blue-950/70"
              : state.status === "completed"
                ? "border-emerald-500/20 bg-emerald-950/70"
                : "border-red-500/20 bg-red-950/70"
          }`}
        >
          <div className="grid gap-1.5">
            {state.steps.map((step) => (
              <div key={step.id} className="flex items-center gap-2.5 text-xs">
                <StepDot step={step} />
                <span className={`min-w-[100px] font-medium ${step.status === "running" ? "text-white" : step.status === "done" ? "text-emerald-300" : step.status === "error" ? "text-red-300" : "text-white/40"}`}>
                  {step.label}
                </span>
                <span className="flex-1 text-white/50">{step.detail || (step.status === "pending" ? "Waiting…" : "")}</span>
                {step.count > 0 && (
                  <span className="font-semibold text-white/80">{step.count}</span>
                )}
              </div>
            ))}
          </div>

          {/* Agent-level tracking */}
          {state.agents && state.agents.length > 0 && (
            <div className="mt-2 border-t border-white/10 pt-2">
              <div className="mb-1 text-xs font-medium text-white/50">Agents ({activeCount} active)</div>
              <div className="grid grid-cols-4 gap-1.5">
                {state.agents.map((agent) => (
                  <div
                    key={agent.agentId}
                    className={`rounded px-2 py-1.5 text-[10px] leading-tight ${
                      agent.status === "working"
                        ? "bg-blue-500/15 ring-1 ring-blue-500/30"
                        : agent.status === "error"
                          ? "bg-red-500/10 ring-1 ring-red-500/30"
                          : "bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <StatusDot status={agent.status} />
                      <span className="font-medium text-white/80">{agent.agentName}</span>
                      {agent.topicsCompleted > 0 && (
                        <span className="ml-auto text-white/40">{agent.topicsCompleted}</span>
                      )}
                    </div>
                    {agent.currentTopicTitle && (
                      <div className="mt-0.5 truncate text-white/50">{agent.currentTopicTitle}</div>
                    )}
                    {agent.status === "working" && (
                      <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                        {agent.lifecycle.map((sa) => (
                          <span
                            key={sa.type}
                            className={`inline-flex items-center gap-0.5 ${
                              sa.status === "running" ? "text-blue-300" :
                              sa.status === "done" ? "text-emerald-400" :
                              sa.status === "error" ? "text-red-400" :
                              "text-white/25"
                            }`}
                          >
                            <SubDot status={sa.status} />
                            {STAGE_SHORT[sa.type]}
                          </span>
                        ))}
                      </div>
                    )}
                    {agent.aiFailures > 0 && (
                      <div className="mt-0.5 truncate text-amber-400">AI failures: {agent.aiFailures}</div>
                    )}
                    {agent.error && (
                      <div className="mt-0.5 truncate text-red-400">{agent.error}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {state.error && (
            <div className="mt-2 rounded bg-red-500/20 px-3 py-1.5 text-xs text-red-300">{state.error}</div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: NamedAgentState["status"] }) {
  switch (status) {
    case "working":
      return <Loader2 size={10} className="animate-spin text-blue-400 shrink-0" />;
    case "error":
      return <XCircle size={10} className="text-red-400 shrink-0" />;
    case "assigned":
      return <span className="block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />;
    default:
      return <span className="block h-1.5 w-1.5 shrink-0 rounded-full bg-white/20" />;
  }
}

function SubDot({ status }: { status: string }) {
  switch (status) {
    case "running":
      return <Loader2 size={7} className="animate-spin shrink-0" />;
    case "done":
      return <CheckCircle2 size={7} className="shrink-0" />;
    case "error":
      return <XCircle size={7} className="shrink-0" />;
    default:
      return <span className="block h-1 w-1 shrink-0 rounded-full bg-current opacity-40" />;
  }
}

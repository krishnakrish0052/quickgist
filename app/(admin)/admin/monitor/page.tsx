import { Activity, Server, Database, Wifi, Cpu, Clock, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { config } from "@/lib/config";
import { pingDatabase } from "@/lib/db/client";
import { getPlatformSnapshot } from "@/lib/repositories/platformRepository";
import { getPipelineRunState } from "@/lib/services/pipelineTracker";
import { getOperationsSnapshot } from "@/lib/services/observability";
import { AdminNav } from "@/components/AdminNav";

export const metadata = {
  title: "System Monitor — QuickGist",
  description: "Service health, pipeline status, and operational metrics.",
};

export const dynamic = "force-dynamic";

function StatusIcon({ ok }: { ok: boolean }) {
  return ok
    ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
    : <XCircle size={14} className="text-red-500 shrink-0" />;
}

export default async function MonitorPage() {
  const dbHealth = await pingDatabase();
  const snapshot = await getOperationsSnapshot().catch(() => null);
  const platform = await getPlatformSnapshot();
  const pipeline = getPipelineRunState();

  const recentEvents = platform.auditLogs
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 20);

  const aiProvider = process.env.DEEPSEEK_API_KEY
    ? { name: "DeepSeek", key: true, model: config.aiModel || "deepseek-chat" }
    : process.env.GROQ_API_KEY
      ? { name: "Groq", key: true, model: config.aiModel || "llama-3.3-70b-versatile" }
      : process.env.OPENAI_API_KEY
        ? { name: "OpenAI", key: true, model: config.aiModel || "gpt-4o-mini" }
        : process.env.GEMINI_API_KEY
          ? { name: "Gemini", key: true, model: config.aiModel || "gemini-2.0-flash" }
          : { name: "None (deterministic)", key: false, model: "quickgist-local-synthesizer" };

  return (
    <main className="container-shell py-8">
      <div className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-signal">QuickGist</p>
        <h1 className="mt-0.5 text-3xl font-bold tracking-tight text-[var(--ink)]">System monitor</h1>
      </div>

      <AdminNav />

      {/* Service health */}
      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
            <Server size={14} className="text-blue-400" />
            Storage
          </div>
          <div className="mt-2 flex items-center gap-2">
            <StatusIcon ok={dbHealth.ok} />
            <span className="font-semibold text-[var(--ink)]">{dbHealth.ok ? "Connected" : "Disconnected"}</span>
          </div>
          <p className="mt-0.5 text-xs text-[var(--ink-faint)]">
            Driver: {config.storageDriver}
            {dbHealth.error ? ` · ${dbHealth.error}` : ""}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
            <Cpu size={14} className="text-purple-400" />
            AI Provider
          </div>
          <div className="mt-2 flex items-center gap-2">
            <StatusIcon ok={aiProvider.key} />
            <span className="font-semibold text-[var(--ink)]">{aiProvider.name}</span>
          </div>
          <p className="mt-0.5 text-xs text-[var(--ink-faint)]">
            Model: {aiProvider.model}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
            <Wifi size={14} className="text-cyan-400" />
            Queue
          </div>
          <div className="mt-2 flex items-center gap-2">
            <StatusIcon ok={config.queueDriver === "bullmq"} />
            <span className="font-semibold text-[var(--ink)]">{config.queueDriver === "bullmq" ? "BullMQ" : "Inline"}</span>
          </div>
          <p className="mt-0.5 text-xs text-[var(--ink-faint)]">
            {config.queueDriver === "bullmq" ? "Redis connected" : "No Redis — jobs run inline"}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
            <Activity size={14} className="text-amber-400" />
            Pipeline
          </div>
          <div className="mt-2 flex items-center gap-2">
            <StatusIcon ok={pipeline.status !== "idle"} />
            <span className="font-semibold text-[var(--ink)]">
              {pipeline.status === "running" ? "Running" : pipeline.status === "completed" ? "Completed" : pipeline.status === "error" ? "Failed" : "Idle"}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-[var(--ink-faint)]">
            Last run: {pipeline.runId?.slice(-8) ?? "—"}
            {pipeline.startedAt ? ` · ${new Date(pipeline.startedAt).toLocaleString()}` : ""}
          </p>
        </div>
      </section>

      {/* Agent status */}
      <section className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
          <Activity size={15} className="text-signal" />
          Agent status
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard label="Total agents" value={String(pipeline.agents.length)} />
          <MetricCard label="Active" value={String(pipeline.agents.filter((a) => a.status === "working").length)} />
          <MetricCard label="Completed topics" value={String(pipeline.agents.reduce((s, a) => s + a.topicsCompleted, 0))} />
          <MetricCard label="Failed topics" value={String(pipeline.agents.reduce((s, a) => s + a.topicsFailed, 0))} />
        </div>
        {pipeline.agents.length > 0 && (
          <div className="mt-3 grid gap-1.5">
            {pipeline.agents.map((agent) => (
              <div key={agent.agentId} className="flex items-center gap-3 rounded-md bg-[var(--bg)] px-3 py-2 text-xs">
                <span className="font-semibold text-[var(--ink)]">{agent.agentName}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  agent.status === "working" ? "bg-blue-100 text-blue-700" :
                  agent.status === "error" ? "bg-red-100 text-red-700" :
                  "bg-[var(--bg-elevated)] text-[var(--ink-muted)]"
                }`}>
                  {agent.status}
                </span>
                <span className="text-[var(--ink-faint)]">{agent.topicsCompleted} completed</span>
                {agent.topicsFailed > 0 && <span className="text-red-500">{agent.topicsFailed} failed</span>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pipeline steps */}
      {pipeline.steps.length > 0 && (
        <section className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
            <Clock size={15} className="text-signal" />
            Pipeline steps
          </h2>
          <div className="mt-3 grid gap-1.5">
            {pipeline.steps.map((step) => (
              <div key={step.id} className="flex items-center gap-3 rounded-md bg-[var(--bg)] px-3 py-2 text-xs">
                {step.status === "running" ? <Activity size={12} className="animate-pulse text-blue-500" /> :
                 step.status === "done" ? <CheckCircle2 size={12} className="text-emerald-500" /> :
                 step.status === "error" ? <XCircle size={12} className="text-red-500" /> :
                 <Clock size={12} className="text-[var(--ink-faint)]" />}
                <span className="font-medium text-[var(--ink)]">{step.label}</span>
                <span className="text-[var(--ink-faint)]">{step.detail || "Waiting..."}</span>
                {step.count > 0 && <span className="font-semibold text-[var(--ink)]">{step.count}</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Counters */}
      {snapshot && (
        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Sources" value={String(snapshot.sources)} />
          <MetricCard label="Raw items" value={String(snapshot.rawItems)} />
          <MetricCard label="Articles" value={String(snapshot.articles)} />
          <MetricCard label="Quality failures" value={String(snapshot.failedQualityReports)} />
        </section>
      )}

      {/* Recent audit events */}
      {recentEvents.length > 0 && (
        <section className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
            <AlertCircle size={15} className="text-signal" />
            Recent activity
          </h2>
          <div className="mt-3 max-h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--line)] text-left text-[var(--ink-muted)]">
                  <th className="px-2 py-1.5 font-medium">Time</th>
                  <th className="px-2 py-1.5 font-medium">Action</th>
                  <th className="px-2 py-1.5 font-medium">Actor</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((evt, i) => (
                  <tr key={i} className="border-b border-[var(--line)] last:border-0">
                    <td className="px-2 py-1.5 text-[var(--ink-soft)]">{new Date(evt.createdAt).toLocaleTimeString()}</td>
                    <td className="px-2 py-1.5 font-mono text-[var(--ink)]">{evt.action}</td>
                    <td className="px-2 py-1.5 text-[var(--ink-soft)]">{evt.actor}</td>
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

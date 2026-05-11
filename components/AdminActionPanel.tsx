"use client";

import { useState, useCallback } from "react";
import { Database, Loader2, Play, RefreshCw, Zap } from "lucide-react";
import { seedDatabaseAction } from "@/app/(admin)/admin/actions";
import { PipelineRunMonitor } from "@/components/PipelineRunMonitor";

export function AdminActionPanel() {
  const [dryRun, setDryRun] = useState(true);
  const [autoPublish, setAutoPublish] = useState(false);
  const [starting, setStarting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const handleRunPipeline = useCallback(async () => {
    setStarting(true);
    try {
      await fetch("/api/admin/pipeline/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun, autoPublish }),
      });
    } catch (err) {
      console.error("Failed to start pipeline:", err);
    } finally {
      setStarting(false);
    }
  }, [dryRun, autoPublish]);

  const handleSeed = useCallback(async () => {
    setSeeding(true);
    try {
      await seedDatabaseAction();
    } finally {
      setSeeding(false);
    }
  }, []);

  return (
    <section className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] p-6 shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-signal" />
            <h2 className="text-lg font-bold text-[var(--ink)]">Pipeline controls</h2>
          </div>
          <p className="mt-1 text-sm text-[var(--ink-faint)]">
            Ingest → cluster → generate → quality-gate → publish
          </p>
        </div>
        <button
          disabled={seeding}
          onClick={handleSeed}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--bg-elevated)] disabled:opacity-60"
        >
          {seeding ? <Loader2 size={15} className="animate-spin" /> : <Database size={15} />}
          {seeding ? "Seeding…" : "Seed database"}
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-[var(--bg)] px-5 py-4">
        <div className="flex flex-wrap items-center gap-6 text-sm text-[var(--ink-soft)]">
          <label className="inline-flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="h-4 w-4 accent-signal"
            />
            Dry-run distribution
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={autoPublish}
              onChange={(e) => setAutoPublish(e.target.checked)}
              className="h-4 w-4 accent-signal"
            />
            Auto-publish on pass
          </label>
        </div>
        <button
          disabled={starting}
          onClick={handleRunPipeline}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--bg-elevated)] px-5 py-2.5 text-sm font-semibold text-[var(--ink)] transition hover:bg-signal disabled:cursor-not-allowed disabled:opacity-60"
        >
          {starting ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          {starting ? "Starting…" : "Run pipeline"}
        </button>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg bg-accent/5 px-4 py-3 text-xs text-accent/80">
        <Play size={12} className="mt-0.5 shrink-0" />
        <span>
          <strong>Dry-run distribution</strong> runs the full ingest→generate pipeline but sends social/newsletter as test payloads only.
          Uncheck to enable live distribution.
        </span>
      </div>

      <PipelineRunMonitor />
    </section>
  );
}

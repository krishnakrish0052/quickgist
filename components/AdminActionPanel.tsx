"use client";

import { useFormStatus } from "react-dom";
import { Database, Loader2, Play, RefreshCw, Zap } from "lucide-react";
import { runPipelineAction, seedDatabaseAction } from "@/app/(admin)/admin/actions";

function RunPipelineButton() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-signal disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
      {pending ? "Running…" : "Run pipeline"}
    </button>
  );
}

function SeedButton() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-lg border border-line bg-paper px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-white disabled:opacity-60"
    >
      {pending ? <Loader2 size={15} className="animate-spin" /> : <Database size={15} />}
      {pending ? "Seeding…" : "Seed database"}
    </button>
  );
}

export function AdminActionPanel() {
  return (
    <section className="rounded-xl border border-line bg-white p-6 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-signal" />
            <h2 className="text-lg font-bold text-ink">Pipeline controls</h2>
          </div>
          <p className="mt-1 text-sm text-ink/55">
            Ingest → cluster → generate → quality-gate → publish
          </p>
        </div>
        <form action={seedDatabaseAction}>
          <SeedButton />
        </form>
      </div>

      <form action={runPipelineAction} className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-paper px-5 py-4">
        <div className="flex flex-wrap items-center gap-6 text-sm text-ink/70">
          <label className="inline-flex cursor-pointer items-center gap-2">
            <input name="dryRun" type="checkbox" defaultChecked className="h-4 w-4 accent-signal" />
            Dry-run distribution
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2">
            <input name="autoPublish" type="checkbox" className="h-4 w-4 accent-signal" />
            Auto-publish on pass
          </label>
        </div>
        <RunPipelineButton />
      </form>

      <div className="mt-4 flex items-start gap-2 rounded-lg bg-accent/5 px-4 py-3 text-xs text-accent/80">
        <Play size={12} className="mt-0.5 shrink-0" />
        <span>
          <strong>Dry-run distribution</strong> runs the full ingest→generate pipeline but sends social/newsletter as test payloads only.
          Uncheck to enable live distribution.
        </span>
      </div>
    </section>
  );
}

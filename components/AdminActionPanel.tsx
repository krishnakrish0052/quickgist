import { Database, Play, RefreshCw } from "lucide-react";
import { runPipelineAction, seedDatabaseAction } from "@/app/(admin)/admin/actions";

export function AdminActionPanel() {
  return (
    <section className="rounded-md border border-line bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-ink">
            <Play size={22} />
            Local pipeline controls
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink/65">
            Run the same services exposed through HTTP, worker queues, and MCP tools.
          </p>
        </div>
        <form action={seedDatabaseAction}>
          <button className="inline-flex items-center gap-2 rounded-md border border-line bg-paper px-4 py-3 text-sm font-semibold text-ink">
            <Database size={16} />
            Seed PSQL
          </button>
        </form>
      </div>
      <form action={runPipelineAction} className="mt-5 grid gap-4 rounded-md bg-paper p-4 md:grid-cols-[1fr_auto]">
        <div className="flex flex-wrap items-center gap-5 text-sm text-ink/75">
          <label className="inline-flex items-center gap-2">
            <input name="dryRun" type="checkbox" defaultChecked className="h-4 w-4 accent-signal" />
            Dry run distribution
          </label>
          <label className="inline-flex items-center gap-2">
            <input name="autoPublish" type="checkbox" className="h-4 w-4 accent-signal" />
            Auto-publish passing low/medium risk articles
          </label>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-3 text-sm font-semibold text-white">
          <RefreshCw size={16} />
          Run pipeline
        </button>
      </form>
    </section>
  );
}

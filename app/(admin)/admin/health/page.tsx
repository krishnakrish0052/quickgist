import { AdminNav } from "@/components/AdminNav";
import { pingDatabase } from "@/lib/db/client";
import { getOperationsSnapshot } from "@/lib/services/observability";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function AdminHealthPage() {
  const database = await pingDatabase();
  const snapshot = database.ok ? await getOperationsSnapshot().catch(() => null) : null;

  return (
    <main className="container-shell py-10">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-signal">Admin</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-normal text-[var(--ink)]">Service health</h1>
      <AdminNav />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
          <h2 className="text-xl font-semibold text-[var(--ink)]">PostgreSQL</h2>
          <p className={database.ok ? "mt-2 text-signal" : "mt-2 text-alert"}>{database.ok ? "Connected" : database.error}</p>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">Driver: {config.storageDriver}</p>
        </div>
        <pre className="overflow-auto rounded-md border border-[var(--line)] bg-[var(--bg)] p-5 text-xs text-[var(--ink)]">
          {JSON.stringify(snapshot, null, 2)}
        </pre>
      </div>
    </main>
  );
}

import { AdminNav } from "@/components/AdminNav";
import { getPlatformSnapshot } from "@/lib/repositories/platformRepository";

export const dynamic = "force-dynamic";

export default async function AdminSourcesPage() {
  const { sources, rawItems } = await getPlatformSnapshot();

  return (
    <main className="container-shell py-10">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-signal">Admin</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-normal text-[var(--ink)]">Sources</h1>
      <AdminNav />
      <div className="grid gap-4">
        {sources.map((source) => (
          <div key={source.id} className="rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-[var(--ink)]">{source.name}</h2>
                <p className="mt-1 text-sm text-[var(--ink-muted)]">{source.homepageUrl}</p>
              </div>
              <span className="rounded-full bg-[var(--bg)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                {source.kind}
              </span>
            </div>
            <p className="mt-3 text-sm text-[var(--ink-soft)]">
              Reliability {source.reliabilityScore} - {rawItems.filter((item) => item.sourceId === source.id).length} raw
              records
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}

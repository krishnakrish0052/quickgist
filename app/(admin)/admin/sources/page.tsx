import { AdminNav } from "@/components/AdminNav";
import { getPlatformSnapshot } from "@/lib/repositories/platformRepository";

export const dynamic = "force-dynamic";

export default async function AdminSourcesPage() {
  const { sources, rawItems } = await getPlatformSnapshot();

  return (
    <main className="container-shell py-10">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-signal">Admin</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Sources</h1>
      <AdminNav />
      <div className="grid gap-4">
        {sources.map((source) => (
          <div key={source.id} className="rounded-md border border-line bg-white p-5">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-ink">{source.name}</h2>
                <p className="mt-1 text-sm text-ink/60">{source.homepageUrl}</p>
              </div>
              <span className="rounded-full bg-paper px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-ink/60">
                {source.kind}
              </span>
            </div>
            <p className="mt-3 text-sm text-ink/70">
              Reliability {source.reliabilityScore} - {rawItems.filter((item) => item.sourceId === source.id).length} raw
              records
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}

import { AdminNav } from "@/components/AdminNav";
import { getPlatformSnapshot } from "@/lib/repositories/platformRepository";

export const dynamic = "force-dynamic";

export default async function AdminDistributionPage() {
  const { distributionJobs, articles } = await getPlatformSnapshot();

  return (
    <main className="container-shell py-10">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-signal">Admin</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-normal text-[var(--ink)]">Distribution jobs</h1>
      <AdminNav />
      <div className="grid gap-4">
        {distributionJobs.map((job) => {
          const article = articles.find((candidate) => candidate.id === job.articleId);
          return (
            <div key={job.id} className="rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
              <div className="flex flex-wrap justify-between gap-3">
                <h2 className="text-xl font-semibold text-[var(--ink)]">{article?.title ?? job.articleId}</h2>
                <span className="rounded-full bg-[var(--bg)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                  {job.channel} - {job.status}
                </span>
              </div>
              <p className="mt-2 break-all text-sm text-[var(--ink-soft)]">{job.utmUrl}</p>
            </div>
          );
        })}
      </div>
    </main>
  );
}

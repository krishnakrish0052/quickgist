import { Activity, Database, GitBranch, Send } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { ReviewQueue } from "@/components/ReviewQueue";
import { getOperationsSnapshot } from "@/lib/services/observability";
import { getPlatformSnapshot } from "@/lib/repositories/platformRepository";
import { AdminActionPanel } from "@/components/AdminActionPanel";
import { evaluateArticleAction, publishArticleAction, scheduleDistributionAction } from "@/app/(admin)/admin/actions";
import { AdminNav } from "@/components/AdminNav";

const endpoints = [
  "POST /api/ingest/run",
  "POST /api/trending/detect",
  "POST /api/generate/article",
  "POST /api/generate/social",
  "POST /api/generate/script",
  "POST /api/generate/image-prompt",
  "POST /api/quality/evaluate",
  "POST /api/publish/article",
  "POST /api/distribution/schedule",
  "POST /api/pipeline/run"
];

export const metadata = {
  title: "Admin Review Desk",
  description: "Review generated content, monitor service health, and export social packages."
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const snapshot = await getOperationsSnapshot();
  const state = await getPlatformSnapshot();
  const openTasks = state.reviewTasks.filter((task) => task.status === "open");
  const articles = [...state.articles].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <main className="container-shell py-10">
      <div className="mb-7">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-signal">Operations</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Admin review desk</h1>
      </div>
      <AdminNav />

      <section className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Articles" value={snapshot.articles} />
        <MetricCard label="Open reviews" value={snapshot.openReviewTasks} />
        <MetricCard label="Quality failures" value={snapshot.failedQualityReports} />
        <MetricCard label="Distribution jobs" value={snapshot.distributionJobs} />
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-8">
          <AdminActionPanel />

          <div>
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold text-ink">
              <Activity size={22} />
              Review queue
            </h2>
            <ReviewQueue tasks={openTasks} />
          </div>

          <div>
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold text-ink">
              <Send size={22} />
              Article packages
            </h2>
            <div className="grid gap-4">
              {articles.map((article) => (
                <article key={article.id} id={article.id} className="rounded-md border border-line bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-signal">
                        {article.status} - quality {article.qualityScore}
                      </p>
                      <h3 className="mt-1 text-xl font-semibold text-ink">{article.title}</h3>
                    </div>
                    <span className="rounded-full bg-paper px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-ink/60">
                      {article.risk} risk
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-md bg-paper p-4">
                      <h4 className="text-sm font-semibold text-ink">Social export</h4>
                      <p className="mt-2 text-sm leading-6 text-ink/70">{article.socialPack.linkedinPost}</p>
                    </div>
                    <div className="rounded-md bg-paper p-4">
                      <h4 className="text-sm font-semibold text-ink">Image prompt</h4>
                      <p className="mt-2 text-sm leading-6 text-ink/70">{article.imagePrompt}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <form action={evaluateArticleAction}>
                      <input type="hidden" name="articleId" value={article.id} />
                      <button className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink">
                        Evaluate quality
                      </button>
                    </form>
                    <form action={publishArticleAction}>
                      <input type="hidden" name="articleId" value={article.id} />
                      <button className="rounded-md bg-signal px-3 py-2 text-sm font-semibold text-white">
                        Publish
                      </button>
                    </form>
                    <form action={scheduleDistributionAction}>
                      <input type="hidden" name="articleId" value={article.id} />
                      <button className="rounded-md bg-paper px-3 py-2 text-sm font-semibold text-ink">
                        Schedule dry-run distribution
                      </button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        <aside className="grid content-start gap-5">
          <div className="rounded-md border border-line bg-white p-5">
            <h2 className="flex items-center gap-2 font-semibold text-ink">
              <GitBranch size={18} />
              Internal APIs
            </h2>
            <div className="mt-4 grid gap-2">
              {endpoints.map((endpoint) => (
                <code key={endpoint} className="rounded-md bg-paper px-3 py-2 text-xs text-ink/70">
                  {endpoint}
                </code>
              ))}
            </div>
          </div>
          <div className="rounded-md border border-line bg-white p-5">
            <h2 className="flex items-center gap-2 font-semibold text-ink">
              <Database size={18} />
              Storage plan
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink/70">
              PostgreSQL stores durable content, Redis/BullMQ runs jobs, and R2 stores generated media. Local tests can
              use memory mode, but production-local mode reads and writes through PSQL.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}

import { Activity, BarChart3, Database, FileText, GitBranch, Send } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { ReviewQueue } from "@/components/ReviewQueue";
import { getOperationsSnapshot } from "@/lib/services/observability";
import { getPlatformSnapshot } from "@/lib/repositories/platformRepository";
import { AdminActionPanel } from "@/components/AdminActionPanel";
import { ArticleActions } from "@/components/ArticleActions";
import { AdminNav } from "@/components/AdminNav";

export const metadata = {
  title: "Admin — QuickGist",
  description: "Review generated content, monitor service health, and manage the editorial pipeline."
};

export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: "bg-emerald-50 text-emerald-700 border-emerald-200",
    review: "bg-amber-50 text-amber-700 border-amber-200",
    draft: "bg-sky-50 text-sky-700 border-sky-200",
    generating: "bg-purple-50 text-purple-700 border-purple-200",
    blocked: "bg-red-50 text-red-700 border-red-200"
  };
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${map[status] ?? "bg-paper text-ink/50 border-line"}`}>
      {status}
    </span>
  );
}

export default async function AdminPage() {
  const snapshot = await getOperationsSnapshot();
  const state = await getPlatformSnapshot();
  const openTasks = state.reviewTasks.filter((task) => task.status === "open");
  const articles = [...state.articles].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <main className="container-shell py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-signal">QuickGist</p>
          <h1 className="mt-0.5 text-3xl font-bold tracking-tight text-ink">Editorial dashboard</h1>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
          ● Live
        </span>
      </div>

      <AdminNav />

      {/* Metrics */}
      <section className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <MetricCard label="Total articles" value={snapshot.articles} />
        <MetricCard label="Awaiting review" value={snapshot.openReviewTasks} />
        <MetricCard label="Quality failures" value={snapshot.failedQualityReports} />
        <MetricCard label="Distribution jobs" value={snapshot.distributionJobs} />
      </section>

      <section className="mt-8 grid gap-8 xl:grid-cols-[1fr_320px]">
        <div className="grid gap-8">
          <AdminActionPanel />

          {/* Review queue */}
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-ink">
              <Activity size={16} className="text-signal" />
              Review queue
            </h2>
            <ReviewQueue tasks={openTasks} />
          </div>

          {/* Articles */}
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-ink">
              <FileText size={16} className="text-signal" />
              Article packages
              <span className="ml-auto text-xs font-normal text-ink/40">{articles.length} total</span>
            </h2>
            <div className="grid gap-3">
              {articles.map((article) => (
                <article
                  key={article.id}
                  id={article.id}
                  className="rounded-xl border border-line bg-white p-5 transition hover:shadow-soft"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={article.status} />
                        <span className="text-[10px] text-ink/40 uppercase tracking-widest">
                          {article.category} · Q{article.qualityScore}
                        </span>
                      </div>
                      <h3 className="mt-2 text-base font-semibold leading-snug text-ink">{article.title}</h3>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                      article.risk === "high" ? "bg-red-50 text-red-600" :
                      article.risk === "medium" ? "bg-amber-50 text-amber-600" :
                      "bg-paper text-ink/50"
                    }`}>
                      {article.risk} risk
                    </span>
                  </div>

                  {article.socialPack?.linkedinPost ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg bg-paper p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-ink/40">LinkedIn</p>
                        <p className="mt-1.5 line-clamp-3 text-xs leading-5 text-ink/70">{article.socialPack.linkedinPost}</p>
                      </div>
                      {article.imagePrompt ? (
                        <div className="rounded-lg bg-paper p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-ink/40">Image prompt</p>
                          <p className="mt-1.5 line-clamp-3 text-xs leading-5 text-ink/70">{article.imagePrompt}</p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-4 border-t border-line pt-3">
                    <ArticleActions articleId={article.id} />
                  </div>
                </article>
              ))}
              {articles.length === 0 && (
                <div className="rounded-xl border border-dashed border-line py-12 text-center text-sm text-ink/40">
                  No articles yet — run the pipeline to generate content.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="grid content-start gap-5">
          <div className="rounded-xl border border-line bg-white p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
              <BarChart3 size={15} className="text-signal" />
              System
            </h2>
            <dl className="mt-4 grid gap-2">
              {[
                ["Storage", snapshot.sources > 0 ? "Memory" : "—"],
                ["Sources", String(snapshot.sources)],
                ["Raw items", String((snapshot as Record<string, unknown>).rawItems ?? "—")],
                ["Topics", String((snapshot as Record<string, unknown>).topics ?? "—")]
              ].map(([label, val]) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <dt className="text-ink/50">{label}</dt>
                  <dd className="font-semibold text-ink">{val}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-xl border border-line bg-white p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
              <GitBranch size={15} className="text-signal" />
              API endpoints
            </h2>
            <div className="mt-3 grid gap-1.5">
              {[
                "POST /api/ingest/run",
                "POST /api/trending/detect",
                "POST /api/generate/article",
                "POST /api/quality/evaluate",
                "POST /api/publish/article",
                "POST /api/pipeline/run"
              ].map((ep) => (
                <code key={ep} className="block rounded bg-paper px-2.5 py-1.5 text-[10px] font-mono text-ink/60">
                  {ep}
                </code>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-line bg-white p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
              <Send size={15} className="text-signal" />
              MCP server
            </h2>
            <p className="mt-2 text-xs leading-5 text-ink/55">
              25 tools available via HTTP on <code className="font-mono">:3333/mcp</code> or stdio transport.
              Run <code className="font-mono">npm run mcp:http</code> to activate.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}

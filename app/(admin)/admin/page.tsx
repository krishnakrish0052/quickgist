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
    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${map[status] ?? "bg-[var(--bg)] text-[var(--ink-muted)] border-[var(--line)]"}`}>
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
          <h1 className="mt-0.5 text-3xl font-bold tracking-tight text-[var(--ink)]">Editorial dashboard</h1>
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
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-[var(--ink)]">
              <Activity size={16} className="text-signal" />
              Review queue
              <span className="ml-auto text-xs font-normal text-[var(--ink-faint)]">{openTasks.length} open</span>
            </h2>
            <div className="max-h-[40vh] overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--bg)]/50 pr-1">
              <div className="p-2">
                <ReviewQueue tasks={openTasks} />
              </div>
            </div>
          </div>

          {/* Articles */}
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-[var(--ink)]">
              <FileText size={16} className="text-signal" />
              Article packages
              <span className="ml-auto text-xs font-normal text-[var(--ink-faint)]">{articles.length} total</span>
            </h2>
            <div className="max-h-[65vh] overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--bg)]/50 pr-1">
              <div className="grid gap-2 p-2">
              {articles.map((article) => (
                <article
                  key={article.id}
                  id={article.id}
                  className="rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] p-3 transition hover:shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={article.status} />
                        <span className="text-[10px] text-[var(--ink-faint)] uppercase tracking-widest">
                          {article.category} · Q{article.qualityScore}
                        </span>
                      </div>
                      <h3 className="mt-1 text-sm font-semibold leading-snug text-[var(--ink)] line-clamp-2">{article.title}</h3>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                      article.risk === "high" ? "bg-red-50 text-red-600" :
                      article.risk === "medium" ? "bg-amber-50 text-amber-600" :
                      "bg-[var(--bg)] text-[var(--ink-muted)]"
                    }`}>
                      {article.risk} risk
                    </span>
                  </div>

                  {article.socialPack?.linkedinPost ? (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-widest text-signal hover:underline">
                        Show previews
                      </summary>
                      <div className="mt-2 grid gap-2 md:grid-cols-2">
                        <div className="rounded-md bg-[var(--bg)] p-2">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--ink-faint)]">LinkedIn</p>
                          <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-[var(--ink-soft)]">{article.socialPack.linkedinPost}</p>
                        </div>
                        {article.imagePrompt ? (
                          <div className="rounded-md bg-[var(--bg)] p-2">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--ink-faint)]">Image prompt</p>
                            <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-[var(--ink-soft)]">{article.imagePrompt}</p>
                          </div>
                        ) : null}
                      </div>
                    </details>
                  ) : null}

                  <div className="mt-2 border-t border-[var(--line)] pt-2">
                    <ArticleActions articleId={article.id} />
                  </div>
                </article>
              ))}
              {articles.length === 0 && (
                <div className="rounded-xl border border-dashed border-[var(--line)] py-12 text-center text-sm text-[var(--ink-faint)]">
                  No articles yet — run the pipeline to generate content.
                </div>
              )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="grid content-start gap-5">
          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
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
                  <dt className="text-[var(--ink-muted)]">{label}</dt>
                  <dd className="font-semibold text-[var(--ink)]">{val}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
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
                <code key={ep} className="block rounded bg-[var(--bg)] px-2.5 py-1.5 text-[10px] font-mono text-[var(--ink-muted)]">
                  {ep}
                </code>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
              <Send size={15} className="text-signal" />
              MCP server — {process.env.DEEPSEEK_API_KEY ? "DeepSeek AI active" : "27 tools available"}
            </h2>
            <p className="mt-2 text-xs leading-5 text-[var(--ink-faint)]">
              27 tools via HTTP on <code className="font-mono">:3333/mcp</code> or stdio transport.
              Run <code className="font-mono">npm run mcp:http</code> to start the server, then connect from Claude Code.
            </p>
            <a
              href="/admin/mcp"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-signal hover:underline"
            >
              View MCP dashboard →
            </a>
          </div>
        </aside>
      </section>
    </main>
  );
}

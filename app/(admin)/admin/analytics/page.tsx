import { BarChart3, TrendingUp, FileText, Activity, Eye, Calendar, Layers, CheckCircle2, AlertCircle, Loader2, Circle } from "lucide-react";
import { getPlatformSnapshot, getPublishedArticles } from "@/lib/repositories/platformRepository";
import { getOperationsSnapshot } from "@/lib/services/observability";
import { getPipelineRunState } from "@/lib/services/pipelineTracker";
import { getTopArticlesByViews, getDailyViewCount, getArticleViews } from "@/lib/services/analytics";
import { scoreArticle } from "@/lib/services/seoEngine";
import { MetricCard } from "@/components/MetricCard";
import { AdminNav } from "@/components/AdminNav";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Analytics — QuickGist",
};

export default async function AdminAnalyticsPage() {
  const platform = await getPlatformSnapshot();
  const ops = await getOperationsSnapshot();
  const published = await getPublishedArticles();
  const pipeline = getPipelineRunState();

  // ── View analytics from tracking service ───────────────────
  const dailyViews = await getDailyViewCount();
  const topByViews = await getTopArticlesByViews(10);
  const avgViewsPerArticle =
    published.length > 0 ? (await Promise.all(published.map((a) => getArticleViews(a.id)))).reduce((sum, v) => sum + v, 0) / published.length : 0;

  // ── Traffic overview ───────────────────────────────────────

  const now = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    return d.toLocaleDateString();
  }).reverse();

  const dailyCounts = last7Days.map((dateStr) => {
    const count = published.filter((a) => {
      if (!a.publishedAt) return false;
      return new Date(a.publishedAt).toLocaleDateString() === dateStr;
    }).length;
    return { date: dateStr, count };
  });

  const articleViews = platform.auditLogs.filter(
    (log) => log.action === "article.read" || log.action === "article.published"
  ).length;

  const uniqueCategoryCount = new Set(published.map((a) => a.category).filter(Boolean)).size;

  // ── Top content ────────────────────────────────────────────

  const recent = published.slice(0, 10);

  // ── Category breakdown ────────────────────────────────────

  const categoryCounts: Record<string, number> = {};
  for (const a of platform.articles) {
    const cat = a.category || "uncategorized";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }
  const categoryEntries = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
  const maxCategoryCount = categoryEntries.length > 0
    ? Math.max(...categoryEntries.map(([, c]) => c))
    : 0;

  const dailyMax = Math.max(...dailyCounts.map((d) => d.count), 1);

  return (
    <main>
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-signal">Admin</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-normal text-[var(--ink)]">
        Analytics
      </h1>
      <AdminNav />

      {/* ─── Traffic overview ─────────────────────────────── */}
      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-[var(--ink)]">
          <BarChart3 size={18} /> Traffic overview
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Articles published" value={ops.publishedArticles} />
          <MetricCard label="Article views (inferred)" value={articleViews} />
          <MetricCard label="Unique categories published" value={uniqueCategoryCount} />
          <MetricCard label="Articles (last 7 days)" value={dailyCounts.reduce((s, d) => s + d.count, 0)} />
        </div>

        {/* View-based metrics from analytics service */}
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <MetricCard label="Total views today" value={dailyViews} />
          <MetricCard label="Total articles" value={published.length} />
          <MetricCard label="Avg views per article" value={avgViewsPerArticle.toFixed(1)} />
        </div>

        <div className="mt-4 rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
            <Calendar size={14} /> Daily published (last 7 days)
          </h3>
          <div className="mt-6 flex items-end gap-3">
            {dailyCounts.map(({ date, count }) => {
              const height = Math.max((count / dailyMax) * 100, count > 0 ? 16 : 4);
              return (
                <div key={date} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs font-semibold text-[var(--ink)]">{count}</span>
                  <div
                    className="w-full rounded-t-sm bg-accent/60 transition-all"
                    style={{ height: `${height}px` }}
                    title={`${date}: ${count} articles`}
                  />
                  <span className="text-[10px] text-[var(--ink-muted)]">{date}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Top content ──────────────────────────────────── */}
      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-[var(--ink)]">
          <FileText size={18} /> Top content
        </h2>
        <div className="mt-4 overflow-x-auto rounded-md border border-[var(--line)] bg-[var(--bg-elevated)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--bg)] text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Quality</th>
                <th className="px-4 py-3">Words</th>
                <th className="px-4 py-3">SEO</th>
                <th className="px-4 py-3">Published</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-[var(--ink-faint)]">
                    No published articles yet.
                  </td>
                </tr>
              ) : (
                recent.map((article) => {
                  const wordCount = article.contentMarkdown
                    ? article.contentMarkdown.split(/\s+/).filter(Boolean).length
                    : 0;
                  const seo = scoreArticle(article, article.tags?.[0]);
                  return (
                    <tr key={article.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--bg)]/50">
                      <td className="max-w-xs truncate px-4 py-3 font-medium text-[var(--ink)]">
                        {article.title}
                      </td>
                      <td className="px-4 py-3 text-[var(--ink-soft)]">{article.category}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                            article.qualityScore >= 70
                              ? "bg-accent/10 text-accent"
                              : article.qualityScore >= 40
                                ? "bg-signal/10 text-signal"
                                : "bg-alert/10 text-alert"
                          }`}
                        >
                          {article.qualityScore}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--ink-soft)]">{wordCount.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[var(--bg)]">
                            <div
                              className="h-full rounded-full bg-accent transition-all"
                              style={{ width: `${seo.overall}%` }}
                            />
                          </div>
                          <span className="text-xs text-[var(--ink-muted)]">{seo.overall}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--ink-muted)]">
                        {article.publishedAt
                          ? new Date(article.publishedAt).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── Top articles by views (tracked) ──────────────── */}
      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-[var(--ink)]">
          <TrendingUp size={18} /> Top articles by views
        </h2>
        <div className="mt-4 overflow-x-auto rounded-md border border-[var(--line)] bg-[var(--bg-elevated)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--bg)] text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
                <th className="px-4 py-3 w-10">#</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3 text-right">Views</th>
              </tr>
            </thead>
            <tbody>
              {topByViews.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-[var(--ink-faint)]">
                    No views tracked yet. Visit articles on the public site to populate data.
                  </td>
                </tr>
              ) : (
                topByViews.map((item, i) => (
                  <tr key={item.articleId} className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--bg)]/50">
                    <td className="px-4 py-3 text-xs font-semibold text-[var(--ink-muted)]">{i + 1}</td>
                    <td className="max-w-xs truncate px-4 py-3 font-medium text-[var(--ink)]">
                      {item.title}
                    </td>
                    <td className="max-w-[12rem] truncate px-4 py-3 text-xs text-[var(--ink-soft)] font-mono">
                      {item.slug}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
                        <Eye size={12} />
                        {item.views}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── Content pipeline ─────────────────────────────── */}
      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-[var(--ink)]">
          <Activity size={18} /> Content pipeline
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <MetricCard
            label="Pipeline status"
            value={
              pipeline.status === "idle"
                ? "Idle"
                : pipeline.status === "running"
                  ? "Running"
                  : pipeline.status === "completed"
                    ? "Completed"
                    : "Error"
            }
          />
          <MetricCard label="Articles generated" value={pipeline.articlesGenerated} />
          <MetricCard label="Quality failures" value={pipeline.qualityFailures} />
        </div>
        <div className="mt-4 rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
          <h3 className="text-sm font-semibold text-[var(--ink)]">Pipeline steps</h3>
          {pipeline.steps.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--ink-faint)]">No pipeline runs yet.</p>
          ) : (
            <div className="mt-4 grid gap-2">
              {pipeline.steps.map((step) => {
                const Icon =
                  step.status === "done"
                    ? CheckCircle2
                    : step.status === "error"
                      ? AlertCircle
                      : step.status === "running"
                        ? Loader2
                        : Circle;
                const iconClass =
                  step.status === "done"
                    ? "text-accent"
                    : step.status === "error"
                      ? "text-alert"
                      : step.status === "running"
                        ? "animate-spin text-signal"
                        : "text-[var(--ink-faint)]";
                return (
                  <div key={step.id} className="flex items-center gap-3 rounded-lg bg-[var(--bg)] p-3">
                    <Icon size={16} className={iconClass} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--ink)]">{step.label}</p>
                      {step.detail && (
                        <p className="truncate text-xs text-[var(--ink-muted)]">{step.detail}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-[var(--ink-muted)]">
                      {step.status === "done" && step.completedAt
                        ? new Date(step.completedAt).toLocaleTimeString()
                        : step.status === "running" && step.startedAt
                          ? new Date(step.startedAt).toLocaleTimeString()
                          : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── Category breakdown ───────────────────────────── */}
      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-[var(--ink)]">
          <Layers size={18} /> Category breakdown
        </h2>
        <div className="mt-4 rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
          {categoryEntries.length === 0 ? (
            <p className="text-sm text-[var(--ink-faint)]">No articles yet.</p>
          ) : (
            <div className="grid gap-3">
              {categoryEntries.map(([category, count]) => {
                const pct = maxCategoryCount > 0 ? (count / maxCategoryCount) * 100 : 0;
                return (
                  <div key={category} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 text-sm font-medium capitalize text-[var(--ink)]">
                      {category}
                    </span>
                    <div className="flex-1">
                      <div className="h-3 overflow-hidden rounded-full bg-[var(--bg)]">
                        <div
                          className="h-full rounded-full bg-accent/70 transition-all"
                          style={{ width: `${Math.max(pct, count > 0 ? 6 : 0)}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-8 shrink-0 text-right text-sm font-semibold text-[var(--ink)]">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

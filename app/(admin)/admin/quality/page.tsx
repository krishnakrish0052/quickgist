import { CheckCircle2, AlertCircle, RefreshCcw } from "lucide-react";
import { getPlatformSnapshot } from "@/lib/repositories/platformRepository";
import { scoreArticle } from "@/lib/services/seoEngine";
import { evaluateConfidence } from "@/lib/services/quality";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Quality"
};

export default async function AdminQualityPage() {
  const { qualityReports, articles, topics } = await getPlatformSnapshot();

  return (
    <div>
      <header className="mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink/55">Operations</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink">Quality &amp; SEO</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink/65">
          Confidence routing decides whether a generated article auto-publishes, goes to human review, or gets
          regenerated. Thresholds: <strong>≥{Math.round(config.autoPublishConfidenceThreshold * 100)}</strong> auto,{" "}
          <strong>≥{Math.round(config.reviewConfidenceThreshold * 100)}</strong> review, below → regenerate.
        </p>
      </header>

      <div className="grid gap-4">
        {qualityReports.length === 0 ? (
          <p className="text-sm text-ink/55">No quality reports yet — run the pipeline to generate articles.</p>
        ) : null}
        {qualityReports.map((report) => {
          const article = articles.find((candidate) => candidate.id === report.articleId);
          if (!article) return null;
          const topic = topics.find((t) => t.id === article.topicId);
          const seo = scoreArticle(article, topic?.keywords[0]);
          const requiresHumanReview =
            article.risk === "high" ||
            config.highRiskCategories.includes(article.category.toLowerCase());
          const confidence = evaluateConfidence(
            article,
            seo,
            report.score,
            new Set(article.sources.map((s) => s.publisher)).size,
            requiresHumanReview
          );

          const decisionStyle =
            confidence.decision === "auto_publish"
              ? "bg-accent/10 text-accent"
              : confidence.decision === "human_review"
                ? "bg-signal/10 text-signal"
                : "bg-alert/10 text-alert";

          const DecisionIcon =
            confidence.decision === "auto_publish"
              ? CheckCircle2
              : confidence.decision === "regenerate"
                ? RefreshCcw
                : AlertCircle;

          return (
            <article key={report.id} className="admin-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-signal">
                    {article.category} • {article.status}
                  </p>
                  <h2 className="mt-1 font-display text-xl font-bold text-ink">{article.title}</h2>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${decisionStyle}`}>
                  <DecisionIcon size={13} />
                  {confidence.decision.replace("_", " ")}
                </span>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-4">
                <ScoreBlock label="Confidence" value={Math.round(confidence.confidence * 100)} suffix="/100" />
                <ScoreBlock label="SEO" value={seo.overall} suffix="/100" />
                <ScoreBlock label="Structural" value={confidence.weights.structuralScore} suffix="/100" />
                <ScoreBlock label="Word count" value={seo.wordCount} suffix="" />
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-paper p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/55">SEO breakdown</h3>
                  <ul className="mt-2 grid gap-1 text-sm text-ink/80">
                    <li>Keyword density: {(seo.keyword.density * 100).toFixed(2)}%</li>
                    <li>Title score: {seo.title.score}/100</li>
                    <li>Meta score: {seo.meta.score}/100</li>
                    <li>Readability ({seo.readability.level}): {seo.readability.fleschScore}</li>
                    <li>Structure (H2/lists): {seo.structure.score}/100</li>
                    <li>Internal links: {seo.internalLinks.count}</li>
                  </ul>
                </div>
                <div className="rounded-lg bg-paper p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/55">Decision reasoning</h3>
                  {confidence.reasons.length === 0 ? (
                    <p className="mt-2 text-sm text-ink/65">All checks clean.</p>
                  ) : (
                    <ul className="mt-2 grid gap-1 text-sm text-ink/80">
                      {confidence.reasons.map((reason) => (
                        <li key={reason}>• {reason}</li>
                      ))}
                    </ul>
                  )}
                  {seo.suggestions.length > 0 ? (
                    <div className="mt-3 border-t border-line pt-2">
                      <h4 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/55">
                        Suggestions
                      </h4>
                      <ul className="mt-1 grid gap-1 text-sm text-ink/75">
                        {seo.suggestions.slice(0, 3).map((s) => (
                          <li key={s}>· {s}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function ScoreBlock({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return (
    <div className="rounded-lg bg-paper p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/55">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-ink">
        {value}
        {suffix}
      </p>
    </div>
  );
}

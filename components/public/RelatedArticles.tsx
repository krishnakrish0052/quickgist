import type { Article } from "@/lib/types";
import { StoryCard } from "@/components/public/StoryCard";

export function RelatedArticles({ current, all }: { current: Article; all: Article[] }) {
  const related = all
    .filter((a) => a.id !== current.id && (a.category === current.category || a.status === "published"))
    .slice(0, 3);

  if (related.length === 0) return null;

  return (
    <section className="border-t border-[var(--line)]">
      <div className="container-wide px-4 py-12 lg:py-16">
        <div className="mb-7 border-b border-[var(--ink)] pb-3">
          <div className="section-rule mb-2" />
          <h2 className="font-display text-2xl font-bold text-[var(--ink)]">Related stories</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {related.map((article) => (
            <StoryCard key={article.id} article={article} size="medium" />
          ))}
        </div>
      </div>
    </section>
  );
}

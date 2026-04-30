import Link from "next/link";
import type { Article } from "@/lib/types";
import { StoryCard } from "@/components/public/StoryCard";

export function RelatedArticles({ current, all }: { current: Article; all: Article[] }) {
  const related = all
    .filter((article) => article.id !== current.id)
    .filter((article) => article.category === current.category || article.tags.some((tag) => current.tags.includes(tag)))
    .slice(0, 3);
  if (related.length === 0) return null;
  return (
    <section className="border-t border-line bg-paper py-14">
      <div className="container-wide px-4">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-bold text-ink md:text-3xl">More on this story</h2>
          <Link href={`/category/${current.category.toLowerCase()}`} className="text-sm font-semibold text-signal">
            More in {current.category}
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {related.map((article) => (
            <StoryCard key={article.id} article={article} size="medium" />
          ))}
        </div>
      </div>
    </section>
  );
}

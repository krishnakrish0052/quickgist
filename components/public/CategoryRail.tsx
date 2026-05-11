import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Article } from "@/lib/types";
import { StoryCard } from "@/components/public/StoryCard";

export function CategoryRail({ category, articles }: { category: string; articles: Article[] }) {
  const displayName = category.charAt(0).toUpperCase() + category.slice(1);
  const topFour = articles.slice(0, 4);

  return (
    <section className="border-b border-[var(--line)]">
      <div className="container-wide px-4 py-10 lg:py-14">
        <div className="mb-7 flex items-end justify-between border-b border-[var(--ink)] pb-3">
          <div>
            <div className="section-rule mb-2" />
            <h2 className="font-display text-2xl font-bold text-[var(--ink)]">{displayName}</h2>
          </div>
          <Link
            href={`/category/${category}`}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--signal)] hover:underline"
          >
            View all <ArrowRight size={13} />
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {topFour.map((article) => (
            <StoryCard key={article.id} article={article} size="small" />
          ))}
        </div>
      </div>
    </section>
  );
}

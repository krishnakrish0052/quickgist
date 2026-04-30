import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StoryCard } from "@/components/public/StoryCard";
import type { Article } from "@/lib/types";

interface CategoryRailProps {
  category: string;
  articles: Article[];
}

const categoryDescriptions: Record<string, string> = {
  world: "Global politics, conflict, and diplomacy.",
  business: "Markets, deals, and the people moving capital.",
  technology: "AI, software, hardware, and the platforms shaping how we work.",
  science: "Discoveries from the lab, the launchpad, and the field.",
  health: "Public health, biotech, and personal wellness.",
  finance: "Macro, monetary policy, and consumer money.",
  india: "From the subcontinent: politics, business, culture."
};

export function CategoryRail({ category, articles }: CategoryRailProps) {
  if (articles.length === 0) return null;
  const description = categoryDescriptions[category.toLowerCase()] ?? "Latest stories in this section.";
  return (
    <section className="container-wide px-4 py-10 lg:py-14">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-signal">{category}</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-ink md:text-3xl">{categoryHeading(category)}</h2>
          <p className="mt-1 max-w-xl text-sm text-ink/65">{description}</p>
        </div>
        <Link
          href={`/category/${category.toLowerCase()}`}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-ink hover:border-ink"
        >
          See all
          <ArrowRight size={14} />
        </Link>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {articles.slice(0, 3).map((article, index) => (
          <StoryCard key={article.id} article={article} size={index === 0 ? "large" : "medium"} />
        ))}
      </div>
    </section>
  );
}

function categoryHeading(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

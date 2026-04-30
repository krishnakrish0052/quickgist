import Link from "next/link";
import { GraduationCap, ArrowRight } from "lucide-react";
import type { Article } from "@/lib/types";

export function ExplainerCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/explain/${article.slug}`}
      className="story-card group grid gap-3 rounded-2xl border border-accent/15 bg-gradient-to-br from-white to-accent/5 p-5"
    >
      <span className="inline-flex w-fit items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
        <GraduationCap size={12} />
        Explained
      </span>
      <h3 className="font-display text-lg font-semibold leading-snug text-ink group-hover:text-accent">
        {article.title}
      </h3>
      <p className="line-clamp-3 text-sm leading-6 text-ink/65">{article.dek}</p>
      <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-accent">
        Read explainer
        <ArrowRight size={12} className="transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

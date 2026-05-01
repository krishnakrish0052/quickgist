import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import type { Article } from "@/lib/types";

export function ExplainerCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/explain/${article.slug}`}
      className="story-card group flex flex-col gap-4 rounded-2xl border border-accent/20 bg-white p-5 transition hover:border-accent/40 hover:shadow-glow"
    >
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
        <BookOpen size={11} />
        Explained
      </span>
      <div className="flex-1">
        <h3 className="font-display text-[1.05rem] font-bold leading-snug text-ink transition group-hover:text-accent">
          {article.title}
        </h3>
        <p className="mt-2 line-clamp-3 text-[13px] leading-6 text-ink/60">{article.dek}</p>
      </div>
      <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-accent">
        Read explainer
        <ArrowRight size={12} className="transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

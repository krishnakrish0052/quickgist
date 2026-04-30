import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/lib/types";

export function ArticleCard({ article, priority = false }: { article: Article; priority?: boolean }) {
  return (
    <article className="grid overflow-hidden rounded-md border border-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-panel">
      {article.heroImageUrl ? (
        <Link href={`/news/${article.slug}`} className="relative block aspect-[16/9] bg-line">
          <Image
            src={article.heroImageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            priority={priority}
            className="object-cover"
          />
        </Link>
      ) : null}
      <div className="grid gap-4 p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-signal">
          <span>{article.category}</span>
          <span className="h-1 w-1 rounded-full bg-line" />
          <span>{article.readingMinutes} min read</span>
        </div>
        <Link href={`/news/${article.slug}`}>
          <h2 className="text-xl font-semibold leading-snug text-ink">{article.title}</h2>
        </Link>
        <p className="line-clamp-3 text-sm leading-6 text-ink/70">{article.dek}</p>
        <div className="flex flex-wrap gap-2">
          {article.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-paper px-3 py-1 text-xs text-ink/70">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

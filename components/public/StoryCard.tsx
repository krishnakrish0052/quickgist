import Image from "next/image";
import Link from "next/link";
import { Clock } from "lucide-react";
import type { Article } from "@/lib/types";

type StoryCardSize = "lead" | "large" | "medium" | "small" | "row";

interface StoryCardProps {
  article: Article;
  size?: StoryCardSize;
  priority?: boolean;
}

export function StoryCard({ article, size = "medium", priority = false }: StoryCardProps) {
  const href = `/news/${article.slug}`;

  if (size === "lead") {
    return (
      <article className="story-card group relative overflow-hidden rounded-2xl bg-ink text-paper">
        {article.heroImageUrl ? (
          <Link href={href} className="block">
            <div className="relative aspect-[16/10] w-full overflow-hidden">
              <Image
                src={article.heroImageUrl}
                alt={article.title}
                fill
                priority={priority}
                sizes="100vw"
                className="object-cover transition duration-700 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            </div>
            <div className="absolute inset-x-0 bottom-0 p-8 md:p-10">
              <span className="inline-flex items-center gap-2 rounded-full bg-signal/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                {article.category}
              </span>
              <h2 className="mt-4 max-w-3xl font-display text-display-lg font-bold leading-tight text-white">
                {article.title}
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/80">{article.dek}</p>
              <div className="mt-5 flex items-center gap-4 text-xs text-white/65">
                <span>{article.authorName}</span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={12} />
                  {article.readingMinutes} min read
                </span>
              </div>
            </div>
          </Link>
        ) : (
          <Link href={href} className="block p-10">
            <h2 className="font-display text-display-lg font-bold text-white">{article.title}</h2>
          </Link>
        )}
      </article>
    );
  }

  if (size === "row") {
    return (
      <article className="story-card grid grid-cols-[1fr_auto] gap-4 border-b border-line py-4 last:border-0">
        <div>
          <Link href={href} className="block">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-signal">
              {article.category}
            </p>
            <h3 className="mt-1 font-display text-base font-semibold leading-snug text-ink group-hover:text-signal">
              {article.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm text-ink/65">{article.dek}</p>
          </Link>
        </div>
        {article.heroImageUrl ? (
          <Link href={href} className="relative h-20 w-28 overflow-hidden rounded-md bg-line">
            <Image
              src={article.heroImageUrl}
              alt=""
              fill
              sizes="120px"
              className="object-cover"
            />
          </Link>
        ) : null}
      </article>
    );
  }

  const aspectClass = size === "large" ? "aspect-[16/10]" : size === "small" ? "aspect-[4/3]" : "aspect-[16/9]";
  const titleClass =
    size === "large"
      ? "font-display text-2xl md:text-3xl font-bold leading-tight"
      : size === "small"
        ? "font-display text-lg font-semibold leading-snug"
        : "font-display text-xl md:text-2xl font-semibold leading-snug";

  return (
    <article className="story-card group flex flex-col overflow-hidden rounded-xl border border-line/70 bg-white">
      {article.heroImageUrl ? (
        <Link href={href} className={`relative block ${aspectClass} w-full overflow-hidden bg-line`}>
          <Image
            src={article.heroImageUrl}
            alt=""
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        </Link>
      ) : null}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-signal">{article.category}</p>
        <Link href={href}>
          <h3 className={`${titleClass} text-ink transition group-hover:text-signal`}>{article.title}</h3>
        </Link>
        {size !== "small" ? <p className="line-clamp-2 text-sm leading-6 text-ink/65">{article.dek}</p> : null}
        <div className="mt-auto flex items-center gap-3 pt-2 text-xs text-ink/55">
          <span>{article.authorName}</span>
          <span className="h-0.5 w-0.5 rounded-full bg-line" />
          <span className="inline-flex items-center gap-1">
            <Clock size={11} /> {article.readingMinutes} min
          </span>
        </div>
      </div>
    </article>
  );
}

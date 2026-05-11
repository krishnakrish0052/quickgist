import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/lib/types";
import { articleHeroImage } from "@/lib/services/generation";

type StoryCardSize = "lead" | "large" | "medium" | "small" | "row" | "featured";

interface StoryCardProps {
  article: Article;
  size?: StoryCardSize;
  priority?: boolean;
}

function CategoryPill({ category }: { category: string }) {
  return (
    <Link href={`/category/${category.toLowerCase()}`} className="cat-pill">
      {category}
    </Link>
  );
}

function ReadTime({ minutes }: { minutes: number }) {
  return (
    <span className="text-[11px] text-[var(--ink-muted)]">
      {minutes} min read
    </span>
  );
}

export function StoryCard({ article, size = "medium", priority = false }: StoryCardProps) {
  const href = `/news/${article.slug}`;
  const heroImg = articleHeroImage(article);

  if (size === "lead") {
    return (
      <article className="story-card group relative overflow-hidden rounded-2xl bg-[var(--bg-elevated)]">
        <Link href={href} className="block" tabIndex={-1} aria-hidden="true">
          <div className="relative aspect-[21/12] w-full overflow-hidden md:aspect-[21/11]">
            <Image
              src={heroImg}
              alt={article.title}
              fill
              priority={priority}
              sizes="100vw"
              className="object-cover transition duration-700 group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)]/95 via-[var(--bg)]/40 to-transparent" />
          </div>
        </Link>
        <div className="absolute inset-x-0 bottom-0 p-8 md:p-12">
          <CategoryPill category={article.category} />
          <Link href={href}>
            <h2 className="mt-4 max-w-3xl font-display text-[clamp(1.75rem,4vw,3rem)] font-bold leading-[1.08] tracking-tight text-[var(--ink)] transition group-hover:text-[var(--signal)]">
              {article.title}
            </h2>
          </Link>
          {article.dek ? (
            <p className="mt-3 max-w-2xl text-[1.05rem] leading-relaxed text-[var(--ink-soft)]">{article.dek}</p>
          ) : null}
          <div className="mt-5 flex items-center gap-4 text-[12px] text-[var(--ink-muted)]">
            <span className="font-medium text-[var(--ink-soft)]">{article.authorName}</span>
            <span>&middot;</span>
            <ReadTime minutes={article.readingMinutes} />
          </div>
        </div>
      </article>
    );
  }

  if (size === "row") {
    return (
      <article className="group flex flex-1 items-center gap-3 py-3">
        <div className="min-w-0 flex-1">
          <CategoryPill category={article.category} />
          <Link href={href}>
            <h3 className="mt-1 font-display text-[0.85rem] font-semibold leading-snug text-[var(--ink)] transition group-hover:text-[var(--signal)] line-clamp-2">
              {article.title}
            </h3>
          </Link>
          <div className="mt-1">
            <ReadTime minutes={article.readingMinutes} />
          </div>
        </div>
        <Link href={href} className="relative h-[60px] w-[84px] shrink-0 overflow-hidden rounded-lg bg-[var(--bg-raft)]">
          <Image src={heroImg} alt="" fill sizes="84px" className="object-cover transition duration-500 group-hover:scale-105" />
        </Link>
      </article>
    );
  }

  if (size === "featured") {
    return (
      <article className="story-card group grid overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] md:grid-cols-[1.4fr_1fr]">
        <Link href={href} className="relative block aspect-[16/9] w-full overflow-hidden bg-[var(--bg-raft)] md:aspect-auto md:min-h-[240px]">
          <Image src={heroImg} alt="" fill sizes="(max-width:768px) 100vw, 55vw" className="object-cover transition duration-600 group-hover:scale-[1.03]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
        </Link>
        <div className="flex flex-col justify-center gap-3 p-7">
          <CategoryPill category={article.category} />
          <Link href={href}>
            <h3 className="font-display text-[1.35rem] font-bold leading-snug text-[var(--ink)] transition group-hover:text-[var(--signal)]">
              {article.title}
            </h3>
          </Link>
          <p className="line-clamp-3 text-sm leading-6 text-[var(--ink-soft)]">{article.dek}</p>
          <div className="flex items-center gap-3 pt-1 text-[11px] text-[var(--ink-muted)]">
            <span className="font-medium text-[var(--ink-soft)]">{article.authorName}</span>
            <span className="text-[var(--ink-faint)]">&middot;</span>
            <ReadTime minutes={article.readingMinutes} />
          </div>
        </div>
      </article>
    );
  }

  const isLarge = size === "large";
  const isSmall = size === "small";
  const aspectClass = isSmall ? "aspect-[4/3]" : "aspect-[16/9]";
  const titleClass = isLarge
    ? "font-display text-[1.35rem] font-bold leading-snug md:text-[1.55rem]"
    : isSmall
      ? "font-display text-[1rem] font-semibold leading-snug"
      : "font-display text-[1.15rem] font-bold leading-snug";

  return (
    <article className="story-card group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]">
      <Link href={href} className={`relative block ${aspectClass} w-full shrink-0 overflow-hidden bg-[var(--bg-raft)]`}>
        <Image
          src={heroImg}
          alt=""
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition duration-600 group-hover:scale-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
      </Link>
      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <CategoryPill category={article.category} />
        <Link href={href}>
          <h3 className={`${titleClass} text-[var(--ink)] transition group-hover:text-[var(--signal)]`}>
            {article.title}
          </h3>
        </Link>
        {!isSmall && article.dek ? (
          <p className="line-clamp-2 text-[13px] leading-6 text-[var(--ink-muted)]">{article.dek}</p>
        ) : null}
        <div className="mt-auto flex items-center gap-3 pt-2 text-[11px] text-[var(--ink-muted)]">
          <span className="font-medium text-[var(--ink-soft)]">{article.authorName}</span>
          <span className="text-[var(--ink-faint)]">&middot;</span>
          <ReadTime minutes={article.readingMinutes} />
        </div>
      </div>
    </article>
  );
}

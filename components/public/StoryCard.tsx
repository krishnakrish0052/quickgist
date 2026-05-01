import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/lib/types";

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
    <span className="text-[11px] text-ink/45">
      {minutes} min read
    </span>
  );
}

export function StoryCard({ article, size = "medium", priority = false }: StoryCardProps) {
  const href = `/news/${article.slug}`;

  /* ── Lead (hero card, full-width dark) ─────────────────── */
  if (size === "lead") {
    return (
      <article className="story-card group relative overflow-hidden rounded-2xl bg-ink">
        {article.heroImageUrl ? (
          <Link href={href} className="block">
            <div className="relative aspect-[21/12] w-full overflow-hidden md:aspect-[21/11]">
              <Image
                src={article.heroImageUrl}
                alt={article.title}
                fill
                priority={priority}
                sizes="100vw"
                className="object-cover transition duration-700 group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
            </div>
            <div className="absolute inset-x-0 bottom-0 p-8 md:p-12">
              <CategoryPill category={article.category} />
              <h2 className="mt-4 max-w-3xl font-display text-[clamp(1.75rem,4vw,3rem)] font-bold leading-[1.08] tracking-tight text-white">
                {article.title}
              </h2>
              {article.dek ? (
                <p className="mt-3 max-w-2xl text-[1.05rem] leading-relaxed text-white/75">{article.dek}</p>
              ) : null}
              <div className="mt-5 flex items-center gap-4 text-[12px] text-white/50">
                <span className="font-medium">{article.authorName}</span>
                <span>·</span>
                <ReadTime minutes={article.readingMinutes} />
              </div>
            </div>
          </Link>
        ) : (
          <Link href={href} className="block p-10 md:p-14">
            <CategoryPill category={article.category} />
            <h2 className="mt-5 font-display text-[clamp(1.75rem,4vw,3rem)] font-bold leading-tight text-white">
              {article.title}
            </h2>
          </Link>
        )}
      </article>
    );
  }

  /* ── Row (sidebar compact list) ────────────────────────── */
  if (size === "row") {
    return (
      <article className="group flex items-start gap-4 border-b border-line/70 py-4 last:border-0">
        <div className="min-w-0 flex-1">
          <CategoryPill category={article.category} />
          <Link href={href}>
            <h3 className="mt-2 font-display text-[0.9rem] font-semibold leading-snug text-ink transition group-hover:text-signal">
              {article.title}
            </h3>
          </Link>
          <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-ink/55">{article.dek}</p>
          <div className="mt-2">
            <ReadTime minutes={article.readingMinutes} />
          </div>
        </div>
        {article.heroImageUrl ? (
          <Link href={href} className="relative h-[72px] w-[100px] shrink-0 overflow-hidden rounded-lg bg-line">
            <Image src={article.heroImageUrl} alt="" fill sizes="100px" className="object-cover transition duration-500 group-hover:scale-105" />
          </Link>
        ) : (
          <div className="h-[72px] w-[100px] shrink-0 rounded-lg bg-line" />
        )}
      </article>
    );
  }

  /* ── Featured (wide horizontal card) ───────────────────── */
  if (size === "featured") {
    return (
      <article className="story-card group grid overflow-hidden rounded-2xl border border-line/60 bg-white md:grid-cols-[1.4fr_1fr]">
        {article.heroImageUrl ? (
          <Link href={href} className="relative block aspect-[16/9] w-full overflow-hidden bg-line md:aspect-auto md:min-h-[240px]">
            <Image src={article.heroImageUrl} alt="" fill sizes="(max-width:768px) 100vw, 55vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" />
          </Link>
        ) : <div className="hidden bg-line md:block" />}
        <div className="flex flex-col justify-center gap-3 p-7">
          <CategoryPill category={article.category} />
          <Link href={href}>
            <h3 className="font-display text-[1.35rem] font-bold leading-snug text-ink transition group-hover:text-signal">
              {article.title}
            </h3>
          </Link>
          <p className="line-clamp-3 text-sm leading-6 text-ink/60">{article.dek}</p>
          <div className="flex items-center gap-3 pt-1 text-[11px] text-ink/45">
            <span className="font-medium">{article.authorName}</span>
            <span>·</span>
            <ReadTime minutes={article.readingMinutes} />
          </div>
        </div>
      </article>
    );
  }

  /* ── Large / Medium / Small (standard grid cards) ───────── */
  const isLarge = size === "large";
  const isSmall = size === "small";
  const aspectClass = isLarge ? "aspect-[16/9]" : isSmall ? "aspect-[4/3]" : "aspect-[16/10]";
  const titleClass = isLarge
    ? "font-display text-[1.35rem] font-bold leading-snug md:text-[1.55rem]"
    : isSmall
    ? "font-display text-[1rem] font-semibold leading-snug"
    : "font-display text-[1.15rem] font-bold leading-snug";

  return (
    <article className="story-card group flex flex-col overflow-hidden rounded-2xl border border-line/60 bg-white">
      {article.heroImageUrl ? (
        <Link href={href} className={`relative block ${aspectClass} w-full overflow-hidden bg-line`}>
          <Image
            src={article.heroImageUrl}
            alt=""
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition group-hover:opacity-100" />
        </Link>
      ) : (
        <div className={`${aspectClass} bg-gradient-to-br from-ink/5 to-signal/5`} />
      )}
      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <CategoryPill category={article.category} />
        <Link href={href}>
          <h3 className={`${titleClass} text-ink transition group-hover:text-signal`}>{article.title}</h3>
        </Link>
        {!isSmall && article.dek ? (
          <p className="line-clamp-2 text-[13px] leading-6 text-ink/60">{article.dek}</p>
        ) : null}
        <div className="mt-auto flex items-center gap-3 pt-2 text-[11px] text-ink/45">
          <span className="font-medium">{article.authorName}</span>
          <span>·</span>
          <ReadTime minutes={article.readingMinutes} />
        </div>
      </div>
    </article>
  );
}

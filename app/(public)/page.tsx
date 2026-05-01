import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, TrendingUp } from "lucide-react";
import { StoryCard } from "@/components/public/StoryCard";
import { CategoryRail } from "@/components/public/CategoryRail";
import { ExplainerCard } from "@/components/public/ExplainerCard";
import { NewsletterBand } from "@/components/public/NewsletterBand";
import { Reveal } from "@/components/motion/Reveal";
import { getArticles, getPublishedArticles } from "@/lib/repositories/platformRepository";
import { config } from "@/lib/config";
import { websiteSchema, organizationSchema, homeItemListSchema } from "@/lib/seo/schema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "QuickGist — Real news, explained clearly" },
  description:
    "Source-grounded news summaries across world, business, tech, science and health. No noise, no opinion. Just the facts.",
  keywords: ["news", "world news", "business news", "technology news", "science news", "explainers"],
  openGraph: {
    title: "QuickGist — Real news, explained clearly",
    description: "Source-grounded news summaries. No noise, no opinion.",
    url: config.siteUrl,
    siteName: "QuickGist",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "QuickGist — Real news, explained clearly",
    description: "Source-grounded news summaries. No noise, no opinion."
  },
  alternates: { canonical: config.siteUrl }
};

export default async function HomePage() {
  let published = await getPublishedArticles();
  if (published.length === 0) {
    const all = await getArticles();
    published = all.filter((a) => a.status === "review" || a.status === "draft").slice(0, 12);
  }

  if (published.length === 0) {
    return (
      <div className="container-narrow py-24 text-center">
        <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-signal/10 flex items-center justify-center">
          <BookOpen size={28} className="text-signal" />
        </div>
        <h1 className="font-display text-3xl font-bold text-ink">Newsroom is warming up.</h1>
        <p className="mt-3 text-ink/55">
          Run <code className="rounded bg-white px-1.5 py-0.5 text-sm">npm run pipeline:local</code> to seed content.
        </p>
      </div>
    );
  }

  const lead = published[0];
  const secondLead = published[1];
  const topStories = published.slice(2, 9);
  const gridArticles = published.slice(9, 15);
  const categories = Array.from(new Set(published.map((a) => a.category.toLowerCase())));

  const explainers = published
    .filter((a) => a.eli5Markdown && a.eli5Markdown.length > 80)
    .slice(0, 4);
  const explainerFallback = published.slice(0, 4);
  const explainerItems = explainers.length >= 2 ? explainers : explainerFallback;

  const articlesByCategory: Record<string, typeof published> = {};
  for (const article of published) {
    const key = article.category.toLowerCase();
    if (!articlesByCategory[key]) articlesByCategory[key] = [];
    articlesByCategory[key].push(article);
  }

  const schemas = [websiteSchema(), organizationSchema(), homeItemListSchema(published)];

  return (
    <>
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}

      {/* ── Breaking banner ───────────────────────────────── */}
      <div className="border-b border-signal/20 bg-signal/5">
        <div className="container-wide flex items-center gap-3 px-4 py-2 text-[11px]">
          <span className="shrink-0 rounded-full bg-signal px-2.5 py-0.5 font-bold uppercase tracking-widest text-white">
            Latest
          </span>
          <p className="truncate font-medium text-ink/75">{lead.title}</p>
          <Link href={`/news/${lead.slug}`} className="ml-auto shrink-0 font-semibold text-signal hover:underline flex items-center gap-1">
            Read <ArrowRight size={11} />
          </Link>
        </div>
      </div>

      {/* ── Hero section ──────────────────────────────────── */}
      <section className="hero-bg border-b border-line">
        <div className="container-wide px-4 py-8 lg:py-12">
          <div className="grid items-stretch gap-6 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
            {/* Left col: lead + second lead stacked */}
            <div className="flex flex-col gap-4">
              <Reveal direction="up">
                <StoryCard article={lead} size="lead" priority />
              </Reveal>
              {secondLead ? (
                <Reveal direction="up" delay={0.08}>
                  <StoryCard article={secondLead} size="featured" />
                </Reveal>
              ) : null}
            </div>

            {/* Right col: Top stories panel — h-full stretches to match left column */}
            <div className="flex h-full flex-col rounded-2xl border border-line/70 bg-white shadow-soft overflow-hidden">
              <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} className="text-signal" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink">Top stories</span>
                </div>
                <Link href="/trending" className="text-[11px] font-semibold text-signal hover:underline flex items-center gap-1">
                  See all <ArrowRight size={10} />
                </Link>
              </div>
              <div className="flex flex-1 flex-col justify-between divide-y divide-line/60 px-5">
                {topStories.map((article) => (
                  <StoryCard key={article.id} article={article} size="row" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Latest coverage grid ──────────────────────────── */}
      <section className="container-wide px-4 py-10 lg:py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-ink pb-3">
          <div>
            <div className="section-rule mb-2" />
            <h2 className="font-display text-2xl font-bold text-ink">Latest coverage</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.slice(0, 5).map((cat) => (
              <Link
                key={cat}
                href={`/category/${cat}`}
                className="rounded-full border border-line px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60 transition hover:border-ink hover:text-ink"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>

        {gridArticles.length > 0 ? (
          <div className="grid auto-rows-fr gap-6 md:grid-cols-2 lg:grid-cols-3">
            {gridArticles.map((article, index) => (
              <Reveal key={article.id} delay={index * 0.06} direction="up" className="h-full">
                <StoryCard article={article} size="medium" />
              </Reveal>
            ))}
          </div>
        ) : null}
      </section>

      {/* ── Explainers ────────────────────────────────────── */}
      {explainerItems.length > 0 ? (
        <section className="border-y border-line bg-white">
          <div className="container-wide px-4 py-12 lg:py-16">
            <Reveal direction="up">
              <div className="mb-8 flex items-end justify-between border-b border-ink pb-3">
                <div>
                  <div className="section-rule mb-2 bg-accent" />
                  <h2 className="font-display text-2xl font-bold text-ink">Stories, explained.</h2>
                  <p className="mt-1 text-sm text-ink/55">
                    Background, definitions and context for the day&apos;s most complex stories.
                  </p>
                </div>
                <Link href="/trending" className="hidden items-center gap-1.5 text-[13px] font-semibold text-accent md:flex hover:underline">
                  Browse all <ArrowRight size={13} />
                </Link>
              </div>
            </Reveal>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {explainerItems.map((article, i) => (
                <Reveal key={article.id} delay={i * 0.08} direction="up">
                  <ExplainerCard article={article} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Category rails ────────────────────────────────── */}
      {categories.slice(0, 3).map((category) =>
        articlesByCategory[category]?.length >= 2 ? (
          <CategoryRail key={category} category={category} articles={articlesByCategory[category]} />
        ) : null
      )}

      <NewsletterBand />
    </>
  );
}

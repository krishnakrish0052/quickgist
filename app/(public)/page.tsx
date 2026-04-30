import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp } from "lucide-react";
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
  description: "Source-grounded news summaries across world, business, tech, science and health. No noise, no opinion. Just the facts.",
  keywords: ["news", "summaries", "explained", "world news", "technology news", "AI news"],
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
    published = all
      .filter((article) => article.status === "review" || article.status === "draft")
      .slice(0, 12);
  }

  if (published.length === 0) {
    return (
      <div className="container-narrow py-24 text-center">
        <Sparkles size={32} className="mx-auto text-signal" />
        <h1 className="mt-6 font-display text-3xl font-bold text-ink">Newsroom warming up.</h1>
        <p className="mt-3 text-ink/65">
          No published stories yet. Run <code className="rounded bg-white px-1.5 py-0.5">npm run pipeline:local</code>{" "}
          or call the MCP tool <code className="rounded bg-white px-1.5 py-0.5">pipeline_run</code> to seed content.
        </p>
      </div>
    );
  }

  const lead = published[0];
  const topStories = published.slice(1, 5);
  const grid = published.slice(5, 11);
  const categories = Array.from(new Set(published.map((article) => article.category.toLowerCase())));

  const explainerCandidates = published.filter(
    (article) => article.eli5Markdown && article.eli5Markdown.length > 80
  );
  const explainers = (explainerCandidates.length > 0 ? explainerCandidates : published).slice(0, 4);

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
      <section className="bg-hero-radial">
        <div className="container-wide grid gap-6 px-4 py-10 lg:grid-cols-[2fr_1fr] lg:py-14">
          <div className="animate-fade-in">
            <StoryCard article={lead} size="lead" priority />
          </div>
          <div className="grid content-start gap-1 rounded-2xl bg-white p-6 shadow-soft">
            <div className="mb-2 flex items-center gap-2">
              <TrendingUp size={16} className="text-signal" />
              <h2 className="font-display text-base font-bold text-ink">Top stories</h2>
              <Link href="/trending" className="ml-auto text-xs font-semibold text-signal hover:text-ink">
                See all
              </Link>
            </div>
            {topStories.map((article) => (
              <StoryCard key={article.id} article={article} size="row" />
            ))}
          </div>
        </div>
      </section>

      <section className="container-wide px-4 py-10 lg:py-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-signal">More to read</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-ink md:text-3xl">Latest coverage</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.slice(0, 5).map((category) => (
              <Link
                key={category}
                href={`/category/${category}`}
                className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-ink/70 hover:border-ink hover:text-ink"
              >
                {category}
              </Link>
            ))}
          </div>
        </div>
        {grid.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {grid.map((article, index) => (
              <Reveal key={article.id} delay={index * 0.07} direction="up">
                <StoryCard article={article} size={index === 0 ? "large" : "medium"} />
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink/55">More stories coming soon.</p>
        )}
      </section>

      {explainers.length > 0 ? (
        <section className="border-y border-line bg-gradient-to-br from-white via-paper to-accent/5">
          <div className="container-wide px-4 py-12 lg:py-16">
            <Reveal direction="up">
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">In plain English</p>
                  <h2 className="mt-1 font-display text-2xl font-bold text-ink md:text-3xl">Stories, explained.</h2>
                  <p className="mt-1 max-w-xl text-sm text-ink/65">
                    Background, definitions, and analogies for the day&apos;s most complex stories.
                  </p>
                </div>
                <Link
                  href="/trending"
                  className="hidden items-center gap-2 text-sm font-semibold text-accent md:inline-flex"
                >
                  Browse explainers <ArrowRight size={14} />
                </Link>
              </div>
            </Reveal>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {explainers.map((article, i) => (
                <Reveal key={article.id} delay={i * 0.09} direction="up">
                  <ExplainerCard article={article} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {categories.slice(0, 3).map((category) =>
        articlesByCategory[category] && articlesByCategory[category].length >= 2 ? (
          <CategoryRail key={category} category={category} articles={articlesByCategory[category]} />
        ) : null
      )}

      <NewsletterBand />
    </>
  );
}

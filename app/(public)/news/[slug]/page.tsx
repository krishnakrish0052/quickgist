import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, FileText, BookOpen, ArrowLeft } from "lucide-react";
import { AdSlot } from "@/components/AdSlot";
import { MarkdownArticle } from "@/lib/markdown";
import { articleJsonLd, absoluteUrl } from "@/lib/seo";
import { getArticleBySlug, getArticles } from "@/lib/repositories/platformRepository";
import { ReadingProgress } from "@/components/public/ReadingProgress";
import { ShareBar } from "@/components/public/ShareBar";
import { RelatedArticles } from "@/components/public/RelatedArticles";

interface Props {
  params: { slug: string };
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug);
  if (!article) return {};
  const ogImage = absoluteUrl(`/og/${article.slug}`);
  const heroImage = article.heroImageUrl ?? ogImage;
  return {
    title: article.title,
    description: article.metaDescription,
    keywords: article.tags,
    alternates: { canonical: absoluteUrl(`/news/${article.slug}`) },
    openGraph: {
      title: article.title,
      description: article.metaDescription,
      type: "article",
      images: [{ url: heroImage, width: 1400, height: 788, alt: article.title }],
      publishedTime: article.publishedAt ?? article.createdAt,
      authors: [article.authorName ?? "QuickGist Editorial"],
      section: article.category,
      tags: article.tags
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.metaDescription,
      images: [{ url: ogImage, alt: article.title }]
    }
  };
}

export default async function NewsArticlePage({ params }: Props) {
  const article = await getArticleBySlug(params.slug);
  if (!article) notFound();
  if (article.status !== "published" && process.env.NODE_ENV === "production") notFound();

  const jsonLd = articleJsonLd(article);
  const all = await getArticles();
  const url = absoluteUrl(`/news/${article.slug}`);

  const pubDate = new Date(article.publishedAt ?? article.createdAt).toLocaleDateString("en", {
    month: "long", day: "numeric", year: "numeric"
  });

  return (
    <>
      <ReadingProgress />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── Back nav ──────────────────────────────────────── */}
      <div className="border-b border-line bg-white">
        <div className="container-shell flex items-center gap-2 px-4 py-3">
          <Link href="/" className="flex items-center gap-1.5 text-[12px] font-semibold text-ink/50 transition hover:text-ink">
            <ArrowLeft size={13} />
            Back
          </Link>
          <span className="text-ink/20">/</span>
          <Link href={`/category/${article.category.toLowerCase()}`} className="text-[12px] font-semibold text-signal hover:underline">
            {article.category}
          </Link>
        </div>
      </div>

      {/* ── Hero header ───────────────────────────────────── */}
      <header className="border-b border-line bg-white">
        <div className="container-narrow px-4 pt-10 pb-8">
          <Link href={`/category/${article.category.toLowerCase()}`} className="cat-pill">
            {article.category}
          </Link>
          <h1 className="mt-5 font-display text-[clamp(1.9rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-ink">
            {article.title}
          </h1>
          {article.dek ? (
            <p className="mt-4 font-display text-[1.15rem] leading-8 text-ink/65">{article.dek}</p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-5 text-[12px] text-ink/50">
            <span className="font-semibold text-ink">{article.authorName}</span>
            <span className="flex items-center gap-1.5">
              <CalendarDays size={13} />
              {pubDate}
            </span>
            <span>{article.readingMinutes} min read</span>
            <div className="ml-auto">
              <ShareBar url={url} title={article.title} />
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero image ────────────────────────────────────── */}
      {article.heroImageUrl ? (
        <div className="bg-white">
          <div className="container-shell px-4 pb-10">
            <div className="relative aspect-[21/10] overflow-hidden rounded-2xl bg-line shadow-panel">
              <Image
                src={article.heroImageUrl}
                alt={article.title}
                fill
                priority
                sizes="(max-width: 1280px) 100vw, 1240px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Body ──────────────────────────────────────────── */}
      <div className="container-shell px-4 py-10 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,700px)_1fr]">
          {/* Article content */}
          <div>
            {/* Key points box */}
            {article.summaryBullets?.length > 0 ? (
              <div className="mb-8 rounded-2xl border border-accent/20 bg-accent/5 p-5">
                <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
                  <FileText size={13} />
                  Key points
                </h2>
                <ul className="mt-4 grid gap-3">
                  {article.summaryBullets.map((bullet, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-6 text-ink/80">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Article body */}
            <div className="prose-article drop-cap">
              <MarkdownArticle markdown={article.contentMarkdown} />
            </div>

            <AdSlot label="In-content ad" />

            {/* Explainer CTA */}
            <div className="mt-10 rounded-2xl border border-line bg-gradient-to-br from-white to-accent/5 p-6">
              <div className="flex items-start gap-4">
                <div className="mt-0.5 rounded-xl bg-accent/10 p-2.5">
                  <BookOpen size={20} className="text-accent" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-ink">
                    Want this story explained simply?
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-ink/60">
                    Read the plain-English version — background, the why-it-matters, and the bottom line.
                  </p>
                  <Link
                    href={`/explain/${article.slug}`}
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#0c5f58]"
                  >
                    Read the explainer
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom share */}
            <div className="mt-8 border-t border-line pt-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink/40">Share this story</p>
              <div className="mt-3">
                <ShareBar url={url} title={article.title} />
              </div>
            </div>
          </div>

          {/* Sticky sidebar */}
          <aside className="grid content-start gap-4 lg:sticky lg:top-24 lg:self-start">
            {/* Tags */}
            {article.tags.length > 0 ? (
              <div className="rounded-2xl border border-line bg-white p-5">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink/40">Topics</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/category/${tag.toLowerCase()}`}
                      className="rounded-full bg-paper px-3 py-1 text-[12px] font-medium text-ink/65 transition hover:bg-signal hover:text-white"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Newsletter mini */}
            <div className="rounded-2xl bg-ink p-5 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-signal">Daily Brief</p>
              <p className="mt-2 text-sm font-semibold leading-snug">
                Get the day&apos;s most important stories in 5 minutes.
              </p>
              <Link
                href="/newsletter"
                className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-signal px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#b03a0a]"
              >
                Subscribe free
              </Link>
            </div>

            <AdSlot label="Sidebar ad" />
          </aside>
        </div>
      </div>

      <RelatedArticles current={article} all={all} />
    </>
  );
}

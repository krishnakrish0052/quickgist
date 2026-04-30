import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ExternalLink, FileText, Sparkles } from "lucide-react";
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
  // In production we want only published; in dev surface drafts/reviews so the page is useful.
  if (article.status !== "published" && process.env.NODE_ENV === "production") notFound();

  const jsonLd = articleJsonLd(article);
  const all = await getArticles();
  const url = absoluteUrl(`/news/${article.slug}`);

  return (
    <>
      <ReadingProgress />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd)
        }}
      />
      {/* Hero */}
      <section className="border-b border-line bg-white">
        <div className="container-narrow px-4 pt-10 pb-8">
          <div className="mb-5 flex flex-wrap items-center gap-3 text-xs text-ink/60">
            <Link
              href={`/category/${article.category.toLowerCase()}`}
              className="rounded-full bg-signal/10 px-3 py-1 font-semibold uppercase tracking-[0.16em] text-signal"
            >
              {article.category}
            </Link>
            <span className="inline-flex items-center gap-1">
              <CalendarDays size={13} />
              {new Date(article.publishedAt ?? article.createdAt).toLocaleDateString("en", {
                month: "short",
                day: "numeric",
                year: "numeric"
              })}
            </span>
            <span className="h-0.5 w-0.5 rounded-full bg-line" />
            <span>{article.readingMinutes} min read</span>
            <span className="h-0.5 w-0.5 rounded-full bg-line" />
            <span>By {article.authorName}</span>
          </div>
          <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight text-ink md:text-5xl">
            {article.title}
          </h1>
          <p className="mt-5 max-w-3xl font-display text-xl leading-8 text-ink/75">{article.dek}</p>
          <div className="mt-6">
            <ShareBar url={url} title={article.title} />
          </div>
        </div>
      </section>

      {article.heroImageUrl ? (
        <div className="border-b border-line bg-white">
          <div className="container-wide px-4 pb-10">
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-line">
              <Image
                src={article.heroImageUrl}
                alt={article.title}
                fill
                priority
                sizes="(max-width: 1280px) 100vw, 1280px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      ) : null}

      <article className="container-wide grid gap-10 px-4 py-10 lg:grid-cols-[minmax(0,720px)_320px] lg:py-14">
        <div>
          {/* Short version pull-quote */}
          <div className="mb-8 grid gap-3 rounded-2xl border border-accent/20 bg-accent/5 p-5">
            <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              <FileText size={14} />
              The short version
            </h2>
            <ul className="grid gap-2 text-sm leading-6 text-ink/85">
              {article.summaryBullets.map((bullet) => (
                <li key={bullet} className="border-l-2 border-accent/40 pl-3">
                  {bullet}
                </li>
              ))}
            </ul>
          </div>

          <div className="prose-article drop-cap">
            <MarkdownArticle markdown={article.contentMarkdown} />
          </div>

          <AdSlot label="In-content ad placement" />

          <div className="mt-10 rounded-2xl border border-line bg-white p-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink">
              <Sparkles size={18} className="text-signal" />
              Want this story explained simply?
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink/70">
              Read the plain-English version with the background, the why-it-matters, and the bottom line.
            </p>
            <Link
              href={`/explain/${article.slug}`}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper transition hover:bg-signal"
            >
              Read the ELI5 explainer
            </Link>
          </div>

          <div className="mt-10 border-t border-line pt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/55">Share this story</p>
            <div className="mt-3">
              <ShareBar url={url} title={article.title} />
            </div>
          </div>
        </div>

        <aside className="grid content-start gap-5 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-line bg-white p-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/55">Sources</h2>
            <div className="mt-4 grid gap-3">
              {article.sources.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group rounded-md bg-paper p-3 text-sm leading-5 text-ink/75 transition hover:bg-white hover:shadow-soft"
                >
                  <span className="font-semibold text-ink">{source.publisher}</span>
                  <span className="mt-1 flex items-start gap-2">
                    {source.title}
                    <ExternalLink className="mt-0.5 shrink-0 opacity-40 group-hover:opacity-100" size={14} />
                  </span>
                </a>
              ))}
            </div>
          </div>
          {article.tags.length > 0 ? (
            <div className="rounded-2xl border border-line bg-white p-5">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/55">Topics</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-paper px-3 py-1 text-xs text-ink/70">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          <AdSlot label="Sidebar ad" />
        </aside>
      </article>

      <RelatedArticles current={article} all={all} />
    </>
  );
}

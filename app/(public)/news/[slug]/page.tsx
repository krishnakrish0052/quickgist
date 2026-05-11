import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { CalendarDays, FileText, BookOpen, ArrowLeft } from "lucide-react";
import { AdSlot } from "@/components/AdSlot";
import { MarkdownArticle } from "@/lib/markdown";
import { articleJsonLd, absoluteUrl } from "@/lib/seo";
import { getArticleBySlug, getArticles } from "@/lib/repositories/platformRepository";
import { sanitizeAiOutput } from "@/lib/services/aiOrchestration";
import { trackArticleView } from "@/lib/services/analytics";
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
  const t = await getTranslations();
  const article = await getArticleBySlug(params.slug);
  if (!article) notFound();
  if (article.status !== "published" && process.env.NODE_ENV === "production") notFound();

  // Track article view (non-blocking — failure is silently ignored)
  try {
    const hdrs = headers();
    await trackArticleView(article.id, {
      referer: hdrs.get("referer") ?? undefined,
      country: hdrs.get("x-vercel-ip-country") ?? undefined
    });
  } catch {
    // View tracking failure must not affect page rendering
  }

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

      {/* Back nav */}
      <div className="border-b border-[var(--line)] bg-[var(--bg-elevated)]">
        <div className="container-shell flex items-center gap-2 px-4 py-3">
          <Link href="/" className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--ink-muted)] transition hover:text-[var(--ink)]">
            <ArrowLeft size={13} />
            {t("article.backToHome")}
          </Link>
          <span className="text-[var(--ink-faint)]">/</span>
          <Link href={`/category/${article.category.toLowerCase()}`} className="text-[12px] font-semibold text-[var(--signal)] hover:underline">
            {article.category}
          </Link>
        </div>
      </div>

      {/* Hero header */}
      <header className="border-b border-[var(--line)] bg-[var(--bg-elevated)]">
        <div className="container-narrow px-4 pt-12 pb-10">
          <Link href={`/category/${article.category.toLowerCase()}`} className="cat-pill">
            {article.category}
          </Link>
          <h1 className="mt-6 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-bold leading-[1.08] tracking-tight text-[var(--ink)]">
            {article.title}
          </h1>
          {article.dek ? (
            <p className="mt-5 font-display text-[1.2rem] leading-8 text-[var(--ink-soft)]">{article.dek}</p>
          ) : null}

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--line)] pt-5 text-[12px] text-[var(--ink-muted)]">
            <span className="font-semibold text-[var(--ink)]">{article.authorName}</span>
            <span className="flex items-center gap-1.5">
              <CalendarDays size={13} />
              {pubDate}
            </span>
            <span>{article.readingMinutes} {t("article.minRead")}</span>
            <div className="ml-auto">
              <ShareBar url={url} title={article.title} />
            </div>
          </div>
        </div>
      </header>

      {/* Hero image */}
      {article.heroImageUrl ? (
        <div className="bg-[var(--bg-elevated)]">
          <div className="container-shell px-4 pb-12">
            <div className="relative aspect-[21/10] overflow-hidden rounded-2xl bg-[var(--bg-raft)] shadow-lg">
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

      {/* Body */}
      <div className="container-shell px-4 py-12 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,720px)_1fr]">
          {/* Article content */}
          <div>
            {/* Key points box */}
            {article.summaryBullets?.length > 0 ? (
              <div className="mb-10 rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent-soft)] p-6">
                <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
                  <FileText size={13} />
                  {t("article.keyPoints")}
                </h2>
                <ul className="mt-4 grid gap-3">
                  {article.summaryBullets.map((bullet, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-6 text-[var(--ink-soft)]">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Article body */}
            <div className="prose-article drop-cap">
              <MarkdownArticle markdown={sanitizeAiOutput(article.contentMarkdown)} />
            </div>

            <AdSlot label="In-content ad" />

            {/* Explainer CTA */}
            <div className="mt-12 rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-7">
              <div className="flex items-start gap-4">
                <div className="mt-0.5 rounded-xl bg-[var(--accent-soft)] p-3">
                  <BookOpen size={20} className="text-[var(--accent)]" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-[var(--ink)]">
                    {t("article.wantExplained")}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
                    {t("article.explainerPrompt")}
                  </p>
                  <Link
                    href={`/explain/${article.slug}`}
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--accent-deep)]"
                  >
                    {t("article.readExplainer")}
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom share */}
            <div className="mt-10 border-t border-[var(--line)] pt-7">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--ink-faint)]">{t("article.shareStory")}</p>
              <div className="mt-3">
                <ShareBar url={url} title={article.title} />
              </div>
            </div>
          </div>

          {/* Sticky sidebar */}
          <aside className="grid content-start gap-5 lg:sticky lg:top-24 lg:self-start">
            {/* Tags */}
            {article.tags.length > 0 ? (
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-faint)]">{t("article.topics")}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/category/${tag.toLowerCase()}`}
                      className="rounded-full bg-[var(--bg-raft)] px-3 py-1 text-[12px] font-medium text-[var(--ink-muted)] transition hover:bg-[var(--signal)] hover:text-[var(--ink)]"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Newsletter mini */}
            <div className="rounded-2xl bg-[var(--bg-elevated)] border border-[var(--line)] p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--signal)]">{t("article.dailyBrief")}</p>
              <p className="mt-3 text-sm font-semibold leading-snug text-[var(--ink)]">
                {t("article.dailyBriefDesc")}
              </p>
              <Link
                href="/newsletter"
                className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-[var(--signal)] px-4 py-2.5 text-sm font-bold text-[var(--ink)] transition hover:bg-[var(--signal-deep)]"
              >
                {t("article.subscribeFree")}
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

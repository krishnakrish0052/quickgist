import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";
import { MarkdownArticle } from "@/lib/markdown";
import { getArticleBySlug } from "@/lib/repositories/platformRepository";
import { absoluteUrl } from "@/lib/seo";
import { ReadingProgress } from "@/components/public/ReadingProgress";
import { ShareBar } from "@/components/public/ShareBar";

interface Props {
  params: { slug: string };
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug);
  if (!article) return {};
  return {
    title: `${article.title} — Explained`,
    description: `A simple, plain-English explainer for ${article.title}. Background, context, and the bottom line.`,
    alternates: { canonical: absoluteUrl(`/explain/${article.slug}`) }
  };
}

export default async function ExplainPage({ params }: Props) {
  const article = await getArticleBySlug(params.slug);
  if (!article) notFound();

  const pubDate = new Date(article.publishedAt ?? article.createdAt).toLocaleDateString("en", {
    month: "long", day: "numeric", year: "numeric"
  });
  const url = absoluteUrl(`/explain/${article.slug}`);

  return (
    <>
      <ReadingProgress />
      <div className="border-b border-[var(--line)] bg-[var(--bg-elevated)]">
        <div className="container-shell flex items-center gap-2 px-4 py-3">
          <Link href={`/news/${article.slug}`} className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--ink-muted)] transition hover:text-[var(--ink)]">
            <ArrowLeft size={13} />
            Back to article
          </Link>
        </div>
      </div>

      <header className="border-b border-[var(--line)] bg-[var(--bg-elevated)]">
        <div className="container-narrow px-4 pt-12 pb-10">
          <span className="cat-pill">
            <BookOpen size={11} className="mr-1" />
            Explained
          </span>
          <h1 className="mt-6 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-bold leading-[1.08] tracking-tight text-[var(--ink)]">
            {article.title}
          </h1>
          <p className="mt-4 text-[var(--ink-muted)] text-sm">{pubDate} &middot; {article.readingMinutes} min read</p>
        </div>
      </header>

      <div className="container-narrow px-4 py-12 lg:py-16">
        <div className="mb-10 rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-6">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
            Plain English Edition
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
            This explainer breaks down a complex story into clear, actionable information. No jargon, no spin — just what you need to know.
          </p>
        </div>

        <div className="prose-article drop-cap">
          <MarkdownArticle markdown={article.eli5Markdown} />
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-[var(--line)] pt-7">
          <Link href={`/news/${article.slug}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)] hover:underline">
            <ArrowLeft size={14} />
            Read the full article
          </Link>
          <ShareBar url={url} title={`${article.title} — Explained`} />
        </div>
      </div>
    </>
  );
}

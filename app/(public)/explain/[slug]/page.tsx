import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, GraduationCap, Lightbulb } from "lucide-react";
import { MarkdownArticle } from "@/lib/markdown";
import { absoluteUrl } from "@/lib/seo";
import { getArticleBySlug } from "@/lib/repositories/platformRepository";

interface Props {
  params: { slug: string };
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug);
  return {
    title: article ? `${article.title} — explained simply` : "Explainer",
    description: article?.metaDescription,
    alternates: article ? { canonical: absoluteUrl(`/explain/${article.slug}`) } : undefined
  };
}

export default async function ExplainerPage({ params }: Props) {
  const article = await getArticleBySlug(params.slug);
  if (!article) notFound();
  if (article.status !== "published" && process.env.NODE_ENV === "production") notFound();

  return (
    <div className="bg-gradient-to-br from-paper via-white to-accent/5">
      <div className="container-narrow px-4 py-14">
        <Link
          href={`/news/${article.slug}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-ink"
        >
          <ArrowLeft size={14} />
          Back to full article
        </Link>

        <div className="mt-8 flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
            <GraduationCap size={12} />
            Plain English
          </span>
          <span className="rounded-full bg-paper px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/60">
            {article.category}
          </span>
        </div>

        <h1 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight text-ink md:text-5xl">
          {article.title}
        </h1>
        <p className="mt-4 text-lg leading-8 text-ink/75">{article.dek}</p>

        {article.summaryBullets.length > 0 ? (
          <div className="mt-8 rounded-2xl border border-accent/15 bg-white p-6 shadow-soft">
            <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              <Lightbulb size={14} />
              Quick facts
            </h2>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-ink/85">
              {article.summaryBullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2">
                  <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="prose-article mt-10">
          <MarkdownArticle markdown={article.eli5Markdown} />
        </div>

        <div className="mt-10 rounded-2xl bg-ink p-6 text-paper">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-paper/60">The bottom line</p>
          <p className="mt-2 font-display text-xl leading-8 text-paper">
            {article.metaDescription || article.dek}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/news/${article.slug}`}
            className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper transition hover:bg-signal"
          >
            Read full article
          </Link>
          <Link
            href={`/category/${article.category.toLowerCase()}`}
            className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink"
          >
            More in {article.category}
          </Link>
        </div>
      </div>
    </div>
  );
}

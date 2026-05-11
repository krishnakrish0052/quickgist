import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArticles, getPublishedArticles } from "@/lib/repositories/platformRepository";
import { StoryCard } from "@/components/public/StoryCard";
import { Reveal } from "@/components/motion/Reveal";
import { config } from "@/lib/config";

interface Props { params: { slug: string } }

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const displayName = params.slug.charAt(0).toUpperCase() + params.slug.slice(1);
  return {
    title: `${displayName} news`,
    description: `Latest ${params.slug} news — verified from multiple sources by ${config.brandName} editors.`
  };
}

export default async function CategoryPage({ params }: Props) {
  let all = await getPublishedArticles();
  if (all.length === 0) {
    all = (await getArticles()).filter((a) => a.status === "review" || a.status === "draft");
  }
  const articles = all.filter((a) => a.category.toLowerCase() === params.slug.toLowerCase());
  if (articles.length === 0) notFound();

  const displayName = params.slug.charAt(0).toUpperCase() + params.slug.slice(1);

  return (
    <>
      <header className="border-b border-[var(--line)] bg-[var(--bg-elevated)]">
        <div className="container-wide px-4 pt-12 pb-10">
          <h1 className="font-display text-3xl font-bold text-[var(--ink)]">{displayName}</h1>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">{articles.length} stories</p>
        </div>
      </header>
      <div className="container-wide px-4 py-10 lg:py-14">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, i) => (
            <Reveal key={article.id} delay={i * 0.05} direction="up">
              <StoryCard article={article} size={i === 0 ? "large" : "medium"} />
            </Reveal>
          ))}
        </div>
      </div>
    </>
  );
}

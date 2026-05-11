import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getArticles, getPublishedArticles } from "@/lib/repositories/platformRepository";
import { StoryCard } from "@/components/public/StoryCard";
import { Reveal } from "@/components/motion/Reveal";
import { TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("trending.title"),
    description: t("trending.description")
  };
}

export default async function TrendingPage() {
  const t = await getTranslations();
  let articles = await getPublishedArticles();
  if (articles.length === 0) {
    articles = (await getArticles()).filter((a) => a.status === "review" || a.status === "draft");
  }
  articles.sort((a, b) => b.qualityScore - a.qualityScore);

  return (
    <>
      <header className="border-b border-[var(--line)] bg-[var(--bg-elevated)]">
        <div className="container-wide px-4 pt-12 pb-10">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[var(--signal-soft)] p-2.5">
              <TrendingUp size={22} className="text-[var(--signal)]" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-[var(--ink)]">{t("trending.title")}</h1>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">{t("trending.description")}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container-wide px-4 py-10 lg:py-14">
        {articles.length === 0 ? (
          <div className="py-20 text-center text-[var(--ink-muted)]">
            <TrendingUp size={32} className="mx-auto mb-4 opacity-30" />
            <p>No trending stories yet. Run the pipeline to seed content.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article, i) => (
              <Reveal key={article.id} delay={i * 0.05} direction="up">
                <div className="relative">
                  <span className="absolute top-3 left-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--signal)] text-[11px] font-bold text-[var(--ink)] shadow-lg">
                    {i + 1}
                  </span>
                  <StoryCard article={article} size={i < 2 ? "large" : "medium"} />
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

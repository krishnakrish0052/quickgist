import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoryCard } from "@/components/public/StoryCard";
import { getArticles } from "@/lib/repositories/platformRepository";
import { collectionPageSchema, breadcrumbSchema } from "@/lib/seo/schema";

interface Props {
  params: { slug: string };
}

export const dynamic = "force-dynamic";

const categoryDescriptions: Record<string, string> = {
  world: "Global politics, conflict, diplomacy, and international affairs.",
  business: "Markets, M&A, the people moving capital, and the firms shaping the economy.",
  technology: "AI, software, hardware, platforms, and the policies behind them.",
  science: "Discoveries from labs, launchpads, and field stations.",
  health: "Public health, biotech, clinical research, and personal wellness.",
  finance: "Macro, monetary policy, equities, fixed income, and consumer money.",
  india: "From the subcontinent: politics, business, culture, and infrastructure.",
  sports: "Match recaps, transfer news, and the storylines around the game.",
  politics: "Elections, legislation, and the people running the show."
};

export function generateMetadata({ params }: Props): Metadata {
  const heading = params.slug.charAt(0).toUpperCase() + params.slug.slice(1);
  return {
    title: `${heading} news`,
    description: categoryDescriptions[params.slug.toLowerCase()] ?? `Latest stories in ${heading}.`
  };
}

export default async function CategoryPage({ params }: Props) {
  const articles = (await getArticles()).filter(
    (article) => article.category.toLowerCase() === params.slug.toLowerCase() && article.status === "published"
  );

  const heading = params.slug.charAt(0).toUpperCase() + params.slug.slice(1);
  const description = categoryDescriptions[params.slug.toLowerCase()] ?? `Latest stories in ${heading}.`;

  if (articles.length === 0 && process.env.NODE_ENV === "production") notFound();

  const lead = articles[0];
  const rest = articles.slice(1);

  const schemas = [
    collectionPageSchema(`${heading} News`, description, `/category/${params.slug}`),
    breadcrumbSchema([{ name: "Home", url: "/" }, { name: heading, url: `/category/${params.slug}` }])
  ];

  return (
    <>
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}
      <section className="border-b border-line bg-white">
        <div className="container-wide px-4 py-12">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-signal">Section</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink md:text-5xl">{heading}</h1>
          <p className="mt-3 max-w-2xl text-ink/65">{description}</p>
        </div>
      </section>
      <section className="container-wide px-4 py-10">
        {articles.length === 0 ? (
          <p className="text-ink/55">No published articles in this section yet.</p>
        ) : (
          <>
            {lead ? (
              <div className="mb-8">
                <StoryCard article={lead} size="lead" priority />
              </div>
            ) : null}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((article, index) => (
                <StoryCard key={article.id} article={article} size={index === 0 ? "large" : "medium"} />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}

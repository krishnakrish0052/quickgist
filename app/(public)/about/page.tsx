import type { Metadata } from "next";
import { aboutPageSchema } from "@/lib/seo/schema";

export const metadata: Metadata = {
  title: "About QuickGist",
  description:
    "QuickGist is an independent news platform committed to clear, accurate, and timely reporting from trusted global sources.",
  openGraph: {
    title: "About QuickGist",
    description: "Independent news, curated from trusted sources and delivered with editorial clarity."
  }
};

export default function AboutPage() {
  const schema = aboutPageSchema();

  return (
    <main className="container-shell max-w-3xl py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-signal">About</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-ink">
        Independent news, delivered with clarity
      </h1>

      <div className="mt-8 space-y-6 text-base leading-8 text-ink/75">
        <p>
          QuickGist is an independent news platform dedicated to delivering accurate, well-sourced stories
          across politics, business, science, and culture. We aggregate from 19 trusted global outlets —
          including BBC, The Guardian, NPR, Al Jazeera, TechCrunch, and Ars Technica — and distil what
          matters into clear, readable coverage.
        </p>

        <p>
          Every story on QuickGist is drawn from multiple corroborating sources. Our editorial process
          cross-references reports, strips partisan framing, and presents what verified sources agree on.
          High-stakes topics undergo additional editorial review before publication.
        </p>

        <p>
          We believe fast news should not mean shallow news. Each article comes paired with an explainer
          that gives readers the background they need to understand the story — not just the headline.
          Where the evidence is thin or contested, we say so clearly.
        </p>

        <h2 className="pt-4 text-2xl font-bold tracking-tight text-ink">Our editorial standards</h2>
        <ul className="list-inside list-disc space-y-2">
          <li>Minimum two independent sources per factual claim</li>
          <li>Source attribution on every article</li>
          <li>Corrections published prominently and permanently</li>
          <li>No sponsored content in editorial columns</li>
          <li>Ad-editorial separation maintained at all times</li>
        </ul>

        <h2 className="pt-4 text-2xl font-bold tracking-tight text-ink">Who we are</h2>
        <p>
          QuickGist is operated by a small editorial team with backgrounds in journalism, technology, and
          information design. We are headquartered in India and cover global stories with a focus on
          understandability and relevance for international audiences.
        </p>

        <h2 className="pt-4 text-2xl font-bold tracking-tight text-ink">Contact & corrections</h2>
        <p>
          Spotted an error? Have a tip? Reach us at{" "}
          <a href="mailto:editorial@quickgist.news" className="font-semibold text-signal hover:underline">
            editorial@quickgist.news
          </a>
          . We respond to all correction requests within one business day.
        </p>
      </div>
    </main>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact QuickGist",
  description: "Get in touch with the QuickGist editorial team for corrections, tips, and partnerships.",
  openGraph: {
    title: "Contact QuickGist",
    description: "Reach the QuickGist editorial team for corrections, tips, and media enquiries."
  }
};

export default function ContactPage() {
  return (
    <main className="container-shell max-w-3xl py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-signal">Contact</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-[var(--ink)]">Get in touch</h1>
      <p className="mt-4 text-base leading-8 text-[var(--ink-soft)]">
        We read every message and respond within one business day.
      </p>

      <div className="mt-10 grid gap-8 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] p-6">
          <h2 className="text-base font-bold text-[var(--ink)]">Editorial & corrections</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
            Spotted a factual error? Have additional context on a story? Reach our editorial desk.
          </p>
          <a
            href="mailto:editorial@quickgist.news"
            className="mt-4 inline-block text-sm font-semibold text-signal hover:underline"
          >
            editorial@quickgist.news
          </a>
        </div>

        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] p-6">
          <h2 className="text-base font-bold text-[var(--ink)]">Tips & story leads</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
            Have a story we should be covering? Share your tip with our newsroom.
          </p>
          <a
            href="mailto:tips@quickgist.news"
            className="mt-4 inline-block text-sm font-semibold text-signal hover:underline"
          >
            tips@quickgist.news
          </a>
        </div>

        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] p-6">
          <h2 className="text-base font-bold text-[var(--ink)]">Partnerships & media</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
            Content syndication, advertising, or press enquiries about QuickGist.
          </p>
          <a
            href="mailto:partnerships@quickgist.news"
            className="mt-4 inline-block text-sm font-semibold text-signal hover:underline"
          >
            partnerships@quickgist.news
          </a>
        </div>

        <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] p-6">
          <h2 className="text-base font-bold text-[var(--ink)]">Privacy & data</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
            Data access requests, cookie enquiries, or privacy-related matters.
          </p>
          <a
            href="mailto:privacy@quickgist.news"
            className="mt-4 inline-block text-sm font-semibold text-signal hover:underline"
          >
            privacy@quickgist.news
          </a>
        </div>
      </div>
    </main>
  );
}

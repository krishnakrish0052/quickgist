export const metadata = {
  title: "About",
  description: "About QuickGist and its AI-assisted editorial workflow."
};

export default function AboutPage() {
  return (
    <main className="container-shell max-w-3xl py-10">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-signal">About</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">AI-assisted, source-grounded news</h1>
      <div className="mt-6 space-y-4 leading-8 text-ink/75">
        <p>
          QuickGist is designed as an editorial platform that clusters source signals, extracts verifiable facts,
          drafts explainers, and routes risky or low-confidence work to human review.
        </p>
        <p>
          The system is transparent by design: public articles keep source attribution, while the internal review desk
          keeps quality reports, prompt traces, and distribution payloads.
        </p>
      </div>
    </main>
  );
}

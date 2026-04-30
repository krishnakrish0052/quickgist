export const metadata = {
  title: "Disclaimer",
  description: "QuickGist editorial disclaimer."
};

export default function DisclaimerPage() {
  return (
    <main className="container-shell max-w-3xl py-10">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-signal">Disclaimer</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Editorial Disclaimer</h1>
      <div className="mt-6 space-y-4 leading-8 text-ink/75">
        <p>
          QuickGist articles are AI-assisted and source-grounded. They are informational only and should not be treated
          as financial, medical, legal, or investment advice.
        </p>
        <p>
          High-risk topics are designed to require human review before publishing. Readers should verify critical facts
          with original sources and official statements.
        </p>
      </div>
    </main>
  );
}

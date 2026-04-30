import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Editorial Disclaimer",
  description: "QuickGist editorial disclaimer and content policy.",
  robots: { index: true, follow: true }
};

export default function DisclaimerPage() {
  return (
    <main className="container-shell max-w-3xl py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-signal">Disclaimer</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-ink">Editorial Disclaimer</h1>
      <p className="mt-2 text-sm text-ink/50">Last updated: April 2026</p>

      <div className="mt-8 space-y-6 text-base leading-8 text-ink/75">
        <p>
          QuickGist publishes news summaries, analysis, and explanatory journalism drawn from publicly
          available sources. All content is informational in nature and is not intended to substitute
          for professional advice of any kind.
        </p>

        <h2 className="pt-4 text-xl font-bold tracking-tight text-ink">No professional advice</h2>
        <p>
          Nothing published on QuickGist constitutes financial, investment, legal, medical, or any other
          form of professional advice. Readers should consult qualified professionals before making
          decisions based on information covered in our articles.
        </p>

        <h2 className="pt-4 text-xl font-bold tracking-tight text-ink">Source accuracy</h2>
        <p>
          We make every effort to verify facts before publication. All articles cite their primary sources,
          and our editorial process requires cross-referencing at least two independent outlets before a
          claim is treated as established. Despite these measures, errors can occur. If you identify an
          inaccuracy, please contact us at{" "}
          <a href="mailto:editorial@quickgist.news" className="font-semibold text-signal hover:underline">
            editorial@quickgist.news
          </a>{" "}
          and we will investigate promptly.
        </p>

        <h2 className="pt-4 text-xl font-bold tracking-tight text-ink">Third-party sources</h2>
        <p>
          QuickGist links to and cites third-party publications. We are not responsible for the content,
          accuracy, or privacy practices of external websites. Links to external sources are provided for
          reference only and do not constitute endorsement.
        </p>

        <h2 className="pt-4 text-xl font-bold tracking-tight text-ink">Corrections policy</h2>
        <p>
          When we identify errors in our coverage, we correct them and note the correction at the bottom
          of the article with a timestamp. We do not silently edit published articles. Substantive changes
          made after initial publication are always disclosed.
        </p>

        <h2 className="pt-4 text-xl font-bold tracking-tight text-ink">Opinion and analysis</h2>
        <p>
          Articles marked &ldquo;Analysis&rdquo; or &ldquo;Opinion&rdquo; represent the views of the named author and not
          necessarily the position of QuickGist as a publication. News reports and opinion pieces are
          clearly labelled.
        </p>
      </div>
    </main>
  );
}

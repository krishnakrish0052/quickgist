import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "QuickGist terms of service — rules for using the platform.",
  robots: { index: true, follow: true }
};

export default function TermsPage() {
  return (
    <main className="container-shell max-w-3xl py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-signal">Terms</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-[var(--ink)]">Terms of Service</h1>
      <p className="mt-2 text-sm text-[var(--ink-muted)]">Last updated: April 2026</p>

      <div className="mt-8 space-y-6 text-base leading-8 text-[var(--ink-soft)]">
        <p>
          By accessing or using QuickGist (&ldquo;the Service&rdquo;), you agree to be bound by these
          Terms of Service. If you do not agree, please do not use the Service.
        </p>

        <h2 className="pt-4 text-xl font-bold tracking-tight text-[var(--ink)]">Permitted use</h2>
        <p>
          You may read, share, and link to QuickGist content for personal, educational, and
          non-commercial purposes, provided attribution to QuickGist and the original source is included.
          Brief excerpts for commentary, criticism, or reporting are permitted under fair use.
        </p>

        <h2 className="pt-4 text-xl font-bold tracking-tight text-[var(--ink)]">Prohibited use</h2>
        <ul className="list-inside list-disc space-y-2">
          <li>Scraping or bulk-downloading content without written permission</li>
          <li>Republishing articles in full without a syndication agreement</li>
          <li>Using the Service for any unlawful purpose or in violation of any applicable regulation</li>
          <li>Attempting to gain unauthorised access to any part of the Service or its infrastructure</li>
          <li>Transmitting malware, spam, or any harmful code</li>
          <li>Interfering with the availability or performance of the Service</li>
        </ul>

        <h2 className="pt-4 text-xl font-bold tracking-tight text-[var(--ink)]">Intellectual property</h2>
        <p>
          All original content, design, and code on QuickGist is the property of QuickGist or its content
          partners and is protected by applicable copyright law. Trademarks appearing on the Service belong
          to their respective owners.
        </p>

        <h2 className="pt-4 text-xl font-bold tracking-tight text-[var(--ink)]">Disclaimer of warranties</h2>
        <p>
          The Service is provided &ldquo;as is&rdquo; without warranties of any kind, express or implied.
          We do not guarantee the accuracy, completeness, or timeliness of any content on the Service.
          See our <a href="/disclaimer" className="font-semibold text-signal hover:underline">Editorial Disclaimer</a> for
          our content accuracy policy.
        </p>

        <h2 className="pt-4 text-xl font-bold tracking-tight text-[var(--ink)]">Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, QuickGist and its operators shall not be liable for any
          indirect, incidental, special, consequential, or punitive damages arising from your use of the
          Service.
        </p>

        <h2 className="pt-4 text-xl font-bold tracking-tight text-[var(--ink)]">Changes to these terms</h2>
        <p>
          We may revise these terms at any time. Continued use of the Service after changes are posted
          constitutes your acceptance of the revised terms.
        </p>

        <h2 className="pt-4 text-xl font-bold tracking-tight text-[var(--ink)]">Governing law</h2>
        <p>
          These terms are governed by the laws of India. Disputes shall be subject to the exclusive
          jurisdiction of the courts located in India.
        </p>

        <h2 className="pt-4 text-xl font-bold tracking-tight text-[var(--ink)]">Contact</h2>
        <p>
          Legal enquiries:{" "}
          <a href="mailto:legal@quickgist.news" className="font-semibold text-signal hover:underline">
            legal@quickgist.news
          </a>
        </p>
      </div>
    </main>
  );
}

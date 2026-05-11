import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "QuickGist privacy policy — how we collect, use, and protect your data.",
  robots: { index: true, follow: true }
};

export default function PrivacyPage() {
  return (
    <main className="container-shell max-w-3xl py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-signal">Privacy</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-[var(--ink)]">Privacy Policy</h1>
      <p className="mt-2 text-sm text-[var(--ink-muted)]">Last updated: April 2026</p>

      <div className="mt-8 space-y-6 text-base leading-8 text-[var(--ink-soft)]">
        <p>
          QuickGist (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) respects your privacy. This policy
          explains what information we collect, how we use it, and the choices available to you.
        </p>

        <h2 className="pt-4 text-xl font-bold tracking-tight text-[var(--ink)]">Information we collect</h2>
        <ul className="list-inside list-disc space-y-2">
          <li>
            <strong>Newsletter subscriptions</strong> — email address only. Used solely to deliver
            the QuickGist digest. You may unsubscribe at any time via the link in every email.
          </li>
          <li>
            <strong>Analytics</strong> — page views, referral sources, and session duration collected
            in aggregate. We do not track individual users across sites or build personal profiles.
          </li>
          <li>
            <strong>Locale preference</strong> — a cookie named <code>quickgist_locale</code> stores
            your language selection so we can serve content in your preferred language on return visits.
            This cookie contains no personal information.
          </li>
        </ul>

        <h2 className="pt-4 text-xl font-bold tracking-tight text-[var(--ink)]">How we use your information</h2>
        <p>We use the information collected for the following purposes:</p>
        <ul className="list-inside list-disc space-y-2">
          <li>To deliver the email newsletter you have subscribed to</li>
          <li>To understand which topics and formats our readers find valuable</li>
          <li>To improve site performance and editorial priorities</li>
          <li>To comply with applicable law and respond to lawful requests</li>
        </ul>

        <h2 className="pt-4 text-xl font-bold tracking-tight text-[var(--ink)]">Cookies</h2>
        <p>
          We use a minimal set of cookies: one for language preference (first-party, no expiry), and
          analytics cookies if you have not opted out. We do not use advertising cookies, tracking pixels,
          or cross-site identifiers. You can clear or block cookies at any time via your browser settings.
        </p>

        <h2 className="pt-4 text-xl font-bold tracking-tight text-[var(--ink)]">Third-party services</h2>
        <p>
          QuickGist may use third-party analytics and email delivery providers. These providers process
          data on our behalf under data processing agreements and are prohibited from using your data for
          their own purposes.
        </p>

        <h2 className="pt-4 text-xl font-bold tracking-tight text-[var(--ink)]">Data retention</h2>
        <p>
          Newsletter email addresses are retained until you unsubscribe. Aggregate analytics data is
          retained for up to 24 months. We do not sell, rent, or trade personal information.
        </p>

        <h2 className="pt-4 text-xl font-bold tracking-tight text-[var(--ink)]">Your rights</h2>
        <p>
          Depending on your jurisdiction, you may have the right to access, correct, or delete personal
          data we hold about you. To exercise these rights, email us at{" "}
          <a href="mailto:privacy@quickgist.news" className="font-semibold text-signal hover:underline">
            privacy@quickgist.news
          </a>
          .
        </p>

        <h2 className="pt-4 text-xl font-bold tracking-tight text-[var(--ink)]">Changes to this policy</h2>
        <p>
          We may update this policy from time to time. Material changes will be noted with a revised
          &ldquo;Last updated&rdquo; date at the top. Continued use of the site after changes constitutes
          acceptance of the revised policy.
        </p>

        <h2 className="pt-4 text-xl font-bold tracking-tight text-[var(--ink)]">Contact</h2>
        <p>
          Privacy enquiries:{" "}
          <a href="mailto:privacy@quickgist.news" className="font-semibold text-signal hover:underline">
            privacy@quickgist.news
          </a>
        </p>
      </div>
    </main>
  );
}

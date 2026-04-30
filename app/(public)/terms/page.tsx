export const metadata = {
  title: "Terms of Service",
  description: "QuickGist terms of service."
};

export default function TermsPage() {
  return (
    <main className="container-shell max-w-3xl py-10">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-signal">Terms</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Terms of Service</h1>
      <div className="mt-6 space-y-4 leading-8 text-ink/75">
        <p>
          Use QuickGist for lawful reading, research, and editorial workflows. Do not attempt to overload internal
          endpoints, abuse automation, or copy content without attribution.
        </p>
        <p>
          Production teams should replace this starter page with reviewed legal terms before monetization.
        </p>
      </div>
    </main>
  );
}

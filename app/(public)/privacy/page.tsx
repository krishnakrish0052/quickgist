export const metadata = {
  title: "Privacy Policy",
  description: "QuickGist privacy policy."
};

export default function PrivacyPage() {
  return (
    <main className="container-shell max-w-3xl py-10">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-signal">Policy</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Privacy Policy</h1>
      <div className="mt-6 space-y-4 leading-8 text-ink/75">
        <p>
          QuickGist collects only the information needed to operate the service, such as newsletter email addresses,
          analytics events, and content review logs.
        </p>
        <p>
          Production deployments should connect a consent banner, analytics controls, and regional privacy notices
          before enabling advertising or newsletter automation.
        </p>
      </div>
    </main>
  );
}

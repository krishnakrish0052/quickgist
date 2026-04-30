export const metadata = {
  title: "Contact",
  description: "Contact QuickGist."
};

export default function ContactPage() {
  return (
    <main className="container-shell max-w-3xl py-10">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-signal">Contact</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Contact QuickGist</h1>
      <p className="mt-6 leading-8 text-ink/75">
        For corrections, partnerships, or editorial questions, email{" "}
        <a className="font-semibold text-signal" href="mailto:editorial@quickgist.local">
          editorial@quickgist.local
        </a>
        .
      </p>
    </main>
  );
}

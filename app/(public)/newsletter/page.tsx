import { CheckCircle2, MailCheck, Sparkles } from "lucide-react";
import { NewsletterSignup } from "@/components/NewsletterSignup";

export const metadata = {
  title: "Newsletter",
  description: "Subscribe to the daily 5-minute brief — the news you need, distilled."
};

const sample = [
  "World — Two-line headline that captures what changed in geopolitics this morning.",
  "Markets — A clean read on overnight moves, the data drop coming today, and why it matters.",
  "Tech — One AI/software story plus a quick explainer of any new term.",
  "Long read — One curated story worth your weekend coffee.",
  "Quick hits — Three more headlines you should have on your radar."
];

export default function NewsletterPage() {
  return (
    <div className="container-wide grid gap-10 px-4 py-14 md:grid-cols-[1.1fr_1fr] md:py-20">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-signal/20 bg-[var(--bg-elevated)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-signal">
          <Sparkles size={12} />
          The daily brief
        </div>
        <h1 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight text-[var(--ink)] md:text-5xl">
          5 minutes, every weekday. No filler.
        </h1>
        <p className="mt-4 text-lg leading-8 text-[var(--ink-soft)]">
          The newsroom writes the brief from our source-grounded coverage. You get the headlines that actually matter,
          a quick explainer when context helps, and never more than one email a day.
        </p>
        <ul className="mt-8 grid gap-2 text-sm leading-6 text-[var(--ink-soft)]">
          {[
            "Free forever for personal use.",
            "Read in under 5 minutes — guaranteed.",
            "Unsubscribe in one click. We never sell your address."
          ].map((point) => (
            <li key={point} className="flex items-start gap-2">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-signal" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="grid content-start gap-5">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-6 shadow-lg">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink-faint)]">
            <MailCheck size={14} className="text-signal" />
            What&apos;s in tomorrow&apos;s brief
          </div>
          <ul className="grid gap-3 text-sm leading-6 text-[var(--ink)]/85">
            {sample.map((item) => (
              <li key={item} className="border-l-2 border-signal/40 pl-3">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <NewsletterSignup />
      </div>
    </div>
  );
}

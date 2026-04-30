import { MailCheck, Sparkles } from "lucide-react";
import { subscribeAction } from "@/app/(public)/actions";
import { config } from "@/lib/config";

export function NewsletterBand() {
  return (
    <section className="container-wide my-16 px-4">
      <div className="overflow-hidden rounded-2xl bg-ink text-paper">
        <div className="grid items-center gap-8 p-8 md:grid-cols-[1.4fr_1fr] md:p-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75">
              <Sparkles size={12} />
              Daily brief
            </div>
            <h2 className="mt-4 font-display text-3xl font-bold leading-tight md:text-4xl">
              The 5-minute morning brief on what actually matters.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">
              Curated from {config.brandName}&apos;s source-grounded coverage. No filler, no clickbait — just the
              stories you&apos;ll need to follow today, with explainers when context matters.
            </p>
          </div>
          <form
            action={subscribeAction}
            className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur"
          >
            <input type="hidden" name="topic" value="daily-brief" />
            <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/65">
              Email address
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              className="rounded-md border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/40"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-paper px-4 py-3 text-sm font-semibold text-ink hover:bg-white"
            >
              <MailCheck size={14} />
              Subscribe — it&apos;s free
            </button>
            <p className="text-[11px] text-white/55">
              One email a day. Unsubscribe anytime. Your address is never sold.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

import { MailCheck } from "lucide-react";
import { subscribeAction } from "@/app/(public)/actions";
import { config } from "@/lib/config";

export function NewsletterBand() {
  return (
    <section className="border-t border-line bg-ink">
      <div className="container-wide px-4 py-16 lg:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_440px]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-signal">Daily Brief</p>
            <h2 className="mt-3 font-display text-4xl font-bold leading-[1.08] tracking-tight text-white md:text-5xl">
              Five minutes.<br />Fully informed.
            </h2>
            <p className="mt-5 max-w-xl text-[1rem] leading-7 text-white/55">
              {config.brandName}&apos;s daily digest — the most important verified stories with context,
              delivered every morning. No noise, no clickbait.
            </p>
            <div className="mt-6 flex flex-wrap gap-5 text-[12px] font-semibold text-white/35 uppercase tracking-[0.14em]">
              <span>✓ Free forever</span>
              <span>✓ One email a day</span>
              <span>✓ Unsubscribe anytime</span>
            </div>
          </div>

          <form action={subscribeAction} className="rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm">
            <input type="hidden" name="topic" value="daily-brief" />
            <p className="text-sm font-semibold text-white/80">Join thousands of readers who start their day with QuickGist.</p>
            <div className="mt-5 grid gap-3">
              <input
                type="email"
                name="email"
                required
                placeholder="Enter your email address"
                className="w-full rounded-xl border border-white/12 bg-black/25 px-4 py-3.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-signal/60 transition"
              />
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-signal px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#b03a0a]"
              >
                <MailCheck size={15} />
                Subscribe — it&apos;s free
              </button>
            </div>
            <p className="mt-3 text-[11px] text-white/35 text-center">
              Your address is never sold or shared.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

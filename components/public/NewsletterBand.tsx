import { getTranslations } from "next-intl/server";
import { NewsletterSignup } from "@/components/NewsletterSignup";

export async function NewsletterBand() {
  const t = await getTranslations();

  return (
    <section className="border-t border-[var(--line)] bg-[var(--bg-elevated)]">
      <div className="container-narrow px-4 py-16 text-center lg:py-20">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--signal)]">
          {t("article.dailyBrief")}
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-[var(--ink)]">
          {t("newsletter.heading")}
        </h2>
        <p className="mt-3 text-[var(--ink-muted)] leading-relaxed">
          {t("newsletter.subheading")}
        </p>
        <div className="mt-8">
          <NewsletterSignup />
        </div>
        <p className="mt-4 text-[10px] text-[var(--ink-faint)]">
          {t("newsletter.unsubscribeNote")}{" "}
          <a href="/privacy" className="underline hover:text-[var(--ink-muted)]">{t("footer.privacy")}</a>.
        </p>
      </div>
    </section>
  );
}

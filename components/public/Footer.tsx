import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { config } from "@/lib/config";

export async function PublicFooter() {
  const t = await getTranslations();

  const newsLinks = [
    { href: "/", key: "footer.latest" },
    { href: "/trending", key: "footer.trending" },
    { href: "/category/world", key: "footer.world" },
    { href: "/category/business", key: "footer.business" },
    { href: "/category/technology", key: "footer.technology" },
    { href: "/category/science", key: "footer.science" },
  ];

  const toolLinks = [
    { href: "/tools", key: "footer.freeTools" },
    { href: "/tools/summarize", key: "footer.articleSummarizer" },
    { href: "/newsletter", key: "footer.newsletterLink" },
    { href: "/rss.xml", key: "footer.rssFeed" },
  ];

  const companyLinks = [
    { href: "/about", key: "footer.about" },
    { href: "/contact", key: "footer.contact" },
    { href: "/privacy", key: "footer.privacy" },
    { href: "/disclaimer", key: "footer.disclaimer" },
    { href: "/terms", key: "footer.terms" },
  ];

  const sections: Record<string, { href: string; key: string }[]> = {};
  sections[t("footer.news")] = newsLinks;
  sections[t("footer.toolsHeading")] = toolLinks;
  sections[t("footer.company")] = companyLinks;

  return (
    <footer className="border-t-2 border-[var(--signal)]/20 bg-gradient-to-b from-[var(--bg)] to-[var(--bg-elevated)]">
      <div className="container-wide px-4 py-16">
        <div className="grid gap-12 md:grid-cols-[1.8fr_2fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/logo.svg" alt={config.brandName} width={40} height={40} />
              <span className="font-display text-2xl font-bold bg-gradient-to-r from-[var(--ink)] to-[var(--signal)] bg-clip-text text-transparent">
                {config.brandName}
              </span>
            </Link>
            <p className="mt-5 max-w-[360px] text-[14px] leading-7 text-[var(--ink-muted)]">
              {t("footer.tagline")}
            </p>
            <a
              href="mailto:editorial@quickgist.news"
              className="mt-4 inline-block text-[12px] font-semibold text-[var(--signal)] hover:underline"
            >
              editorial@quickgist.news
            </a>
            <p className="mt-8 text-[12px] text-[var(--ink-faint)]">
              {t("footer.copyright", { year: new Date().getFullYear().toString() })}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
            {Object.entries(sections).map(([heading, items]) => (
              <div key={heading}>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--ink-faint)]">
                  {heading}
                </h3>
                <ul className="mt-4 grid gap-3">
                  {items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="text-[14px] text-[var(--ink-muted)] transition hover:text-[var(--ink)]"
                      >
                        {t(item.key)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] bg-gradient-to-r from-transparent via-[var(--signal)]/10 to-transparent pt-6 text-[12px] text-[var(--ink-faint)]">
          <p>{t("footer.verifiedSources")}</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-[var(--ink-muted)] transition">
              {t("footer.privacy")}
            </Link>
            <Link href="/terms" className="hover:text-[var(--ink-muted)] transition">
              {t("footer.terms")}
            </Link>
            <Link href="/disclaimer" className="hover:text-[var(--ink-muted)] transition">
              {t("footer.disclaimer")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

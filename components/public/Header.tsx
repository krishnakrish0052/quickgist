import Link from "next/link";
import Image from "next/image";
import { cookies, headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { config } from "@/lib/config";
import { ThemeToggle } from "@/components/public/ThemeToggle";
import { LocaleSwitcher } from "@/components/public/LocaleSwitcher";
import { locales, countryToLocale, LOCALE_COOKIE, defaultLocale, type Locale } from "@/i18n/routing";

const nav = [
  { href: "/", key: "nav.latest" },
  { href: "/trending", key: "nav.trending" },
  { href: "/category/world", key: "nav.world" },
  { href: "/category/business", key: "nav.business" },
  { href: "/category/technology", key: "nav.technology" },
  { href: "/category/science", key: "nav.science" },
];

async function resolveCurrentLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value as Locale | undefined;
  if (fromCookie && locales.includes(fromCookie)) return fromCookie;
  const country = headerStore.get("x-vercel-ip-country") ?? headerStore.get("cf-ipcountry");
  if (country) {
    const mapped = countryToLocale[country.toUpperCase()];
    if (mapped) return mapped;
  }
  return defaultLocale;
}

function isActiveLink(href: string, currentPath: string): boolean {
  if (href === "/") return currentPath === "/";
  return currentPath === href || currentPath.startsWith(href + "/");
}

export async function PublicHeader() {
  const locale = await resolveCurrentLocale();
  const t = await getTranslations();
  const cookieStore = await cookies();
  const headerStore = await headers();
  const theme = cookieStore.get("quickgist_theme")?.value ?? "dark";
  const currentPath = headerStore.get("x-pathname") ?? headerStore.get("x-invoke-path") ?? "";

  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const navLabels = nav.map((item) => ({
    ...item,
    label: t(item.key),
  }));

  return (
    <header className="sticky top-0 z-40">
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--signal)]/30 to-transparent" />
      <div className="glass-surface-strong border-b border-[var(--line)] bg-gradient-to-r from-[var(--bg-elevated)] via-[var(--bg)] to-[var(--bg-elevated)]">
        <div className="edition-bar hidden border-b border-[var(--line)] md:block">
          <div className="container-wide flex items-center justify-between px-4 py-1.5">
            <span className="text-sm text-[var(--ink-muted)]">{date}</span>
            <span className="text-sm text-[var(--ink-muted)]">{t("nav.tagline")}</span>
          </div>
        </div>
        <div className="container-wide flex min-h-[68px] items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative shrink-0">
              <Image src="/logo.svg" alt={config.brandName} width={38} height={38} priority className="shrink-0 transition-transform duration-400 group-hover:scale-105" />
              <div className="absolute -inset-1 rounded-full bg-signal/10 blur-md opacity-0 transition duration-400 group-hover:opacity-100" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-[1.4rem] font-bold tracking-tight bg-gradient-to-r from-[var(--ink)] to-[var(--signal)] bg-clip-text text-transparent">
                {config.brandName}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] bg-gradient-to-r from-[var(--signal)] to-[var(--signal-deep)] bg-clip-text text-transparent mt-0.5">
                {t("nav.independentVerified")}
              </span>
            </div>
          </Link>

          <nav className="hidden items-center lg:flex">
            {navLabels.map((item) => {
              const active = isActiveLink(item.href, currentPath);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-4 py-2 text-[14px] font-semibold transition-colors duration-200 hover:text-[var(--ink)] ${
                    active
                      ? "text-[var(--ink)]"
                      : "text-[var(--ink-soft)]"
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute bottom-0 left-4 right-4 h-[2px] bg-gradient-to-r from-[var(--signal)] to-[var(--signal-deep)] rounded-full transition-all duration-300 ${
                      active
                        ? "opacity-100 scale-x-100"
                        : "opacity-0 scale-x-0 hover:opacity-60 hover:scale-x-100"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle initial={theme} />
            <LocaleSwitcher currentLocale={locale} />
            <Link
              href="/newsletter"
              className="magnetic-btn magnetic-btn-primary hidden sm:inline-flex text-[14px]"
            >
              {t("nav.subscribe")}
            </Link>
          </div>
        </div>
      </div>

      <div className="border-b border-[var(--line)] glass-surface lg:hidden">
        <div className="container-wide flex items-center gap-0 overflow-x-auto px-4 scrollbar-none">
          {navLabels.map((item) => {
            const active = isActiveLink(item.href, currentPath);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 border-b-2 px-3 py-2.5 text-[13px] font-semibold transition-all duration-200 ${
                  active
                    ? "border-transparent text-[var(--ink)]"
                    : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink)]"
                }`}
                style={
                  active
                    ? {
                        borderImage: "linear-gradient(to right, var(--signal), var(--signal-deep)) 1",
                      }
                    : undefined
                }
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}

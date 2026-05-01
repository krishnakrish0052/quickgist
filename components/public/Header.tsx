import Link from "next/link";
import Image from "next/image";
import { cookies, headers } from "next/headers";
import { config } from "@/lib/config";
import { LocaleSwitcher } from "@/components/public/LocaleSwitcher";
import { locales, countryToLocale, LOCALE_COOKIE, defaultLocale, type Locale } from "@/i18n/routing";

const nav = [
  { href: "/", label: "Latest" },
  { href: "/trending", label: "Trending" },
  { href: "/category/world", label: "World" },
  { href: "/category/business", label: "Business" },
  { href: "/category/technology", label: "Tech" },
  { href: "/category/science", label: "Science" }
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

function EditionBar() {
  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
  return (
    <div className="edition-bar hidden border-b border-white/10 md:block">
      <div className="container-wide flex items-center justify-between px-4 py-1.5">
        <span className="text-white/50">{date}</span>
        <span className="text-white/50">Independent news · Verified sources</span>
      </div>
    </div>
  );
}

export async function PublicHeader() {
  const locale = await resolveCurrentLocale();

  return (
    <header className="sticky top-0 z-40 shadow-[0_1px_0_0_rgba(15,15,16,0.08)]">
      {/* Masthead */}
      <div className="bg-ink">
        <EditionBar />
        <div className="container-wide flex min-h-[62px] items-center justify-between gap-4 px-4 py-3">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image src="/logo.svg" alt={config.brandName} width={38} height={38} priority className="shrink-0" />
            <div className="flex flex-col leading-none">
              <span className="font-display text-[1.35rem] font-bold tracking-tight text-white">
                {config.brandName}
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/40 mt-0.5">
                Independent · Verified
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center lg:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3.5 py-2 text-[13px] font-semibold text-white/65 transition hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <LocaleSwitcher currentLocale={locale} />
            <Link
              href="/newsletter"
              className="hidden items-center gap-2 rounded-full bg-signal px-4 py-2 text-[13px] font-bold text-white transition hover:bg-[#b03a0a] sm:inline-flex"
            >
              Subscribe
            </Link>
          </div>
        </div>
      </div>

      {/* Category nav bar */}
      <div className="border-b border-line bg-white/95 backdrop-blur-sm">
        <div className="container-wide flex items-center gap-0 overflow-x-auto px-4 scrollbar-none">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 border-b-2 border-transparent px-3 py-2.5 text-[12px] font-semibold text-ink/60 transition hover:border-signal hover:text-ink lg:hidden"
            >
              {item.label}
            </Link>
          ))}
          <div className="ml-auto hidden shrink-0 items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/40 lg:flex py-2.5">
            <span>All stories verified from multiple sources</span>
          </div>
        </div>
      </div>
    </header>
  );
}

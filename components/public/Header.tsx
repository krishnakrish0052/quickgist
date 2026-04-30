import Link from "next/link";
import { cookies, headers } from "next/headers";
import Image from "next/image";
import { config } from "@/lib/config";
import { LocaleSwitcher } from "@/components/public/LocaleSwitcher";
import { locales, countryToLocale, LOCALE_COOKIE, defaultLocale, type Locale } from "@/i18n/routing";

const nav = [
  { href: "/", label: "Latest" },
  { href: "/trending", label: "Trending" },
  { href: "/category/world", label: "World" },
  { href: "/category/business", label: "Business" },
  { href: "/category/technology", label: "Tech" },
  { href: "/tools", label: "Tools" }
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

export async function PublicHeader() {
  const locale = await resolveCurrentLocale();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="container-wide flex min-h-16 items-center justify-between gap-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.svg" alt={config.brandName} width={36} height={36} priority />
          <span className="font-display text-xl font-bold tracking-tight text-ink">
            {config.brandName}
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-ink/75 transition hover:bg-white hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <LocaleSwitcher currentLocale={locale} />
          <Link
            href="/newsletter"
            className="hidden items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper transition hover:bg-signal sm:inline-flex"
          >
            Subscribe
          </Link>
        </div>
      </div>
    </header>
  );
}

"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { locales, localeFlags, localeNames, LOCALE_COOKIE, type Locale } from "@/i18n/routing";

interface LocaleSwitcherProps {
  currentLocale: string;
}

export function LocaleSwitcher({ currentLocale }: LocaleSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as Locale;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    startTransition(() => router.refresh());
  }

  return (
    <div className="relative flex items-center gap-1">
      <span className="text-base leading-none">{localeFlags[currentLocale as Locale] ?? "🌐"}</span>
      <select
        value={currentLocale}
        onChange={handleChange}
        disabled={isPending}
        aria-label="Select language"
        className="cursor-pointer appearance-none bg-transparent py-1 pl-0.5 pr-4 text-xs font-semibold text-ink/70 hover:text-ink focus:outline-none"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%230f0f10'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 0 center" }}
      >
        {locales.map((locale) => (
          <option key={locale} value={locale}>
            {localeNames[locale]}
          </option>
        ))}
      </select>
    </div>
  );
}

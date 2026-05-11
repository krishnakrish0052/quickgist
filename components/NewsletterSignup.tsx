"use client";

import { useTranslations } from "next-intl";
import { MailPlus } from "lucide-react";
import { subscribeAction } from "@/app/(public)/actions";

export function NewsletterSignup({ topic = "top-stories" }: { topic?: string }) {
  const t = useTranslations("newsletter");

  return (
    <form action={subscribeAction} className="rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] p-5 shadow-sm">
      <input type="hidden" name="topic" value={topic} />
      <div className="flex items-center gap-2 font-semibold text-[var(--ink)]">
        <MailPlus size={18} />
        {t("heading")}
      </div>
      <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
        {t("subheading")}
      </p>
      <div className="mt-4 flex gap-2">
        <input
          name="email"
          type="email"
          required
          placeholder={t("placeholder")}
          className="min-w-0 flex-1 rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm outline-none ring-signal/20 focus:ring-4"
        />
        <button className="rounded-md bg-[var(--bg-elevated)] px-4 py-2 text-sm font-semibold text-[var(--ink)]">{t("cta")}</button>
      </div>
    </form>
  );
}

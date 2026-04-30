import { MailPlus } from "lucide-react";
import { subscribeAction } from "@/app/(public)/actions";

export function NewsletterSignup({ topic = "top-stories" }: { topic?: string }) {
  return (
    <form action={subscribeAction} className="rounded-md border border-line bg-white p-5 shadow-sm">
      <input type="hidden" name="topic" value={topic} />
      <div className="flex items-center gap-2 font-semibold text-ink">
        <MailPlus size={18} />
        Daily brief
      </div>
      <p className="mt-2 text-sm leading-6 text-ink/65">
        Topic tracker foundation: subscribers are stored with preferred topics for later personalization.
      </p>
      <div className="mt-4 flex gap-2">
        <input
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="min-w-0 flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm outline-none ring-signal/20 focus:ring-4"
        />
        <button className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white">Join</button>
      </div>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key, next })
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setError(body.error === "invalid_key" ? "Incorrect key." : "Could not sign in.");
        setPending(false);
        return;
      }
      const data = (await response.json()) as { next?: string };
      router.push(data.next ?? next ?? "/admin");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-line bg-white p-6 shadow-soft">
      <label className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/55" htmlFor="admin-key">
        Admin API key
      </label>
      <input
        id="admin-key"
        type="password"
        autoComplete="current-password"
        value={key}
        onChange={(event) => setKey(event.target.value)}
        required
        className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-3 text-sm outline-none focus:border-ink"
        placeholder="••••••••••"
      />
      {error ? <p className="mt-3 text-sm text-alert">{error}</p> : null}
      <button
        type="submit"
        disabled={pending || !key}
        className="mt-4 w-full rounded-md bg-ink px-4 py-3 text-sm font-semibold text-paper transition hover:bg-signal disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

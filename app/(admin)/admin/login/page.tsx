"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin";
  const [key, setKey] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key, next })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error === "invalid_key" ? "Invalid admin key." : "Sign-in failed.");
        return;
      }
      router.push(next);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4">
      <div className="w-full max-w-md rounded-xl border border-line bg-white p-8 shadow-soft">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-ink text-white">
            <ShieldCheck size={18} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/60">QuickGist COS</p>
            <h1 className="text-xl font-semibold text-ink">Operator console</h1>
          </div>
        </div>
        <p className="mb-6 text-sm leading-6 text-ink/70">
          The operations dashboard, review queue, and pipeline controls are restricted. Enter your admin key to
          continue. The public site at{" "}
          <a href="/" className="link">
            quickgist.local
          </a>{" "}
          remains accessible without auth.
        </p>
        <form onSubmit={handleSubmit} className="grid gap-3">
          <label className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/60">Admin key</label>
          <div className="flex items-center gap-2 rounded-md border border-line bg-paper px-3 py-2">
            <LockKeyhole size={16} className="text-ink/60" />
            <input
              autoFocus
              type="password"
              value={key}
              onChange={(event) => setKey(event.target.value)}
              placeholder="dev-admin-key"
              className="flex-1 bg-transparent text-sm outline-none"
              disabled={pending}
            />
          </div>
          {error ? <p className="text-sm text-alert">{error}</p> : null}
          <button
            type="submit"
            disabled={pending || !key}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}

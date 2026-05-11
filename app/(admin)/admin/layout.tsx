import Link from "next/link";
import { cookies } from "next/headers";
import { ShieldCheck, ExternalLink } from "lucide-react";
import { AdminNav } from "@/components/AdminNav";
import { AdminSignOut } from "@/components/AdminSignOut";
import { PipelineStatusBar } from "@/components/PipelineStatusBar";

export const metadata = {
  title: "QuickGist COS — Operator Console",
  robots: { index: false, follow: false }
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const authed = Boolean(cookies().get("quickgist_admin")?.value);

  if (!authed) {
    // Login page renders without chrome. Other admin pages get redirected by middleware.
    return <div className="admin-shell">{children}</div>;
  }

  return (
    <div className="admin-shell">
      <div className="grid min-h-screen grid-cols-[260px_1fr]">
        <aside className="border-r border-[var(--line)] bg-[var(--bg-elevated)]">
          <div className="flex items-center gap-3 border-b border-[var(--line)] px-5 py-5">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-[var(--bg-elevated)] text-[var(--ink)]">
              <ShieldCheck size={18} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-faint)]">QuickGist COS</p>
              <p className="text-sm font-semibold text-[var(--ink)]">Operator Console</p>
            </div>
          </div>
          <div className="px-3 py-4">
            <AdminNav orientation="vertical" />
          </div>
          <div className="mt-2 border-t border-[var(--line)] px-3 py-4">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--ink-soft)] hover:bg-[var(--bg)] hover:text-[var(--ink)]"
            >
              <ExternalLink size={14} />
              View public site
            </Link>
            <AdminSignOut />
          </div>
        </aside>
        <main className="min-h-screen overflow-x-auto">
          <div className="px-8 py-8">{children}</div>
        </main>
      </div>
      <PipelineStatusBar />
    </div>
  );
}

import Link from "next/link";
import { cookies } from "next/headers";
import { ShieldCheck, ExternalLink } from "lucide-react";
import { AdminNav } from "@/components/AdminNav";
import { AdminSignOut } from "@/components/AdminSignOut";

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
        <aside className="border-r border-line bg-white">
          <div className="flex items-center gap-3 border-b border-line px-5 py-5">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-ink text-white">
              <ShieldCheck size={18} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/55">QuickGist COS</p>
              <p className="text-sm font-semibold text-ink">Operator Console</p>
            </div>
          </div>
          <div className="px-3 py-4">
            <AdminNav orientation="vertical" />
          </div>
          <div className="mt-2 border-t border-line px-3 py-4">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-ink/70 hover:bg-paper hover:text-ink"
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
    </div>
  );
}

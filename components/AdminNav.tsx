"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Cpu,
  Database,
  Eye,
  FileCheck2,
  GitBranch,
  HeartPulse,
  Inbox,
  Mail,
  Newspaper
} from "lucide-react";

const items = [
  { href: "/admin", label: "Dashboard", icon: Activity },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/sources", label: "Sources", icon: Database },
  { href: "/admin/topics", label: "Topics", icon: GitBranch },
  { href: "/admin/reviews", label: "Reviews", icon: Inbox },
  { href: "/admin/quality", label: "Quality", icon: FileCheck2 },
  { href: "/admin/distribution", label: "Distribution", icon: Newspaper },
  { href: "/admin/subscribers", label: "Subscribers", icon: Mail },
  { href: "/admin/monitor", label: "Monitor", icon: Eye },
  { href: "/admin/mcp", label: "MCP", icon: Cpu },
  { href: "/admin/monitoring", label: "Monitoring", icon: Activity },
  { href: "/admin/health", label: "Health", icon: HeartPulse }
];

export function AdminNav({ orientation = "horizontal" }: { orientation?: "horizontal" | "vertical" }) {
  const pathname = usePathname();
  const wrapperClass =
    orientation === "vertical" ? "grid gap-1" : "mb-6 flex flex-wrap gap-2";
  return (
    <nav className={wrapperClass} aria-label="Admin navigation">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
        const itemClass =
          orientation === "vertical"
            ? `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-[var(--bg-elevated)] text-[var(--ink)]"
                  : "text-[var(--ink-soft)] hover:bg-[var(--bg-elevated)] hover:text-[var(--ink)]"
              }`
            : `inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition ${
                active
                  ? "border-ink bg-[var(--bg-elevated)] text-[var(--ink)]"
                  : "border-[var(--line)] bg-[var(--bg-elevated)] text-[var(--ink-soft)] hover:text-[var(--ink)]"
              }`;
        return (
          <Link key={item.href} href={item.href} className={itemClass}>
            <Icon size={15} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Database,
  FileCheck2,
  GitBranch,
  HeartPulse,
  Inbox,
  Mail,
  Newspaper
} from "lucide-react";

const items = [
  { href: "/admin", label: "Dashboard", icon: Activity },
  { href: "/admin/sources", label: "Sources", icon: Database },
  { href: "/admin/topics", label: "Topics", icon: GitBranch },
  { href: "/admin/reviews", label: "Reviews", icon: Inbox },
  { href: "/admin/quality", label: "Quality", icon: FileCheck2 },
  { href: "/admin/distribution", label: "Distribution", icon: Newspaper },
  { href: "/admin/subscribers", label: "Subscribers", icon: Mail },
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
                  ? "bg-ink text-white"
                  : "text-ink/70 hover:bg-white hover:text-ink"
              }`
            : `inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition ${
                active
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-white text-ink/75 hover:text-ink"
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

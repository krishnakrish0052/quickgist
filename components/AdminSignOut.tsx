"use client";

import { LogOut } from "lucide-react";

export function AdminSignOut() {
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/admin/session", { method: "DELETE" });
        window.location.href = "/admin/login";
      }}
      className="mt-1 inline-flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-ink/70 hover:bg-paper hover:text-ink"
    >
      <LogOut size={14} />
      Sign out
    </button>
  );
}

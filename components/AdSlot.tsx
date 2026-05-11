"use client";

import { useEffect, useRef } from "react";

interface AdSlotProps {
  /** Ad unit label for identification */
  label?: string;
  /** Ad format: banner, rectangle, or native */
  format?: "banner" | "rectangle" | "native";
  /** Google AdSense slot ID (set via env var or pass directly) */
  slotId?: string;
}

/**
 * AdSense-compatible ad slot with responsive sizing and lazy loading.
 * Falls back to a placeholder when AdSense is not configured.
 */
export function AdSlot({ label = "Advertisement", format = "rectangle", slotId }: AdSlotProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const adClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? process.env.NEXT_PUBLIC_ADSENSE_ID ?? "";
  const hasAdSense = adClient.length > 0 && (slotId ?? "").length > 0;

  useEffect(() => {
    if (!hasAdSense || !adRef.current) return;
    try {
      // Push the ad after component mounts (lazy load)
      const win = window as unknown as Record<string, unknown>;
      (win.adsbygoogle = (win.adsbygoogle ?? []) as unknown[]).push({});
    } catch {
      // AdBlock or script not loaded — safe fallback
    }
  }, [hasAdSense]);

  const dimensions =
    format === "banner"
      ? { minH: "90px", className: "ad-banner" }
      : format === "native"
        ? { minH: "120px", className: "ad-native" }
        : { minH: "250px", className: "ad-rectangle" };

  if (!hasAdSense) {
    return (
      <div
        className={`flex min-h-[${dimensions.minH}] items-center justify-center rounded-md border border-dashed border-[var(--line)] bg-[var(--bg-elevated)]/60 px-4 text-xs font-medium uppercase tracking-[0.14em] text-[var(--ink-muted)]`}
      >
        {label}
      </div>
    );
  }

  return (
    <div ref={adRef} className={`ad-container my-6 ${dimensions.className}`}>
      <ins
        className="adsbygoogle block w-full"
        style={{ display: "block", minHeight: dimensions.minH }}
        data-ad-client={adClient}
        data-ad-slot={slotId}
        data-ad-format={format === "banner" ? "auto" : "rectangle"}
        data-full-width-responsive="true"
      />
    </div>
  );
}

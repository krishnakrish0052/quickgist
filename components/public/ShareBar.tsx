"use client";

import { useState } from "react";
import { Link2, Share2, Check } from "lucide-react";

export function ShareBar({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const shareText = encodeURIComponent(title);
  const shareUrl = encodeURIComponent(url);

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-[var(--ink-muted)] transition hover:bg-[var(--bg-raft)] hover:text-[var(--ink)]"
        aria-label="Copy link"
      >
        {copied ? <Check size={14} className="text-green-500" /> : <Link2 size={14} />}
        {copied ? "Copied" : "Copy"}
      </button>
      <a
        href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-[var(--ink-muted)] transition hover:bg-[var(--bg-raft)] hover:text-[var(--ink)]"
        aria-label="Share on X"
      >
        <Share2 size={14} />
        Share
      </a>
    </div>
  );
}

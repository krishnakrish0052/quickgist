"use client";

import { useState } from "react";
import { Copy, Check, Linkedin, MessageCircle, Send, Twitter } from "lucide-react";

interface ShareBarProps {
  url: string;
  title: string;
}

export function ShareBar({ url, title }: ShareBarProps) {
  const [copied, setCopied] = useState(false);
  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const shareLinks = [
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encoded}`,
      Icon: Twitter
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
      Icon: Linkedin
    },
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${encoded}&text=${encodedTitle}`,
      Icon: Send
    },
    {
      label: "WhatsApp",
      href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encoded}`,
      Icon: MessageCircle
    }
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {shareLinks.map(({ label, href, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={`Share on ${label}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-ink/75 transition hover:border-ink hover:text-ink"
        >
          <Icon size={15} />
        </a>
      ))}
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            /* ignore */
          }
        }}
        aria-label="Copy link"
        className="inline-flex h-9 items-center gap-2 rounded-full border border-line bg-white px-3 text-xs font-medium text-ink/75 transition hover:border-ink hover:text-ink"
      >
        {copied ? <Check size={14} className="text-accent" /> : <Copy size={14} />}
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}

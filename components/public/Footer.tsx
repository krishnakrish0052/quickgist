import Link from "next/link";
import Image from "next/image";
import { config } from "@/lib/config";

const links = {
  News: [
    { href: "/", label: "Latest" },
    { href: "/trending", label: "Trending" },
    { href: "/category/world", label: "World" },
    { href: "/category/business", label: "Business" },
    { href: "/category/technology", label: "Technology" },
    { href: "/category/science", label: "Science" }
  ],
  Tools: [
    { href: "/tools", label: "Free tools" },
    { href: "/tools/summarize", label: "Article summarizer" },
    { href: "/newsletter", label: "Newsletter" },
    { href: "/rss.xml", label: "RSS feed" }
  ],
  Company: [
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "/privacy", label: "Privacy policy" },
    { href: "/disclaimer", label: "Disclaimer" },
    { href: "/terms", label: "Terms of service" }
  ]
};

export function PublicFooter() {
  return (
    <footer className="border-t border-line bg-ink text-white/60">
      <div className="container-wide px-4 py-14">
        <div className="grid gap-12 md:grid-cols-[1.8fr_2fr]">
          {/* Brand col */}
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/logo.svg" alt={config.brandName} width={38} height={38} />
              <span className="font-display text-xl font-bold text-white">{config.brandName}</span>
            </Link>
            <p className="mt-4 max-w-[320px] text-[13px] leading-7 text-white/45">
              Independent news verified from multiple sources, delivered with editorial clarity.
              No noise, no filler — just the stories that matter.
            </p>
            <div className="mt-5 flex gap-3">
              <a href="mailto:editorial@quickgist.news" className="text-[11px] font-semibold text-signal hover:underline">
                editorial@quickgist.news
              </a>
            </div>
            <p className="mt-6 text-[11px] text-white/25">
              © {new Date().getFullYear()} {config.brandName}. All rights reserved.
            </p>
          </div>

          {/* Links grid */}
          <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
            {Object.entries(links).map(([heading, items]) => (
              <div key={heading}>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{heading}</h3>
                <ul className="mt-4 grid gap-2.5">
                  {items.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className="text-[13px] text-white/50 transition hover:text-white">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/8 pt-6 text-[11px] text-white/25">
          <p>Stories verified from multiple independent sources before publication.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white/60 transition">Privacy</Link>
            <Link href="/terms" className="hover:text-white/60 transition">Terms</Link>
            <Link href="/disclaimer" className="hover:text-white/60 transition">Disclaimer</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

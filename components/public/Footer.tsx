import Link from "next/link";
import Image from "next/image";
import { config } from "@/lib/config";

const links = {
  Site: [
    { href: "/", label: "Latest" },
    { href: "/trending", label: "Trending" },
    { href: "/tools", label: "Tools" },
    { href: "/newsletter", label: "Newsletter" }
  ],
  Categories: [
    { href: "/category/world", label: "World" },
    { href: "/category/business", label: "Business" },
    { href: "/category/technology", label: "Technology" },
    { href: "/category/science", label: "Science" }
  ],
  Company: [
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "/privacy", label: "Privacy" },
    { href: "/disclaimer", label: "Disclaimer" },
    { href: "/terms", label: "Terms" }
  ]
};

export function PublicFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-white">
      <div className="container-wide grid gap-10 px-4 py-14 lg:grid-cols-[1.5fr_2fr]">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.svg" alt={config.brandName} width={36} height={36} />
            <span className="font-display text-xl font-bold tracking-tight text-ink">
              {config.brandName}
            </span>
          </Link>
          <p className="mt-4 max-w-md text-sm leading-7 text-ink/65">
            Trending stories, distilled from multiple sources, reviewed for quality, and delivered with explainers
            and SEO-ready packaging. Read fast, understand deeply.
          </p>
          <p className="mt-3 text-xs text-ink/45">
            © {new Date().getFullYear()} {config.brandName}. All rights reserved.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
          {Object.entries(links).map(([heading, items]) => (
            <div key={heading}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/55">{heading}</h3>
              <ul className="mt-3 grid gap-2">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-sm text-ink/75 hover:text-ink">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}

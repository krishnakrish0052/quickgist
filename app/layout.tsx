import type { Metadata } from "next";
import { Inter, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import { config } from "@/lib/config";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
  axes: ["opsz"]
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(config.siteUrl),
  title: {
    default: `${config.brandName} — Source-grounded news, simplified`,
    template: `%s | ${config.brandName}`
  },
  description:
    "Trending stories, distilled from multiple sources, reviewed for quality, and delivered with explainers, social packs, and SEO-ready packaging.",
  applicationName: config.brandName,
  authors: [{ name: `${config.brandName} editorial` }],
  keywords: ["news", "world news", "trending stories", "explainers", "technology", "business", "science"],
  openGraph: {
    type: "website",
    siteName: config.brandName,
    url: config.siteUrl,
    title: `${config.brandName} — Source-grounded news`,
    description: "Trending stories distilled from multiple sources, fact-checked and delivered with in-depth explainers."
  },
  twitter: {
    card: "summary_large_image",
    title: config.brandName,
    description: "Breaking stories and explainers from trusted global sources, curated by QuickGist editors."
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${sourceSerif.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">{children}</body>
    </html>
  );
}

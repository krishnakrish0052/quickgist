import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { config } from "@/lib/config";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
  axes: ["opsz"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(config.siteUrl),
  title: {
    default: `${config.brandName} — Source-grounded news, simplified`,
    template: `%s | ${config.brandName}`,
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
    description: "Trending stories distilled from multiple sources, fact-checked and delivered with in-depth explainers.",
  },
  twitter: {
    card: "summary_large_image",
    title: config.brandName,
    description: "Breaking stories and explainers from trusted global sources, curated by QuickGist editors.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const theme = cookieStore.get("quickgist_theme")?.value ?? "dark";
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${inter.variable} ${sourceSerif.variable} ${jetbrainsMono.variable} ${theme === "light" ? "light" : ""}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=document.cookie.split("; ").find(function(r){return r.startsWith("quickgist_theme=")});var m=t?t.split("=")[1]:"dark";document.documentElement.classList.toggle("light",m==="light")}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-screen bg-[var(--bg)] font-sans text-[var(--ink)] antialiased">
        <div className="grain-overlay" aria-hidden="true" />
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

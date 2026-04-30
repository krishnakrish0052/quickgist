# QuickGist COS — Phase-2 Upgrade Plan

## Why this round

The Phase-1 release ([COMPLETE_PLAN](../README.md)) gave us the skeleton: separation of public / admin / MCP, confidence-routed quality gate, 20 MCP tools, no-Docker setup. The user's review on 2026-04-28 surfaced six gaps that block the product from feeling like a real Content Operating Service:

1. **MCP isn't actually exercised end-to-end** — only via local smoke scripts; never tested with real generation cycles.
2. **UI is "basic"** — needs animation, motion design, scroll-driven transitions worthy of the magazine framing.
3. **Content isn't real news** — the seed feeds are demo data; we need true RSS ingestion against major newsrooms.
4. **No multi-language / country awareness** — every reader sees the same English copy regardless of locale.
5. **Not autonomous** — the pipeline only runs when triggered. The "operating service" framing demands a scheduler.
6. **Article quality** — needs to read 100% human and be SEO-perfect, not just pass a structural check.

This plan adapts current best-practice research (RSS sources, next-intl routing, motion library, NewsArticle schema, Anthropic prompt engineering, MCP scheduler patterns) to ship those gaps as a coherent upgrade.

## Phase A — Real news ingestion

**Goal:** the homepage shows genuine breaking news from named publishers, not seed fixtures.

### What ships

- **RSS sources file** — `lib/sources/curated.ts` with 25+ free RSS feeds across categories: BBC World, Al Jazeera, NPR, Hacker News (tech), TechCrunch, The Verge, Ars Technica, Reuters via Google News, Reddit `/r/worldnews`, `/r/technology`, `/r/science`, etc.
- **Real RSS fetcher** — extend [lib/services/ingestion.ts](../lib/services/ingestion.ts) to actually call `rss-parser` against each source on every ingest. Parse, dedupe by URL hash, extract image from `<media:content>` / `<enclosure>` / OG-image fallback.
- **HTML cleanup** — strip tags, decode entities, normalize whitespace before persisting.
- **Per-source rate limiting** — exponential backoff so we don't hammer any one publisher.
- **Default seed flips to real** — `npm run pipeline:local` ingests live RSS by default; the synthetic seed is only used when `OFFLINE=1`.

### Files

- New: `lib/sources/curated.ts`, `lib/utils/htmlClean.ts`
- Edit: [lib/services/ingestion.ts](../lib/services/ingestion.ts), [lib/seed.ts](../lib/seed.ts), [scripts/db-seed.ts](../scripts/db-seed.ts)

## Phase B — Advanced humanization & SEO-perfect content

**Goal:** every published article reads like a human staff writer wrote it, ranks for its target keyword, and meets all Google Helpful Content signals.

### Approach

A **multi-pass synthesis pipeline** instead of a single `routeAiTask`:

1. **Pass 1 — Extract** — pull raw fact claims from sources (already exists, sharpen).
2. **Pass 2 — Outline** — produce a 4–6 section outline targeting the primary keyword.
3. **Pass 3 — Draft** — write the article with explicit cadence rules (mix 8–15–25-word sentences, alternate paragraph lengths).
4. **Pass 4 — Humanize** — vary openers, inject rhetorical questions, transitional phrases ("That said,", "Here's what changed,"), kill AI tropes.
5. **Pass 5 — SEO optimize** — re-check keyword density, internal link injection, FAQ append, meta tag tighten.
6. **Pass 6 — Quality gate** — confidence score; on regenerate, retry with a different prompt variant.

### Anti-AI-trope filter

Hard-block list expanded: "in today's fast-paced world", "delve into", "navigate the", "in the realm of", "tapestry of", "stand as a testament", "moreover, furthermore" stacks, "it's important to note", semicolons-on-every-line, em-dash overuse.

### Cadence engine

A small TS utility (`lib/text/cadence.ts`) that:
- splits the draft into sentences
- measures average sentence length and stddev (burstiness)
- if stddev < 5 words, rewrites the longest 3 sentences as 2 short ones each
- enforces ≥ 1 question, ≥ 2 contractions, ≥ 1 short paragraph (1–2 sentences) per article

### Files

- New: `lib/text/cadence.ts`, `lib/text/humanizer.ts`, `lib/prompts/v2.ts` (multi-pass templates)
- Edit: [lib/services/generation.ts](../lib/services/generation.ts), [lib/services/quality.ts](../lib/services/quality.ts)

## Phase C — Site-wide SEO

**Goal:** every page (not just `/news/[slug]`) is fully SEO-optimized — metadata, JSON-LD schema, OG images, internal links, hreflang.

### What ships

- **Per-page `generateMetadata`** for: home, category, trending, tools, newsletter, all policy pages, ELI5.
- **JSON-LD schema** added to every page type:
  - Home: `WebSite` + `Organization` + `ItemList` for top stories
  - Article: `NewsArticle` (already exists, expand with `image`, `wordCount`, `articleSection`, `keywords`)
  - Category: `CollectionPage` + `BreadcrumbList`
  - Explainer: `Article` + `FAQPage`
  - About: `AboutPage`
  - Newsletter: `WebPage`
- **Dynamic OG images** — `/og/[slug]/route.tsx` using `next/og` to render branded social cards on demand.
- **Sitemap with hreflang** — `app/sitemap.ts` lists every URL × locale and includes `<xhtml:link rel="alternate" hreflang="…"/>`.
- **Internal link auto-injection** — generation pass 5 finds 2–3 published articles that match the new article's tags and inserts inline markdown links.
- **Core Web Vitals** — `next/image` with `priority` only on lead, fonts via `next/font` (replaces the Google Fonts `@import`), no CLS.

### Files

- New: `app/og/[slug]/route.tsx`, `lib/seo/schema.ts` (typed schema builders), `lib/seo/internalLinks.ts`
- Edit: every public page's `generateMetadata`, [app/sitemap.ts](../app/sitemap.ts), [app/robots.ts](../app/robots.ts), [app/globals.css](../app/globals.css) (drop `@import`, switch to `next/font`)

## Phase D — Multi-language with country detection

**Goal:** a reader in Mumbai sees the site in Hindi (or English with India focus), a reader in São Paulo sees Portuguese, a reader in Tokyo sees Japanese.

### Approach

- Adopt **next-intl** (research-recommended, App Router native, ~2KB).
- Restructure routes to `app/(public)/[locale]/...`.
- Locales: `en`, `hi`, `es`, `fr`, `de`, `ja`, `pt`, `ar` (8 to start).
- **Country → locale negotiation** in middleware:
  - `Accept-Language` header parses preferred locale
  - Cookie override (`quickgist_locale`) if user picked manually
  - Fallback: GeoIP via Vercel headers (`x-vercel-ip-country`) → country-to-locale map
- **UI string catalog** — `messages/<locale>.json` for header/footer/buttons. Generated initially via deterministic translation table, replaceable with real Claude translations later.
- **Article translation** — each article has a `translations` JSONB column (`{ locale: { title, dek, contentMarkdown, metaDescription } }`). Translation is opt-in per article; missing translations fall back to English with `<link rel="alternate" hreflang>` pointing to the canonical language.
- **Locale switcher** in header (flag-style picker).

### Files

- New: `i18n/routing.ts`, `i18n/request.ts`, `messages/<locale>.json` × 8, `components/public/LocaleSwitcher.tsx`, `lib/services/translation.ts`
- Edit: [middleware.ts](../middleware.ts) (locale negotiation before admin gate), restructure `app/(public)/` into `app/(public)/[locale]/`, [db/schema.ts](../db/schema.ts) (`articles.translations` jsonb)
- New migration: `db/migrations/002_translations.sql`

## Phase E — Magazine-grade animations

**Goal:** the public site feels alive — scroll-driven reveals, page transitions, magnetic CTAs — without sacrificing performance.

### Library choice

**Motion** (formerly Framer Motion) — research-recommended, 4.5M weekly downloads, native React/Next.js support, hardware-accelerated. Single dependency.

### Animation system

- **Stagger fade-in on scroll** — magazine grid cards animate in as they enter viewport (intersection observer + motion variants).
- **Hero parallax** — lead image moves at 0.7× scroll speed; headline at 0.95×.
- **Page transitions** — soft cross-fade between routes (Next.js `template.tsx` pattern).
- **Magnetic CTAs** — primary buttons subtly track cursor position within 40px radius.
- **Reading progress bar** — already shipped, re-style with `motion.div`.
- **Reveal-on-scroll** primitive — `<Reveal>` wrapper component used across pages.
- **Smooth marquee** for trending ticker on homepage.

### Files

- New: `components/motion/Reveal.tsx`, `Magnetic.tsx`, `Marquee.tsx`, `PageTransition.tsx`, `Parallax.tsx`
- Edit: homepage, article page, category page to wrap key blocks in motion primitives
- New: `app/template.tsx` (page transition wrapper)

## Phase F — Autonomous orchestration

**Goal:** QuickGist runs the pipeline on its own. The MCP server can start/stop autonomous mode, and the operator console shows the next scheduled run.

### Components

- **Embedded scheduler** — `lib/scheduler/cron.ts` using `node-cron`. Runs in-process when MCP HTTP server is up, or as a separate `npm run scheduler` task.
- **Schedule config** — `.env.local` can set `AUTONOMOUS_CRON="0 */2 * * *"` (every 2 hours). Default off.
- **MCP tools added:**
  - `autonomous_start` — kick off the scheduler with optional cron expression
  - `autonomous_stop` — pause the scheduler
  - `autonomous_status` — report next run time, last run summary, current cron
  - `autonomous_run_once` — manually trigger one cycle (alias for `pipeline_run` with autonomous defaults)
  - `translate_article` — translate a published article into a target locale
  - `humanize_article` — re-run the humanizer pass on an existing article
- **Per-locale pipeline mode** — autonomous run iterates the locales list and translates each newly published article.
- **Daily digest** — at 06:00 UTC by default, run `compose_daily_digest` to assemble a top-stories newsletter.

### Files

- New: `lib/scheduler/cron.ts`, `lib/scheduler/state.ts`, `mcp/tools/autonomous.ts`
- Edit: [mcp/server.ts](../mcp/server.ts) to register new tools, [package.json](../package.json) (`node-cron` dep, `npm run scheduler` script)

## Phase G — End-to-end MCP exercise

**Goal:** prove every MCP tool works against real data through a Claude Code session.

### Tasks

1. Start the MCP server in stdio + HTTP modes against a real Postgres-backed instance.
2. Run a deterministic smoke harness that calls **every** registered tool, asserts JSON shape, and prints a pass/fail matrix.
3. Document a "wire QuickGist into your Claude Code" recipe with `claude mcp add` and a sample `.mcp.json`.
4. Capture a transcript of a real `pipeline_run` against live RSS, with the resulting article slug, SEO score, and confidence decision logged to `docs/MCP_SESSION_LOG.md`.

### Files

- New: `tests/mcp-full-smoke.mjs` (drives all 25+ tools), `docs/MCP_SESSION_LOG.md`
- Edit: [docs/MCP_USAGE.md](MCP_USAGE.md) to point at the real session log

## Implementation order

The phases ship in dependency order:

```
A (real news) → B (humanization) → C (site SEO) → E (animations)
                                    ↘
                                     D (i18n) → F (autonomous, per-locale)
                                                  ↘
                                                   G (full MCP test)
```

A and B unblock everything else (without real content, animations and SEO have nothing to render). D depends on the route structure and on a working translation pipeline. F depends on D so autonomous runs can iterate locales.

## Pragmatic scope notes

- **Translation quality**: deterministic translation tables ship first; real Claude-driven translation lands behind a feature flag once we have provider keys configured.
- **Animation performance**: every animation is `prefers-reduced-motion`-aware and disabled below 768px width unless the user opts in.
- **Autonomous safety**: by default the autonomous scheduler runs in dry-run mode. The operator must explicitly POST `/api/admin/autonomous/start` to enable real publishing.
- **Multi-language SEO**: hreflang + canonical pairs are mandatory; we never silently 404 a locale.

## Sources used in this research

- RSS feeds: [Top 100 World News RSS Feeds (Feedspot)](https://rss.feedspot.com/world_news_rss_feeds/), [Most Popular RSS Feeds (RSS.com)](https://rss.com/blog/popular-rss-feeds/)
- i18n: [next-intl App Router guide](https://next-intl.dev/docs/getting-started/app-router), [Next.js Internationalization](https://nextjs.org/docs/app/guides/internationalization)
- Animations: [Motion (Framer Motion)](https://motion.dev), [2026 Motion UI trends](https://lomatechnology.com/blog/motion-ui-trends-2026/2911)
- Humanization: [How to Humanize AI Writing 2026](https://humbot.ai/hub/humanize-ai/how-to-humanize-ai-writing), perplexity/burstiness research
- News SEO: [Next.js JSON-LD guide](https://nextjs.org/docs/app/guides/json-ld), [Structured Data SEO 2026](https://www.digitalapplied.com/blog/structured-data-seo-2026-rich-results-guide)
- Claude prompting: [Anthropic prompt engineering best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- MCP scheduling: [scheduler-mcp by PhialsBasement](https://github.com/PhialsBasement/scheduler-mcp), [MCP for Enterprise (CData, 2026)](https://medium.com/cdata-software/the-definitive-2026-guide-to-implementing-mcp-in-enterprise-environments-d74009a17b07)

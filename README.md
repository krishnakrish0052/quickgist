# QuickGist — Content Operating Service (COS)

QuickGist is a local-first **Content Operating Service**: a magazine-grade public news site, an isolated operator console, and a 25-tool MCP server that drives the editorial pipeline end-to-end — autonomously. No Docker required.

---

## Three surfaces

| Surface | URL | Audience |
|---|---|---|
| **Public site** | `/` | End readers — homepage, articles, ELI5 explainers, trending, free tools, newsletter |
| **Operator console** | `/admin` | Editors / operators — review queue, quality + SEO scoring, distribution scheduler, source inventory. Auth-gated, hidden from search engines |
| **MCP server** | stdio + `:3333/mcp` | Agentic IDEs (Claude Code, Cursor, Windsurf) — 25 tools to drive the full pipeline |

The public site is the product. Admin and MCP are the back-of-house. Users never see them.

---

## What's in the pipeline

1. **Ingest** — 19 curated RSS feeds (BBC, Al Jazeera, NPR, The Guardian, TechCrunch, The Verge, Ars Technica, Hacker News, The Hindu + more). Falls back to seed fixtures when offline.
2. **Cluster** — Jaccard-similarity topic clustering, scored by trend velocity and novelty.
3. **Extract facts** — Only what 2+ sources agree on.
4. **Generate** — Multi-pass article synthesis:
   - Pass 1: Draft from verified facts
   - Pass 2: Cadence analysis (burstiness enforcement, sentence length variety)
   - Pass 3: Humanization (30+ anti-AI-trope filters — no "delve into", no "in today's fast-paced world")
   - Plus: ELI5 explainer + 4-platform social pack + long video script + Shorts script + image prompts + FAQ + meta tags
5. **Score SEO** — Keyword density, title/meta length, Flesch readability, structure, internal links, word count.
6. **Confidence-gate** — `auto_publish` (≥0.85), `human_review` (0.6–0.85), `regenerate` (<0.6).
7. **Publish + distribute** — Telegram / X / LinkedIn / Instagram / Newsletter / RSS.
8. **Autonomous** — Scheduler runs the full cycle on cron (default every 2h), controllable via MCP.

---

## Quick start (no Docker)

```bash
npm install
cp .env.example .env.local
npm run dev                  # public site on http://localhost:3000
```

`STORAGE_DRIVER=memory` and `QUEUE_DRIVER=inline` are default — no PostgreSQL or Redis needed for local development.

To seed real content:

```bash
npm run pipeline:local       # ingest → cluster → generate → quality → publish
```

For persistent storage, install PostgreSQL + Redis natively and set `DATABASE_URL` + `REDIS_URL` in `.env.local`. See [SETUP_AND_CONFIGURATION.md](SETUP_AND_CONFIGURATION.md).

---

## MCP — Drive the pipeline from Claude Code

```bash
npm run mcp:http             # HTTP transport on :3333
# or
npm run mcp:stdio            # stdio transport for Claude Desktop
```

**25 MCP tools** are available — see [docs/MCP_USAGE.md](docs/MCP_USAGE.md).

| Group | Tools |
|---|---|
| Pipeline | `ingest_run`, `trending_detect`, `pipeline_run` |
| Generation | `generate_article`, `generate_eli5_explanation`, `generate_faq_section`, `generate_meta_tags` |
| Social | `generate_social_package`, `generate_twitter_thread` |
| Video | `generate_video_script`, `generate_shorts_script` |
| Image | `generate_image_prompts` |
| SEO | `analyze_seo_score`, `improve_article_seo` |
| Quality | `quality_evaluate`, `publish_article`, `distribution_schedule` |
| Reporting | `ops_snapshot`, `get_top_articles`, `get_content_calendar` |
| **Autonomous** | `autonomous_start`, `autonomous_stop`, `autonomous_status`, `autonomous_run_once` |
| **Humanization** | `humanize_article` |

Smoke-test all 25 tools at once:

```bash
# In one terminal:
STORAGE_DRIVER=memory npm run mcp:http
# In another:
node tests/mcp-full-smoke.mjs
```

---

## Multi-language

The public site auto-detects reader locale from:
1. Cookie (`quickgist_locale`) — user override via the language picker in the header
2. Vercel/Cloudflare GeoIP header (`x-vercel-ip-country` / `cf-ipcountry`)
3. `Accept-Language` HTTP header

Supported: `en` `hi` `es` `fr` `de` `ja` `pt` `ar`

---

## Useful commands

```bash
npm run services:check       # detect Postgres / Redis availability
npm run pipeline:dry-run     # full pipeline, no DB writes
npm run pipeline:local       # full pipeline, write + auto-publish
npm run worker               # BullMQ workers (requires REDIS_URL)
npm run db:migrate           # Drizzle migrations
npm run db:seed              # demo seed data
npm run test                 # vitest unit + integration tests
npm run test:e2e             # Playwright end-to-end
npm run build                # production Next.js build
npm run mcp:http             # MCP HTTP server on :3333
npm run mcp:stdio            # MCP stdio server
```

---

## Admin auth

- Set `ADMIN_API_KEY` in `.env.local`
- Dev default: `dev-admin-key` (when `NODE_ENV !== production`)
- Browser: visit `/admin/login`, paste the key
- API: `x-admin-api-key: <key>` header

Admin routes are `Disallow`-ed in `robots.txt`, excluded from `sitemap.xml`, and never linked from public pages.

---

## Changelog

### Phase 2 — Advanced COS (2026-04-30)

**Real news ingestion (Phase A)**
- 19 curated RSS feeds: BBC, Al Jazeera, NPR, Guardian, TechCrunch, The Verge, Ars Technica, Hacker News, The Hindu
- `lib/sources/curated.ts` — feed registry with reliability scores, country/language metadata
- `lib/utils/htmlClean.ts` — HTML→plaintext stripping, entity decoding, image extraction from `<media:content>` / `<enclosure>` / `content:encoded`
- `lib/services/ingestion.ts` — parallel fetch with per-feed error isolation and seed fallback

**Multi-pass humanization (Phase B)**
- `lib/text/cadence.ts` — sentence-level burstiness analysis; rewrites monotone long sentences
- `lib/text/humanizer.ts` — 30+ anti-AI-trope regex replacements (delve, tapestry, navigate the complexities, in today's fast-paced world, moreover/furthermore stacks, etc.)
- Every generated article now runs cadence → humanize passes before save
- `humanize_article` MCP tool to re-run the pass on any existing article

**Site-wide SEO (Phase C)**
- `lib/seo/schema.ts` — typed JSON-LD builders: `WebSite`, `NewsArticle`, `CollectionPage`, `BreadcrumbList`, `FAQPage`, `AboutPage`
- `app/og/[slug]/route.tsx` — dynamic branded OG image cards via `next/og`
- Switched from Google Fonts `@import` to `next/font` (Inter + Source Serif 4 + JetBrains Mono) — eliminates render-blocking
- `generateMetadata` on all public pages with full OG/Twitter/keywords/canonical

**Multi-language i18n (Phase D)**
- `next-intl` v4, cookie-based locale (no URL restructuring)
- 8 locales: English, हिन्दी, Español, Français, Deutsch, 日本語, Português, العربية
- GeoIP + Accept-Language auto-detection
- `LocaleSwitcher` flag-picker in the public header

**Magazine animations (Phase E)**
- `motion` package (Framer Motion successor)
- `components/motion/` — `Reveal`, `Magnetic`, `Marquee`, `PageTransition`, `Parallax`
- `app/template.tsx` — soft cross-fade between routes
- Homepage grid stagger-reveals on scroll; `prefers-reduced-motion` disables all animations

**Autonomous scheduler (Phase F)**
- `node-cron` powered scheduler — default every 2h, configurable via `AUTONOMOUS_CRON` env
- `lib/scheduler/cron.ts` + `lib/scheduler/runner.ts` — full ingest→cluster→generate→publish cycle
- MCP tools: `autonomous_start`, `autonomous_stop`, `autonomous_status`, `autonomous_run_once`

**Full MCP exercise (Phase G)**
- `tests/mcp-full-smoke.mjs` — drives all 25 tools, pass/fail matrix
- `docs/MCP_USAGE.md` updated with autonomous + humanize tools

---

### Phase 1 — Foundation (2026-04-28)

**Architecture**
- Separated public/admin/MCP surfaces using Next.js route groups (`(public)`, `(admin)`)
- `middleware.ts` — admin gate with `quickgist_admin` cookie + `x-admin-api-key` header
- `/admin/login` — minimal auth form, sets httpOnly cookie
- Memory-mode storage (`STORAGE_DRIVER=memory`) — zero services needed for dev
- Inline queue mode (`QUEUE_DRIVER=inline`) — BullMQ optional, degrades to direct `await`
- Removed Docker dependency entirely

**Magazine-grade public UI**
- `components/public/` — `Header`, `Footer`, `StoryCard` (5 sizes), `ExplainerCard`, `CategoryRail`, `ShareBar`, `ReadingProgress`, `RelatedArticles`, `NewsletterBand`
- `tailwind.config.ts` — refined type scale, Source Serif 4 + Inter, animation keyframes, shadow tokens
- `app/globals.css` — prose reader styles, drop cap, `.story-card` hover transitions, reading progress bar

**MCP server (v0.1 — 18 tools)**
- `mcp/server.ts` — McpServer with stdio + Fastify HTTP transport
- Full pipeline toolset: ingest, cluster, generate, quality, publish, distribute, snapshot

**SEO engine**
- `lib/services/seoEngine.ts` — pure-TS Flesch readability, keyword density, title/meta scoring, structure checks
- `lib/services/quality.ts` — confidence-weighted routing (structural 45% + SEO 35% + sources 20%)

**Documentation**
- `README.md`, `SETUP_AND_CONFIGURATION.md`, `docs/MCP_USAGE.md` — full setup, native install, MCP walkthroughs

---

Full configuration + troubleshooting: [SETUP_AND_CONFIGURATION.md](SETUP_AND_CONFIGURATION.md)  
MCP tool reference: [docs/MCP_USAGE.md](docs/MCP_USAGE.md)

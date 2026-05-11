# QuickGist — Content Operating Service (COS)

QuickGist is a local-first **Content Operating Service**: a magazine-grade public news site, an isolated operator console, and a 43-tool MCP server that drives the editorial pipeline end-to-end. No Docker required.

---

## Three surfaces

| Surface | URL | Audience |
|---|---|---|
| **Public site** | `/` | End readers — homepage, articles, ELI5 explainers, trending, free tools, newsletter |
| **Operator console** | `/admin` | Editors / operators — review queue, quality + SEO scoring, distribution scheduler, source inventory. Auth-gated, hidden from search engines |
| **MCP server** | stdio + `:3333/mcp` | Agentic IDEs (Claude Code, Cursor, Windsurf) — 43 tools to drive the full pipeline |

The public site is the product. Admin and MCP are the back-of-house. Users never see them.

---

## What's in the pipeline

1. **Ingest** — 19 curated RSS feeds (BBC, Al Jazeera, NPR, The Guardian, TechCrunch, The Verge, Ars Technica, Hacker News, The Hindu + more). Falls back to seed fixtures when offline.
2. **Cluster** — Jaccard-similarity topic clustering with word-boundary category inference (7 categories: finance, health, politics, education, technology, sports, entertainment), scored by trend velocity and novelty.
3. **Dispatch** — Up to 8 in-process concurrent workers (Alpha–Hotel) pull topics from a shared queue via `claimNextTopic()`. Each worker runs the full generate→quality→publish lifecycle across 6 sequential stages (fact extraction, writing, social/FAQ/media, quality, publish). Workers share memory directly — no HTTP serialization, no subprocess management, no temp files. Concurrency is configurable via `PIPELINE_AGENT_CONCURRENCY` (default 8, all modes).
4. **Extract facts** — Only what 2+ sources agree on.
5. **Generate** — Multi-pass article synthesis with resilient `Promise.allSettled` (one AI call failure doesn't kill the topic):
   - Pass 1: Draft from verified facts (or topic summary/keywords when claims are sparse)
   - Pass 2: Cadence analysis (burstiness enforcement, sentence length variety)
   - Pass 3: Humanization (30+ anti-AI-trope filters — no "delve into", no "in today's fast-paced world")
   - Plus: ELI5 explainer + 4-platform social pack + long video script + Shorts script + image prompts + FAQ + meta tags
6. **Score SEO** — Keyword density, title/meta length, Flesch readability, structure, internal links, word count.
7. **Quality gate** — Confidence-routed decision: `auto_publish`, `human_review`, or `regenerate`. Formula: `structuralNorm × 0.45 + seoScoreNorm × 0.35 + sourceNorm × 0.2 − riskPenalty`.
8. **Publish + distribute** — Telegram / X / LinkedIn / Instagram / Newsletter / RSS.
9. **Autonomous** — Scheduler runs the full cycle on cron (default every 2h), controllable via MCP.

---

## Quick start (no Docker)

```bash
npm install
cp .env.example .env
npm run dev                  # public site on http://localhost:3000
```

`STORAGE_DRIVER=memory` and `QUEUE_DRIVER=inline` are default — no PostgreSQL or Redis needed for local development.

To seed real content:

```bash
npm run pipeline:local       # ingest → cluster → generate → quality → publish
```

For persistent storage, install PostgreSQL + Redis natively and set `DATABASE_URL` + `REDIS_URL` in `.env`. See [docs/SETUP_AND_CONFIGURATION.md](docs/SETUP_AND_CONFIGURATION.md).

---

## MCP — Drive the pipeline from Claude Code

```bash
npm run mcp:http             # HTTP transport on :3333
# or
npm run mcp:stdio            # stdio transport for Claude Desktop
```

**43 MCP tools** are available — see [docs/MCP_USAGE.md](docs/MCP_USAGE.md). 31 tools work with 100% real data; 12 tools use AI for generation and deep analysis (with deterministic fallback when no API key is set).

| Group | Tools | Tier |
|---|---|---|
| Pipeline | `ingest_run`, `trending_detect`, `trending_detect_incremental`, `pipeline_run`, `pipeline_agent_status` | REAL |
| Generation | `generate_article`, `generate_eli5_explanation`, `generate_faq_section`, `generate_meta_tags`, `improve_article_seo`, `humanize_article` | HYBRID / REAL |
| Social | `generate_social_package`, `generate_twitter_thread` | REAL |
| Video + Image | `generate_video_script`, `generate_shorts_script`, `generate_image_prompts`, `generate_article_image`, `regenerate_image` | HYBRID |
| SEO | `analyze_seo_score`, `analyze_seo_with_ai`, `seo_audit_site`, `audit_seo_health` | REAL / HYBRID |
| Quality | `quality_evaluate`, `quality_evaluate_with_ai`, `analyze_content_quality` | REAL / HYBRID |
| Publish | `publish_article`, `distribution_schedule` | REAL |
| Content Ops | `analyze_traffic_potential`, `analyze_content_gaps`, `generate_internal_links`, `generate_newsletter_brief`, `generate_newsletter_digest`, `translate_article`, `detect_ai_content`, `suggest_related_links` | HYBRID / REAL |
| Reporting | `analytics_overview`, `ops_snapshot`, `get_top_articles`, `get_content_calendar` | REAL |
| Autonomous | `autonomous_start`, `autonomous_stop`, `autonomous_status`, `autonomous_run_once` | REAL |

**REAL** = no AI, deterministic data/analytics. **HYBRID** = uses DeepSeek AI when API key is set, falls back to deterministic templates otherwise.

To wire into Claude Code:

```bash
claude mcp add quickgist -- npm --prefix /home/krishna/quickgist run mcp:stdio
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

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        QuickGist COS                                  │
│                                                                       │
│  ┌─────────────── pipeline process ─────────────────────────────┐    │
│  │                                                              │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │    │
│  │  │  Alpha  │ │  Bravo  │ │ Charlie │ │  Delta  │  ... ×8   │    │
│  │  │ (async) │ │ (async) │ │ (async) │ │ (async) │           │    │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │    │
│  │       │            │           │            │                 │    │
│  │       └────────────┴───────────┴────────────┘                 │    │
│  │                  │ claimNextTopic() / work-steal               │    │
│  │            ┌─────┴─────┐                                      │    │
│  │            │  Tracker   │  pipelineTracker.ts                 │    │
│  │            │  (shared   │  singleton in globalThis            │    │
│  │            │   memory)  │                                      │    │
│  │            └─────┬─────┘                                      │    │
│  │                  │                                             │    │
│  └──────────────────┼─────────────────────────────────────────────┘    │
│                     │                                                  │
│          ┌──────────┼──────────┐                                       │
│          │          │          │                                       │
│    ┌─────┴──┐  ┌────┴────┐  ┌─┴────────┐                              │
│    │  MCP   │  │   API   │  │ Dashboard │                              │
│    │ :3333  │  │  :3000  │  │  /admin   │                              │
│    └────────┘  └─────────┘  └──────────┘                              │
│                                                                        │
│  Each worker: 6 lifecycle stages (Fact Extractor → Writer → Social     │
│  Composer → Media Scout → Quality Inspector → Publisher)               │
│  All stages run in-process, share memory directly.                     │
│  No HTTP coordinator, no subprocess spawns, no temp files.             │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Admin / operator console

Admin lives under `/admin/*` and is gated by `middleware.ts`.

- Set `ADMIN_API_KEY` in `.env`. Default `dev-admin-key` is accepted in non-production.
- Visit `/admin/login`, paste the key — sets an `httpOnly` cookie for 8h.
- Or pass header `x-admin-api-key: <key>` to admin HTTP endpoints.

Pages: dashboard (with Evaluate / Publish / Schedule dist. / Delete per article), sources, topics, reviews, quality, distribution, subscribers, MCP, health.

Admin routes are `Disallow`-ed in `robots.txt`, excluded from `sitemap.xml`, and never linked from public pages.

---

## Changelog

### Phase 7 — v0.1.2 Production-grade upgrade (2026-05-11)

**Content quality**
- `sanitizeAiOutput()` strips AI markdown artifacts (`**`, code fences, empty links) from all generated content
- Centralized AI artifact phrase list in `lib/text/ai-artifacts.ts` shared by generation, quality, and humanizer
- 3 new quality checks: `noMarkdownArtifacts`, `noCodeFences`, `noEmptyLinks`

**i18n fully wired**
- `NextIntlClientProvider` in root layout with dynamic `lang={locale}`
- All public pages and components use `getTranslations()` / `useTranslations()` — Header, Footer, news page, home page, trending, about, tools, privacy, terms, contact, newsletter
- All 8 locale files synced with authentic translations (hi, es, fr, de, ja, pt, ar)

**AI image generation**
- `lib/services/imageGeneration.ts` — DALL-E 3 via OpenAI SDK, with in-memory caching by prompt hash
- Wired into article generation pipeline; falls back to stock photo search when no OpenAI key
- MCP tools: `generate_article_image`, `regenerate_image`

**8-agent pipeline unlocked**
- Memory mode no longer caps at 3 agents; all 8 agents active in all modes
- `PIPELINE_AGENT_CONCURRENCY` env var (default 8), `TOPIC_TIMEOUT_MS` (default 900s)
- Per-call 45s timeout on social/video/FAQ sub-tasks via `AbortController`

**Advanced SEO scoring**
- 4 new scoring components: Image SEO (8%), Schema validation (7%), Canonical URL (3%), Social meta (5%)
- Locale-aware JSON-LD schema with `inLanguage` parameter
- Sitemap with `changefreq`, `priority`, and hreflang alternates for all 8 locales

**Auto-publish at 60%**
- `autoPublishConfidenceThreshold` lowered from 0.85 → 0.60
- `autoPublishQualityThreshold` lowered from 86 → 60
- High-risk categories (health, finance, legal, conflict, elections) always require human review

**MCP v0.1.2 — 43 tools**
- 8 new tools: `analyze_content_quality`, `generate_article_image`, `analyze_traffic_potential`, `generate_newsletter_brief`, `analyze_content_gaps`, `generate_internal_links`, `audit_seo_health`, `trending_detect_incremental`
- All tools include `version: "0.1.2"` and `capabilityLevel` metadata

**Analytics + AdSense**
- In-house view tracking: `trackArticleView()`, `getTopArticlesByViews()`, daily view counts
- `AdSlot` renders real Google AdSense `<ins>` units when `NEXT_PUBLIC_ADSENSE_CLIENT_ID` is set
- Admin analytics dashboard at `/admin/analytics` with views, top articles, category breakdown

**Admin monitoring dashboard**
- `/admin/monitoring` — live pipeline status, agent health grid (8 agents), content health, system stats
- Enhanced `/api/health` with pipeline status, recent errors, source freshness, uptime

**Dynamic category expansion**
- 6 new categories: banking, automotive, energy, legal, science, real-estate (15-25 keywords each)
- Incremental topic detection: `detectTrendingTopicsIncremental()` for on-the-fly topic creation

**Test coverage**
- New tests: `seoEngine.test.ts` (6), `header.test.tsx` (2), `footer.test.tsx` (2)
- Expanded quality, pipeline, and MCP tests
- 31 tests passing (1 Postgres integration test skipped)

**UI polish**
- Header: gradient top border, gradient underline on active nav links, gradient brand text
- Footer: gradient top border, gradient background, gradient brand text
- Active nav link detection via `x-pathname` header from middleware

### Phase 6 — In-process architecture refactor (2026-05-11)

**In-process concurrent workers**
- Replaced 8 subprocess spawns with in-process async workers sharing memory directly
- Deleted: `workers/agent.ts`, `lib/services/agentCoordinator.ts`, `lib/services/pipelineStateClient.ts` (~340 lines removed)
- No HTTP coordinator server, no temp discovery files, no orphan processes
- In memory mode, concurrency capped at 3 instead of 8 to avoid crowding

**MCP server cleanup**
- Removed agent coordination tools (`agent_claim_topic`, `agent_report_progress`, `agent_report_completion`) — no longer needed
- 34 tools (down from 31)
- Fixed StreamableHTTP session management in Fastify setup

**Naming: sub-agent → lifecycle stage**
- Renamed `SubAgentType` → `LifecycleStage` with backward-compat aliases
- Pipeline tracker field renamed from `subAgents` to `lifecycle`

**Quality evaluation fixes**
- Split `evaluateQuality` into read-only `assessQuality` + persistence wrapper
- MCP tools now use `assessQuality` — safe to call without side effects
- Fixed `deepseek-v4-flash` → `deepseek-chat` (model didn't exist on DeepSeek)
- Raised source-similarity threshold from 0.42 to 0.80 (synthesized content naturally overlaps)
- Changed `passed` logic from zero-failures-required to structural-score-driven
- Lowered confidence thresholds to realistic deterministic-mode defaults
- Review tasks only created for `human_review` decisions, not every article

**Admin: delete article**
- Added Delete button to article cards with confirmation dialog
- Cascading delete through quality_reports, review_tasks, media_assets, distribution_jobs

### Phase 5 — 8-Agent Autonomous Pipeline (2026-05-11)

**8-Agent autonomous dispatch**
- 8 named agents (Alpha–Hotel, NATO alphabet) run as independent OS processes via `child_process.spawn`
- Built-in coordinator HTTP server (`agentCoordinator.ts`) — agents communicate via REST, not MCP
- Coordinator discovery via temp file (`$TMPDIR/quickgist-coordinator.json`) for cross-process state sharing
- `getLiveState()` in `pipelineStateClient.ts` — fetches coordinator `/state` with 2s timeout, falls back to local singleton
- Dashboard and MCP server now see live agent/sub-agent activity during pipeline runs

**Resilient generation**
- Token budget (2M default) is a soft warning, not a throw — falls back to deterministic templates
- `Promise.allSettled` replaces `Promise.all` for 5 parallel AI calls — one failure doesn't kill the topic
- Per-AI-call 120s timeout via `AbortController`, per-topic 10-min timeout in agent workers
- `createArticleMarkdown` handles empty fact claims — builds content from topic summary and keywords

**Cross-process article persistence**
- Agent POSTs article to coordinator's `/article` endpoint after generation
- Re-POSTs article after quality evaluation (was Q0 because quality score was never sent back)
- Coordinator enriches article sources from shared store (agent's isolated `globalThis` has empty `sourceRefs()`)

**Quality & visibility**
- AI failure tracking: `aiFailures` counter + `lastError` on agent cards, `/ai-failure` coordinator endpoint
- Agent lifecycle: "assigned" → "working" status, idle cleanup on exit, 15-min stuck-agent health check
- Category inference: word-boundary regex with match-count scoring, 7 categories
- Dry-run mode for clustering: skips persistence and dedup so results are always visible

### Phase 4 — Production AI + MCP Dashboard (2026-05-10)

**DeepSeek AI integration**
- `lib/services/aiOrchestration.ts` — real AI provider routing: DeepSeek > Groq > OpenAI > Gemini (auto-detected from env)
- Deterministic local fallback when no API key is configured — graceful degradation
- Deterministic templates produce real-structured articles with verified facts and sources

**MCP dashboard**
- `/admin/mcp` — tool catalog with REAL/HYBRID tier labels, AI provider status, scheduler state, operations snapshot, recent audit events
- 25 tools registered in the server

**Admin quality page**
- `/admin/quality` — per-article SEO breakdown, confidence routing, structural checks
- Daily token budget on `MODEL_DAILY_TOKEN_BUDGET` — soft warning, not hard block

### Phase 3 — Quality gate + deterministic templates (2026-04-29)

- Deterministic article/ELI5/social/video generation via `createArticleMarkdown()` and friends
- 4-method quality pipeline: deterministic checklist → `evaluateConfidence()` → SEO scoring via `scoreArticle()` → review task
- `evaluateConfidence` formula: structuralNorm×0.45 + seoScoreNorm×0.35 + sourceNorm×0.2 − riskPenalty
- `fleschReadingEase` in `seoEngine.ts` with sentence/burstiness metrics
- 4 MCP tools added: `quality_evaluate`, `analyze_seo_score`, `improve_article_seo`, `humanize_article`
- MCP tool count: 16 tools

### Phase 2 — Admin UI + real RSS (2026-04-28)

- 20+ real RSS sources in `lib/sources/curated.ts` (BBC, Al Jazeera, NPR, The Guardian, etc.)
- `rss-parser` fetches live on every ingest, falls back to seed fixtures when offline
- Admin UI: sources, topics, reviews, quality, distribution, subscribers pages
- Preview mode for LinkedIn posts + image prompts per article
- Admin auth with `ADMIN_API_KEY` via `api/admin/session`

### Phase 1 — Foundation (2026-04-28)

- Next.js 14 App Router with `(public)`/`(admin)` route groups
- `next-intl` i18n routing (8 locales)
- MCP server with `@modelcontextprotocol/sdk` (stdio + HTTP)
- Drizzle ORM + PostgreSQL migrations
- BullMQ workers for queue-driven execution
- `STORAGE_DRIVER=memory` + `QUEUE_DRIVER=inline` for zero-Docker dev
- Tailwind CSS + motion library for magazine-grade animations
- Free summarizer tool at `/tools/summarize`
- 12 MCP tools: ingest, generate, social, SEO, analytics

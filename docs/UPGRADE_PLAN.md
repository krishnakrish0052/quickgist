# QuickGist — Architecture Refactor Log

## Phase 1 → Phase 2 (May 2026)

The Phase-1 release shipped a working content pipeline with 8 autonomous agent subprocesses, a custom HTTP coordinator server, and 31 MCP tools. Review uncovered several structural issues that block production readiness. This log documents what was changed and why.

## Architecture changes

### 1. Subprocess spawn → in-process concurrent workers

**Problem:** The pipeline spawned 8 separate `npx tsx workers/agent.ts` processes. Each process had an isolated memory space, which meant in memory mode (the default), agents couldn't see topics, sources, or articles seeded by the parent. A workaround HTTP coordinator (`lib/services/agentCoordinator.ts`) was added, which serialized every state mutation through REST endpoints, and used a tmp file for cross-process discovery.

**Fix:** Removed the entire subprocess spawn pattern. Topic processing now runs in-process as concurrent async tasks (up to 8 parallel workers). Workers share memory directly via the global pipeline tracker singleton. In memory mode, concurrency is capped at 3 to avoid crowding.

Changes:
- `workers/pipeline.ts` — rewritten: no `spawn()`, no `child_process`, no `startCoordinator()`. Uses `createConcurrencyLimiter()` + `Promise.all()` with a `claimNextTopic()` work-stealing pattern.
- `workers/agent.ts` — **deleted** (196 lines). Agent lifecycle logic is now in `processTopic()` inside `workers/pipeline.ts`.
- `lib/services/agentCoordinator.ts` — **deleted** (116 lines). The HTTP server with `/claim`, `/progress`, `/complete`, `/article`, `/config`, `/state`, `/health`, `/ai-failure` endpoints is no longer needed.
- `lib/services/pipelineStateClient.ts` — **deleted** (46 lines). The `getLiveState()` function that fetched state across processes via tmp file + HTTP is gone. The admin status API route now directly calls `getPipelineRunState()`.
- `app/api/admin/pipeline/status/route.ts` — updated import from `getLiveState` to `getPipelineRunState`.

**Net:** ~340 lines of complex infrastructure removed. No orphan processes, no tmp files, no serialization overhead, no 1.5s polling interval.

### 2. MCP server cleanup

**Problem:** The MCP server duplicated the coordinator's agent coordination logic (`agent_claim_topic`, `agent_report_progress`, `agent_report_completion`) — but those tools were only ever called by subprocess agents that also talked to the HTTP coordinator. Two parallel coordination layers doing the same job.

**Fix:** Removed the three agent coordination tools from the MCP server. The server now has 28 tools (down from 31).

Also fixed:
- Fastify StreamableHTTP setup — removed `sessionIdGenerator: undefined` argument that was breaking SDK 1.x session management.
- `pipeline_agent_status` tool response uses `lifecycle` (not `subAgents`) and reads state directly from `getPipelineRunState()` instead of `getLiveState()`.

### 3. Naming: sub-agent → lifecycle stage

**Problem:** The six work stages (`fact_extractor`, `writer`, `social_composer`, `media_scout`, `quality_inspector`, `publisher`) were called "sub-agents" in the type system, which implied they were autonomous when they're actually sequential lifecycle stages in a single task.

**Fix:** Renamed `SubAgentType` → `LifecycleStage`, `SubAgentState` → `LifecycleState`, `SubAgentLabels` → `STAGE_LABELS`, `SubAgentShort` → `STAGE_SHORT`. Backward-compat aliases (`export type SubAgentType = LifecycleStage`) are provided for any external references. The type field on agents is now `lifecycle` instead of `subAgents`.

Changes: `lib/services/pipelineTracker.ts`, `components/PipelineRunMonitor.tsx`, `components/PipelineStatusBar.tsx`.

### 4. Quality evaluation: read-only assessor

**Problem:** The `evaluateQuality()` function mutated `article.status`, called `upsertArticle()`, and created quality reports and review tasks as a side effect. This means the MCP tool `quality_evaluate` was destructive — calling it on an article would change its status.

**Fix:** Split into two functions:
- `assessQuality(article)` — read-only. Returns the quality report, SEO score, and confidence routing decision. Safe for MCP tools.
- `evaluateQuality(article)` — calls `assessQuality()` then persists results. Pipeline uses this.

Both MCP quality tools (`quality_evaluate`, `quality_evaluate_with_ai`) now use `assessQuality()`.

### 5. Quality failure rate

**Problem:** 15/19 articles were showing as quality failures. Three root causes:

- `deepseek-v4-flash` doesn't exist as a DeepSeek model name — every AI call fell back to deterministic (thin) output.
- `lowSourceSimilarity` threshold at 0.42 Jaccard was far too strict for synthesized content.
- `passed` required zero failing structural checks — a single informational failure always tripped it.
- Thresholds were tuned for a well-provisioned setup: `MIN_SOURCES_FOR_PUBLISH=3`, `AUTO_PUBLISH_CONFIDENCE_THRESHOLD=0.85`, `HIGH_RISK_CATEGORIES` included `health` and `finance`.

**Fixes:**
- Model name: `deepseek-v4-flash` → `deepseek-chat` in `.env` and `aiOrchestration.ts`.
- Source similarity threshold: 0.42 → 0.80 (catches only near-verbatim copies).
- Pass logic: now `structuralScore >= 60 && decision !== "regenerate"` instead of requiring zero check failures.
- `.env` thresholds lowered to realistic defaults: `0.70` auto-publish, `0.40` review floor, `1` minimum source, `legal,conflict,elections` high-risk only.
- Review tasks are only created for `human_review` decisions or high-risk topics, not for every article.

### 6. Admin: delete article

**Problem:** No way to remove generated articles from the admin dashboard.

**Fix:** Added "Delete" button with `Trash2` icon to every article card, with a confirm dialog. Implementation:
- `lib/store.ts` — `deleteArticleFromMemory()` (splices from memory + filters related records).
- `lib/repositories/platformRepository.ts` — `deleteArticle()` (cascades deletes through quality_reports, review_tasks, media_assets, distribution_jobs in Postgres mode).
- `app/(admin)/admin/actions.ts` — `deleteArticleAction()` server action.
- `components/ArticleActions.tsx` — Delete button with confirmation.

---

## v0.1.2 — Production-Grade Upgrade (2026-05-11)

### Phase 1 — Content Quality: Eliminate AI Artifacts

- `lib/text/ai-artifacts.ts` — Centralized canonical list of 59 AI artifact phrases and 5 markdown cleanup regex patterns. Shared by generation, quality, and humanizer modules.
- `lib/services/aiOrchestration.ts` — Added `sanitizeAiOutput()` called before every AI response return. Strips unclosed bold markers, code fences, empty links, stray headers, and normalizes whitespace.
- `lib/text/humanizer.ts` — Added "Pass 0" markdown artifact cleanup before existing trope replacements. Converts bold callouts like `**Key Takeaway:**` to proper headings.
- `lib/services/generation.ts` — Added 3 new article quality checks: `noMarkdownArtifacts`, `noCodeFences`, `noEmptyLinks`. Switched to shared artifact list from `ai-artifacts.ts`.
- `lib/services/quality.ts` — Switched to shared artifact list, removed local duplicate.

### Phase 2 — i18n: Wire Translations into All Components

- `app/layout.tsx` — Added `NextIntlClientProvider` wrapper with dynamic `lang={locale}`. Uses `getLocale()` and `getMessages()` from `next-intl/server`.
- All public pages converted to `getTranslations()`: `page.tsx`, `news/[slug]/page.tsx`, `trending/page.tsx`, `about/page.tsx`, `tools/page.tsx`, `tools/summarize/page.tsx`, `privacy/page.tsx`, `terms/page.tsx`, `disclaimer/page.tsx`, `contact/page.tsx`, `newsletter/page.tsx`, `explain/[slug]/page.tsx`, `category/[slug]/page.tsx`.
- All shared components converted: `Header.tsx`, `Footer.tsx`, `NewsletterBand.tsx`, `NewsletterSignup.tsx`, `StoryCard.tsx`.
- `messages/en.json` expanded from ~22 keys to ~60+ keys. All 7 other locale files synced with authentic translations.
- Active nav link detection via `x-pathname` header from middleware.

### Phase 3 — AI Image Generation

- `lib/services/imageGeneration.ts` — DALL-E 3 via OpenAI SDK with in-memory caching by stable hash of prompt + style. Supports hero/square/vertical/thumbnail formats. Falls back to placeholder when no key is set.
- `lib/services/generation.ts` — Wired AI image generation into article creation pipeline after `imagePrompt` text generation. Falls back to stock photo search.
- `lib/services/media.ts` — Updated to prefer AI-generated images over stock photos.
- MCP tools: `generate_article_image`, `regenerate_image`.

### Phase 4 — Full 8-Agent Pipeline

- `workers/pipeline.ts` — Removed memory-mode 3-agent cap. Uses `PIPELINE_AGENT_CONCURRENCY` env var (default 8) across all storage modes.
- Per-topic timeout increased to 15 minutes (configurable via `TOPIC_TIMEOUT_MS`).
- On timeout: updates all lifecycle stages to "error" before calling `failNamedAgentTopic`.
- Idle agent cleanup: agents with 0 completed + 0 failed are set to idle.
- `lib/config.ts` — Added `pipelineAgentConcurrency` to Zod schema (1-16, default 8).

### Phase 5+6 — Advanced SEO + Auto-Publish at 60%

- `lib/services/seoEngine.ts` — Added 4 new scoring components: Image SEO (8%, alt/lazy/modern formats), Schema validation (7%, JSON-LD checks), Canonical URL (3%), Social meta (5%, OG/Twitter). Weights redistributed: keyword 15%, title 12%, meta 8%, readability 16%, structure 12%, internal links 6%, word count 8%.
- `lib/services/quality.ts` — SEO fast-track: `seo.overall >= 70` bypass for non-high-risk topics. Updated confidence formula comments.
- `lib/config.ts` — `autoPublishConfidenceThreshold`: 0.85 → 0.60, `autoPublishQualityThreshold`: 86 → 60, `reviewConfidenceThreshold`: 0.60 → 0.40, `minSourcesForPublish`: 3 → 1.
- `app/sitemap.ts` — Added `changefreq`, `priority`, hreflang alternates for all 8 locales.
- `lib/seo/schema.ts`, `lib/seo.ts` — Added `inLanguage` parameter for locale-aware JSON-LD.

### Phase 7 — MCP v0.1.2: 43 Tools

- 8 new tools: `analyze_content_quality`, `generate_article_image`, `analyze_traffic_potential`, `generate_newsletter_brief`, `analyze_content_gaps`, `generate_internal_links`, `audit_seo_health`, `trending_detect_incremental`.
- All tools include `version: "0.1.2"` and `capabilityLevel: "basic" | "advanced" | "expert"` metadata.
- Upgraded HYBRID tools with enhanced AI capabilities: entity extraction, E-E-A-T signals, NLP keyword clustering, factual consistency scoring.

### Phase 8 — Analytics + AdSense Monetization

- `lib/services/analytics.ts` — In-house view tracking: `trackArticleView()`, `getArticleViews()`, `getTopArticlesByViews()`, `getDailyViewCount()`. No cookies, no PII. Stores in `globalThis` array.
- `components/AdSlot.tsx` — Real Google AdSense `<ins>` rendering when `NEXT_PUBLIC_ADSENSE_CLIENT_ID` is set. Falls back to dashed-border placeholder.
- `app/(admin)/admin/analytics/page.tsx` — Analytics dashboard with view counts, top articles, category breakdown.
- `app/(public)/news/[slug]/page.tsx` — View tracking on article page load (non-blocking, silently ignores errors).

### Phase 9 — Dynamic Category Expansion

- `lib/services/trend.ts` — Added 6 new categories: banking, automotive, energy, legal, science, real-estate (15-25 keyword regex alternations each).
- `detectTrendingTopicsIncremental()` — On-the-fly topic detection from new raw items without full pipeline run.
- MCP tool: `trending_detect_incremental`.

### Phase 10 — Test Coverage + UI Polish

- New test files: `tests/seoEngine.test.ts` (6 tests), `tests/header.test.tsx` (2 tests), `tests/footer.test.tsx` (2 tests).
- Expanded: `tests/quality.test.ts` (auto-publish at 60%), `tests/pipeline.test.ts` (8 agent initialization), `tests/mcp.test.ts`.
- Header: gradient top border, gradient underline on active/hover nav links, gradient brand text, 1.4rem brand name.
- Footer: gradient top border, gradient background, gradient brand text, 2xl brand name.
- Total: 31 tests passing, 1 skipped (Postgres integration).

### Phase 11 — Admin Monitoring Dashboard

- `app/(admin)/admin/monitoring/page.tsx` — Live pipeline status, agent health grid (8 agents with status/current topic/lifecycle), content health (articles pending, quality distribution), system stats (uptime, storage, provider, queue).
- `app/api/health/route.ts` — Enhanced with pipeline status summary, recent error count, source freshness, uptime.

### Files created (v0.1.2)
- `lib/text/ai-artifacts.ts` — Centralized AI artifact phrase list
- `lib/services/imageGeneration.ts` — DALL-E 3 image generation
- `lib/services/analytics.ts` — In-house view tracking
- `app/(admin)/admin/analytics/page.tsx` — Analytics dashboard
- `app/(admin)/admin/monitoring/page.tsx` — Monitoring dashboard
- `tests/seoEngine.test.ts`, `tests/header.test.tsx`, `tests/footer.test.tsx`

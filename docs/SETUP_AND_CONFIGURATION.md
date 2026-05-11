# QuickGist — Setup & Configuration

## 1. Requirements

- Node.js 20+
- npm 10+
- (Optional) PostgreSQL 14+ and Redis 7+ for persistent storage and BullMQ workers
- (Optional) Provider keys for DeepSeek / Groq / OpenAI / Gemini — local deterministic mode works without any keys

QuickGist does **not** use Docker. Storage and queue are optional in development; install them natively for full persistence.

## 2. Install

```bash
npm install
cp .env.example .env
```

The repo includes `.npmrc` with `legacy-peer-deps=true` because Drizzle has optional peer dependencies that can confuse npm in a Next.js app.

## 3. Pick a run mode

QuickGist has three run modes.

### Mode A — Memory (default, zero setup)

Open `.env` and confirm:

```bash
STORAGE_DRIVER=memory
QUEUE_DRIVER=inline
REDIS_URL=
```

Then:

```bash
npm run dev
```

Everything (sources, raw items, topics, articles, distribution jobs, audit log) lives in process memory and is reset on restart. Perfect for trying the product or running tests.

### Mode B — Native PostgreSQL + inline queue

Install Postgres locally:

| OS | Command |
|---|---|
| Ubuntu / Debian | `sudo apt install postgresql` |
| macOS (Homebrew) | `brew install postgresql@16 && brew services start postgresql@16` |
| Arch / WSL | `sudo pacman -S postgresql` |

Create a database and user:

```bash
sudo -u postgres createuser -P quickgist            # set password "quickgist"
sudo -u postgres createdb -O quickgist quickgist
```

In `.env`:

```bash
STORAGE_DRIVER=postgres
DATABASE_URL=postgres://quickgist:quickgist@localhost:5432/quickgist
QUEUE_DRIVER=inline
```

Run migrations + seed:

```bash
npm run db:migrate
npm run db:seed
npm run db:health
npm run dev
```

### Mode C — Native PostgreSQL + Redis BullMQ workers

Add Redis to Mode B:

```bash
sudo apt install redis-server          # Ubuntu
brew install redis && brew services start redis   # macOS
```

In `.env`:

```bash
QUEUE_DRIVER=bullmq
REDIS_URL=redis://localhost:6379
```

Then run web + worker in separate shells:

```bash
npm run dev
npm run worker
```

## 4. Preflight

Run `npm run services:check` at any time to see which services are reachable. It never fails the process — it just reports what mode QuickGist will run in.

## 5. Public site routes

- `/` homepage (magazine grid)
- `/news/[slug]` article page
- `/explain/[slug]` ELI5 explainer
- `/category/[slug]` category landing
- `/trending` topic dashboard
- `/tools` and `/tools/summarize` free tools
- `/newsletter` subscription page
- `/about`, `/privacy`, `/contact`, `/disclaimer`, `/terms` policy pages
- `/rss.xml`, `/sitemap.xml`, `/robots.txt`

There is **no** admin link anywhere on the public site.

## 6. Admin / operator console

Admin lives under `/admin/*` and is gated by `middleware.ts`.

- Set `ADMIN_API_KEY` in `.env`. Default `dev-admin-key` is accepted in non-production.
- Visit `/admin/login`, paste the key — sets an `httpOnly` cookie for 8h.
- Or pass header `x-admin-api-key: <key>` to admin HTTP endpoints.

Pages:

- `/admin` dashboard — article cards with Evaluate / Publish / Schedule dist. / Delete actions
- `/admin/sources` source inventory
- `/admin/topics` topic clusters
- `/admin/reviews` review queue
- `/admin/quality` confidence + SEO breakdown per article
- `/admin/distribution` scheduled jobs
- `/admin/subscribers` newsletter list
- `/admin/mcp` MCP server status + tool catalog
- `/admin/health` service health

Admin routes are excluded from `sitemap.xml` and have `robots: noindex,nofollow`.

## 7. Internal HTTP APIs

All operational endpoints require the admin key (header `x-admin-api-key`).

```bash
curl -X POST http://localhost:3000/api/ingest/run \
  -H "content-type: application/json" \
  -H "x-admin-api-key: dev-admin-key" \
  -d '{"dryRun": false}'

curl -X POST http://localhost:3000/api/trending/detect \
  -H "x-admin-api-key: dev-admin-key"

curl -X POST http://localhost:3000/api/pipeline/run \
  -H "content-type: application/json" \
  -H "x-admin-api-key: dev-admin-key" \
  -d '{"dryRun": true, "autoPublish": false}'
```

Public:

- `GET /api/health`
- `POST /api/admin/session` (login — body `{ key }`)
- `DELETE /api/admin/session` (logout)
- `GET /sitemap.xml`, `/robots.txt`, `/rss.xml`

## 8. Pipeline

```bash
npm run pipeline:dry-run     # safe: no writes, no auto-publish
npm run pipeline:local       # full: writes + autoPublish, high-risk topics still go to review
```

Pipeline stages:

1. **Seed** local demo records (idempotent).
2. **Ingest** RSS / source records (19 curated feeds, parallel fetch with per-feed error isolation).
3. **Cluster** into topics by Jaccard similarity, 2+ source verification, category inference.
4. **Concurrent topic processing** — topics are processed by in-process concurrent workers (up to 8, configurable via `PIPELINE_AGENT_CONCURRENCY`). Each worker runs the full lifecycle for a claimed topic. All 8 agents are active in all storage modes.
5. **Fact extraction** — only multi-source confirmed claims; falls back to topic summary when sparse.
6. **Article generation** — article + ELI5 + social pack + video + Shorts + image prompts + FAQ (5 parallel AI calls with `Promise.allSettled` — one failure doesn't kill the topic).
7. **Quality evaluation** — structural checks + SEO scoring + confidence routing (`auto_publish` / `human_review` / `regenerate`). Formula: structuralNorm × 0.45 + seoScoreNorm × 0.35 + sourceNorm × 0.2 − riskPenalty.
8. **Publish** eligible articles.
9. **Schedule distribution** jobs (Telegram / X / LinkedIn / Instagram / Newsletter / RSS).

### Architecture note

Topic processing runs **in-process** — no subprocess spawns, no HTTP coordinator server. Workers share memory directly. This eliminates serialization overhead, orphan processes, and a large temp-file discovery mechanism that the Phase-1 architecture used. All 8 named agents (Alpha–Hotel) are async tasks within the same Node.js process, pulling topics from a shared queue via `claimNextTopic()`.

## 9. MCP server

```bash
npm run mcp:stdio       # for Claude Desktop / local agents
npm run mcp:http        # HTTP transport on http://localhost:3333/mcp
```

Forty-three tools are registered — full reference and walkthroughs in [docs/MCP_USAGE.md](docs/MCP_USAGE.md).

To wire QuickGist into Claude Code:

```bash
claude mcp add quickgist -- npm --prefix /home/krishna/quickgist run mcp:stdio
```

Or in `.mcp.json`:

```json
{
  "mcpServers": {
    "quickgist": {
      "command": "npm",
      "args": ["--prefix", "/home/krishna/quickgist", "run", "mcp:stdio"]
    }
  }
}
```

## 10. AI provider configuration

Default mode is deterministic local generation in `lib/services/aiOrchestration.ts` — no keys required. To enable real AI model calls:

```bash
# DeepSeek (preferred — OpenAI-compatible, auto-detected first)
DEEPSEEK_API_KEY=sk-...
AI_PROVIDER=deepseek       # optional — "auto" detects first available
AI_MODEL=deepseek-chat     # optional — override the default model

# Alternatives: Groq, OpenAI, Gemini
GROQ_API_KEY=...
OPENAI_API_KEY=...         # also used for DALL-E 3 image generation
GEMINI_API_KEY=...
MODEL_DAILY_TOKEN_BUDGET=2000000

# Image generation (optional — falls back to stock photos)
# Set OPENAI_API_KEY above for DALL-E 3; also supports Replicate (REPLICATE_API_TOKEN) and Fal.ai (FAL_API_KEY)

# Pipeline tuning
PIPELINE_AGENT_CONCURRENCY=8    # max concurrent agents (1-16)
TOPIC_TIMEOUT_MS=900000         # per-topic timeout in ms (default 15 min)
```

**Provider auto-detection order:** DeepSeek → Groq → OpenAI → Gemini. Set `AI_PROVIDER` to a specific provider to override auto-detection. DeepSeek and Groq both use OpenAI-compatible endpoints — the existing `openai` SDK handles them with no extra dependencies. Gemini uses `@google/generative-ai` (installed automatically).

When no API key is configured, the system gracefully degrades to deterministic template-based generation — articles still have real structure, facts, and sources, just without AI-synthesized prose.

## 11. Quality + SEO thresholds

Tune via `.env`:

```bash
AUTO_PUBLISH_CONFIDENCE_THRESHOLD=0.60   # floor for auto-publish (≥60% + not high-risk = auto_publish)
AUTO_PUBLISH_QUALITY_THRESHOLD=60        # minimum structural quality score for auto-publish
REVIEW_CONFIDENCE_THRESHOLD=0.40         # below this = flagged for regeneration
MIN_SOURCES_FOR_PUBLISH=1                # minimum source count for publish
HIGH_RISK_CATEGORIES=health,finance,legal,conflict,elections   # always require human review
```

- `autoPublishConfidenceThreshold` is the floor for auto-publishing.
- Below `reviewConfidenceThreshold`, the article is flagged for regeneration on the next run.
- High-risk categories bypass auto-publish entirely — they always create a review task.
- The `passed` flag on quality reports uses structural score (≥60) and decision (`human_review` or `auto_publish`) — individual check failures are informational and feed the confidence score but don't automatically fail an article.

## 12. Tests

```bash
npm run test                          # vitest unit + integration (memory mode)
npm run test:db                       # postgres-backed integration (requires Mode B)
npx playwright install chromium
npm run test:e2e                      # Playwright smoke
npm run build                         # production build
```

`test:e2e` runs the app with `STORAGE_DRIVER=memory` so smoke tests do not require Postgres.

## 13. Troubleshooting

- **`Cannot connect to PostgreSQL`** — confirm Postgres is running and `DATABASE_URL` matches. Or set `STORAGE_DRIVER=memory` and unset `DATABASE_URL` for in-memory dev.
- **`Redis connection refused`** — set `QUEUE_DRIVER=inline` and unset `REDIS_URL`. The pipeline runs inline without BullMQ.
- **`401 Unauthorized` on `/api/...`** — pass `x-admin-api-key` header. In dev the default `dev-admin-key` works.
- **`/admin` redirects to `/admin/login`** — by design. Set `ADMIN_API_KEY` and sign in.
- **Public homepage shows "Newsroom warming up"** — no published articles yet. Run `npm run pipeline:local`.
- **MCP HTTP returns 404** — make sure you're hitting `/mcp`, not `/`. Default port is `3333` (override with `MCP_PORT`).
- **All articles show low quality scores** — check `.env` thresholds are calibrated correctly. In deterministic mode (no API key), the auto-publish threshold of 0.70 is realistic. See section 11.
- **AI calls failing** — verify your provider key is set. `deepseek-chat` is the correct model for DeepSeek. Check `MODEL_DAILY_TOKEN_BUDGET` isn't set too low.

# QuickGist — Setup & Configuration

## 1. Requirements

- Node.js 20+
- npm 10+
- (Optional) PostgreSQL 14+ and Redis 7+ for persistent storage and BullMQ workers
- (Optional) Provider keys for Gemini / Groq / OpenAI — local deterministic mode works without any keys

QuickGist does **not** use Docker. Storage and queue are optional in development; install them natively for full persistence.

## 2. Install

```bash
npm install
cp .env.example .env.local
```

The repo includes `.npmrc` with `legacy-peer-deps=true` because Drizzle has optional peer dependencies that can confuse npm in a Next.js app.

## 3. Pick a run mode

QuickGist has three run modes.

### Mode A — Memory (default, zero setup)

Open `.env.local` and confirm:

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

In `.env.local`:

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

In `.env.local`:

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

- Set `ADMIN_API_KEY` in `.env.local`. Default `dev-admin-key` is accepted in non-production.
- Visit `/admin/login`, paste the key — sets an `httpOnly` cookie for 8h.
- Or pass header `x-admin-api-key: <key>` to admin HTTP endpoints.

Pages:

- `/admin` dashboard
- `/admin/sources` source inventory
- `/admin/topics` topic clusters
- `/admin/reviews` review queue
- `/admin/quality` confidence + SEO breakdown per article
- `/admin/distribution` scheduled jobs
- `/admin/subscribers` newsletter list
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

1. Seed local demo records (idempotent).
2. Ingest RSS / source records.
3. Cluster into topics by similarity + recency.
4. Extract fact claims (only multi-source confirmed).
5. Generate article + ELI5 + social pack + video + Shorts + image prompts + FAQ.
6. Evaluate quality + SEO + confidence routing (auto_publish / human_review / regenerate).
7. Publish eligible articles.
8. Schedule distribution jobs.

## 9. MCP server

```bash
npm run mcp:stdio       # for Claude Desktop / local agents
npm run mcp:http        # HTTP transport on http://localhost:3333/mcp
```

Eighteen tools are registered — full reference and walkthroughs in [docs/MCP_USAGE.md](docs/MCP_USAGE.md).

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

Default mode is deterministic local generation in `lib/services/aiOrchestration.ts` — no keys required. To enable real model calls, set:

```bash
GEMINI_API_KEY=...
GROQ_API_KEY=...
OPENAI_API_KEY=...
MODEL_DAILY_TOKEN_BUDGET=250000
```

Real providers should be added behind the existing model gateway without changing route, worker, or MCP interfaces.

## 11. Quality + SEO thresholds

Tune via `.env.local`:

```bash
AUTO_PUBLISH_QUALITY_THRESHOLD=86
AUTO_PUBLISH_CONFIDENCE_THRESHOLD=0.85
REVIEW_CONFIDENCE_THRESHOLD=0.6
MIN_SOURCES_FOR_PUBLISH=3
HIGH_RISK_CATEGORIES=health,finance,legal,conflict,elections
```

`autoPublishConfidenceThreshold` is the floor for auto-publishing. Below `reviewConfidenceThreshold`, the article is flagged for regeneration on the next run.

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

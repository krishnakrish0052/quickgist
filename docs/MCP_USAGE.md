# QuickGist MCP — Tool reference and walkthroughs

QuickGist exposes 25 tools over the Model Context Protocol. They drive the full editorial pipeline — ingest, cluster, generate, score, publish, distribute, humanize, and schedule — using the same service layer as the web app and BullMQ workers.

## Connect

### From Claude Code (CLI)

```bash
claude mcp add quickgist -- npm --prefix /home/krishna/quickgist run mcp:stdio
```

Then in any Claude Code session:

```
> use the quickgist mcp server, call ops_snapshot
```

### Via HTTP (any MCP HTTP client)

```bash
npm run mcp:http
# server listens on http://localhost:3333/mcp
```

### Via project `.mcp.json`

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

## Tool index

| Group | Tool | Purpose |
|---|---|---|
| Pipeline | `ingest_run` | Fetch raw items from RSS/manual sources |
| Pipeline | `trending_detect` | Cluster raw items into topics |
| Pipeline | `pipeline_run` | End-to-end run (ingest → publish) |
| Generation | `generate_article` | Full article package (article + ELI5 + social + script + image prompt) |
| Generation | `generate_eli5_explanation` | Standalone ELI5 explainer |
| Generation | `generate_faq_section` | 5-question FAQ for a topic |
| Generation | `generate_meta_tags` | SEO meta + OG + Twitter tags |
| Social | `generate_social_package` | All four social platforms |
| Social | `generate_twitter_thread` | X/Twitter thread only |
| Video | `generate_video_script` | 4-minute long-form script |
| Video | `generate_shorts_script` | 60-second 4-beat script |
| Image | `generate_image_prompts` | Hero / square / vertical / thumbnail prompts |
| SEO | `analyze_seo_score` | Full SEO breakdown |
| SEO | `improve_article_seo` | Score + targeted rewrite suggestions |
| Quality | `quality_evaluate` | Confidence routing + SEO + structural checks |
| Publish | `publish_article` | Move from review to published |
| Publish | `distribution_schedule` | Schedule channel distribution jobs |
| Reporting | `ops_snapshot` | Counts: sources, articles, reviews, jobs |
| Reporting | `get_top_articles` | Recent published articles by category |
| Reporting | `get_content_calendar` | Upcoming scheduled posts + recently published |
| Autonomous | `autonomous_start` | Start scheduler with optional cron expression |
| Autonomous | `autonomous_stop` | Pause the scheduler |
| Autonomous | `autonomous_status` | Next run, last run summary, total counts |
| Autonomous | `autonomous_run_once` | Trigger one full cycle immediately |
| Humanization | `humanize_article` | Re-run anti-AI-trope + cadence pass |

## Walkthrough: end-to-end run via MCP

```
> ops_snapshot              ← baseline counts
> pipeline_run({ dryRun: false, autoPublish: true })
> ops_snapshot              ← compare delta

> get_top_articles({ limit: 3 })
   → returns three published articles with slugs + quality scores

> analyze_seo_score({ slug: "<slug>" })
   → { overall, keyword, title, meta, readability, structure, internalLinks, issues, suggestions }

> generate_shorts_script({ slug: "<slug>" })
   → 4 timed beats with visual cues

> generate_image_prompts({ slug: "<slug>" })
   → { hero, square, vertical, thumbnail }

> get_content_calendar({ daysAhead: 7 })
   → upcoming distribution jobs across all channels
```

## Walkthrough: SEO improvement loop

```
> generate_article({ slug: "<topic-slug>" })
> analyze_seo_score({ slug: "<article-slug>" })
   → notice: overall < 70, missing primary keyword in title, low meta length

> improve_article_seo({ slug: "<article-slug>" })
   → returns { seo, rewrite: { title, metaDescription, suggestions } }

> quality_evaluate({ slug: "<article-slug>" })
   → confidence-routed decision: auto_publish | human_review | regenerate

> publish_article({ slug: "<article-slug>" })          # if confidence ≥ 0.85
> distribution_schedule({ slug: "<article-slug>", dryRun: false })
```

## Walkthrough: content calendar review

```
> get_content_calendar({ daysAhead: 14, daysBack: 7 })
   → upcomingDistributions: [{ articleId, channel, scheduledFor, status, utmUrl }]
   → recentlyPublished:    [{ slug, title, publishedAt, category }]
```

## Tool input schemas

All tools that take an article or topic accept either `articleId`/`topicId` (preferred) or `slug` (convenient when working from MCP shorthand).

| Tool | Required | Optional |
|---|---|---|
| `ingest_run` | — | `rssUrls?: string[]`, `limit?: 1–100`, `dryRun?: boolean` |
| `trending_detect` | — | — |
| `pipeline_run` | — | `dryRun?`, `autoPublish?`, `rssUrls?` |
| `generate_article` | one of | `topicId`, `slug` |
| `generate_eli5_explanation` | one of | `topicId`, `slug` |
| `generate_faq_section` | one of | `topicId`, `slug` |
| `generate_meta_tags` | one of | `articleId`, `slug` |
| `generate_social_package` | one of | `articleId`, `slug` |
| `generate_twitter_thread` | one of | `articleId`, `slug` |
| `generate_video_script` | one of | `topicId`, `slug` |
| `generate_shorts_script` | one of | `topicId`, `slug` |
| `generate_image_prompts` | one of | `topicId`, `slug` |
| `analyze_seo_score` | one of | `articleId`, `slug`, `primaryKeyword?` |
| `improve_article_seo` | one of | `articleId`, `slug`, `primaryKeyword?` |
| `quality_evaluate` | one of | `articleId`, `slug` |
| `publish_article` | one of | `articleId`, `slug` |
| `distribution_schedule` | one of | `articleId`, `slug`, `dryRun?` |
| `ops_snapshot` | — | — |
| `get_top_articles` | — | `limit?: 1–50`, `category?: string` |
| `get_content_calendar` | — | `daysAhead?: 1–60`, `daysBack?: 0–60` |

## Troubleshooting

- **MCP HTTP 404** — POST to `/mcp`, not `/`. Default port `3333`.
- **`Topic not found`** — pass `topicId` or `slug` matching a row in `topics`. Run `pipeline_run` first to seed.
- **`Article not found`** — same; topics generate before articles.
- **Confidence always = `regenerate`** — too few sources, weak SEO, or short article. Check `analyze_seo_score` for specific issues, then re-run `generate_article`.
- **All tools return placeholder text** — local deterministic mode is on. Set `OPENAI_API_KEY` / `GEMINI_API_KEY` / `GROQ_API_KEY` to call real providers (gateway preserves the same MCP signatures).

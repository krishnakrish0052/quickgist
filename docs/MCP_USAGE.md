# QuickGist MCP — v0.1.2 Production Reference

QuickGist exposes **43 tools** over the Model Context Protocol. They drive the full editorial pipeline — ingest, cluster, generate, score, publish, distribute, humanize, analyze, translate, and monitor — using the same service layer as the web app and worker processes.

---

## Connect

### From Claude Code (CLI)

```bash
claude mcp add quickgist -- npm --prefix /home/krishna/quickgist run mcp:stdio
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

---

## Tool index

### Pipeline (5 tools)

| Tool | Purpose | Tier | AI Required |
|---|---|---|---|
| `ingest_run` | Fetch raw items from RSS/manual sources | REAL | No |
| `trending_detect` | Cluster raw items into topics | REAL | No |
| `trending_detect_incremental` | On-the-fly topic detection from new raw items without full pipeline run | REAL | No |
| `pipeline_run` | End-to-end run (ingest → publish → distribute) | REAL | No |
| `pipeline_agent_status` | Live agent lifecycle-stage state during pipeline runs | REAL | No |

### Content Generation (6 tools)

| Tool | Purpose | Tier | AI Required |
|---|---|---|---|
| `generate_article` | Full article package (article + ELI5 + social + script + image prompt). All output goes through humanization + cadence pass — no raw AI text leaks. | HYBRID | Recommended |
| `generate_eli5_explanation` | Standalone ELI5 explainer | HYBRID | Recommended |
| `generate_faq_section` | 5-question FAQ for a topic | HYBRID | Recommended |
| `generate_meta_tags` | SEO meta + OG + Twitter tags | REAL | No |
| `improve_article_seo` | Score + targeted rewrite suggestions | HYBRID | Recommended |
| `humanize_article` | Re-run anti-AI-trope + cadence pass | REAL | No |

### Social (2 tools)

| Tool | Purpose | Tier | AI Required |
|---|---|---|---|
| `generate_social_package` | All four social platforms | REAL | No |
| `generate_twitter_thread` | X/Twitter thread only | REAL | No |

### Video + Image (5 tools)

| Tool | Purpose | Tier | AI Required |
|---|---|---|---|
| `generate_video_script` | 4-minute long-form script with timed sections | HYBRID | Recommended |
| `generate_shorts_script` | 60-second 4-beat Shorts/Reels script | HYBRID | Recommended |
| `generate_image_prompts` | Hero / square / vertical / thumbnail prompts | HYBRID | Recommended |
| `generate_article_image` | AI image generation (DALL-E 3) from article headline + keywords | HYBRID | Recommended |
| `regenerate_image` | Re-generate article image with different style/prompt | HYBRID | Recommended |

### SEO + Quality (8 tools)

| Tool | Purpose | Tier | AI Required |
|---|---|---|---|
| `analyze_seo_score` | Full SEO breakdown (keyword, title, meta, Flesch readability, structure, internal links, word count, image SEO, schema validation, canonical, social meta). All weights adjusted for forgiving deterministic scoring. | REAL | No |
| `analyze_seo_with_ai` | Deterministic SEO + AI deep analysis (search intent, content gaps, semantic keywords, title/meta optimization, competitive angle) | HYBRID | Recommended |
| `quality_evaluate` | Read-only confidence routing + SEO + structural checks. Does NOT mutate articles. | REAL | No |
| `quality_evaluate_with_ai` | Read-only deterministic checks + AI deep analysis (depth score, bias/framing, missing context, fact quality, recommendations) | HYBRID | Recommended |
| `seo_audit_site` | Full-site SEO audit with score distribution, issue detection, and improvement suggestions | REAL | No |
| `analyze_content_quality` | Deep AI content analysis: bias detection, fact density, reading level, entity extraction | HYBRID | Recommended |
| `analyze_traffic_potential` | Estimate traffic/ranking potential for a topic based on keyword volume signals | HYBRID | Recommended |
| `audit_seo_health` | Full-site SEO health: broken links, missing meta, duplicate content, thin content | REAL | No |

### Publish + Distribute (2 tools)

| Tool | Purpose | Tier | AI Required |
|---|---|---|---|
| `publish_article` | Move from review to published | REAL | No |
| `distribution_schedule` | Schedule channel distribution jobs | REAL | No |

### Analytics + Reports (5 tools)

| Tool | Purpose | Tier | AI Required |
|---|---|---|---|
| `analytics_overview` | Daily published counts, category breakdown, pipeline performance, top articles by quality | REAL | No |
| `ops_snapshot` | Counts: sources, articles, reviews, jobs | REAL | No |
| `get_top_articles` | Recent published articles by category | REAL | No |
| `get_content_calendar` | Upcoming scheduled posts + recently published | REAL | No |
| `generate_newsletter_digest` | Compile top-N recent articles into digest format | REAL | No |

### AI Analysis + Content Ops (6 tools)

| Tool | Purpose | Tier | AI Required |
|---|---|---|---|
| `detect_ai_content` | Score article for AI-detectable patterns: slop phrases, sentence length uniformity, trope frequency. Returns human-likelihood score 0-100. | REAL | No |
| `translate_article` | Translate article to target locale with context preservation | HYBRID | Recommended |
| `suggest_related_links` | Find related articles by matching tags and categories | REAL | No |
| `generate_newsletter_brief` | Daily/weekly newsletter compilation from recent articles | HYBRID | Recommended |
| `analyze_content_gaps` | Compare article against top-ranking competitors, identify missing subtopics | HYBRID | Recommended |
| `generate_internal_links` | Suggest internal linking opportunities across articles | REAL | No |

### Autonomous (4 tools)

| Tool | Purpose | Tier | AI Required |
|---|---|---|---|
| `autonomous_start` | Start scheduler with optional cron expression | REAL | No |
| `autonomous_stop` | Pause the scheduler | REAL | No |
| `autonomous_status` | Next run, last run summary, total counts | REAL | No |
| `autonomous_run_once` | Trigger one full cycle immediately | REAL | No |

---

### Tool counts by tier

- **REAL** (no AI, deterministic): 31 tools
- **HYBRID** (AI-powered with deterministic fallback): 12 tools
- **Total**: 43 tools

---

## v0.1.1 → v0.1.2 changes

### New tools (8)

| Tool | What it does |
|---|---|
| `trending_detect_incremental` | On-the-fly topic detection from new raw items without requiring a full pipeline run |
| `generate_article_image` | AI image generation (DALL-E 3) from article headline + keywords, with in-memory caching |
| `regenerate_image` | Re-generate an article image with a different style or prompt |
| `analyze_content_quality` | Deep AI content analysis: bias detection, fact density, reading level, entity extraction |
| `analyze_traffic_potential` | Estimate traffic/ranking potential for a topic based on keyword volume signals |
| `analyze_content_gaps` | Compare article against top-ranking competitors, identify missing subtopics |
| `generate_internal_links` | Suggest internal linking opportunities across existing articles |
| `audit_seo_health` | Full-site SEO audit: broken links, missing meta, duplicate content, thin content |

### Enhanced tools

| Tool | What changed |
|---|---|
| `quality_evaluate` | Now **read-only** — calls `assessQuality()` instead of `evaluateQuality()`. Never mutates article status. |
| `analyze_seo_score` | Added 4 new components: image SEO (alt/lazy/modern formats), schema validation (JSON-LD), canonical URL, social meta (OG/Twitter). Weights redistributed. |
| `generate_article` | Always applies humanizer + cadence improvement + `sanitizeAiOutput()` on output. No raw AI text ever leaks through. |
| `pipeline_agent_status` | Response uses `lifecycle` instead of `subAgents`. No HTTP round-trip needed — reads from in-process tracker directly. |
| `seo_audit_site` | Added hreflang check, canonical verification, schema validation coverage |
| `generate_newsletter_digest` | Renamed from `generate_newsletter_digest`; now uses AI for summary compilation when available |

### Architecture changes

- **In-process workers**: All 8 named agents (Alpha–Hotel) now run as async tasks in the same process, sharing memory directly. No subprocess spawns, no HTTP coordinator, no temp files, no orphan processes.
- **8 agent concurrency**: Memory mode no longer caps at 3 agents. All 8 agents are fully active in all modes. Configurable via `PIPELINE_AGENT_CONCURRENCY`.
- **Per-call AI timeouts**: Each social/video/FAQ sub-task has a 45s timeout so one hanging call doesn't block an agent.
- **Auto-publish at 60+**: Articles with confidence ≥ 0.60 and structural quality ≥ 60 auto-publish. High-risk categories (health, finance, legal, conflict, elections) always require human review.
- **AI image generation**: DALL-E 3 via OpenAI SDK with in-memory caching by prompt hash. Falls back to stock photos when no key is set.
- **i18n fully wired**: All public pages and components use `next-intl` translations. 8 locale files synced.
- **Analytics + AdSense**: In-house view tracking, admin analytics dashboard, real AdSense ad slot rendering.

---

## Walkthrough: production end-to-end

```
> pipeline_run({ autoPublish: true })
   → Full cycle: ingest → cluster → 8-agent concurrent generation → quality → publish → distribution

> pipeline_agent_status
   → Live view: { steps, agents: [{ name, status, currentTopic, lifecycle: [{ type, status }] }] }

> analytics_overview
   → { dailyPublished, categories, topArticles, pipeline: { articlesGenerated, articlesPublished } }

> detect_ai_content({ slug: "<slug>" })
   → { humanLikelihoodScore, verdict, slopPhrasesFound, sentenceStddev, suggestions }

> seo_audit_site
   → { scoreDistribution, issues: { noMetaDescription, shortContent, lowScore }, topCategories }

> audit_seo_health
   → { brokenLinks, missingMeta, duplicateContent, thinContent, hreflangIssues }

> analyze_content_quality({ slug: "<slug>" })
   → { biasScore, factDensity, readingLevel, entities, recommendations }

> translate_article({ slug: "<slug>", locale: "hi" })
   → { translation: "हिंदी अनुवाद...", provider }

> generate_article_image({ slug: "<slug>", style: "hero" })
   → { url: "https://...", provider: "openai-dall-e-3", cached: false }

> suggest_related_links({ slug: "<slug>" })
   → { related: [{ title, slug, relevance }] }

> trending_detect_incremental
   → { newTopics: [...], mergedInto: [...] }
```

## Troubleshooting

- **MCP HTTP 404** — POST to `/mcp`, not `/`. Default port `3333`.
- **`Topic not found`** — pass `topicId` or `slug` matching a row in `topics`. Run `pipeline_run` first to seed.
- **`quality_evaluate` still modifies articles?** — No. Refactored to use `assessQuality()` which is read-only. Only the pipeline's internal `evaluateQuality()` persists results.
- **All tools return placeholder text** — local deterministic mode is on. Set `DEEPSEEK_API_KEY` for real AI output.
- **Social composer stays "running"** — each sub-task now has a 45s timeout. Check logs via `pipeline_agent_status` for which call timed out.
- **Only 3 agents active** — Fixed in v0.1.2. All 8 agents run regardless of storage mode. Check `PIPELINE_AGENT_CONCURRENCY` in `.env`.
- **Image generation fails** — verify `OPENAI_API_KEY` is set for DALL-E 3. Falls back to placeholder images when no key is configured.

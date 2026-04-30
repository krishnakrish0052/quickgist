import Fastify from "fastify";
import { pathToFileURL } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { startScheduler, stopScheduler, isSchedulerRunning } from "@/lib/scheduler/cron";
import { getSchedulerState } from "@/lib/scheduler/state";
import { runPipelineOnce } from "@/lib/scheduler/runner";
import { runIngestion } from "@/lib/services/ingestion";
import { detectTrendingTopics } from "@/lib/services/trend";
import { extractFactClaims } from "@/lib/services/factExtraction";
import {
  generateArticlePackage,
  generateEli5,
  generateFaqSection,
  generateImagePromptPack,
  generateMetaTags,
  generateSeoRewriteSuggestions,
  generateShortsScript,
  generateVideoLongScript
} from "@/lib/services/generation";
import { evaluateQuality } from "@/lib/services/quality";
import { publishArticle } from "@/lib/services/publishing";
import { scheduleDistribution } from "@/lib/services/distribution";
import { getOperationsSnapshot } from "@/lib/services/observability";
import { scoreArticle } from "@/lib/services/seoEngine";
import {
  getArticleById,
  getArticleBySlug,
  getPlatformSnapshot,
  getPublishedArticles,
  getTopicById,
  getTopicBySlug
} from "@/lib/repositories/platformRepository";
import { runContentPipeline } from "@/workers/pipeline";

function content(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2)
      }
    ]
  };
}

async function topicFromArgs(args: { topicId?: string; slug?: string }) {
  const topic = args.topicId ? await getTopicById(args.topicId) : await getTopicBySlug(args.slug ?? "");
  if (!topic) throw new Error("Topic not found");
  return topic;
}

async function articleFromArgs(args: { articleId?: string; slug?: string }) {
  const article = args.articleId
    ? await getArticleById(args.articleId)
    : await getArticleBySlug(args.slug ?? "");
  if (!article) throw new Error("Article not found");
  return article;
}

export function createQuickGistMcpServer() {
  const server = new McpServer({
    name: "quickgist-cos",
    version: "0.2.0"
  });

  // ─── Pipeline / orchestration ─────────────────────────────
  server.registerTool(
    "ingest_run",
    {
      title: "Run ingestion",
      description: "Fetch RSS/manual source records and persist raw items.",
      inputSchema: {
        rssUrls: z.array(z.string().url()).optional(),
        limit: z.number().int().min(1).max(100).optional(),
        dryRun: z.boolean().optional()
      }
    },
    async (args) => content(await runIngestion(args))
  );

  server.registerTool(
    "trending_detect",
    {
      title: "Detect trending topics",
      description: "Cluster persisted raw source records into topic candidates.",
      inputSchema: {}
    },
    async () => content(await detectTrendingTopics())
  );

  server.registerTool(
    "pipeline_run",
    {
      title: "Run full pipeline",
      description: "Run fetch, cluster, generate, quality, optional publish, and distribution.",
      inputSchema: {
        dryRun: z.boolean().optional(),
        autoPublish: z.boolean().optional(),
        rssUrls: z.array(z.string().url()).optional()
      }
    },
    async (args) => content(await runContentPipeline(args))
  );

  // ─── Article generation ──────────────────────────────────
  server.registerTool(
    "generate_article",
    {
      title: "Generate article package",
      description: "Extract facts and generate article, explainer, social pack, script, and image prompt.",
      inputSchema: {
        topicId: z.string().optional(),
        slug: z.string().optional()
      }
    },
    async (args) => {
      const topic = await topicFromArgs(args);
      await extractFactClaims(topic);
      return content(await generateArticlePackage(topic));
    }
  );

  server.registerTool(
    "generate_eli5_explanation",
    {
      title: "Generate ELI5 explainer",
      description: "Produce a plain-English explainer for a topic.",
      inputSchema: {
        topicId: z.string().optional(),
        slug: z.string().optional()
      }
    },
    async (args) => content(await generateEli5(await topicFromArgs(args)))
  );

  server.registerTool(
    "generate_faq_section",
    {
      title: "Generate FAQ",
      description: "Produce a 5-question FAQ block for a topic.",
      inputSchema: {
        topicId: z.string().optional(),
        slug: z.string().optional()
      }
    },
    async (args) => content(await generateFaqSection(await topicFromArgs(args)))
  );

  server.registerTool(
    "generate_meta_tags",
    {
      title: "Generate meta tags",
      description: "Generate SEO meta title, description, OG, and Twitter tags for an article.",
      inputSchema: {
        articleId: z.string().optional(),
        slug: z.string().optional()
      }
    },
    async (args) => content(await generateMetaTags(await articleFromArgs(args)))
  );

  server.registerTool(
    "improve_article_seo",
    {
      title: "Improve article SEO",
      description: "Score the article and return rewrite suggestions for low-scoring fields.",
      inputSchema: {
        articleId: z.string().optional(),
        slug: z.string().optional(),
        primaryKeyword: z.string().optional()
      }
    },
    async (args) => {
      const article = await articleFromArgs(args);
      const topic = await getTopicById(article.topicId);
      const keyword = args.primaryKeyword ?? topic?.keywords[0] ?? article.tags[0] ?? "";
      const seo = scoreArticle(article, keyword);
      const rewrite = await generateSeoRewriteSuggestions(article, keyword, seo.issues.map((i) => i.message));
      return content({ seo, rewrite });
    }
  );

  // ─── Social ───────────────────────────────────────────────
  server.registerTool(
    "generate_social_package",
    {
      title: "Generate social package",
      description: "Return platform-specific social posts (X thread, IG, LinkedIn, WhatsApp).",
      inputSchema: {
        articleId: z.string().optional(),
        slug: z.string().optional()
      }
    },
    async (args) => {
      const article = await articleFromArgs(args);
      return content({ articleId: article.id, slug: article.slug, social: article.socialPack });
    }
  );

  server.registerTool(
    "generate_twitter_thread",
    {
      title: "Generate X/Twitter thread",
      description: "Return only the 5-tweet X/Twitter thread for an article.",
      inputSchema: {
        articleId: z.string().optional(),
        slug: z.string().optional()
      }
    },
    async (args) => {
      const article = await articleFromArgs(args);
      return content({ slug: article.slug, thread: article.socialPack.xThread });
    }
  );

  // ─── Video ────────────────────────────────────────────────
  server.registerTool(
    "generate_video_script",
    {
      title: "Generate long-form video script",
      description: "Produce a 4-minute script with timed sections.",
      inputSchema: {
        topicId: z.string().optional(),
        slug: z.string().optional()
      }
    },
    async (args) => content(await generateVideoLongScript(await topicFromArgs(args)))
  );

  server.registerTool(
    "generate_shorts_script",
    {
      title: "Generate 60s Shorts/Reels script",
      description: "Produce a 4-beat short-form video script.",
      inputSchema: {
        topicId: z.string().optional(),
        slug: z.string().optional()
      }
    },
    async (args) => content(await generateShortsScript(await topicFromArgs(args)))
  );

  // ─── Image ────────────────────────────────────────────────
  server.registerTool(
    "generate_image_prompts",
    {
      title: "Generate image prompts",
      description: "Hero, square, vertical, and thumbnail prompts for media generation.",
      inputSchema: {
        topicId: z.string().optional(),
        slug: z.string().optional()
      }
    },
    async (args) => content(await generateImagePromptPack(await topicFromArgs(args)))
  );

  // ─── SEO / quality ────────────────────────────────────────
  server.registerTool(
    "analyze_seo_score",
    {
      title: "Analyze SEO score",
      description: "Run SEO scoring on an article and return the breakdown.",
      inputSchema: {
        articleId: z.string().optional(),
        slug: z.string().optional(),
        primaryKeyword: z.string().optional()
      }
    },
    async (args) => {
      const article = await articleFromArgs(args);
      const topic = await getTopicById(article.topicId);
      const keyword = args.primaryKeyword ?? topic?.keywords[0];
      return content(scoreArticle(article, keyword));
    }
  );

  server.registerTool(
    "quality_evaluate",
    {
      title: "Evaluate quality",
      description: "Run quality, compliance, and confidence routing checks for an article.",
      inputSchema: {
        articleId: z.string().optional(),
        slug: z.string().optional()
      }
    },
    async (args) => content(await evaluateQuality(await articleFromArgs(args)))
  );

  // ─── Publish + distribute ────────────────────────────────
  server.registerTool(
    "publish_article",
    {
      title: "Publish article",
      description: "Publish an article that has passed quality checks.",
      inputSchema: {
        articleId: z.string().optional(),
        slug: z.string().optional()
      }
    },
    async (args) => {
      const article = await articleFromArgs(args);
      return content(await publishArticle(article.id, "worker"));
    }
  );

  server.registerTool(
    "distribution_schedule",
    {
      title: "Schedule distribution",
      description: "Create dry-run or live distribution jobs for an article.",
      inputSchema: {
        articleId: z.string().optional(),
        slug: z.string().optional(),
        dryRun: z.boolean().optional()
      }
    },
    async (args) => {
      const article = await articleFromArgs(args);
      return content(await scheduleDistribution({ article, dryRun: args.dryRun ?? true }));
    }
  );

  // ─── Read / analytics ────────────────────────────────────
  server.registerTool(
    "ops_snapshot",
    {
      title: "Operations snapshot",
      description: "Return source, topic, article, review, and distribution counts.",
      inputSchema: {}
    },
    async () => content(await getOperationsSnapshot())
  );

  server.registerTool(
    "get_top_articles",
    {
      title: "Get top articles",
      description: "List the most recent published articles, with quality scores and categories.",
      inputSchema: {
        limit: z.number().int().min(1).max(50).optional(),
        category: z.string().optional()
      }
    },
    async (args) => {
      const all = await getPublishedArticles();
      const filtered = args.category
        ? all.filter((article) => article.category.toLowerCase() === args.category!.toLowerCase())
        : all;
      const limit = args.limit ?? 10;
      return content(
        filtered.slice(0, limit).map((article) => ({
          id: article.id,
          slug: article.slug,
          title: article.title,
          category: article.category,
          qualityScore: article.qualityScore,
          publishedAt: article.publishedAt,
          readingMinutes: article.readingMinutes,
          tags: article.tags
        }))
      );
    }
  );

  server.registerTool(
    "get_content_calendar",
    {
      title: "Get content calendar",
      description: "List upcoming distribution jobs and recently published articles within N days.",
      inputSchema: {
        daysAhead: z.number().int().min(1).max(60).optional(),
        daysBack: z.number().int().min(0).max(60).optional()
      }
    },
    async (args) => {
      const daysAhead = args.daysAhead ?? 7;
      const daysBack = args.daysBack ?? 7;
      const now = Date.now();
      const upper = now + daysAhead * 86400000;
      const lower = now - daysBack * 86400000;
      const state = await getPlatformSnapshot();
      const upcoming = state.distributionJobs
        .filter((job) => {
          const t = Date.parse(job.scheduledFor);
          return t >= now && t <= upper;
        })
        .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
      const recent = state.articles
        .filter((article) => {
          if (!article.publishedAt) return false;
          const t = Date.parse(article.publishedAt);
          return t >= lower && t <= now;
        })
        .sort((a, b) => (a.publishedAt ?? "").localeCompare(b.publishedAt ?? ""))
        .reverse();
      return content({
        windowDays: { ahead: daysAhead, back: daysBack },
        upcomingDistributions: upcoming.map((job) => ({
          id: job.id,
          articleId: job.articleId,
          channel: job.channel,
          scheduledFor: job.scheduledFor,
          status: job.status,
          utmUrl: job.utmUrl
        })),
        recentlyPublished: recent.map((article) => ({
          id: article.id,
          slug: article.slug,
          title: article.title,
          publishedAt: article.publishedAt,
          category: article.category
        }))
      });
    }
  );

  // ─── Autonomous orchestration ─────────────────────────────
  server.registerTool(
    "autonomous_start",
    {
      title: "Start autonomous mode",
      description: "Start the autonomous pipeline scheduler with an optional cron expression.",
      inputSchema: {
        cronExpression: z.string().optional()
      }
    },
    async (args) => {
      await startScheduler({ cronExpression: args.cronExpression });
      const state = getSchedulerState();
      return content({ started: true, cronExpression: state.cronExpression, startedAt: state.startedAt });
    }
  );

  server.registerTool(
    "autonomous_stop",
    {
      title: "Stop autonomous mode",
      description: "Pause the autonomous scheduler. Can be restarted at any time.",
      inputSchema: {}
    },
    async () => {
      stopScheduler();
      return content({ stopped: true, stoppedAt: new Date().toISOString() });
    }
  );

  server.registerTool(
    "autonomous_status",
    {
      title: "Get autonomous status",
      description: "Get the current scheduler state: running, cron, last run, next run, totals.",
      inputSchema: {}
    },
    async () => {
      const state = getSchedulerState();
      return content({
        running: state.running,
        cronExpression: state.cronExpression,
        startedAt: state.startedAt,
        lastRunAt: state.lastRunAt,
        lastRunSummary: state.lastRunSummary,
        totalRuns: state.totalRuns,
        totalArticlesPublished: state.totalArticlesPublished
      });
    }
  );

  server.registerTool(
    "autonomous_run_once",
    {
      title: "Trigger one pipeline cycle",
      description: "Manually trigger one full ingest→cluster→generate→publish cycle regardless of schedule.",
      inputSchema: {}
    },
    async () => {
      const summary = await runPipelineOnce();
      return content({ summary, triggeredAt: new Date().toISOString() });
    }
  );

  server.registerTool(
    "humanize_article",
    {
      title: "Humanize article",
      description: "Re-run the anti-AI-trope humanization pass on an existing article's content.",
      inputSchema: {
        articleId: z.string().optional(),
        slug: z.string().optional()
      }
    },
    async (args) => {
      const { humanize, humanizeScore } = await import("@/lib/text/humanizer");
      const { analyzeCadence } = await import("@/lib/text/cadence");
      const article = await articleFromArgs(args);
      const { markdown, tropesRemoved, openersVaried } = humanize(article.contentMarkdown ?? "");
      const score = humanizeScore(markdown);
      const cadence = analyzeCadence(markdown);
      return content({
        articleId: article.id,
        slug: article.slug,
        tropesRemoved,
        openersVaried,
        humanizeScore: score,
        cadenceScore: cadence.score,
        cadenceSuggestions: cadence.suggestions,
        previewChars: markdown.slice(0, 400)
      });
    }
  );

  return server;
}

async function startStdio() {
  const server = createQuickGistMcpServer();
  await server.connect(new StdioServerTransport());
}

async function startHttp() {
  const app = Fastify({ logger: true });

  // SDK 1.x stateless mode: create a fresh transport + server per request
  app.all("/mcp", async (request, reply) => {
    reply.hijack();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    const server = createQuickGistMcpServer();
    await server.connect(transport);
    await transport.handleRequest(request.raw, reply.raw, request.body);
  });

  const port = Number(process.env.MCP_PORT ?? 3333);
  await app.listen({ port, host: "0.0.0.0" });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const mode = process.argv[2] ?? "stdio";
  if (mode === "http") {
    await startHttp();
  } else {
    await startStdio();
  }
}

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
import { detectTrendingTopics, detectTrendingTopicsIncremental } from "@/lib/services/trend";
import { extractFactClaims } from "@/lib/services/factExtraction";
import {
  generateArticlePackage,
  generateEli5,
  generateFaqSection,
  generateImagePromptPack,
  generateMetaTags,
  generateSeoRewriteSuggestions,
  generateShortsScript,
  generateVideoLongScript,
} from "@/lib/services/generation";
import { assessQuality, evaluateQuality } from "@/lib/services/quality";
import { publishArticle } from "@/lib/services/publishing";
import { scheduleDistribution } from "@/lib/services/distribution";
import { getOperationsSnapshot } from "@/lib/services/observability";
import { scoreArticle } from "@/lib/services/seoEngine";
import {
  getArticleById,
  getArticleBySlug,
  getPlatformSnapshot,
  getPublishedArticles,
  getRawItemById,
  getTopicById,
  getTopicBySlug,
  getTopics,
} from "@/lib/repositories/platformRepository";
import { runContentPipeline } from "@/workers/pipeline";
import { getPipelineRunState } from "@/lib/services/pipelineTracker";
import { markdownToPlainText } from "@/lib/utils";
import { routeAiTask } from "@/lib/services/aiOrchestration";
import { analyzeContentQuality, analyzeSEO } from "@/lib/services/aiAnalysis";
import { generateNewsImage } from "@/lib/services/imageGeneration";

function content(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
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
    version: "0.1.2",
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
        dryRun: z.boolean().optional(),
      },
    },
    async (args) => content(await runIngestion(args)),
  );

  server.registerTool(
    "trending_detect",
    {
      title: "Detect trending topics",
      description: "Cluster persisted raw source records into topic candidates.",
      inputSchema: {},
    },
    async () => content(await detectTrendingTopics()),
  );

  server.registerTool(
    "trending_detect_incremental",
    {
      title: "Detect trending topics incrementally",
      description: "Cluster only new/selected raw items into topic candidates, cross-checking against existing topics to avoid duplicates. Useful when new RSS items arrive between pipeline runs.",
      inputSchema: {
        rawItemIds: z.array(z.string()).optional(),
      },
    },
    async (args) => {
      if (args.rawItemIds && args.rawItemIds.length > 0) {
        const resolved = (await Promise.all(args.rawItemIds.map((id) => getRawItemById(id))))
          .filter((item): item is NonNullable<typeof item> => item != null);
        const existingTopics = await getTopics();
        return content(await detectTrendingTopicsIncremental(resolved, existingTopics));
      }
      return content(await detectTrendingTopics());
    },
  );

  server.registerTool(
    "pipeline_run",
    {
      title: "Run full pipeline",
      description: "Run fetch, cluster, generate, quality, optional publish, and distribution.",
      inputSchema: {
        dryRun: z.boolean().optional(),
        autoPublish: z.boolean().optional(),
        rssUrls: z.array(z.string().url()).optional(),
      },
    },
    async (args) => content(await runContentPipeline(args)),
  );

  // ─── Article generation ──────────────────────────────────
  server.registerTool(
    "generate_article",
    {
      title: "Generate article package",
      description: "Extract facts and generate article, explainer, social pack, script, and image prompt.",
      inputSchema: {
        topicId: z.string().optional(),
        slug: z.string().optional(),
      },
    },
    async (args) => {
      const topic = await topicFromArgs(args);
      await extractFactClaims(topic);
      return content(await generateArticlePackage(topic));
    },
  );

  server.registerTool(
    "generate_eli5_explanation",
    {
      title: "Generate ELI5 explainer",
      description: "Produce a plain-English explainer for a topic.",
      inputSchema: {
        topicId: z.string().optional(),
        slug: z.string().optional(),
      },
    },
    async (args) => content(await generateEli5(await topicFromArgs(args))),
  );

  server.registerTool(
    "generate_faq_section",
    {
      title: "Generate FAQ",
      description: "Produce a 5-question FAQ block for a topic.",
      inputSchema: {
        topicId: z.string().optional(),
        slug: z.string().optional(),
      },
    },
    async (args) => content(await generateFaqSection(await topicFromArgs(args))),
  );

  server.registerTool(
    "generate_meta_tags",
    {
      title: "Generate meta tags",
      description: "Generate SEO meta title, description, OG, and Twitter tags for an article.",
      inputSchema: {
        articleId: z.string().optional(),
        slug: z.string().optional(),
      },
    },
    async (args) => content(await generateMetaTags(await articleFromArgs(args))),
  );

  server.registerTool(
    "improve_article_seo",
    {
      title: "Improve article SEO",
      description: "Score the article and return rewrite suggestions for low-scoring fields.",
      inputSchema: {
        articleId: z.string().optional(),
        slug: z.string().optional(),
        primaryKeyword: z.string().optional(),
      },
    },
    async (args) => {
      const article = await articleFromArgs(args);
      const topic = await getTopicById(article.topicId);
      const keyword = args.primaryKeyword ?? topic?.keywords[0] ?? article.tags[0] ?? "";
      const seo = scoreArticle(article, keyword);
      const rewrite = await generateSeoRewriteSuggestions(article, keyword, seo.issues.map((i) => i.message));
      return content({ seo, rewrite });
    },
  );

  // ─── Social ───────────────────────────────────────────────
  server.registerTool(
    "generate_social_package",
    {
      title: "Generate social package",
      description: "Return platform-specific social posts (X thread, IG, LinkedIn, WhatsApp).",
      inputSchema: {
        articleId: z.string().optional(),
        slug: z.string().optional(),
      },
    },
    async (args) => {
      const article = await articleFromArgs(args);
      return content({ articleId: article.id, slug: article.slug, social: article.socialPack });
    },
  );

  server.registerTool(
    "generate_twitter_thread",
    {
      title: "Generate X/Twitter thread",
      description: "Return only the 5-tweet X/Twitter thread for an article.",
      inputSchema: {
        articleId: z.string().optional(),
        slug: z.string().optional(),
      },
    },
    async (args) => {
      const article = await articleFromArgs(args);
      return content({ slug: article.slug, thread: article.socialPack.xThread });
    },
  );

  // ─── Video ────────────────────────────────────────────────
  server.registerTool(
    "generate_video_script",
    {
      title: "Generate long-form video script",
      description: "Produce a 4-minute script with timed sections.",
      inputSchema: {
        topicId: z.string().optional(),
        slug: z.string().optional(),
      },
    },
    async (args) => content(await generateVideoLongScript(await topicFromArgs(args))),
  );

  server.registerTool(
    "generate_shorts_script",
    {
      title: "Generate 60s Shorts/Reels script",
      description: "Produce a 4-beat short-form video script.",
      inputSchema: {
        topicId: z.string().optional(),
        slug: z.string().optional(),
      },
    },
    async (args) => content(await generateShortsScript(await topicFromArgs(args))),
  );

  // ─── Image ────────────────────────────────────────────────
  server.registerTool(
    "generate_image_prompts",
    {
      title: "Generate image prompts",
      description: "Hero, square, vertical, and thumbnail prompts for media generation.",
      inputSchema: {
        topicId: z.string().optional(),
        slug: z.string().optional(),
      },
    },
    async (args) => content(await generateImagePromptPack(await topicFromArgs(args))),
  );

  server.registerTool(
    "generate_article_image",
    {
      title: "Generate AI article image",
      description: "Generate an actual AI image for an article using the configured provider (DALL-E 3) and return the URL. Falls back to a placeholder if no provider key is set.",
      inputSchema: {
        articleId: z.string().optional(),
        slug: z.string().optional(),
        style: z.enum(["hero", "square", "vertical", "thumbnail"]).optional(),
      },
    },
    async (args) => {
      const article = await articleFromArgs(args);
      const style = args.style ?? "hero";
      const image = await generateNewsImage(article.imagePrompt, style);
      return content({
        articleId: article.id,
        slug: article.slug,
        style,
        ...image,
      });
    },
  );

  server.registerTool(
    "regenerate_image",
    {
      title: "Regenerate article image",
      description: "Re-generate an AI image for an article with a different prompt or style. Always calls the provider (bypasses cache).",
      inputSchema: {
        articleId: z.string().optional(),
        slug: z.string().optional(),
        style: z.enum(["hero", "square", "vertical", "thumbnail"]),
        promptOverride: z.string().optional(),
      },
    },
    async (args) => {
      const article = await articleFromArgs(args);
      const prompt = args.promptOverride ?? article.imagePrompt;
      const style = args.style;
      const image = await generateNewsImage(prompt, style, { force: true });
      return content({
        articleId: article.id,
        slug: article.slug,
        style,
        prompt,
        ...image,
      });
    },
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
        primaryKeyword: z.string().optional(),
      },
    },
    async (args) => {
      const article = await articleFromArgs(args);
      const topic = await getTopicById(article.topicId);
      const keyword = args.primaryKeyword ?? topic?.keywords[0];
      return content(scoreArticle(article, keyword));
    },
  );

  server.registerTool(
    "analyze_seo_with_ai",
    {
      title: "Analyze SEO with AI",
      description: "Run deterministic SEO scoring AND AI-powered deep analysis (search intent, content gaps, semantic keywords, title/meta optimization, competitive angle).",
      inputSchema: {
        articleId: z.string().optional(),
        slug: z.string().optional(),
        primaryKeyword: z.string().optional(),
      },
    },
    async (args) => {
      const article = await articleFromArgs(args);
      const topic = await getTopicById(article.topicId);
      const keyword = args.primaryKeyword ?? topic?.keywords[0];
      const seo = scoreArticle(article, keyword);
      const ai = await analyzeSEO(article, keyword);
      return content({ seo, ai });
    },
  );

  server.registerTool(
    "quality_evaluate",
    {
      title: "Evaluate quality",
      description: "Run quality, compliance, and confidence routing checks for an article.",
      inputSchema: {
        articleId: z.string().optional(),
        slug: z.string().optional(),
      },
    },
    async (args) => content(await assessQuality(await articleFromArgs(args))),
  );

  server.registerTool(
    "quality_evaluate_with_ai",
    {
      title: "Evaluate quality with AI",
      description: "Run deterministic quality checks AND AI-powered deep content analysis (depth score, bias/framing assessment, missing context, fact quality, improvement recommendations).",
      inputSchema: {
        articleId: z.string().optional(),
        slug: z.string().optional(),
      },
    },
    async (args) => {
      const article = await articleFromArgs(args);
      const quality = await evaluateQuality(article);
      const ai = await analyzeContentQuality(article);
      return content({ quality, ai });
    },
  );

  // ─── Publish + distribute ────────────────────────────────
  server.registerTool(
    "publish_article",
    {
      title: "Publish article",
      description: "Publish an article that has passed quality checks.",
      inputSchema: {
        articleId: z.string().optional(),
        slug: z.string().optional(),
      },
    },
    async (args) => {
      const article = await articleFromArgs(args);
      return content(await publishArticle(article.id, "worker"));
    },
  );

  server.registerTool(
    "distribution_schedule",
    {
      title: "Schedule distribution",
      description: "Create dry-run or live distribution jobs for an article.",
      inputSchema: {
        articleId: z.string().optional(),
        slug: z.string().optional(),
        dryRun: z.boolean().optional(),
      },
    },
    async (args) => {
      const article = await articleFromArgs(args);
      return content(await scheduleDistribution({ article, dryRun: args.dryRun ?? true }));
    },
  );

  // ─── Read / analytics ────────────────────────────────────
  server.registerTool(
    "ops_snapshot",
    {
      title: "Operations snapshot",
      description: "Return source, topic, article, review, and distribution counts.",
      inputSchema: {},
    },
    async () => content(await getOperationsSnapshot()),
  );

  server.registerTool(
    "get_top_articles",
    {
      title: "Get top articles",
      description: "List the most recent published articles, with quality scores and categories.",
      inputSchema: {
        limit: z.number().int().min(1).max(50).optional(),
        category: z.string().optional(),
      },
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
          tags: article.tags,
        })),
      );
    },
  );

  server.registerTool(
    "get_content_calendar",
    {
      title: "Get content calendar",
      description: "List upcoming distribution jobs and recently published articles within N days.",
      inputSchema: {
        daysAhead: z.number().int().min(1).max(60).optional(),
        daysBack: z.number().int().min(0).max(60).optional(),
      },
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
          utmUrl: job.utmUrl,
        })),
        recentlyPublished: recent.map((article) => ({
          id: article.id,
          slug: article.slug,
          title: article.title,
          publishedAt: article.publishedAt,
          category: article.category,
        })),
      });
    },
  );

  // ─── Autonomous orchestration ─────────────────────────────
  server.registerTool(
    "autonomous_start",
    {
      title: "Start autonomous mode",
      description: "Start the autonomous pipeline scheduler with an optional cron expression.",
      inputSchema: {
        cronExpression: z.string().optional(),
      },
    },
    async (args) => {
      await startScheduler({ cronExpression: args.cronExpression });
      const state = getSchedulerState();
      return content({ started: true, cronExpression: state.cronExpression, startedAt: state.startedAt });
    },
  );

  server.registerTool(
    "autonomous_stop",
    {
      title: "Stop autonomous mode",
      description: "Pause the autonomous scheduler. Can be restarted at any time.",
      inputSchema: {},
    },
    async () => {
      stopScheduler();
      return content({ stopped: true, stoppedAt: new Date().toISOString() });
    },
  );

  server.registerTool(
    "autonomous_status",
    {
      title: "Get autonomous status",
      description: "Get the current scheduler state: running, cron, last run, next run, totals.",
      inputSchema: {},
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
        totalArticlesPublished: state.totalArticlesPublished,
      });
    },
  );

  server.registerTool(
    "autonomous_run_once",
    {
      title: "Trigger one pipeline cycle",
      description: "Manually trigger one full ingest→cluster→generate→publish cycle regardless of schedule.",
      inputSchema: {},
    },
    async () => {
      const summary = await runPipelineOnce();
      return content({ summary, triggeredAt: new Date().toISOString() });
    },
  );

  server.registerTool(
    "humanize_article",
    {
      title: "Humanize article",
      description: "Re-run the anti-AI-trope humanization pass on an existing article's content.",
      inputSchema: {
        articleId: z.string().optional(),
        slug: z.string().optional(),
      },
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
        previewChars: markdown.slice(0, 400),
      });
    },
  );

  server.registerTool(
    "pipeline_agent_status",
    {
      title: "Get pipeline agent status",
      description: "Return the current agent dispatch state with per-agent lifecycle-stage progress, counters, and step details.",
      inputSchema: {},
    },
    async () => {
      const state = getPipelineRunState();
      return content({
        runId: state.runId,
        status: state.status,
        dryRun: state.dryRun,
        autoPublish: state.autoPublish,
        elapsed: state.startedAt
          ? Math.round((Date.now() - new Date(state.startedAt).getTime()) / 1000)
          : 0,
        steps: state.steps.map((s) => ({
          id: s.id,
          label: s.label,
          status: s.status,
          detail: s.detail,
          count: s.count,
        })),
        agents: state.agents.map((a) => ({
          agentId: a.agentId,
          agentName: a.agentName,
          status: a.status,
          currentTopicTitle: a.currentTopicTitle,
          topicsCompleted: a.topicsCompleted,
          topicsFailed: a.topicsFailed,
          lifecycle: a.lifecycle.map((l) => ({
            type: l.type,
            status: l.status,
            detail: l.detail,
          })),
          error: a.error,
        })),
        counters: {
          feedsAttempted: state.feedsAttempted,
          feedsSucceeded: state.feedsSucceeded,
          rawItemsFetched: state.rawItemsFetched,
          topicsClustered: state.topicsClustered,
          articlesGenerated: state.articlesGenerated,
          articlesPublished: state.articlesPublished,
          qualityFailures: state.qualityFailures,
        },
      });
    },
  );


  // ── New v0.1.2 tools: Analytics, SEO, Translation, Agents ─

  server.registerTool(
    "analytics_overview",
    {
      title: "Analytics overview",
      description: "Return page view statistics, top content by quality, category breakdown, and pipeline performance metrics.",
      inputSchema: {},
    },
    async () => {
      const state = await getPlatformSnapshot();
      const pipelines = getPipelineRunState();

      // Compute daily article counts from the last 7 days
      const now = new Date();
      const dailyCounts: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        dailyCounts[key] = state.articles.filter((a) => {
          const pub = a.publishedAt ?? a.createdAt;
          return pub && pub.slice(0, 10) === key;
        }).length;
      }

      // Category breakdown
      const categoryBreakdown: Record<string, number> = {};
      for (const a of state.articles) {
        categoryBreakdown[a.category] = (categoryBreakdown[a.category] ?? 0) + 1;
      }

      return content({
        dailyPublished: dailyCounts,
        totalArticles: state.articles.length,
        totalPublished: state.articles.filter((a) => a.status === "published").length,
        categories: categoryBreakdown,
        pipeline: {
          status: pipelines.status,
          lastRunId: pipelines.runId,
          totalGenerated: pipelines.articlesGenerated,
          totalPublished: pipelines.articlesPublished,
          qualityFailures: pipelines.qualityFailures,
          agentsActive: pipelines.agents.filter((a) => a.status === "working").length,
          agentsTotal: pipelines.agents.length,
        },
        topArticles: state.articles
          .sort((a, b) => (b.qualityScore ?? 0) - (a.qualityScore ?? 0))
          .slice(0, 10)
          .map((a) => ({
            id: a.id,
            title: a.title.slice(0, 60),
            category: a.category,
            qualityScore: a.qualityScore,
            status: a.status,
            publishedAt: a.publishedAt,
          })),
      });
    },
  );

  server.registerTool(
    "seo_audit_site",
    {
      title: "SEO site audit",
      description: "Full-site SEO audit: article count by score range, missing metadata, keyword coverage, and improvement suggestions.",
      inputSchema: {},
    },
    async () => {
      const state = await getPlatformSnapshot();
      const articles = state.articles;

      const scoreRanges = { critical: 0, poor: 0, fair: 0, good: 0, excellent: 0 };
      const missingMeta = { noMetaDescription: 0, shortContent: 0, lowScore: 0 };

      for (const article of articles) {
        const score = article.qualityScore ?? 0;
        if (score < 30) scoreRanges.critical++;
        else if (score < 50) scoreRanges.poor++;
        else if (score < 65) scoreRanges.fair++;
        else if (score < 80) scoreRanges.good++;
        else scoreRanges.excellent++;

        if (!article.metaDescription || article.metaDescription.length < 80) missingMeta.noMetaDescription++;
        if (article.readingMinutes < 2) missingMeta.shortContent++;
        if (article.qualityScore < 50) missingMeta.lowScore++;
      }

      const topCategories = Object.entries(
        articles.reduce<Record<string, number>>((acc, a) => {
          acc[a.category] = (acc[a.category] ?? 0) + 1;
          return acc;
        }, {}),
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

      return content({
        totalArticles: articles.length,
        publishedArticles: articles.filter((a) => a.status === "published").length,
        averageQuality: Math.round(articles.reduce((s, a) => s + (a.qualityScore ?? 0), 0) / Math.max(1, articles.length)),
        scoreDistribution: scoreRanges,
        issues: missingMeta,
        topCategories,
        suggestions: [
          missingMeta.noMetaDescription > 0 ? `${missingMeta.noMetaDescription} articles need meta descriptions` : null,
          missingMeta.shortContent > 0 ? `${missingMeta.shortContent} articles are under 2 min reading time` : null,
          missingMeta.lowScore > 0 ? `${missingMeta.lowScore} articles scored below 50 — review quality pipeline` : null,
          `Publish more articles in ${topCategories[0]?.[0] ?? "N/A"} — your strongest category`,
        ].filter(Boolean),
      });
    },
  );

  server.registerTool(
    "translate_article",
    {
      title: "Translate article",
      description: "Translate a published article into a target locale with context preservation.",
      inputSchema: {
        articleId: z.string().optional(),
        slug: z.string().optional(),
        locale: z.enum(["hi", "es", "fr", "de", "ja", "pt", "ar"]),
      },
    },
    async (args) => {
      const article = args.articleId
        ? await getArticleById(args.articleId)
        : await getArticleBySlug(args.slug ?? "");
      if (!article) throw new Error("Article not found");

      const targetLocale = args.locale;
      const prompt = `Translate the following news article into ${targetLocale}. Preserve all factual claims, source names, URLs, and dates. Adapt cultural references appropriately. Return the translation as a JSON object with: title, metaDescription, dek, contentMarkdown.

Title: ${article.title}
Meta: ${article.metaDescription}
Dek: ${article.dek}
Content:
${article.contentMarkdown.slice(0, 3000)}`;

      const ai = await routeAiTask({
        task: "article",
        prompt,
        maxTokens: 3000,
        temperature: 0.3,
        traceId: `translate-${article.id}-${targetLocale}`,
      });

      return content({
        articleId: article.id,
        slug: article.slug,
        locale: targetLocale,
        translation: ai.output,
        provider: ai.provider,
        note: ai.provider === "deterministic" ? "Deterministic mode — set DEEPSEEK_API_KEY for real translations" : undefined,
      });
    },
  );

  server.registerTool(
    "detect_ai_content",
    {
      title: "Detect AI-generated patterns",
      description: "Score an article for AI-detectable patterns: slop phrases, cadence uniformity, trope frequency.",
      inputSchema: {
        articleId: z.string().optional(),
        slug: z.string().optional(),
      },
    },
    async (args) => {
      const article = args.articleId
        ? await getArticleById(args.articleId)
        : await getArticleBySlug(args.slug ?? "");
      if (!article) throw new Error("Article not found");

      const text = article.contentMarkdown ?? "";
      const plainText = markdownToPlainText(text);
      const words = plainText.split(/\s+/).filter(Boolean);

      // AI slop phrase detection
      const slopPatterns = [
        /delve/i, /tapestry/i, /navigate\s+(the|this)/i,
        /landscape/i, /moreover/i, /furthermore/i,
        /in today'?s/i, /it'?s worth noting/i,
        /a testament to/i, /not only that but/i,
        /in the grand scheme/i, /fast[- ]?paced/i,
        /ever[- ]?changing/i, /digital age/i,
        /in this article/i, /as we (delve|explore|uncover)/i,
        /let'?s dive/i, /without further ado/i,
        /certainly!?/i, /of course!?/i,
        /i'?d be happy to/i,
      ];

      const slopHits: string[] = [];
      for (const pattern of slopPatterns) {
        if (pattern.test(text)) {
          slopHits.push(pattern.source);
        }
      }

      // Sentence length uniformity (burstiness check)
      const sentences = text.split(/[.!?]+\s+/).filter((s) => s.trim().length > 10);
      const sentLengths = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
      const avgLength = sentLengths.reduce((a, b) => a + b, 0) / Math.max(1, sentLengths.length);
      const variance =
        sentLengths.reduce((sum, l) => sum + (l - avgLength) ** 2, 0) / Math.max(1, sentLengths.length);
      const stddev = Math.sqrt(variance);

      const aiScore = Math.round(
        (slopHits.length > 3 ? 40 : slopHits.length > 1 ? 60 : 80) * 0.4 +
          (stddev < 4 ? 30 : stddev < 7 ? 60 : 85) * 0.3 +
          (text.length > 1500 ? 80 : text.length > 800 ? 60 : 30) * 0.3,
      );

      return content({
        title: article.title,
        wordCount: words.length,
        sentenceCount: sentences.length,
        avgSentenceLength: Math.round(avgLength * 10) / 10,
        sentenceStddev: Math.round(stddev * 10) / 10,
        slopPhrasesFound: slopHits,
        slopCount: slopHits.length,
        humanLikelihoodScore: Math.max(0, Math.min(100, aiScore)),
        verdict: aiScore >= 70 ? "likely human-written" : aiScore >= 45 ? "mixed signals" : "likely AI-generated",
        suggestions:
          aiScore < 70
            ? [
                stddev < 4 ? "Vary sentence length more — aim for stddev > 5" : null,
                slopHits.length > 2 ? `Replace ${slopHits.length} AI-typical phrases with natural alternatives` : null,
                text.length < 800 ? "Expand to at least 800 words for substantive content" : null,
              ].filter(Boolean)
            : [],
      });
    },
  );

  server.registerTool(
    "generate_newsletter_digest",
    {
      title: "Generate newsletter digest",
      description: "Compile top published articles into a newsletter digest format with summaries.",
      inputSchema: {
        limit: z.number().int().min(1).max(20).optional(),
        daysBack: z.number().int().min(1).max(30).optional(),
      },
    },
    async (args) => {
      const limit = args.limit ?? 5;
      const daysBack = args.daysBack ?? 7;
      const cutoff = new Date(Date.now() - daysBack * 86400000).toISOString();

      const articles = (await getPublishedArticles())
        .filter((a) => a.publishedAt && a.publishedAt >= cutoff)
        .slice(0, limit);

      return content({
        date: new Date().toISOString().slice(0, 10),
        articleCount: articles.length,
        digest: articles.map((a) => ({
          title: a.title,
          slug: a.slug,
          category: a.category,
          summary: a.dek || a.metaDescription?.slice(0, 150),
          readingMinutes: a.readingMinutes,
          qualityScore: a.qualityScore,
        })),
        generatedAt: new Date().toISOString(),
      });
    },
  );

  server.registerTool(
    "suggest_related_links",
    {
      title: "Suggest related internal links",
      description: "Find related articles for a given article based on matching tags and categories.",
      inputSchema: {
        articleId: z.string().optional(),
        slug: z.string().optional(),
        maxLinks: z.number().int().min(1).max(10).optional(),
      },
    },
    async (args) => {
      const article = args.articleId
        ? await getArticleById(args.articleId)
        : await getArticleBySlug(args.slug ?? "");
      if (!article) throw new Error("Article not found");

      const all = await getPublishedArticles();
      const maxLinks = args.maxLinks ?? 5;

      const scored = all
        .filter((a) => a.id !== article.id)
        .map((a) => {
          let score = 0;
          if (a.category === article.category) score += 3;
          const tagOverlap = a.tags.filter((t) => article.tags.includes(t)).length;
          score += tagOverlap * 2;
          return { article: a, relevance: score };
        })
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, maxLinks);

      return content({
        sourceArticle: { id: article.id, title: article.title, slug: article.slug, category: article.category, tags: article.tags },
        related: scored.map((s) => ({
          id: s.article.id,
          title: s.article.title,
          slug: s.article.slug,
          category: s.article.category,
          tags: s.article.tags,
          relevance: s.relevance,
          qualityScore: s.article.qualityScore,
        })),
      });
    },
  );

  // ── Phase 7: Content analysis, traffic, newsletter, gaps, links, SEO health ──

  server.registerTool(
    "analyze_content_quality",
    {
      title: "Analyze content quality with AI",
      description: "Deep AI content analysis: bias detection, fact density, reading level, entity extraction.",
      inputSchema: {
        articleId: z.string().optional(),
        slug: z.string().optional(),
      },
    },
    async (args) => {
      const article = await articleFromArgs(args);
      const prompt = `Analyze this article for content quality. Return a JSON object with:
- biasIndicators: array of potential bias signals detected (loaded language, one-sided framing, missing perspectives)
- factDensityScore: number 1-10 estimating how factually dense the content is
- readingLevel: estimated reading grade level (e.g., "8th grade", "college")
- entities: key entities mentioned in the article (people, organizations, places, products)
- qualityFlags: array of quality concerns found (unsupported claims, vague language, logical gaps, hedge words)

Article title: ${article.title}
Article category: ${article.category}
Article content:
${article.contentMarkdown?.slice(0, 5000)}`;

      const ai = await routeAiTask({
        task: "article",
        prompt,
        maxTokens: 1500,
        temperature: 0.2,
        traceId: `content-quality-${article.id}`,
      });

      const raw = ai.output;
      let parsed: Record<string, unknown> | null = null;
      try {
        const start = raw.indexOf("{");
        const end = raw.lastIndexOf("}");
        if (start !== -1 && end !== -1) {
          parsed = JSON.parse(raw.slice(start, end + 1));
        }
      } catch {
        // fall through — return raw output
      }

      return content({
        articleId: article.id,
        slug: article.slug,
        ...(parsed ?? {}),
        rawOutput: parsed ? undefined : raw,
        provider: ai.provider,
      });
    },
  );

  server.registerTool(
    "analyze_traffic_potential",
    {
      title: "Analyze traffic potential",
      description: "Estimate traffic and ranking potential for a topic or keyword.",
      inputSchema: {
        topicId: z.string().optional(),
        keyword: z.string().optional(),
        category: z.string().optional(),
      },
    },
    async (args) => {
      let keyword = args.keyword;
      let category = args.category;

      if (args.topicId) {
        const topic = await getTopicById(args.topicId);
        if (!topic) throw new Error("Topic not found");
        keyword = keyword ?? topic.keywords[0] ?? topic.title;
        category = category ?? topic.category;
      }

      if (!keyword) throw new Error("keyword or topicId is required");

      const prompt = `Estimate the traffic and ranking potential for the keyword "${keyword}"${category ? ` in the "${category}" category` : ""}. Return a JSON object with:
- estimatedVolume: estimated monthly search volume range (e.g., "500-1000")
- competition: one of "low", "medium", or "high"
- rankingDifficulty: numeric score 1-100
- suggestedKeywords: array of 5 related long-tail keywords with an estimated volume for each
- trafficEstimate: summary paragraph explaining the traffic potential

Base estimates on topical authority signals and content competitiveness, not actual search engine data.`;

      const ai = await routeAiTask({
        task: "article",
        prompt,
        maxTokens: 800,
        temperature: 0.3,
        traceId: `traffic-${keyword.slice(0, 30)}`,
      });

      const raw = ai.output;
      let parsed: Record<string, unknown> | null = null;
      try {
        const start = raw.indexOf("{");
        const end = raw.lastIndexOf("}");
        if (start !== -1 && end !== -1) {
          parsed = JSON.parse(raw.slice(start, end + 1));
        }
      } catch {
        // fall through
      }

      return content({
        keyword,
        category: category ?? null,
        ...(parsed ?? {}),
        rawOutput: parsed ? undefined : raw,
        provider: ai.provider,
      });
    },
  );

  server.registerTool(
    "generate_newsletter_brief",
    {
      title: "Generate newsletter brief",
      description: "Daily or weekly newsletter compilation from recent published articles with subject line, HTML, and plain text.",
      inputSchema: {
        daysBack: z.number().int().min(1).max(30).optional(),
        limit: z.number().int().min(1).max(20).optional(),
      },
    },
    async (args) => {
      const daysBack = args.daysBack ?? 1;
      const limit = args.limit ?? 5;
      const cutoff = new Date(Date.now() - daysBack * 86400000).toISOString();

      const articles = (await getPublishedArticles())
        .filter((a) => a.publishedAt && a.publishedAt >= cutoff)
        .slice(0, limit);

      const dateStr = new Date().toISOString().slice(0, 10);

      if (articles.length === 0) {
        return content({
          subject: `QuickGist Brief — ${dateStr} (No articles)`,
          html: "<p>No articles published in the selected period.</p>",
          text: "No articles published in the selected period.",
          articleCount: 0,
        });
      }

      const subject = `QuickGist Brief — ${dateStr}`;

      const textLines = articles
        .map(
          (a, i) =>
            `${i + 1}. ${a.title}\n   ${a.dek || a.metaDescription?.slice(0, 150) || ""}\n   Read: /news/${a.slug}`,
        )
        .join("\n\n");
      const text = `${subject}\n\n${textLines}\n\n---\nCurated by QuickGist AI`;

      const htmlItems = articles
        .map(
          (a) =>
            `<tr><td style="padding:12px;border-bottom:1px solid #eee">
        <h3 style="margin:0 0 4px"><a href="/news/${a.slug}">${a.title}</a></h3>
        <p style="margin:0;color:#555">${a.dek || a.metaDescription?.slice(0, 150) || ""}</p>
        <small style="color:#999">${a.readingMinutes} min read • ${a.category}</small>
      </td></tr>`,
        )
        .join("");
      const html = `<html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <h2>${subject}</h2>
      <table style="width:100%;border-collapse:collapse">${htmlItems}</table>
      <p style="color:#999;font-size:12px;margin-top:20px">Curated by QuickGist AI</p>
    </body></html>`;

      return content({
        subject,
        html,
        text,
        articleCount: articles.length,
      });
    },
  );

  server.registerTool(
    "analyze_content_gaps",
    {
      title: "Analyze content gaps",
      description: "Compare an article against what competing content likely covers, and identify missing subtopics and angles.",
      inputSchema: {
        articleId: z.string().optional(),
        slug: z.string().optional(),
        competitorKeywords: z.array(z.string()).optional(),
      },
    },
    async (args) => {
      const article = await articleFromArgs(args);
      const competitors = args.competitorKeywords ?? [];

      const prompt = `Analyze this article for content gaps compared to what competing articles likely cover. Return a JSON object with:
- missingTopics: array of subtopics or angles this article does not address but competitors would
- suggestedAdditions: array of specific paragraphs, data points, or sections that would improve comprehensiveness
- competitorAngles: array of alternative framings a competing article might use to differentiate
- coverageScore: number 1-10 rating how comprehensively this article covers the topic

Article title: ${article.title}
Article category: ${article.category}
Article tags: ${article.tags.join(", ")}
Article content:
${article.contentMarkdown?.slice(0, 4000)}
${competitors.length > 0 ? `\nCompetitor keywords to consider: ${competitors.join(", ")}` : ""}`;

      const ai = await routeAiTask({
        task: "article",
        prompt,
        maxTokens: 1500,
        temperature: 0.3,
        traceId: `content-gap-${article.id}`,
      });

      const raw = ai.output;
      let parsed: Record<string, unknown> | null = null;
      try {
        const start = raw.indexOf("{");
        const end = raw.lastIndexOf("}");
        if (start !== -1 && end !== -1) {
          parsed = JSON.parse(raw.slice(start, end + 1));
        }
      } catch {
        // fall through
      }

      return content({
        articleId: article.id,
        slug: article.slug,
        ...(parsed ?? {}),
        rawOutput: parsed ? undefined : raw,
        provider: ai.provider,
      });
    },
  );

  server.registerTool(
    "generate_internal_links",
    {
      title: "Generate internal links",
      description: "Suggest internal linking opportunities using Jaccard similarity on keyword and category overlap.",
      inputSchema: {
        articleId: z.string().optional(),
        slug: z.string().optional(),
        limit: z.number().int().min(1).max(20).optional(),
      },
    },
    async (args) => {
      const article = await articleFromArgs(args);
      const limit = args.limit ?? 10;

      const all = await getPublishedArticles();

      const jaccard = (a: Set<string>, b: Set<string>): number => {
        const intersection = new Set([...a].filter((x) => b.has(x)));
        const union = new Set([...a, ...b]);
        return union.size === 0 ? 0 : intersection.size / union.size;
      };

      const sourceKeywords = new Set([...article.tags, article.category].filter(Boolean));

      const scored = all
        .filter((a) => a.id !== article.id)
        .map((a) => {
          const targetKeywords = new Set([...a.tags, a.category].filter(Boolean));
          const relevanceScore = jaccard(sourceKeywords, targetKeywords);
          let anchorText = a.title.split(":")[0].split(" - ")[0].trim();
          if (anchorText.length > 60) anchorText = anchorText.slice(0, 57) + "...";
          return {
            targetArticleId: a.id,
            targetTitle: a.title,
            anchorText,
            relevanceScore: Math.round(relevanceScore * 100) / 100,
          };
        })
        .filter((s) => s.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);

      return content({
        sourceArticle: { id: article.id, title: article.title, slug: article.slug },
        suggestions: scored,
      });
    },
  );

  server.registerTool(
    "audit_seo_health",
    {
      title: "Audit SEO health",
      description: "Full-site SEO health audit: broken internal links, missing meta, thin content, missing images, duplicate titles.",
      inputSchema: {
        category: z.string().optional(),
      },
    },
    async (args) => {
      let articles = await getPublishedArticles();

      if (args.category) {
        const cat = args.category;
        articles = articles.filter(
          (a) => a.category.toLowerCase() === cat.toLowerCase(),
        );
      }

      // Missing meta descriptions (shorter than 60 chars)
      const missingMeta = articles.filter(
        (a) => !a.metaDescription || a.metaDescription.length < 60,
      );

      // Thin content (fewer than 700 words)
      const thinContent = articles.filter((a) => {
        const wordCount = (a.contentMarkdown ?? "").split(/\s+/).filter(Boolean).length;
        return wordCount < 700;
      });

      // Missing hero images
      const missingImages = articles.filter((a) => !a.heroImageUrl);

      // Duplicate titles check
      const titleCounts = new Map<string, number>();
      for (const a of articles) {
        const normalized = a.title.toLowerCase().trim();
        titleCounts.set(normalized, (titleCounts.get(normalized) ?? 0) + 1);
      }
      const duplicateTitles = [...titleCounts.entries()]
        .filter(([, count]) => count > 1)
        .map(([title, count]) => ({ title, occurrences: count }));

      // Broken internal links check: scan markdown links pointing to /news/, /explain/, /category/
      const allSlugs = new Set(articles.map((a) => a.slug));
      const brokenLinks: {
        articleId: string;
        articleTitle: string;
        brokenUrl: string;
      }[] = [];
      for (const a of articles) {
        const content = a.contentMarkdown ?? "";
        const linkMatches = content.matchAll(
          /\[([^\]]+)\]\(\/(news|explain|category)\/([^)\s]+)\)/g,
        );
        for (const match of linkMatches) {
          const linkedSlug = match[3];
          if (!allSlugs.has(linkedSlug) && linkedSlug !== a.slug) {
            brokenLinks.push({
              articleId: a.id,
              articleTitle: a.title.slice(0, 80),
              brokenUrl: `/${match[2]}/${linkedSlug}`,
            });
          }
        }
      }

      const issuesFound =
        missingMeta.length +
        thinContent.length +
        missingImages.length +
        duplicateTitles.length +
        brokenLinks.length;

      const overallHealthScore = Math.min(
        100,
        Math.max(0, Math.round(100 - issuesFound * 2)),
      );

      return content({
        totalArticles: articles.length,
        issuesFound,
        brokenLinks,
        missingMeta: missingMeta.map((a) => ({
          id: a.id,
          title: a.title.slice(0, 80),
          metaDescription: a.metaDescription ?? "(none)",
        })),
        thinContent: thinContent.map((a) => ({
          id: a.id,
          title: a.title.slice(0, 80),
          wordCount: (a.contentMarkdown ?? "").split(/\s+/).filter(Boolean).length,
        })),
        missingImages: missingImages.map((a) => ({
          id: a.id,
          title: a.title.slice(0, 80),
        })),
        duplicateTitles,
        overallHealthScore,
      });
    },
  );

  return server;
}

async function startStdio() {
  const server = createQuickGistMcpServer();
  await server.connect(new StdioServerTransport());
}

async function startHttp() {
  const app = Fastify({ logger: true });

  app.all("/mcp", async (request, reply) => {
    reply.hijack();
    // StreamableHTTP transport manages sessions internally in SDK 1.x
    const transport = new StreamableHTTPServerTransport();
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

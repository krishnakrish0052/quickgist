import { AdminNav } from "@/components/AdminNav";
import { config } from "@/lib/config";
import { getOperationsSnapshot } from "@/lib/services/observability";
import { getPlatformSnapshot } from "@/lib/repositories/platformRepository";
import { getSchedulerState } from "@/lib/scheduler/state";
import { pingDatabase } from "@/lib/db/client";
import {
  Activity, CheckCircle2, Cpu, Layers, Radio, Server, Timer, Wrench,
  FileText, Share2, Video, Image, Search, ShieldCheck, Send,
  BookOpen, BarChart4, Globe, Clock, Zap, AlertCircle
} from "lucide-react";

export const dynamic = "force-dynamic";

// ─── Static tool catalog ──────────────────────────────────────────────
interface ToolEntry {
  name: string;
  title: string;
  description: string;
  category: "pipeline" | "generation" | "social" | "video" | "image" | "seo" | "quality" | "content" | "publish" | "read" | "autonomous";
  tier: "REAL" | "HYBRID";
  inputs: string;
}

const TOOLS: ToolEntry[] = [
  // Pipeline
  { name: "ingest_run", title: "Run ingestion", description: "Fetch RSS/manual source records and persist raw items.", category: "pipeline", tier: "REAL", inputs: "rssUrls?, limit?, dryRun?" },
  { name: "trending_detect", title: "Detect trending topics", description: "Cluster persisted raw source records into topic candidates.", category: "pipeline", tier: "REAL", inputs: "none" },
  { name: "trending_detect_incremental", title: "Detect topics incrementally", description: "On-the-fly topic detection from new raw items without a full pipeline run.", category: "pipeline", tier: "REAL", inputs: "none" },
  { name: "pipeline_run", title: "Run full pipeline", description: "Fetch, cluster, generate, quality, publish, and distribute.", category: "pipeline", tier: "REAL", inputs: "dryRun?, autoPublish?, rssUrls?" },
  { name: "pipeline_agent_status", title: "Agent status", description: "Live agent lifecycle-stage state during pipeline runs.", category: "pipeline", tier: "REAL", inputs: "none" },
  // Generation
  { name: "generate_article", title: "Generate article package", description: "Extract facts and generate article, explainer, social, script, and image prompt.", category: "generation", tier: "HYBRID", inputs: "topicId? | slug?" },
  { name: "generate_eli5_explanation", title: "Generate ELI5 explainer", description: "Produce a plain-English explainer for a topic.", category: "generation", tier: "HYBRID", inputs: "topicId? | slug?" },
  { name: "generate_faq_section", title: "Generate FAQ", description: "Produce a 5-question FAQ block for a topic.", category: "generation", tier: "HYBRID", inputs: "topicId? | slug?" },
  { name: "generate_meta_tags", title: "Generate meta tags", description: "Generate SEO meta title, description, OG, and Twitter tags.", category: "generation", tier: "REAL", inputs: "articleId? | slug?" },
  { name: "improve_article_seo", title: "Improve article SEO", description: "Score the article and return rewrite suggestions.", category: "generation", tier: "HYBRID", inputs: "articleId? | slug?, primaryKeyword?" },
  { name: "humanize_article", title: "Humanize article", description: "Re-run the anti-AI-trope humanization pass on an article.", category: "generation", tier: "REAL", inputs: "articleId? | slug?" },
  // Social
  { name: "generate_social_package", title: "Generate social package", description: "Return platform-specific social posts (X, IG, LinkedIn, WhatsApp).", category: "social", tier: "REAL", inputs: "articleId? | slug?" },
  { name: "generate_twitter_thread", title: "Generate X/Twitter thread", description: "Return the 5-tweet X/Twitter thread for an article.", category: "social", tier: "REAL", inputs: "articleId? | slug?" },
  // Video + Image
  { name: "generate_video_script", title: "Generate video script", description: "Produce a 4-minute script with timed sections.", category: "video", tier: "HYBRID", inputs: "topicId? | slug?" },
  { name: "generate_shorts_script", title: "Generate 60s Shorts script", description: "Produce a 4-beat short-form video script.", category: "video", tier: "HYBRID", inputs: "topicId? | slug?" },
  { name: "generate_image_prompts", title: "Generate image prompts", description: "Hero, square, vertical, and thumbnail prompts.", category: "image", tier: "HYBRID", inputs: "topicId? | slug?" },
  { name: "generate_article_image", title: "Generate article image", description: "AI image generation (DALL-E 3) from article headline and keywords.", category: "image", tier: "HYBRID", inputs: "articleId? | slug?, style?" },
  { name: "regenerate_image", title: "Regenerate image", description: "Re-generate an article image with a different style or prompt.", category: "image", tier: "HYBRID", inputs: "articleId? | slug?, style?" },
  // SEO
  { name: "analyze_seo_score", title: "Analyze SEO score", description: "Run SEO scoring with image, schema, canonical, and social meta checks.", category: "seo", tier: "REAL", inputs: "articleId? | slug?, primaryKeyword?" },
  { name: "analyze_seo_with_ai", title: "SEO + AI deep analysis", description: "Deterministic scoring PLUS AI: search intent, content gaps, semantic keywords, competitive angle.", category: "seo", tier: "HYBRID", inputs: "articleId? | slug?, primaryKeyword?" },
  { name: "seo_audit_site", title: "SEO audit site", description: "Full-site SEO audit with score distribution, issues, and improvement suggestions.", category: "seo", tier: "REAL", inputs: "none" },
  { name: "audit_seo_health", title: "SEO health audit", description: "Full-site SEO health: broken links, missing meta, duplicate content, thin content.", category: "seo", tier: "REAL", inputs: "none" },
  // Quality
  { name: "quality_evaluate", title: "Evaluate quality", description: "Read-only confidence routing + SEO + structural checks. Does not mutate articles.", category: "quality", tier: "REAL", inputs: "articleId? | slug?" },
  { name: "quality_evaluate_with_ai", title: "Quality + AI deep analysis", description: "Deterministic checks PLUS AI: depth score, bias/framing, fact quality, recommendations.", category: "quality", tier: "HYBRID", inputs: "articleId? | slug?" },
  { name: "analyze_content_quality", title: "Analyze content quality", description: "Deep AI content analysis: bias detection, fact density, reading level, entity extraction.", category: "quality", tier: "HYBRID", inputs: "articleId? | slug?" },
  // Publish
  { name: "publish_article", title: "Publish article", description: "Publish an article that has passed quality checks.", category: "publish", tier: "REAL", inputs: "articleId? | slug?" },
  { name: "distribution_schedule", title: "Schedule distribution", description: "Create dry-run or live distribution jobs.", category: "publish", tier: "REAL", inputs: "articleId? | slug?, dryRun?" },
  // Content Ops
  { name: "analyze_traffic_potential", title: "Traffic potential", description: "Estimate traffic/ranking potential for a topic based on keyword volume signals.", category: "content", tier: "HYBRID", inputs: "topicId? | slug?, keywords?" },
  { name: "analyze_content_gaps", title: "Content gap analysis", description: "Compare article against competitors, identify missing subtopics.", category: "content", tier: "HYBRID", inputs: "articleId? | slug?" },
  { name: "generate_internal_links", title: "Suggest internal links", description: "Suggest internal linking opportunities across articles.", category: "content", tier: "REAL", inputs: "articleId? | slug?" },
  { name: "generate_newsletter_brief", title: "Newsletter brief", description: "Daily/weekly newsletter compilation from recent articles.", category: "content", tier: "HYBRID", inputs: "days?, category?" },
  { name: "generate_newsletter_digest", title: "Newsletter digest", description: "Compile top-N recent articles into digest format.", category: "content", tier: "REAL", inputs: "limit?, category?" },
  { name: "detect_ai_content", title: "Detect AI content", description: "Score article for AI-detectable patterns. Returns human-likelihood score 0-100.", category: "content", tier: "REAL", inputs: "articleId? | slug?" },
  { name: "translate_article", title: "Translate article", description: "Translate article to target locale with context preservation.", category: "content", tier: "HYBRID", inputs: "articleId? | slug?, locale" },
  { name: "suggest_related_links", title: "Suggest related links", description: "Find related articles by matching tags and categories.", category: "content", tier: "REAL", inputs: "articleId? | slug?" },
  // Read / Analytics
  { name: "ops_snapshot", title: "Operations snapshot", description: "Return source, topic, article, review, and distribution counts.", category: "read", tier: "REAL", inputs: "none" },
  { name: "get_top_articles", title: "Get top articles", description: "List the most recent published articles with scores and categories.", category: "read", tier: "REAL", inputs: "limit?, category?" },
  { name: "get_content_calendar", title: "Get content calendar", description: "List upcoming distribution jobs and recently published articles.", category: "read", tier: "REAL", inputs: "daysAhead?, daysBack?" },
  { name: "analytics_overview", title: "Analytics overview", description: "Daily published counts, category breakdown, pipeline stats, top articles.", category: "read", tier: "REAL", inputs: "none" },
  // Autonomous
  { name: "autonomous_start", title: "Start autonomous mode", description: "Start the autonomous pipeline scheduler.", category: "autonomous", tier: "REAL", inputs: "cronExpression?" },
  { name: "autonomous_stop", title: "Stop autonomous mode", description: "Pause the autonomous scheduler.", category: "autonomous", tier: "REAL", inputs: "none" },
  { name: "autonomous_status", title: "Get autonomous status", description: "Get current scheduler state.", category: "autonomous", tier: "REAL", inputs: "none" },
  { name: "autonomous_run_once", title: "Trigger one pipeline cycle", description: "Manually trigger one full ingest-cluster-generate-publish cycle.", category: "autonomous", tier: "REAL", inputs: "none" },
];

const CATEGORY_META: Record<string, { label: string; icon: typeof Activity; color: string }> = {
  pipeline:    { label: "Pipeline",    icon: Layers,       color: "text-blue-400" },
  generation:  { label: "Generation",  icon: FileText,     color: "text-emerald-400" },
  social:      { label: "Social",      icon: Share2,       color: "text-pink-400" },
  video:       { label: "Video",       icon: Video,        color: "text-purple-400" },
  image:       { label: "Image",       icon: Image,        color: "text-amber-400" },
  seo:         { label: "SEO",         icon: Search,       color: "text-cyan-400" },
  quality:     { label: "Quality",     icon: ShieldCheck,  color: "text-green-400" },
  content:     { label: "Content Ops", icon: BookOpen,     color: "text-rose-400" },
  publish:     { label: "Publish",     icon: Send,         color: "text-orange-400" },
  read:        { label: "Analytics",   icon: BarChart4,    color: "text-indigo-400" },
  autonomous:  { label: "Autonomous",  icon: Zap,          color: "text-yellow-400" },
};

// ─── Helpers ──────────────────────────────────────────────────────────

function providerStatus() {
  const key = process.env.DEEPSEEK_API_KEY
    ? { provider: "DeepSeek", model: config.aiModel || "deepseek-chat", keyOk: true }
    : process.env.GROQ_API_KEY
      ? { provider: "Groq", model: config.aiModel || "llama-3.3-70b-versatile", keyOk: true }
      : process.env.OPENAI_API_KEY
        ? { provider: "OpenAI", model: config.aiModel || "gpt-4o-mini", keyOk: true }
        : process.env.GEMINI_API_KEY
          ? { provider: "Gemini", model: config.aiModel || "gemini-2.0-flash", keyOk: true }
          : { provider: null, model: null, keyOk: false };
  return key;
}

function toolTierIcon(tier: "REAL" | "HYBRID") {
  if (tier === "REAL") {
    return { icon: CheckCircle2, label: "REAL", className: "text-emerald-400 bg-emerald-400/10" };
  }
  return { icon: AlertCircle, label: "HYBRID", className: "text-amber-400 bg-amber-400/10" };
}

// ─── Page ─────────────────────────────────────────────────────────────

export default async function AdminMcpPage() {
  const db = await pingDatabase().catch(() => ({ ok: false, error: "timeout" }));
  const snapshot = await getOperationsSnapshot().catch(() => null);
  const scheduler = getSchedulerState();
  const aiProvider = providerStatus();

  // Recent AI/pipeline audit events
  let recentEvents: { action: string; createdAt: string; metadata?: Record<string, unknown> }[] = [];
  try {
    const platform = await getPlatformSnapshot();
    recentEvents = platform.auditLogs
      .filter((e) => e.action.startsWith("ai.") || e.action.startsWith("pipeline.") || e.action.startsWith("scheduler."))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 20);
  } catch { /* memory store may not have audit logs */ }

  const toolsByCategory = new Map<string, ToolEntry[]>();
  for (const t of TOOLS) {
    const list = toolsByCategory.get(t.category) ?? [];
    list.push(t);
    toolsByCategory.set(t.category, list);
  }

  const realCount = TOOLS.filter((t) => t.tier === "REAL").length;
  const hybridCount = TOOLS.filter((t) => t.tier === "HYBRID").length;

  return (
    <main className="container-shell py-10">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-signal">Admin</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-normal text-[var(--ink)]">MCP server</h1>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">
        43 tools registered — {realCount} REAL, {hybridCount} HYBRID (AI-powered analysis + generation)
      </p>
      <AdminNav />

      {/* ── Status cards ────────────────────────────────────────── */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatusCard
          icon={aiProvider.keyOk ? CheckCircle2 : AlertCircle}
          iconColor={aiProvider.keyOk ? "text-emerald-400" : "text-amber-400"}
          label="AI Provider"
          value={aiProvider.provider ?? "None configured"}
          detail={aiProvider.keyOk ? `Model: ${aiProvider.model}` : "Add DEEPSEEK_API_KEY to .env"}
        />
        <StatusCard
          icon={db.ok ? CheckCircle2 : AlertCircle}
          iconColor={db.ok ? "text-emerald-400" : "text-amber-400"}
          label="Database"
          value={db.ok ? "Connected" : "Disconnected"}
          detail={`Driver: ${config.storageDriver}`}
        />
        <StatusCard
          icon={scheduler.running ? Zap : Clock}
          iconColor={scheduler.running ? "text-yellow-400" : "text-[var(--ink-muted)]"}
          label="Scheduler"
          value={scheduler.running ? "Running" : "Idle"}
          detail={scheduler.running ? `Cron: ${scheduler.cronExpression}` : "Start via autonomous_start"}
        />
        <StatusCard
          icon={Server}
          iconColor="text-blue-400"
          label="MCP Transport"
          value="HTTP + stdio"
          detail={`Port ${process.env.MCP_PORT || "3333"}/mcp`}
        />
      </section>

      {/* ── Scheduler detail ────────────────────────────────────── */}
      {scheduler.running || scheduler.totalRuns > 0 ? (
        <section className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
            <Timer size={15} className="text-signal" />
            Scheduler state
          </h2>
          <div className="mt-3 grid grid-cols-3 gap-4 text-sm sm:grid-cols-6">
            <Stat label="Status" value={scheduler.running ? "Running" : "Stopped"} />
            <Stat label="Total runs" value={String(scheduler.totalRuns)} />
            <Stat label="Articles published" value={String(scheduler.totalArticlesPublished)} />
            <Stat label="Started at" value={scheduler.startedAt ? new Date(scheduler.startedAt).toLocaleString() : "—"} />
            <Stat label="Last run" value={scheduler.lastRunAt ? new Date(scheduler.lastRunAt).toLocaleString() : "—"} />
            <Stat label="Next run" value={scheduler.nextRunAt ? new Date(scheduler.nextRunAt).toLocaleString() : "—"} />
          </div>
          {scheduler.lastRunSummary && (
            <pre className="mt-3 overflow-auto rounded-md bg-[var(--bg)] p-3 text-xs text-[var(--ink-soft)]">
              {scheduler.lastRunSummary}
            </pre>
          )}
        </section>
      ) : null}

      {/* ── Ops snapshot ────────────────────────────────────────── */}
      {snapshot && (
        <section className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
            <Globe size={15} className="text-signal" />
            Operations snapshot
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
            <Stat label="Sources" value={String(snapshot.sources)} />
            <Stat label="Raw items" value={String(snapshot.rawItems)} />
            <Stat label="Topics" value={String(snapshot.topics)} />
            <Stat label="Articles" value={`${snapshot.publishedArticles}/${snapshot.articles} published`} />
            <Stat label="Open reviews" value={String(snapshot.openReviewTasks)} />
            <Stat label="Quality failures" value={String(snapshot.failedQualityReports)} />
            <Stat label="Distribution jobs" value={String(snapshot.distributionJobs)} />
            <Stat label="Dry-run jobs" value={String(snapshot.dryRunJobs)} />
            <Stat label="Audit events" value={String(snapshot.auditEvents)} />
          </div>
        </section>
      )}

      {/* ── Tool catalog ────────────────────────────────────────── */}
      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-xl font-bold text-[var(--ink)]">
          <Wrench size={18} className="text-signal" />
          Tool catalog
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          All 43 tools registered in the MCP server. HYBRID tools use DeepSeek AI when configured, falling back to deterministic templates.
        </p>
        {[...toolsByCategory.entries()].map(([cat, tools]) => {
          const meta = CATEGORY_META[cat] ?? { label: cat, icon: Activity, color: "text-[var(--ink-muted)]" };
          const CatIcon = meta.icon;
          return (
            <div key={cat} className="mt-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                <CatIcon size={14} className={meta.color} />
                {meta.label}
                <span className="text-xs font-normal text-[var(--ink-faint)]">({tools.length} tools)</span>
              </h3>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {tools.map((tool) => {
                  const tierMeta = toolTierIcon(tool.tier);
                  const TierIcon = tierMeta.icon;
                  return (
                    <div key={tool.name} className="rounded-lg border border-[var(--line)] bg-[var(--bg)] p-3">
                      <div className="flex items-start justify-between gap-2">
                        <code className="text-xs font-bold text-[var(--ink)]">{tool.name}</code>
                        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${tierMeta.className}`}>
                          <TierIcon size={10} />
                          {tierMeta.label}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-[var(--ink-soft)]">{tool.description}</p>
                      <p className="mt-1 text-[10px] text-[var(--ink-faint)]">Inputs: {tool.inputs}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      {/* ── Recent AI / pipeline audit events ───────────────────── */}
      {recentEvents.length > 0 && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[var(--ink)]">
            <Radio size={18} className="text-signal" />
            Recent activity
          </h2>
          <div className="mt-3 overflow-auto rounded-lg border border-[var(--line)] bg-[var(--bg)]">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--line)] text-left text-[var(--ink-muted)]">
                  <th className="px-3 py-2 font-medium">Action</th>
                  <th className="px-3 py-2 font-medium">Time</th>
                  <th className="px-3 py-2 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((evt, i) => (
                  <tr key={i} className="border-b border-[var(--line)] last:border-0">
                    <td className="px-3 py-2 font-mono text-[var(--ink)]">{evt.action}</td>
                    <td className="px-3 py-2 text-[var(--ink-soft)]">{new Date(evt.createdAt).toLocaleString()}</td>
                    <td className="max-w-xs truncate px-3 py-2 font-mono text-[var(--ink-faint)]">
                      {evt.metadata ? JSON.stringify(evt.metadata) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────

function StatusCard({ icon: Icon, iconColor, label, value, detail }: {
  icon: typeof Activity;
  iconColor: string;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
        <Icon size={14} className={iconColor} />
        {label}
      </div>
      <p className="mt-1 text-base font-bold text-[var(--ink)]">{value}</p>
      <p className="mt-0.5 text-xs text-[var(--ink-faint)]">{detail}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--ink-faint)]">{label}</p>
      <p className="text-sm font-semibold text-[var(--ink)]">{value}</p>
    </div>
  );
}

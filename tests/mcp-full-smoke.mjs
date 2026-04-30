#!/usr/bin/env node
/**
 * Full MCP smoke test — drives every registered tool via HTTP transport.
 * Usage: node tests/mcp-full-smoke.mjs
 *
 * Prerequisites:
 *   STORAGE_DRIVER=memory MCP_PORT=3333 npm run mcp:http   (in another shell)
 */

const BASE = process.env.MCP_URL ?? "http://localhost:3333/mcp";
const HEADERS = {
  "Content-Type": "application/json",
  "Accept": "application/json, text/event-stream"
};

let passed = 0;
let failed = 0;

async function call(method, params = {}) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  // SDK returns SSE: parse "data: {...}" lines
  const dataLine = text.split("\n").find((l) => l.startsWith("data:"));
  if (dataLine) return JSON.parse(dataLine.slice(5).trim());
  // Plain JSON fallback
  return JSON.parse(text);
}

async function test(label, fn) {
  try {
    const result = await fn();
    if (result?.error) throw new Error(result.error.message ?? JSON.stringify(result.error));
    console.log(`  ✓  ${label}`);
    passed++;
    return result?.result;
  } catch (err) {
    console.error(`  ✗  ${label}: ${err.message}`);
    failed++;
    return null;
  }
}

async function callTool(name, args = {}) {
  return call("tools/call", { name, arguments: args });
}

// ─── List tools ───────────────────────────────────────────
console.log("\n=== QuickGist MCP Full Smoke Test ===\n");

const listResult = await test("tools/list responds", () => call("tools/list"));
const tools = listResult?.tools ?? [];
console.log(`   ${tools.length} tools registered\n`);

// ─── Pipeline tools ───────────────────────────────────────
console.log("Pipeline:");
await test("ops_snapshot", () => callTool("ops_snapshot"));
await test("ingest_run (offline)", () => callTool("ingest_run", { offline: true, dryRun: true }));
await test("pipeline_run (offline dryRun)", () => callTool("pipeline_run", { offline: true, dryRun: true }));

// trending_detect: capture result to extract a topic ID for generate_article
const trendResult = await test("trending_detect", () => callTool("trending_detect"));
let topicId;
try {
  const parsed = JSON.parse(trendResult?.content?.[0]?.text ?? "{}");
  topicId = parsed?.topics?.[0]?.id;
} catch {}

await test("get_top_articles", () => callTool("get_top_articles", { limit: 5 }));
await test("get_content_calendar", () => callTool("get_content_calendar", { daysAhead: 7 }));

// ─── Autonomous scheduler ─────────────────────────────────
console.log("\nAutonomous:");
await test("autonomous_status", () => callTool("autonomous_status"));
await test("autonomous_start", () => callTool("autonomous_start", { cronExpression: "0 */6 * * *" }));
await test("autonomous_stop", () => callTool("autonomous_stop"));
await test("autonomous_run_once", () => callTool("autonomous_run_once"));

// ─── Content generation ────────────────────────────────────
console.log("\nContent generation:");

if (topicId) {
  await test("generate_article (new topic)", () => callTool("generate_article", { topicId }));
} else {
  console.log("  ℹ  No new topics from trending_detect — skipping generate_article");
}

// Fetch article slug from get_top_articles (uses published seed/generated articles)
const topArticlesResult = await test("get_top_articles for slug", () => callTool("get_top_articles", { limit: 1 }));
let articleSlug;
try {
  const articles = JSON.parse(topArticlesResult?.content?.[0]?.text ?? "[]");
  articleSlug = articles?.[0]?.slug;
} catch {}

if (articleSlug) {
  console.log("\nArticle tools:");
  await test("quality_evaluate", () => callTool("quality_evaluate", { slug: articleSlug }));
  await test("analyze_seo_score", () => callTool("analyze_seo_score", { slug: articleSlug }));
  await test("generate_meta_tags", () => callTool("generate_meta_tags", { slug: articleSlug }));
  await test("improve_article_seo", () => callTool("improve_article_seo", { slug: articleSlug }));
  await test("generate_eli5_explanation", () => callTool("generate_eli5_explanation", { slug: articleSlug }));
  await test("generate_faq_section", () => callTool("generate_faq_section", { slug: articleSlug }));
  await test("humanize_article", () => callTool("humanize_article", { slug: articleSlug }));

  console.log("\nSocial / media:");
  await test("generate_social_package", () => callTool("generate_social_package", { slug: articleSlug }));
  await test("generate_twitter_thread", () => callTool("generate_twitter_thread", { slug: articleSlug }));
  await test("generate_video_script", () => callTool("generate_video_script", { slug: articleSlug }));
  await test("generate_shorts_script", () => callTool("generate_shorts_script", { slug: articleSlug }));
  await test("generate_image_prompts", () => callTool("generate_image_prompts", { slug: articleSlug }));
} else {
  console.log("  ℹ  No published articles found — skipping article-specific tools");
}

// ─── Summary ──────────────────────────────────────────────
console.log(`\n${"─".repeat(48)}`);
console.log(`Result: ${passed} passed  ${failed} failed  (${tools.length} tools listed)`);
if (failed > 0) {
  console.log("Some tools failed — check that the MCP server is running with STORAGE_DRIVER=memory");
  process.exit(1);
}
process.exit(0);

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Minimal .env loader
const envPath = resolve(import.meta.dirname, "..", ".env");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  const val = trimmed.slice(eq + 1).trim();
  if (!process.env[key]) process.env[key] = val;
}

import { analyzeContentQuality, analyzeSEO } from "../lib/services/aiAnalysis";

const mockArticle = {
  id: "test-article",
  title: "Global Carbon Emissions Hit Record High in 2025",
  metaDescription: "New data shows carbon emissions reached unprecedented levels this year, raising urgent questions about climate policy effectiveness worldwide.",
  contentMarkdown: `## What happened

Global carbon dioxide emissions reached a record 37.4 billion metric tons in 2025, according to the latest data from the Global Carbon Project. The 1.1% increase over 2024 levels was driven primarily by rising energy demand in developing economies and the continued reliance on coal-fired power plants.

## Why it matters

Scientists warn that the world is now tracking well above the 1.5°C warming target set in the Paris Agreement. At current emission rates, the carbon budget for staying below this threshold will be exhausted within six years.

## The bottom line

Without accelerated deployment of renewable energy and stronger policy interventions, the world remains on a dangerous trajectory.`,
  category: "science",
  tags: ["carbon emissions", "climate change", "global warming"],
  slug: "test-carbon-emissions"
};

async function main() {
  console.log("=== Testing AI Quality Analysis ===\n");
  const quality = await analyzeContentQuality(mockArticle as any);
  console.log("Provider:", quality.provider);
  console.log("AI result:", quality.ai ? JSON.stringify(quality.ai, null, 2) : "null (deterministic fallback)");

  console.log("\n=== Testing AI SEO Analysis ===\n");
  const seo = await analyzeSEO(mockArticle as any, "carbon emissions");
  console.log("Provider:", seo.provider);
  console.log("AI result:", seo.ai ? JSON.stringify(seo.ai, null, 2) : "null (deterministic fallback)");
}

main().catch(console.error);

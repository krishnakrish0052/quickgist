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

import { routeAiTask } from "../lib/services/aiOrchestration";

async function main() {
  console.log("DEEPSEEK_API_KEY set:", process.env.DEEPSEEK_API_KEY ? "yes (len=" + process.env.DEEPSEEK_API_KEY.length + ")" : "no");
  console.log("AI_PROVIDER:", process.env.AI_PROVIDER);

  const result = await routeAiTask({
    task: "article",
    prompt: "Write a one-sentence summary of what DeepSeek AI is. Keep it under 30 words.",
    maxTokens: 200,
    temperature: 0.7,
    traceId: "e2e-test"
  });

  console.log("Provider:", result.provider);
  console.log("Model:", result.model);
  console.log("Output:", result.output.slice(0, 300));
  console.log("Cached:", result.cached);
}

main().catch(console.error);

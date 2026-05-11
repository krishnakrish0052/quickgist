import OpenAI from "openai";
import { config } from "@/lib/config";
import { aiLimiter } from "@/lib/services/concurrency";
import { addAuditLog } from "@/lib/repositories/platformRepository";
import { nowIso, stableHash } from "@/lib/utils";
import { MARKDOWN_ARTIFACT_PATTERNS } from "@/lib/text/ai-artifacts";

export type AiTask =
  | "article"
  | "explainer"
  | "social"
  | "script"
  | "shorts_script"
  | "image_prompt"
  | "image_prompts_pack"
  | "faq"
  | "meta_tags"
  | "seo_rewrite";

export interface AiRequest {
  task: AiTask;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  traceId?: string;
  agentId?: string;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface AiResponse {
  id: string;
  task: AiTask;
  provider: "deterministic" | "deepseek" | "gemini" | "groq" | "openai";
  model: string;
  output: string;
  tokenEstimate: number;
  cached: boolean;
  createdAt: string;
}

type RealProvider = "deepseek" | "groq" | "openai" | "gemini";

const cache = new Map<string, AiResponse>();

/**
 * Strip AI-leaked markdown artifacts from raw output.
 * Removes code fences, empty links, orphan bold markers, stray headers,
 * and normalizes whitespace.
 */
export function sanitizeAiOutput(raw: string): string {
  let text = raw;

  // Strip all MARKDOWN_ARTIFACT_PATTERNS
  for (const pattern of MARKDOWN_ARTIFACT_PATTERNS) {
    text = text.replace(pattern, "");
  }

  // Remove lines that are ONLY ** or * characters (orphan markers)
  text = text.replace(/^[\*\s]+$/gm, "");

  // Normalize multiple blank lines to max 2
  text = text.replace(/\n{3,}/g, "\n\n");

  // Strip leading/trailing whitespace
  text = text.trim();

  return text;
}

function resolveProvider(): RealProvider | null {
  if (config.aiProvider !== "auto") {
    const key = providerApiKey(config.aiProvider as RealProvider);
    return key ? (config.aiProvider as RealProvider) : null;
  }
  if (process.env.DEEPSEEK_API_KEY) return "deepseek";
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return null;
}

function providerApiKey(provider: RealProvider): string | undefined {
  switch (provider) {
    case "deepseek": return process.env.DEEPSEEK_API_KEY;
    case "groq": return process.env.GROQ_API_KEY;
    case "openai": return process.env.OPENAI_API_KEY;
    case "gemini": return process.env.GEMINI_API_KEY;
  }
}

function defaultModel(provider: RealProvider): string {
  if (config.aiModel) return config.aiModel;
  switch (provider) {
    case "deepseek": return "deepseek-chat";
    case "groq": return "llama-3.3-70b-versatile";
    case "openai": return "gpt-4o-mini";
    case "gemini": return "gemini-2.0-flash";
  }
}

async function callDeepseek(prompt: string, maxTokens: number, temperature: number, signal?: AbortSignal): Promise<string> {
  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com/v1",
  });
  const res = await client.chat.completions.create({
    model: defaultModel("deepseek"),
    messages: [{ role: "user", content: prompt }],
    max_tokens: maxTokens,
    temperature,
  }, { signal });
  return res.choices[0]?.message?.content ?? "";
}

async function callGroq(prompt: string, maxTokens: number, temperature: number, signal?: AbortSignal): Promise<string> {
  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });
  const res = await client.chat.completions.create({
    model: defaultModel("groq"),
    messages: [{ role: "user", content: prompt }],
    max_tokens: maxTokens,
    temperature,
  }, { signal });
  return res.choices[0]?.message?.content ?? "";
}

async function callOpenAI(prompt: string, maxTokens: number, temperature: number, signal?: AbortSignal): Promise<string> {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const res = await client.chat.completions.create({
    model: defaultModel("openai"),
    messages: [{ role: "user", content: prompt }],
    max_tokens: maxTokens,
    temperature,
  }, { signal });
  return res.choices[0]?.message?.content ?? "";
}

async function callGemini(prompt: string, _maxTokens: number, temperature: number, signal?: AbortSignal): Promise<string> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: defaultModel("gemini") });
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature, maxOutputTokens: _maxTokens },
  }, { signal });
  return result.response.text();
}

async function callRealProvider(
  provider: RealProvider,
  prompt: string,
  maxTokens: number,
  temperature: number,
  signal?: AbortSignal,
): Promise<string> {
  switch (provider) {
    case "deepseek": return callDeepseek(prompt, maxTokens, temperature, signal);
    case "groq": return callGroq(prompt, maxTokens, temperature, signal);
    case "openai": return callOpenAI(prompt, maxTokens, temperature, signal);
    case "gemini": return callGemini(prompt, maxTokens, temperature, signal);
  }
}

export async function routeAiTask(request: AiRequest): Promise<AiResponse> {
  const cacheKey = stableHash(`${request.task}:${request.prompt}`);
  const cached = cache.get(cacheKey);
  if (cached) return { ...cached, cached: true };

  const maxTokens = request.maxTokens ?? 1200;
  const temperature = request.temperature ?? 0.7;
  const tokenEstimate = Math.ceil(request.prompt.length / 4) + maxTokens;

  let selectedProvider = resolveProvider();
  if (selectedProvider && tokenEstimate > config.modelDailyTokenBudget) {
    console.warn(`[aiOrchestration] Token estimate ${tokenEstimate} exceeds budget ${config.modelDailyTokenBudget}, using deterministic fallback for task=${request.task}`);
    selectedProvider = null;
  }

  let output: string;
  let model: string;
  let usedProvider: AiResponse["provider"] = "deterministic";

  if (selectedProvider) {
    const timeoutMs = request.timeoutMs ?? 120_000;
    const ctrl = new AbortController();
    const externalSignal = request.signal;
    if (externalSignal) {
      if (externalSignal.aborted) { ctrl.abort(); }
      else { externalSignal.addEventListener("abort", () => ctrl.abort(), { once: true }); }
    }
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);

    try {
      output = await aiLimiter(() => callRealProvider(selectedProvider, request.prompt, maxTokens, temperature, ctrl.signal));
      model = defaultModel(selectedProvider);
      usedProvider = selectedProvider;
    } catch (err) {
      const reason = err instanceof Error && err.name === "AbortError" ? "timeout" : "error";
      console.error(`[aiOrchestration] ${selectedProvider} call ${reason}, falling back to deterministic:`, err);
      await addAuditLog({
        actor: "system",
        action: "ai.task.failed",
        entityType: "ai_request",
        entityId: `ai-${cacheKey}`,
        metadata: { task: request.task, provider: selectedProvider, reason, error: err instanceof Error ? err.message : String(err), ...(request.agentId ? { agentId: request.agentId } : {}) },
      });
      output = `Local deterministic ${request.task} generation completed for trace ${request.traceId ?? cacheKey}.`;
      model = "quickgist-local-synthesizer";
    } finally {
      clearTimeout(timer);
    }
  } else {
    output = `Local deterministic ${request.task} generation completed for trace ${request.traceId ?? cacheKey}.`;
    model = "quickgist-local-synthesizer";
  }

  // Sanitize AI output to strip markdown artifacts
  output = sanitizeAiOutput(output);

  const response: AiResponse = {
    id: `ai-${cacheKey}`,
    task: request.task,
    provider: usedProvider,
    model,
    output,
    tokenEstimate,
    cached: false,
    createdAt: nowIso(),
  };

  cache.set(cacheKey, response);
  await addAuditLog({
    actor: "system",
    action: "ai.task.routed",
    entityType: "ai_request",
    entityId: response.id,
    metadata: {
      task: request.task,
      provider: response.provider,
      model: response.model,
      tokenEstimate,
      ...(request.agentId ? { agentId: request.agentId } : {}),
    },
  });

  return response;
}

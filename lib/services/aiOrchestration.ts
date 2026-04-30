import { config } from "@/lib/config";
import { addAuditLog } from "@/lib/repositories/platformRepository";
import { nowIso, stableHash } from "@/lib/utils";

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
}

export interface AiResponse {
  id: string;
  task: AiTask;
  provider: "deterministic" | "gemini" | "groq" | "openai";
  model: string;
  output: string;
  tokenEstimate: number;
  cached: boolean;
  createdAt: string;
}

const cache = new Map<string, AiResponse>();

export async function routeAiTask(request: AiRequest): Promise<AiResponse> {
  const cacheKey = stableHash(`${request.task}:${request.prompt}`);
  const cached = cache.get(cacheKey);
  if (cached) return { ...cached, cached: true };

  const tokenEstimate = Math.ceil(request.prompt.length / 4) + (request.maxTokens ?? 900);
  if (tokenEstimate > config.modelDailyTokenBudget) {
    throw new Error("AI task exceeds configured daily token budget.");
  }

  const response: AiResponse = {
    id: `ai-${cacheKey}`,
    task: request.task,
    provider: "deterministic",
    model: "quickgist-local-synthesizer",
    output: `Local deterministic ${request.task} generation completed for trace ${request.traceId ?? cacheKey}.`,
    tokenEstimate,
    cached: false,
    createdAt: nowIso()
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
      tokenEstimate
    }
  });

  return response;
}

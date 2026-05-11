import pLimit from "p-limit";
import { config } from "@/lib/config";

export function createConcurrencyLimiter(concurrency = config.pipelineAgentConcurrency) {
  return pLimit(concurrency);
}

export const aiLimiter = pLimit(Number(process.env.AI_CONCURRENCY ?? 5));

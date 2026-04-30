import type { FactClaim, Topic } from "@/lib/types";
import { nowIso, stableHash } from "@/lib/utils";
import { getPlatformSnapshot, upsertFactClaims } from "@/lib/repositories/platformRepository";

export interface FactExtractionResult {
  claims: FactClaim[];
  inserted: FactClaim[];
}

function normalizeClaim(summary: string): string {
  const trimmed = summary.replace(/\s+/g, " ").trim();
  return trimmed.endsWith(".") ? trimmed : `${trimmed}.`;
}

export async function extractFactClaims(topic: Topic): Promise<FactExtractionResult> {
  const state = await getPlatformSnapshot();
  const now = nowIso();
  const rawItems = state.rawItems.filter((item) => topic.rawItemIds.includes(item.id));

  const claims = rawItems.map((item) => {
    const claim = normalizeClaim(item.summary);
    const source = state.sources.find((candidate) => candidate.id === item.sourceId);
    return {
      id: `fact-${stableHash(`${topic.id}:${item.id}:${claim}`)}`,
      topicId: topic.id,
      claim,
      sourceRawItemIds: [item.id],
      confidence: Math.min(0.95, ((source?.reliabilityScore ?? 65) / 100) * 0.9 + 0.08),
      risk: topic.risk,
      createdAt: now
    } satisfies FactClaim;
  });

  return {
    claims,
    inserted: await upsertFactClaims(claims)
  };
}

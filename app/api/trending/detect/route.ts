import { internalGuard, ok } from "@/lib/api";
import { detectTrendingTopics } from "@/lib/services/trend";

export async function POST(request: Request) {
  const guard = internalGuard(request);
  if (guard) return guard;
  return ok(await detectTrendingTopics());
}

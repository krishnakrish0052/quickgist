import { internalGuard, ok } from "@/lib/api";
import { getOperationsSnapshot } from "@/lib/services/observability";

export async function GET(request: Request) {
  const guard = internalGuard(request);
  if (guard) return guard;
  return ok(await getOperationsSnapshot());
}

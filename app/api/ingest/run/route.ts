import { internalGuard, ok, readJson } from "@/lib/api";
import { runIngestion } from "@/lib/services/ingestion";

interface Body {
  rssUrls: string[];
  limit: number;
  dryRun: boolean;
}

export async function POST(request: Request) {
  const guard = internalGuard(request);
  if (guard) return guard;
  const body = await readJson<Body>(request);
  const result = await runIngestion({
    rssUrls: body.rssUrls,
    limit: body.limit,
    dryRun: body.dryRun
  });
  return ok(result);
}

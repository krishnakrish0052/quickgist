import { internalGuard, ok, readJson } from "@/lib/api";
import { config } from "@/lib/config";
import { runContentPipeline } from "@/workers/pipeline";

interface Body {
  dryRun?: boolean;
  autoPublish?: boolean;
  rssUrls?: string[];
}

export async function POST(request: Request) {
  const guard = internalGuard(request);
  if (guard) return guard;
  const body = await readJson<Body>(request);

  return ok(
    await runContentPipeline({
      dryRun: body.dryRun ?? config.pipelineDryRun,
      autoPublish: body.autoPublish ?? config.pipelineAutoPublish,
      rssUrls: body.rssUrls
    })
  );
}

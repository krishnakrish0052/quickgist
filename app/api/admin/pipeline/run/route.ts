import { NextRequest, NextResponse } from "next/server";
import { getPipelineRunState } from "@/lib/services/pipelineTracker";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const dryRun = body.dryRun ?? true;
  const autoPublish = body.autoPublish ?? false;

  const runId = `run-${Date.now()}`;

  // Fire-and-forget: start the pipeline in the background, don't block the response.
  // Dynamic import so the module is loaded inside the same process but the import
  // is cached — this avoids bundling the heavy pipeline into the API route module.
  const { runContentPipeline } = await import("@/workers/pipeline");
  runContentPipeline({ dryRun, autoPublish, rssUrls: body.rssUrls }).catch((err) => {
    console.error("Background pipeline failed:", err);
  });

  const state = getPipelineRunState();
  return NextResponse.json(
    { runId, message: "started", dryRun: state.dryRun, autoPublish: state.autoPublish },
    { status: 202 }
  );
}

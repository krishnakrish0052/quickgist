import { runContentPipeline } from "@/workers/pipeline";

export async function runScheduledContentJob() {
  return runContentPipeline({
    dryRun: process.env.PIPELINE_DRY_RUN !== "false",
    autoPublish: process.env.PIPELINE_AUTO_PUBLISH === "true"
  });
}

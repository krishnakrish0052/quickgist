import { runContentPipeline } from "@/workers/pipeline";
import { closeDatabase } from "@/lib/db/client";

const args = new Set(process.argv.slice(2));
const local = args.has("--local");
const dryRun = args.has("--dry-run") ? true : local ? false : process.env.PIPELINE_DRY_RUN !== "false";

const run = await runContentPipeline({
  dryRun,
  autoPublish: local || process.env.PIPELINE_AUTO_PUBLISH === "true"
});

console.log(JSON.stringify(run, null, 2));
await closeDatabase();

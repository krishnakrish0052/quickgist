import { beforeEach, describe, expect, it } from "vitest";
import { resetPlatformState } from "@/lib/store";
import { runContentPipeline } from "@/workers/pipeline";
import { AGENT_NAMES } from "@/lib/services/pipelineTracker";

describe("content pipeline", () => {
  beforeEach(() => {
    resetPlatformState();
  });

  it("runs the dry-run pipeline end to end", { timeout: 30000 }, async () => {
    process.env.OFFLINE = "1";
    const run = await runContentPipeline({ dryRun: true, autoPublish: false });
    expect(run.rawItemsFetched).toBeGreaterThanOrEqual(3);
    expect(run.completedAt).toBeTruthy();
    expect(run.logs.join(" ")).toContain("Detected");
  });

  it("8 agents are initialized", () => {
    expect(AGENT_NAMES.length).toBe(8);
    // Verify the expected agent names are present
    expect(AGENT_NAMES).toContain("Alpha");
    expect(AGENT_NAMES).toContain("Hotel");
  });
});

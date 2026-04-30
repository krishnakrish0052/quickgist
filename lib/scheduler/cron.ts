import cron from "node-cron";
import { nowIso } from "@/lib/utils";
import { getSchedulerState, updateSchedulerState } from "@/lib/scheduler/state";

type ScheduledTask = ReturnType<typeof cron.schedule>;
let activeTask: ScheduledTask | null = null;

function nextFireTime(expression: string): string | null {
  try {
    const [, , , , ,] = expression.split(" ");
    return null;
  } catch {
    return null;
  }
}

export interface SchedulerStartOptions {
  cronExpression?: string;
  /** Called on each tick with the pipeline result summary */
  onTick?: (summary: string) => Promise<void>;
}

export async function startScheduler(options: SchedulerStartOptions = {}): Promise<void> {
  const expression = options.cronExpression ?? process.env.AUTONOMOUS_CRON ?? "0 */2 * * *";

  if (activeTask) {
    activeTask.stop();
    activeTask = null;
  }

  if (!cron.validate(expression)) {
    throw new Error(`Invalid cron expression: "${expression}"`);
  }

  updateSchedulerState({
    running: true,
    cronExpression: expression,
    startedAt: nowIso()
  });

  activeTask = cron.schedule(expression, async () => {
    const state = getSchedulerState();
    if (!state.running) return;

    try {
      updateSchedulerState({ lastRunAt: nowIso() });

      const { runPipelineOnce } = await import("@/lib/scheduler/runner");
      const summary = await runPipelineOnce();

      updateSchedulerState({
        lastRunSummary: summary,
        totalRuns: state.totalRuns + 1
      });

      if (options.onTick) await options.onTick(summary);
    } catch (err) {
      const msg = (err as Error)?.message ?? String(err);
      updateSchedulerState({ lastRunSummary: `Error: ${msg}` });
    }
  });
}

export function stopScheduler(): void {
  if (activeTask) {
    activeTask.stop();
    activeTask = null;
  }
  updateSchedulerState({ running: false });
}

export function isSchedulerRunning(): boolean {
  return getSchedulerState().running;
}

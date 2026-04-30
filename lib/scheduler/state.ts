export interface SchedulerState {
  running: boolean;
  cronExpression: string;
  startedAt: string | null;
  lastRunAt: string | null;
  lastRunSummary: string | null;
  nextRunAt: string | null;
  totalRuns: number;
  totalArticlesPublished: number;
}

const initial: SchedulerState = {
  running: false,
  cronExpression: "0 */2 * * *",
  startedAt: null,
  lastRunAt: null,
  lastRunSummary: null,
  nextRunAt: null,
  totalRuns: 0,
  totalArticlesPublished: 0
};

let _state: SchedulerState = { ...initial };

export function getSchedulerState(): SchedulerState {
  return { ..._state };
}

export function updateSchedulerState(patch: Partial<SchedulerState>): void {
  _state = { ..._state, ...patch };
}

export function resetSchedulerState(): void {
  _state = { ...initial };
}

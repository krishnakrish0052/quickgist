/**
 * In-memory pipeline run tracker for the admin dashboard.
 * Stores the current/last run state with step-by-step events
 * and per-agent lifecycle-stage progress.
 */

import type { Topic } from "@/lib/types";

export interface PipelineStep {
  id: string;
  label: string;
  status: "pending" | "running" | "done" | "error";
  startedAt: string | null;
  completedAt: string | null;
  detail: string;
  count: number;
  subDetail?: string;
}

// ── Named agent types ──────────────────────────────────────────

export const AGENT_NAMES = [
  "Alpha", "Bravo", "Charlie", "Delta",
  "Echo", "Foxtrot", "Golf", "Hotel",
] as const;
export type AgentName = (typeof AGENT_NAMES)[number];

export type LifecycleStage =
  | "fact_extractor"
  | "writer"
  | "social_composer"
  | "media_scout"
  | "quality_inspector"
  | "publisher";

/** @deprecated Use LifecycleStage */
export type SubAgentType = LifecycleStage;

export const STAGE_LABELS: Record<LifecycleStage, string> = {
  fact_extractor: "Fact Extractor",
  writer: "Writer",
  social_composer: "Social Composer",
  media_scout: "Media Scout",
  quality_inspector: "Quality Inspector",
  publisher: "Publisher",
};

/** @deprecated Use STAGE_LABELS */
export const SUB_AGENT_LABELS = STAGE_LABELS;

export const STAGE_SHORT: Record<LifecycleStage, string> = {
  fact_extractor: "facts",
  writer: "writing",
  social_composer: "social",
  media_scout: "media",
  quality_inspector: "quality",
  publisher: "publish",
};

/** @deprecated Use STAGE_SHORT */
export const SUB_AGENT_SHORT = STAGE_SHORT;

export interface LifecycleState {
  type: LifecycleStage;
  status: "pending" | "running" | "done" | "error";
  startedAt: string | null;
  completedAt: string | null;
  detail: string;
}

/** @deprecated Use LifecycleState */
export type SubAgentState = LifecycleState;

export interface NamedAgentState {
  agentId: string;
  agentName: string;
  status: "idle" | "assigned" | "working" | "error";
  currentTopicId: string | null;
  currentTopicTitle: string | null;
  currentTopicCategory: string | null;
  lifecycle: LifecycleState[];
  topicsCompleted: number;
  topicsFailed: number;
  aiFailures: number;
  lastError: string | null;
  startedAt: string | null;
  error: string | null;
}

// ── Backward-compat aliases ────────────────────────────────────

/** @deprecated Use NamedAgentState */
export type AgentStatus = NamedAgentState["status"];
/** @deprecated Use NamedAgentState; legacy property subAgents maps to lifecycle */
export type TopicAgentState = NamedAgentState;

// ── Pipeline run state ────────────────────────────────────────

export interface PipelineRunState {
  runId: string;
  status: "idle" | "running" | "completed" | "error";
  dryRun: boolean;
  autoPublish: boolean;
  startedAt: string | null;
  completedAt: string | null;
  steps: PipelineStep[];
  agents: NamedAgentState[];
  // Live counters
  feedsAttempted: number;
  feedsSucceeded: number;
  rawItemsFetched: number;
  topicsClustered: number;
  articlesGenerated: number;
  articlesPublished: number;
  qualityFailures: number;
  error: string | null;
}

// ── Defaults ──────────────────────────────────────────────────

function emptyLifecycle(): LifecycleState[] {
  return [
    { type: "fact_extractor", status: "pending", startedAt: null, completedAt: null, detail: "" },
    { type: "writer", status: "pending", startedAt: null, completedAt: null, detail: "" },
    { type: "social_composer", status: "pending", startedAt: null, completedAt: null, detail: "" },
    { type: "media_scout", status: "pending", startedAt: null, completedAt: null, detail: "" },
    { type: "quality_inspector", status: "pending", startedAt: null, completedAt: null, detail: "" },
    { type: "publisher", status: "pending", startedAt: null, completedAt: null, detail: "" },
  ];
}

const EMPTY_STEPS: PipelineStep[] = [
  { id: "seed", label: "Seed repository", status: "pending", startedAt: null, completedAt: null, detail: "", count: 0 },
  { id: "ingest", label: "Ingest RSS feeds", status: "pending", startedAt: null, completedAt: null, detail: "Fetching from 19 curated sources...", count: 0 },
  { id: "cluster", label: "Cluster into topics", status: "pending", startedAt: null, completedAt: null, detail: "", count: 0 },
  { id: "dispatch", label: "8 agents: generate, QA, publish", status: "pending", startedAt: null, completedAt: null, detail: "", count: 0 },
];

// ── Singleton state ──────────────────────────────────────────

let _current: PipelineRunState = {
  runId: "",
  status: "idle",
  dryRun: true,
  autoPublish: false,
  startedAt: null,
  completedAt: null,
  steps: EMPTY_STEPS.map((s) => ({ ...s })),
  agents: [],
  feedsAttempted: 0,
  feedsSucceeded: 0,
  rawItemsFetched: 0,
  topicsClustered: 0,
  articlesGenerated: 0,
  articlesPublished: 0,
  qualityFailures: 0,
  error: null,
};

// ── Pending topic queue (cross-agent work-stealing) ────────

let _pendingTopics: Topic[] = [];

export function setPendingTopics(topics: Topic[]): void {
  _pendingTopics = [...topics];
}

export function claimNextTopic(agentId: string): Topic | null {
  const topic = _pendingTopics.shift() ?? null;
  if (topic) {
    const agent = _current.agents.find((a) => a.agentId === agentId);
    if (agent) {
      agent.status = "working";
      agent.currentTopicId = topic.id;
      agent.currentTopicTitle = topic.title;
      agent.currentTopicCategory = topic.category;
      agent.lifecycle = emptyLifecycle();
      agent.startedAt = agent.startedAt ?? new Date().toISOString();
      agent.error = null;
    }
  }
  return topic;
}

export function getPendingTopicCount(): number {
  return _pendingTopics.length;
}

// ── Read ─────────────────────────────────────────────────────

export function getPipelineRunState(): PipelineRunState {
  return {
    ..._current,
    steps: _current.steps.map((s) => ({ ...s })),
    agents: _current.agents.map((a) => ({
      ...a,
      lifecycle: a.lifecycle.map((l) => ({ ...l })),
    })),
  };
}

// ── Lifecycle ─────────────────────────────────────────────────

export function startPipelineRun(runId: string, dryRun: boolean, autoPublish: boolean): void {
  _current = {
    runId,
    status: "running",
    dryRun,
    autoPublish,
    startedAt: new Date().toISOString(),
    completedAt: null,
    steps: EMPTY_STEPS.map((s) => ({ ...s })),
    agents: [],
    feedsAttempted: 0,
    feedsSucceeded: 0,
    rawItemsFetched: 0,
    topicsClustered: 0,
    articlesGenerated: 0,
    articlesPublished: 0,
    qualityFailures: 0,
    error: null,
  };
  _pendingTopics = [];
}

export function completePipelineRun(): void {
  _current.status = "completed";
  _current.completedAt = new Date().toISOString();
  for (const step of _current.steps) {
    if (step.status === "pending" || step.status === "running") {
      step.status = "done";
      step.completedAt = _current.completedAt;
    }
  }
}

export function failPipelineRun(error: string): void {
  _current.status = "error";
  _current.error = error;
  _current.completedAt = new Date().toISOString();
}

export function resetPipelineRunState(): void {
  _current = {
    runId: "",
    status: "idle",
    dryRun: true,
    autoPublish: false,
    startedAt: null,
    completedAt: null,
    steps: EMPTY_STEPS.map((s) => ({ ...s })),
    agents: [],
    feedsAttempted: 0,
    feedsSucceeded: 0,
    rawItemsFetched: 0,
    topicsClustered: 0,
    articlesGenerated: 0,
    articlesPublished: 0,
    qualityFailures: 0,
    error: null,
  };
  _pendingTopics = [];
}

// ── Steps ────────────────────────────────────────────────────

export function updateStep(stepId: string, patch: Partial<PipelineStep>): void {
  const step = _current.steps.find((s) => s.id === stepId);
  if (step) Object.assign(step, patch);
}

export function stepStart(stepId: string): void {
  updateStep(stepId, { status: "running", startedAt: new Date().toISOString() });
}

export function stepDone(stepId: string, detail: string, count = 0, subDetail?: string): void {
  updateStep(stepId, { status: "done", completedAt: new Date().toISOString(), detail, count, subDetail });
}

export function stepError(stepId: string, detail: string): void {
  updateStep(stepId, { status: "error", completedAt: new Date().toISOString(), detail });
}

// ── Counters ─────────────────────────────────────────────────

export function updateCounts(
  patch: Partial<
    Pick<
      PipelineRunState,
      "feedsAttempted" | "feedsSucceeded" | "rawItemsFetched" | "topicsClustered" | "articlesGenerated" | "articlesPublished" | "qualityFailures"
    >
  >,
): void {
  Object.assign(_current, patch);
}

export function incrementCount(field: "articlesGenerated" | "articlesPublished" | "qualityFailures"): void {
  _current[field] += 1;
}

// ── Named agents ─────────────────────────────────────────────

export function initNamedAgents(): void {
  _current.agents = AGENT_NAMES.map((name) => ({
    agentId: `agent-${name.toLowerCase()}`,
    agentName: name,
    status: "idle" as const,
    currentTopicId: null,
    currentTopicTitle: null,
    currentTopicCategory: null,
    lifecycle: emptyLifecycle(),
    topicsCompleted: 0,
    topicsFailed: 0,
    aiFailures: 0,
    lastError: null,
    startedAt: null,
    error: null,
  }));
}

export function updateLifecycleStage(
  agentId: string,
  type: LifecycleStage,
  patch: Partial<LifecycleState>,
): void {
  const agent = _current.agents.find((a) => a.agentId === agentId);
  if (!agent) return;
  const stage = agent.lifecycle.find((l) => l.type === type);
  if (stage) Object.assign(stage, patch);
}

/** @deprecated Use updateLifecycleStage */
export function updateSubAgent(agentId: string, type: LifecycleStage, patch: Partial<LifecycleState>): void {
  updateLifecycleStage(agentId, type, patch);
}

export function completeNamedAgentTopic(agentId: string): void {
  const agent = _current.agents.find((a) => a.agentId === agentId);
  if (!agent) return;
  agent.topicsCompleted += 1;
  agent.currentTopicId = null;
  agent.currentTopicTitle = null;
  agent.currentTopicCategory = null;
  agent.lifecycle = emptyLifecycle();
}

export function failNamedAgentTopic(agentId: string, error: string): void {
  const agent = _current.agents.find((a) => a.agentId === agentId);
  if (!agent) return;
  agent.topicsFailed += 1;
  agent.error = error;
  agent.currentTopicId = null;
  agent.currentTopicTitle = null;
  agent.currentTopicCategory = null;
  agent.lifecycle = emptyLifecycle();
}

export function setIdleNamedAgent(agentId: string): void {
  const agent = _current.agents.find((a) => a.agentId === agentId);
  if (!agent) return;
  agent.status = "idle";
}

export function incrementAgentAiFailures(agentId: string, error: string): void {
  const agent = _current.agents.find((a) => a.agentId === agentId);
  if (!agent) return;
  agent.aiFailures += 1;
  agent.lastError = error;
}

// ── Deprecated backward-compat wrappers ───────────────────────

/** @deprecated Use initNamedAgents directly */
export function initAgents(topics: { id: string; title: string; category: string }[]): void {
  initNamedAgents();
  for (let i = 0; i < topics.length && i < AGENT_NAMES.length; i++) {
    const agent = _current.agents.find((a) => a.agentId === `agent-${AGENT_NAMES[i].toLowerCase()}`);
    if (agent) {
      agent.status = "assigned";
      agent.currentTopicId = topics[i].id;
      agent.currentTopicTitle = topics[i].title;
      agent.currentTopicCategory = topics[i].category;
    }
  }
}

/** @deprecated Use updateLifecycleStage instead */
export function updateAgent(topicId: string, patch: Partial<NamedAgentState>): void {
  const agent = _current.agents.find((a) => a.currentTopicId === topicId);
  if (agent) Object.assign(agent, patch);
}

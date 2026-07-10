export const WORKFLOW_VERSION = 'v1.0.0';
export const AGENT_VERSION = '1.0.0';

/** Per-node timeout budgets (ms) — 09-langgraph-workflow.md */
export const NODE_TIMEOUTS = {
  planner: 5_000,
  memory: 3_000,
  retrieval: 3_000,
  scoring: 2_000,
  eligibility: 2_000,
  recommendation: 2_000,
  messaging: 15_000,
  audit: 3_000,
  humanApproval: 3_000,
  responseBuilder: 2_000,
} as const;

export const MAX_RETRIES = 3;

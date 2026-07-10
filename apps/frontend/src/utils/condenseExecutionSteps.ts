import type { ExecutionStep } from '@banking-crm/shared-types';

const MILESTONE_AGENTS = new Set([
  'Planner',
  'Scoring',
  'Recommendation',
  'Messaging',
  'Response Builder',
]);

const SKIP_AGENTS = new Set(['Initialize', 'Audit']);

function isRetrievalStep(step: ExecutionStep): boolean {
  return step.agentName.includes('Retrieval')
    || step.agentName === 'Intelligence'
    || step.agentName === 'Memory';
}

function buildRetrievalStep(batch: ExecutionStep[]): ExecutionStep {
  const failed = batch.find((s) => s.status === 'failed');
  const running = batch.find((s) => s.status === 'running');
  return {
    agentName: 'Data Retrieval',
    status: failed ? 'failed' : running ? 'running' : 'completed',
    message: `Loaded ${batch.length} CRM data sources`,
    durationMs: batch.reduce((sum, s) => sum + (s.durationMs ?? 0), 0),
    timestamp: batch[0].timestamp,
  };
}

export function condenseExecutionSteps(steps: ExecutionStep[]): ExecutionStep[] {
  const result: ExecutionStep[] = [];
  let retrievalBatch: ExecutionStep[] = [];

  const flushRetrieval = () => {
    if (retrievalBatch.length === 0) return;
    result.push(buildRetrievalStep(retrievalBatch));
    retrievalBatch = [];
  };

  for (const step of steps) {
    if (SKIP_AGENTS.has(step.agentName)) continue;

    if (isRetrievalStep(step)) {
      retrievalBatch.push(step);
      continue;
    }

    flushRetrieval();

    if (MILESTONE_AGENTS.has(step.agentName) || step.status === 'failed') {
      result.push(step);
    }
  }

  flushRetrieval();
  return result;
}

export const STEP_SHORT_LABELS: Record<string, string> = {
  Planner: 'Plan',
  'Data Retrieval': 'Data',
  Scoring: 'Score',
  Recommendation: 'Match',
  Messaging: 'Messages',
  'Response Builder': 'Done',
};

export function getStepLabel(agentName: string): string {
  return STEP_SHORT_LABELS[agentName] ?? agentName.split(' ')[0];
}

export const LOADING_PIPELINE = ['Plan', 'Data', 'Score', 'Match', 'Messages'] as const;

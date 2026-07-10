import { ScoringEngine } from '@banking-crm/scoring-engine';
import { addConfidence, addStep, emitStep } from '../utils/steps';
import type { AgentRuntimeDeps } from '../interfaces/agent-runtime';
import type { GraphState } from '../state/agent-state';

const scoringEngine = new ScoringEngine();

export async function scoringAgent(
  state: GraphState,
  deps: AgentRuntimeDeps,
): Promise<Partial<GraphState>> {
  emitStep(deps, {
    agentName: 'Scoring',
    status: 'running',
    message: 'Calculating deterministic conversion scores...',
  });

  const start = Date.now();
  const minScore = state.customers.length > 100 ? 60 : 40;

  const scores = scoringEngine.scoreBatch(
    state.customers,
    state.productType,
    state.transactions,
    state.crmNotes,
    state.loanHistory,
    state.customers.length > 100 ? 60 : 40,
    state.campaigns,
    state.filters ?? {},
  );

  const durationMs = Date.now() - start;

  emitStep(deps, {
    agentName: 'Scoring',
    toolName: 'ScoringEngine',
    status: 'completed',
    message: `${scores.length} customers above conversion threshold`,
    durationMs,
  });

  return {
    scores,
    status: 'scoring',
    agentConfidence: addConfidence(state, 'Scoring', 100),
    executionSteps: addStep(state, {
      agentName: 'Scoring',
      toolName: 'ScoringEngine',
      status: 'completed',
      message: `Scored ${scores.length} high-potential customers`,
      durationMs,
    }),
    metadata: {
      ...state.metadata,
      scoringDurationMs: durationMs,
      customersScored: state.customers.length,
      customersAboveThreshold: scores.length,
    },
  };
}

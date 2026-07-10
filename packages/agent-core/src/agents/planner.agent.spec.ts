import { plannerAgent } from './planner.agent';
import { createInitialState } from '../state/agent-state';
import type { AgentRuntimeDeps } from '../interfaces/agent-runtime';

const baseDeps = {} as AgentRuntimeDeps;

describe('plannerAgent', () => {
  it('detects personal loan workflow from query (rule-based fallback)', async () => {
    const state = createInitialState({
      sessionId: 'sess-1',
      userId: 'user-1',
      query: 'Find customers likely to convert for a personal loan',
    });

    const result = await plannerAgent(state, baseDeps);

    expect(result.productType).toBe('PERSONAL_LOAN');
    expect(result.workflow).toBe('loan-recommendation');
    expect(result.executionPlan?.length).toBeGreaterThan(0);
    expect(result.agentConfidence?.some((c) => c.agentName === 'Planner')).toBe(true);
  });

  it('routes credit card queries to credit-card workflow', async () => {
    const state = createInitialState({
      sessionId: 'sess-2',
      userId: 'user-1',
      query: 'Recommend credit card for high spenders',
    });

    const result = await plannerAgent(state, baseDeps);

    expect(result.productType).toBe('CREDIT_CARD');
    expect(result.workflow).toBe('credit-card');
  });
});

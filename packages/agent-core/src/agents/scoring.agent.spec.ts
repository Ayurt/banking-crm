import { scoringAgent } from './scoring.agent';
import { createInitialState } from '../state/agent-state';
import type { AgentRuntimeDeps } from '../interfaces/agent-runtime';
import type { Customer } from '@banking-crm/shared-types';

const highValueCustomer: Customer = {
  id: 'c1',
  customerCode: 'C001',
  name: 'Rahul',
  monthlyIncome: 150000,
  creditScore: 800,
  avgMonthlyBalance: 350000,
  relationshipYears: 7,
  preferredLanguage: 'en',
  riskProfile: 'LOW',
  existingProducts: ['Savings'],
};

describe('scoringAgent', () => {
  it('produces deterministic scores without LLM', async () => {
    const state = createInitialState({
      sessionId: 'sess-1',
      userId: 'user-1',
      query: 'score loan prospects',
    });
    state.customers = [highValueCustomer];
    state.productType = 'PERSONAL_LOAN';

    const result = await scoringAgent(state, {} as AgentRuntimeDeps);

    expect(result.scores?.length).toBeGreaterThan(0);
    expect(result.scores?.[0].conversionScore).toBeGreaterThanOrEqual(40);
    expect(result.scores?.[0].segment).toBeDefined();
    expect(result.agentConfidence?.find((c) => c.agentName === 'Scoring')?.confidence).toBe(100);
  });
});

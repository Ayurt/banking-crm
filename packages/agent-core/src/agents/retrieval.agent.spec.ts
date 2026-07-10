import { retrievalAgent } from './retrieval.agent';
import { createInitialState } from '../state/agent-state';
import type { AgentRuntimeDeps } from '../interfaces/agent-runtime';
import type { Customer } from '@banking-crm/shared-types';

const mockCustomer: Customer = {
  id: 'c1',
  customerCode: 'C001',
  name: 'Rahul',
  monthlyIncome: 120000,
  creditScore: 780,
  avgMonthlyBalance: 200000,
  relationshipYears: 5,
  preferredLanguage: 'en',
  riskProfile: 'LOW',
  existingProducts: ['Savings'],
};

function buildDeps(overrides: Partial<AgentRuntimeDeps> = {}): AgentRuntimeDeps {
  return {
    customerTool: {
      name: 'CustomerTool',
      execute: jest.fn(),
      safeExecute: jest.fn(),
      retrieve: jest.fn().mockResolvedValue({ success: true, data: [mockCustomer], durationMs: 10 }),
    } as AgentRuntimeDeps['customerTool'],
    transactionTool: {
      name: 'TransactionTool',
      execute: jest.fn(),
      safeExecute: jest.fn(),
      retrieve: jest.fn().mockResolvedValue({ success: true, data: [], durationMs: 5 }),
    } as AgentRuntimeDeps['transactionTool'],
    crmTool: {
      name: 'CrmTool',
      execute: jest.fn(),
      safeExecute: jest.fn(),
      retrieve: jest.fn().mockResolvedValue({ success: true, data: [], durationMs: 5 }),
    } as AgentRuntimeDeps['crmTool'],
    loanTool: {
      name: 'LoanTool',
      execute: jest.fn(),
      safeExecute: jest.fn(),
      retrieve: jest.fn().mockResolvedValue({ success: true, data: [], durationMs: 5 }),
    } as AgentRuntimeDeps['loanTool'],
    productTool: {
      name: 'ProductTool',
      execute: jest.fn(),
      safeExecute: jest.fn(),
      getProduct: jest.fn(),
    } as AgentRuntimeDeps['productTool'],
    campaignTool: {
      name: 'CampaignTool',
      execute: jest.fn(),
      safeExecute: jest.fn(),
      retrieve: jest.fn().mockResolvedValue({ success: true, data: [], durationMs: 5 }),
    } as AgentRuntimeDeps['campaignTool'],
    ...overrides,
  };
}

describe('retrievalAgent', () => {
  it('gathers customer intelligence without scoring', async () => {
    const state = createInitialState({
      sessionId: 'sess-1',
      userId: 'user-1',
      query: 'personal loan prospects',
    });
    state.productType = 'PERSONAL_LOAN';

    const deps = buildDeps();
    const result = await retrievalAgent(state, deps);

    expect(result.customers).toHaveLength(1);
    expect(result.customerIds).toEqual(['c1']);
    expect(result.scores).toBeUndefined();
    expect(deps.customerTool.retrieve).toHaveBeenCalledWith('PERSONAL_LOAN', 100);
  });

  it('continues with degraded CRM data on CRM tool failure', async () => {
    const state = createInitialState({
      sessionId: 'sess-2',
      userId: 'user-1',
      query: 'loan outreach',
    });
    state.productType = 'PERSONAL_LOAN';

    const deps = buildDeps({
      crmTool: {
        name: 'CrmTool',
        execute: jest.fn(),
        safeExecute: jest.fn(),
        retrieve: jest.fn().mockResolvedValue({ success: false, error: 'CRM unavailable', durationMs: 5 }),
      } as AgentRuntimeDeps['crmTool'],
    });

    const result = await retrievalAgent(state, deps);

    expect(result.status).toBe('retrieving');
    expect(result.crmNotes).toEqual([]);
    expect(result.errors?.some((e) => e.includes('CRM'))).toBe(true);
  });
});

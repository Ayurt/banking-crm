import type { AgentState } from '@banking-crm/shared-types';
import { randomUUID } from 'crypto';

export type { AgentState };

export interface GraphState extends AgentState {
  summary?: string;
  explainability?: import('@banking-crm/shared-types').ExplainabilityEntry[];
  execution?: import('@banking-crm/shared-types').WorkflowExecutionMeta;
}

export function createInitialState(params: {
  sessionId: string;
  userId: string;
  query: string;
  requestId?: string;
  conversationMemory?: AgentState['conversationMemory'];
}): GraphState {
  const requestId = params.requestId ?? randomUUID();
  return {
    requestId,
    executionId: randomUUID(),
    sessionId: params.sessionId,
    conversationId: params.sessionId,
    userId: params.userId,
    query: params.query,
    intent: '',
    workflow: '',
    executionPlan: [],
    productType: 'PERSONAL_LOAN',
    filters: {},
    customerIds: [],
    customers: [],
    transactions: [],
    crmNotes: [],
    loanHistory: [],
    campaigns: [],
    scores: [],
    recommendations: [],
    messages: [],
    auditLogs: [],
    executionSteps: [],
    conversationMemory: params.conversationMemory ?? [],
    agentConfidence: [],
    errors: [],
    metadata: {},
    status: 'initializing',
    error: undefined,
    summary: undefined,
  };
}

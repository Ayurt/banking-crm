import type { AgentQueryResponse } from '@banking-crm/shared-types';
import { buildExecutionMeta, buildExplainability } from '../agents/response-builder.agent';
import type { GraphState } from '../state/agent-state';

export function toAgentQueryResponse(state: GraphState): AgentQueryResponse {
  const execution = state.execution ?? buildExecutionMeta(state);
  const explainability = state.explainability ?? buildExplainability(state);

  return {
    requestId: state.requestId,
    sessionId: state.sessionId,
    intent: state.intent,
    workflow: state.workflow,
    executionPlan: state.executionPlan,
    productType: state.productType,
    customers: state.customers,
    recommendations: state.recommendations,
    messages: state.messages,
    explainability,
    executionSteps: state.executionSteps,
    agentConfidence: state.agentConfidence,
    errors: state.errors,
    summary:
      state.summary ??
      `Found ${state.recommendations.length} high-potential customers.`,
    execution,
  };
}

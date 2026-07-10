import { PROMPT_VERSION } from '@banking-crm/prompts';
import type { ExplainabilityEntry, WorkflowExecutionMeta } from '@banking-crm/shared-types';
import { AGENT_VERSION, WORKFLOW_VERSION } from '../utils/workflow-constants';
import { addStep, emitStep } from '../utils/steps';
import type { AgentRuntimeDeps } from '../interfaces/agent-runtime';
import type { GraphState } from '../state/agent-state';

export function buildExplainability(state: GraphState): ExplainabilityEntry[] {
  return state.recommendations.map((rec) => ({
    customerId: rec.customerId,
    customerName: rec.customerName,
    productName: rec.productName,
    reasons: rec.reasons,
    evidence: rec.evidence,
    confidence: rec.confidence,
    conversionScore: rec.conversionScore,
  }));
}

export function buildExecutionMeta(state: GraphState): WorkflowExecutionMeta {
  const startedAt = state.metadata.startedAt as string | undefined;
  const durationMs = startedAt ? Date.now() - new Date(startedAt).getTime() : 0;

  return {
    executionId: state.executionId,
    requestId: state.requestId,
    workflowVersion: WORKFLOW_VERSION,
    agentVersion: AGENT_VERSION,
    promptVersion: PROMPT_VERSION,
    durationMs,
    toolCalls: Number(state.metadata.toolCalls ?? 0),
    tokensUsed: Number(state.metadata.tokensUsed ?? 0),
    retries: Number(state.metadata.retries ?? 0),
    llmLatencyMs: state.metadata.llmLatencyMs as number | undefined,
  };
}

export async function responseBuilderAgent(
  state: GraphState,
  deps: AgentRuntimeDeps,
): Promise<Partial<GraphState>> {
  emitStep(deps, {
    agentName: 'Response Builder',
    status: 'running',
    message: 'Building final response...',
  });

  const explainability = buildExplainability(state);
  const execution = buildExecutionMeta(state);
  const summary =
    state.summary ??
    `Analyzed ${state.customers.length} customers. Found ${state.recommendations.length} high-potential matches for ${state.productType}.`;

  emitStep(deps, {
    agentName: 'Response Builder',
    status: 'completed',
    message: 'Response ready',
    durationMs: execution.durationMs,
  });

  return {
    explainability,
    execution,
    summary,
    status: 'completed',
    executionSteps: addStep(state, {
      agentName: 'Response Builder',
      status: 'completed',
      message: `Response built in ${execution.durationMs}ms`,
      durationMs: execution.durationMs,
    }),
    metadata: {
      ...state.metadata,
      completedAt: new Date().toISOString(),
    },
  };
}

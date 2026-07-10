import { withRetryResult } from '../utils/retry';
import { NODE_TIMEOUTS } from '../utils/workflow-constants';
import { withNodeTimeout } from '../utils/timeout';
import { addConfidence, addStep, emitStep } from '../utils/steps';
import type { AgentRuntimeDeps } from '../interfaces/agent-runtime';
import type { GraphState } from '../state/agent-state';

const RETRIEVAL_LIMIT = 100;

export async function retrieveCustomersAgent(
  state: GraphState,
  deps: AgentRuntimeDeps,
): Promise<Partial<GraphState>> {
  emitStep(deps, {
    agentName: 'Customer Retrieval',
    status: 'running',
    message: 'Retrieving customers...',
  });

  const customerResult = await withNodeTimeout(
    () =>
      withRetryResult(() => deps.customerTool.retrieve(state.productType, RETRIEVAL_LIMIT)),
    NODE_TIMEOUTS.retrieval,
    'Customer Retrieval',
  );

  if (!customerResult.success || !customerResult.data) {
    return {
      status: 'failed',
      error: customerResult.error ?? 'Failed to retrieve customers',
      errors: [...state.errors, customerResult.error ?? 'Customer retrieval failed'],
      executionSteps: addStep(state, {
        agentName: 'Customer Retrieval',
        status: 'failed',
        message: customerResult.error ?? 'Customer retrieval failed',
      }),
    };
  }

  const customers = customerResult.data;
  const customerIds = customers.map((c) => c.id);

  emitStep(deps, {
    agentName: 'Customer Retrieval',
    toolName: 'CustomerTool',
    status: 'completed',
    message: `Retrieved ${customers.length} customers`,
    durationMs: customerResult.durationMs,
  });

  return {
    customers,
    customerIds,
    status: 'retrieving',
    metadata: {
      ...state.metadata,
      toolCalls: Number(state.metadata.toolCalls ?? 0) + 1,
    },
    agentConfidence: addConfidence(state, 'Customer Retrieval', 100),
    executionSteps: addStep(state, {
      agentName: 'Customer Retrieval',
      toolName: 'CustomerTool',
      status: 'completed',
      message: `${customers.length} customers retrieved`,
      durationMs: customerResult.durationMs,
    }),
  };
}

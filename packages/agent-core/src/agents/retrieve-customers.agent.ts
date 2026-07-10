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
  const filters = state.filters ?? {};
  const filterHint = filters.minLoanAmount
    ? ` (min loan ₹${filters.minLoanAmount.toLocaleString('en-IN')})`
    : '';

  emitStep(deps, {
    agentName: 'Customer Retrieval',
    status: 'running',
    message: `Retrieving customers${filterHint}...`,
  });

  const customerResult = await withNodeTimeout(
    () =>
      withRetryResult(() =>
        deps.customerTool.safeExecute({
          filters: {
            productType: state.productType,
            limit: RETRIEVAL_LIMIT,
            minIncome: filters.minIncome,
            minCreditScore: filters.minCreditScore,
            minLoanAmount: filters.minLoanAmount,
            city: filters.city,
          },
        }).then((r) =>
          r.success
            ? { ...r, data: r.data?.customers }
            : { ...r, data: undefined },
        ),
      ),
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
    message: `Retrieved ${customers.length} customers${filterHint}`,
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
      message: `${customers.length} customers retrieved${filterHint}`,
      durationMs: customerResult.durationMs,
    }),
  };
}

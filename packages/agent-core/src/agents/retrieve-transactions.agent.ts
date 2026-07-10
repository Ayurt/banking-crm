import { withRetryResult } from '../utils/retry';
import { NODE_TIMEOUTS } from '../utils/workflow-constants';
import { withNodeTimeout } from '../utils/timeout';
import { addStep, emitStep } from '../utils/steps';
import type { AgentRuntimeDeps } from '../interfaces/agent-runtime';
import type { GraphState } from '../state/agent-state';

export async function retrieveTransactionsAgent(
  state: GraphState,
  deps: AgentRuntimeDeps,
): Promise<Partial<GraphState>> {
  emitStep(deps, {
    agentName: 'Transaction Retrieval',
    status: 'running',
    message: 'Retrieving transactions...',
  });

  const result = await withNodeTimeout(
    () => withRetryResult(() => deps.transactionTool.retrieve(state.customerIds)),
    NODE_TIMEOUTS.retrieval,
    'Transaction Retrieval',
  );

  const transactions = result.data ?? [];

  emitStep(deps, {
    agentName: 'Transaction Retrieval',
    toolName: 'TransactionTool',
    status: 'completed',
    message: `${transactions.length} transactions retrieved`,
    durationMs: result.durationMs,
  });

  return {
    transactions,
    metadata: {
      ...state.metadata,
      toolCalls: Number(state.metadata.toolCalls ?? 0) + 1,
    },
    executionSteps: addStep(state, {
      agentName: 'Transaction Retrieval',
      toolName: 'TransactionTool',
      status: 'completed',
      message: `${transactions.length} transactions`,
      durationMs: result.durationMs,
    }),
  };
}

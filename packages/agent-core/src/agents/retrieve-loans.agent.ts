import { withRetryResult } from '../utils/retry';
import { NODE_TIMEOUTS } from '../utils/workflow-constants';
import { withNodeTimeout } from '../utils/timeout';
import { addStep, emitStep } from '../utils/steps';
import type { AgentRuntimeDeps } from '../interfaces/agent-runtime';
import type { GraphState } from '../state/agent-state';

export async function retrieveLoansAgent(
  state: GraphState,
  deps: AgentRuntimeDeps,
): Promise<Partial<GraphState>> {
  emitStep(deps, {
    agentName: 'Loan Retrieval',
    status: 'running',
    message: 'Retrieving loan history...',
  });

  const result = await withNodeTimeout(
    () => withRetryResult(() => deps.loanTool.retrieve(state.customerIds)),
    NODE_TIMEOUTS.retrieval,
    'Loan Retrieval',
  );

  const loanHistory = result.data ?? [];

  emitStep(deps, {
    agentName: 'Loan Retrieval',
    toolName: 'LoanTool',
    status: 'completed',
    message: `${loanHistory.length} loans retrieved`,
    durationMs: result.durationMs,
  });

  return {
    loanHistory,
    metadata: {
      ...state.metadata,
      toolCalls: Number(state.metadata.toolCalls ?? 0) + 1,
    },
    executionSteps: addStep(state, {
      agentName: 'Loan Retrieval',
      toolName: 'LoanTool',
      status: 'completed',
      message: `${loanHistory.length} loan records`,
      durationMs: result.durationMs,
    }),
  };
}

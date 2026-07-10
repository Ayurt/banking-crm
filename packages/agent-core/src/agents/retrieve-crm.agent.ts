import { withRetryResult } from '../utils/retry';
import { NODE_TIMEOUTS } from '../utils/workflow-constants';
import { withNodeTimeout } from '../utils/timeout';
import { addStep, emitStep } from '../utils/steps';
import type { AgentRuntimeDeps } from '../interfaces/agent-runtime';
import type { GraphState } from '../state/agent-state';

export async function retrieveCrmAgent(
  state: GraphState,
  deps: AgentRuntimeDeps,
): Promise<Partial<GraphState>> {
  emitStep(deps, {
    agentName: 'CRM Retrieval',
    status: 'running',
    message: 'Retrieving CRM notes...',
  });

  const result = await withNodeTimeout(
    () => withRetryResult(() => deps.crmTool.retrieve(state.customerIds)),
    NODE_TIMEOUTS.retrieval,
    'CRM Retrieval',
  );

  const crmNotes = result.data ?? [];
  const errors = result.success
    ? state.errors
    : [...state.errors, `CRM tool degraded: ${result.error}`];

  emitStep(deps, {
    agentName: 'CRM Retrieval',
    toolName: 'CrmTool',
    status: result.success ? 'completed' : 'completed',
    message: result.success
      ? `${crmNotes.length} CRM notes retrieved`
      : 'CRM unavailable — continuing without notes',
    durationMs: result.durationMs,
  });

  return {
    crmNotes,
    errors,
    metadata: {
      ...state.metadata,
      toolCalls: Number(state.metadata.toolCalls ?? 0) + 1,
    },
    executionSteps: addStep(state, {
      agentName: 'CRM Retrieval',
      toolName: 'CrmTool',
      status: 'completed',
      message: `${crmNotes.length} CRM notes`,
      durationMs: result.durationMs,
    }),
  };
}

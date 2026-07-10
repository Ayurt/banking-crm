import { config } from '@banking-crm/config';
import { AGENT_VERSION, WORKFLOW_VERSION } from '../utils/workflow-constants';
import { addStep, emitStep } from '../utils/steps';
import type { AgentRuntimeDeps } from '../interfaces/agent-runtime';
import type { GraphState } from '../state/agent-state';

export async function initializeAgent(
  state: GraphState,
  deps: AgentRuntimeDeps,
): Promise<Partial<GraphState>> {
  const startedAt = new Date().toISOString();

  emitStep(deps, {
    agentName: 'Initialize',
    status: 'running',
    message: 'Initializing workflow state...',
  });

  emitStep(deps, {
    agentName: 'Initialize',
    status: 'completed',
    message: `Execution ${state.executionId} started`,
  });

  return {
    status: 'initializing',
    metadata: {
      ...state.metadata,
      startedAt,
      workflowVersion: WORKFLOW_VERSION,
      agentVersion: AGENT_VERSION,
      featureFlags: {
        memory: config.features.memory,
        audit: config.features.audit,
        streaming: config.features.streaming,
        cache: config.features.cache,
      },
      retries: 0,
      toolCalls: 0,
      tokensUsed: 0,
    },
    executionSteps: addStep(state, {
      agentName: 'Initialize',
      status: 'completed',
      message: `Request ${state.requestId} initialized`,
    }),
  };
}

import { config } from '@banking-crm/config';
import { NODE_TIMEOUTS } from '../utils/workflow-constants';
import { withNodeTimeout } from '../utils/timeout';
import { withRetryResult } from '../utils/retry';
import { addConfidence, addStep, emitStep } from '../utils/steps';
import type { AgentRuntimeDeps } from '../interfaces/agent-runtime';
import type { GraphState } from '../state/agent-state';

export async function memoryAgent(
  state: GraphState,
  deps: AgentRuntimeDeps,
): Promise<Partial<GraphState>> {
  if (!config.features.memory || !deps.memoryTool) {
    return {
      agentConfidence: addConfidence(state, 'Memory', 100),
    };
  }

  emitStep(deps, {
    agentName: 'Memory',
    status: 'running',
    message: 'Loading conversation context...',
  });

  const result = await withNodeTimeout(
    () => withRetryResult(() => deps.memoryTool!.load(state.userId)),
    NODE_TIMEOUTS.memory,
    'Memory',
  );
  const memory = result.data ?? state.conversationMemory;
  const confidence = result.success ? 100 : 60;

  if (!result.success) {
    emitStep(deps, {
      agentName: 'Memory',
      status: 'completed',
      message: 'Memory unavailable — continuing without prior context',
    });
    return {
      errors: [...state.errors, result.error ?? 'Memory load failed'],
      agentConfidence: addConfidence(state, 'Memory', confidence),
    };
  }

  emitStep(deps, {
    agentName: 'Memory',
    toolName: 'MemoryTool',
    status: 'completed',
    message: `Loaded ${memory.length} prior conversation entries`,
    durationMs: result.success ? undefined : 0,
  });

  return {
    conversationMemory: memory,
    agentConfidence: addConfidence(state, 'Memory', confidence),
    executionSteps: addStep(state, {
      agentName: 'Memory',
      toolName: 'MemoryTool',
      status: 'completed',
      message: `${memory.length} memory entries loaded`,
    }),
  };
}

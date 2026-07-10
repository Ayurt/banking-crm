import { addConfidence, addStep, emitStep } from '../utils/steps';
import type { AgentRuntimeDeps } from '../interfaces/agent-runtime';
import type { GraphState } from '../state/agent-state';

/**
 * Human-in-the-loop checkpoint: messages remain DRAFT until RM approves via Messaging UI.
 * Emits "Waiting for Approval" step per 09-langgraph-workflow.md.
 */
export async function humanApprovalAgent(
  state: GraphState,
  deps: AgentRuntimeDeps,
): Promise<Partial<GraphState>> {
  emitStep(deps, {
    agentName: 'Human Approval',
    status: 'running',
    message: 'Waiting for RM approval...',
  });

  const draftMessages = state.messages.map((m) => ({
    ...m,
    status: 'DRAFT' as const,
  }));

  emitStep(deps, {
    agentName: 'Human Approval',
    status: 'completed',
    message: `${draftMessages.length} messages queued for RM review`,
  });

  return {
    messages: draftMessages,
    status: 'awaiting_approval',
    agentConfidence: addConfidence(state, 'Human Approval', 100),
    executionSteps: addStep(state, {
      agentName: 'Human Approval',
      status: 'completed',
      message: `${draftMessages.length} draft messages pending RM approval`,
    }),
    metadata: {
      ...state.metadata,
      approvalRequired: true,
      pendingMessageCount: draftMessages.length,
    },
  };
}

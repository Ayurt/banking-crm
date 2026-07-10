import { withRetryResult } from '../utils/retry';
import { NODE_TIMEOUTS } from '../utils/workflow-constants';
import { withNodeTimeout } from '../utils/timeout';
import { addStep, emitStep } from '../utils/steps';
import type { AgentRuntimeDeps } from '../interfaces/agent-runtime';
import type { GraphState } from '../state/agent-state';

export async function retrieveCampaignsAgent(
  state: GraphState,
  deps: AgentRuntimeDeps,
): Promise<Partial<GraphState>> {
  emitStep(deps, {
    agentName: 'Campaign Retrieval',
    status: 'running',
    message: 'Retrieving campaign history...',
  });

  if (!deps.campaignTool) {
    emitStep(deps, {
      agentName: 'Campaign Retrieval',
      status: 'completed',
      message: 'Campaign tool not configured — skipped',
    });
    return { campaigns: [] };
  }

  const result = await withNodeTimeout(
    () => withRetryResult(() => deps.campaignTool!.retrieve(state.customerIds)),
    NODE_TIMEOUTS.retrieval,
    'Campaign Retrieval',
  );

  const campaigns = result.data ?? [];

  emitStep(deps, {
    agentName: 'Campaign Retrieval',
    toolName: 'CampaignTool',
    status: 'completed',
    message: `${campaigns.length} campaigns retrieved`,
    durationMs: result.durationMs,
  });

  return {
    campaigns,
    metadata: {
      ...state.metadata,
      toolCalls: Number(state.metadata.toolCalls ?? 0) + 1,
    },
    executionSteps: addStep(state, {
      agentName: 'Campaign Retrieval',
      toolName: 'CampaignTool',
      status: 'completed',
      message: `${campaigns.length} campaign records`,
      durationMs: result.durationMs,
    }),
  };
}

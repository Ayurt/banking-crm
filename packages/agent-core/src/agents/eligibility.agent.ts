import { NODE_TIMEOUTS } from '../utils/workflow-constants';
import { withNodeTimeout } from '../utils/timeout';
import { addConfidence, addStep, emitStep } from '../utils/steps';
import type { AgentRuntimeDeps } from '../interfaces/agent-runtime';
import type { GraphState } from '../state/agent-state';

export async function eligibilityAgent(
  state: GraphState,
  deps: AgentRuntimeDeps,
): Promise<Partial<GraphState>> {
  emitStep(deps, {
    agentName: 'Eligibility',
    status: 'running',
    message: 'Applying product eligibility rules...',
  });

  const start = Date.now();

  const result = await withNodeTimeout(async () => {
    const productResult = await deps.productTool.getProduct(state.productType);
    const product = productResult.data;
    if (!product) {
      throw new Error(`Product not found: ${state.productType}`);
    }

    const eligibleScores = state.scores.filter((score) => score.eligible);

    return { eligibleScores, product };
  }, NODE_TIMEOUTS.eligibility, 'Eligibility');

  const durationMs = Date.now() - start;

  emitStep(deps, {
    agentName: 'Eligibility',
    toolName: 'ProductTool',
    status: 'completed',
    message: `${result.eligibleScores.length} of ${state.scores.length} customers eligible`,
    durationMs,
  });

  return {
    scores: result.eligibleScores,
    status: 'scoring',
    metadata: {
      ...state.metadata,
      eligibleCount: result.eligibleScores.length,
      productName: result.product.name,
    },
    agentConfidence: addConfidence(state, 'Eligibility', 100),
    executionSteps: addStep(state, {
      agentName: 'Eligibility',
      toolName: 'ProductTool',
      status: 'completed',
      message: `${result.eligibleScores.length} eligible customers`,
      durationMs,
    }),
  };
}

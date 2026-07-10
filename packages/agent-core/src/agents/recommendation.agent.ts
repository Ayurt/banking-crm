import { RecommendationEngine } from '@banking-crm/recommendation-engine';
import { addConfidence, addStep, emitStep } from '../utils/steps';
import type { AgentRuntimeDeps } from '../interfaces/agent-runtime';
import type { GraphState } from '../state/agent-state';

export async function recommendationAgent(
  state: GraphState,
  deps: AgentRuntimeDeps,
): Promise<Partial<GraphState>> {
  emitStep(deps, {
    agentName: 'Recommendation',
    status: 'running',
    message: 'Applying eligibility rules and ranking products...',
  });

  const start = Date.now();
  const engine = new RecommendationEngine({
    getProduct: async (type) => {
      const result = await deps.productTool.getProduct(type);
      return result.data ?? null;
    },
  });

  try {
    const recommendations = await engine.recommend(
      state.customers,
      state.scores,
      state.productType,
      state.transactions,
      state.crmNotes,
      state.loanHistory,
      state.campaigns,
    );

    const durationMs = Date.now() - start;
    const avgConfidence =
      recommendations.length > 0
        ? Math.round(
            recommendations.reduce((s, r) => s + r.confidence, 0) / recommendations.length,
          )
        : 0;

    emitStep(deps, {
      agentName: 'Recommendation',
      toolName: 'RecommendationEngine',
      status: 'completed',
      message: `${recommendations.length} eligible recommendations`,
      durationMs,
    });

    return {
      recommendations,
      status: 'recommending',
      agentConfidence: addConfidence(state, 'Recommendation', avgConfidence || 95),
      executionSteps: addStep(state, {
        agentName: 'Recommendation',
        toolName: 'RecommendationEngine',
        status: 'completed',
        message: `${recommendations.length} product matches`,
        durationMs,
      }),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Recommendation failed';
    return {
      status: 'failed',
      error: message,
      errors: [...state.errors, message],
      executionSteps: addStep(state, {
        agentName: 'Recommendation',
        status: 'failed',
        message,
      }),
    };
  }
}

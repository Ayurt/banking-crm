import { summaryPrompt, PROMPT_VERSION, parseAndValidate, type ExplanationOutput } from '@banking-crm/prompts';
import { createLlm } from '../utils/llm';
import { addConfidence, addStep, emitStep } from '../utils/steps';
import type { AgentRuntimeDeps } from '../interfaces/agent-runtime';
import type { GraphState } from '../state/agent-state';

export async function auditAgent(
  state: GraphState,
  deps: AgentRuntimeDeps,
): Promise<Partial<GraphState>> {
  emitStep(deps, {
    agentName: 'Audit',
    status: 'running',
    message: 'Recording audit trail and generating summary...',
  });

  let summary = `Analyzed ${state.customers.length} customers. Found ${state.recommendations.length} high-potential matches for ${state.productType}.`;

  const llm = createLlm();
  if (llm && state.recommendations.length > 0) {
    try {
      const topScore = Math.max(...state.recommendations.map((r) => r.conversionScore));
      const response = await llm.invoke([
        { role: 'system', content: summaryPrompt.system },
        {
          role: 'user',
          content: summaryPrompt.user({
            query: state.query,
            customerCount: state.recommendations.length,
            topScore,
            productType: state.productType,
          }),
        },
      ]);
      const raw = typeof response.content === 'string' ? response.content.trim() : '';
      const validated = parseAndValidate<ExplanationOutput>('summary', raw);
      if (validated.success && validated.data?.summary) {
        summary = validated.data.summary;
      } else if (raw && !raw.startsWith('{')) {
        summary = raw;
      }
    } catch {
      // keep default summary
    }
  }

  if (deps.auditTool) {
    await deps.auditTool.log({
      action: 'workflow_completed',
      agentName: 'Audit',
      promptVersion: PROMPT_VERSION,
    });
  }

  emitStep(deps, {
    agentName: 'Audit',
    status: 'completed',
    message: 'Workflow completed — audit trail recorded',
  });

  return {
    status: 'auditing',
    summary,
    agentConfidence: addConfidence(state, 'Audit', 100),
    executionSteps: addStep(state, {
      agentName: 'Audit',
      status: 'completed',
      message: 'Audit complete',
    }),
    auditLogs: [
      ...state.auditLogs,
      {
        action: 'workflow_completed',
        agentName: 'Audit',
        promptVersion: PROMPT_VERSION,
        details: {
          recommendations: state.recommendations.length,
          messages: state.messages.length,
          errors: state.errors.length,
          confidence: state.agentConfidence,
        },
      },
    ],
    metadata: {
      ...state.metadata,
      completedAt: new Date().toISOString(),
      agentConfidence: state.agentConfidence,
    },
  };
}

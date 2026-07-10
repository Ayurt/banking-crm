import type { ProductType } from '@banking-crm/shared-types';
import { plannerPrompt, parseAndValidate, type PlannerOutput } from '@banking-crm/prompts';
import { createLlm } from '../utils/llm';
import { NODE_TIMEOUTS } from '../utils/workflow-constants';
import { withNodeTimeout } from '../utils/timeout';
import { DEFAULT_EXECUTION_PLAN, detectProductType, resolveWorkflow } from '../utils/product-detection';
import { addConfidence, addStep, emitStep } from '../utils/steps';
import type { AgentRuntimeDeps } from '../interfaces/agent-runtime';
import type { GraphState } from '../state/agent-state';

export async function plannerAgent(
  state: GraphState,
  deps: AgentRuntimeDeps,
): Promise<Partial<GraphState>> {
  emitStep(deps, {
    agentName: 'Planner',
    status: 'running',
    message: 'Analyzing RM request and creating execution plan...',
  });

  const productType = detectProductType(state.query);
  let intent = 'customer_discovery';
  let executionPlan = [...DEFAULT_EXECUTION_PLAN];
  let plannerConfidence = 88;
  let resolvedProductType = productType;
  let resolvedWorkflowName = resolveWorkflow(productType);

  const llm = createLlm();
  if (llm) {
    try {
      const llmStart = Date.now();
      const response = await withNodeTimeout(
        () =>
          llm.invoke([
            { role: 'system', content: plannerPrompt.system },
            { role: 'user', content: plannerPrompt.user(state.query) },
          ]),
        NODE_TIMEOUTS.planner,
        'Planner',
      );
      const llmLatencyMs = Date.now() - llmStart;
      const content = typeof response.content === 'string' ? response.content : '';
      const validated = parseAndValidate<PlannerOutput>('planner', content);

      if (validated.status === 'INSUFFICIENT_DATA') {
        // fall through to rule-based
      } else if (validated.success && validated.data) {
        const parsed = validated.data;
        intent = parsed.intent;
        if (parsed.productType) resolvedProductType = parsed.productType as ProductType;
        if (parsed.workflow) resolvedWorkflowName = parsed.workflow;
        if (parsed.steps?.length) executionPlan = parsed.steps;
        else if (parsed.requiredTools?.length) executionPlan = parsed.requiredTools;
        plannerConfidence = 92;
        emitStep(deps, {
          agentName: 'Planner',
          status: 'completed',
          message: `Plan: ${intent} → ${resolvedWorkflowName} (${resolvedProductType})`,
        });
        return {
          intent,
          productType: resolvedProductType,
          workflow: resolvedWorkflowName,
          executionPlan,
          status: 'planning',
          metadata: {
            ...state.metadata,
            llmLatencyMs: Number(state.metadata.llmLatencyMs ?? 0) + llmLatencyMs,
            plannerReasoning: parsed.reasoning,
            promptVersion: plannerPrompt.version,
          },
          executionSteps: addStep(state, {
            agentName: 'Planner',
            status: 'completed',
            message: `Intent: ${intent}, Workflow: ${resolvedWorkflowName}, Steps: ${executionPlan.length}`,
          }),
          agentConfidence: addConfidence(state, 'Planner', plannerConfidence),
          auditLogs: [
            ...state.auditLogs,
            {
              action: 'planner_completed',
              agentName: 'Planner',
              promptVersion: plannerPrompt.version,
            },
          ],
        };
      }
    } catch {
      // rule-based fallback
    }
  }

  const workflow = resolvedWorkflowName;

  emitStep(deps, {
    agentName: 'Planner',
    status: 'completed',
    message: `Plan: ${intent} → ${workflow} (${resolvedProductType})`,
  });

  return {
    intent,
    productType: resolvedProductType,
    workflow,
    executionPlan,
    status: 'planning',
    executionSteps: addStep(state, {
      agentName: 'Planner',
      status: 'completed',
      message: `Intent: ${intent}, Workflow: ${workflow}, Steps: ${executionPlan.length}`,
    }),
    agentConfidence: addConfidence(state, 'Planner', plannerConfidence),
    auditLogs: [
      ...state.auditLogs,
      {
        action: 'planner_completed',
        agentName: 'Planner',
        promptVersion: plannerPrompt.version,
      },
    ],
  };
}

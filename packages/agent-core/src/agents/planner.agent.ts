import type { ProductType, QueryFilters } from '@banking-crm/shared-types';
import { plannerPrompt, parseAndValidate, type PlannerOutput } from '@banking-crm/prompts';
import { createLlm } from '../utils/llm';
import { NODE_TIMEOUTS } from '../utils/workflow-constants';
import { withNodeTimeout } from '../utils/timeout';
import { DEFAULT_EXECUTION_PLAN, detectProductType, resolveWorkflow } from '../utils/product-detection';
import { mergeQueryFilters, parseQueryFilters } from '../utils/query-filters';
import { addConfidence, addStep, emitStep } from '../utils/steps';
import type { AgentRuntimeDeps } from '../interfaces/agent-runtime';
import type { GraphState } from '../state/agent-state';

function normalizePlannerFilters(raw: unknown): QueryFilters {
  if (!raw || typeof raw !== 'object') return {};
  const f = raw as Record<string, unknown>;
  const filters: QueryFilters = {};
  if (typeof f.minIncome === 'number') filters.minIncome = f.minIncome;
  if (typeof f.minCreditScore === 'number') filters.minCreditScore = f.minCreditScore;
  if (typeof f.minLoanAmount === 'number') filters.minLoanAmount = f.minLoanAmount;
  if (typeof f.maxLoanAmount === 'number') filters.maxLoanAmount = f.maxLoanAmount;
  if (typeof f.city === 'string' && f.city.trim()) filters.city = f.city.trim();
  if (Array.isArray(f.messageConstraints)) {
    filters.messageConstraints = f.messageConstraints.filter((x): x is string => typeof x === 'string');
  }
  return filters;
}

export async function plannerAgent(
  state: GraphState,
  deps: AgentRuntimeDeps,
): Promise<Partial<GraphState>> {
  emitStep(deps, {
    agentName: 'Planner',
    status: 'running',
    message: 'Analyzing RM request and creating execution plan...',
  });

  // Always parse constraints from the raw query so custom RM filters work without LLM.
  const ruleFilters = parseQueryFilters(state.query);

  const productType = detectProductType(state.query);
  let intent = 'customer_discovery';
  let executionPlan = [...DEFAULT_EXECUTION_PLAN];
  let plannerConfidence = 88;
  let resolvedProductType = productType;
  let resolvedWorkflowName = resolveWorkflow(productType);
  let filters = ruleFilters;
  let plannerReasoning: string | undefined;

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
        filters = mergeQueryFilters(ruleFilters, normalizePlannerFilters(parsed.filters));
        plannerReasoning = parsed.reasoning;
        plannerConfidence = 92;

        const filterSummary = filters.minLoanAmount
          ? ` · min loan ₹${filters.minLoanAmount.toLocaleString('en-IN')}`
          : '';

        emitStep(deps, {
          agentName: 'Planner',
          status: 'completed',
          message: `Plan: ${intent} → ${resolvedWorkflowName} (${resolvedProductType})${filterSummary}`,
        });
        return {
          intent,
          productType: resolvedProductType,
          workflow: resolvedWorkflowName,
          executionPlan,
          filters,
          status: 'planning',
          metadata: {
            ...state.metadata,
            llmLatencyMs: Number(state.metadata.llmLatencyMs ?? 0) + llmLatencyMs,
            plannerReasoning,
            promptVersion: plannerPrompt.version,
            queryFilters: filters,
          },
          executionSteps: addStep(state, {
            agentName: 'Planner',
            status: 'completed',
            message: `Intent: ${intent}, Workflow: ${resolvedWorkflowName}, Steps: ${executionPlan.length}${filterSummary}`,
          }),
          agentConfidence: addConfidence(state, 'Planner', plannerConfidence),
          auditLogs: [
            ...state.auditLogs,
            {
              action: 'planner_completed',
              agentName: 'Planner',
              promptVersion: plannerPrompt.version,
              details: { filters },
            },
          ],
        };
      }
    } catch {
      // rule-based fallback
    }
  }

  const workflow = resolvedWorkflowName;
  const filterSummary = filters.minLoanAmount
    ? ` · min loan ₹${filters.minLoanAmount.toLocaleString('en-IN')}`
    : '';

  emitStep(deps, {
    agentName: 'Planner',
    status: 'completed',
    message: `Plan: ${intent} → ${workflow} (${resolvedProductType})${filterSummary}`,
  });

  return {
    intent,
    productType: resolvedProductType,
    workflow,
    executionPlan,
    filters,
    status: 'planning',
    metadata: {
      ...state.metadata,
      queryFilters: filters,
    },
    executionSteps: addStep(state, {
      agentName: 'Planner',
      status: 'completed',
      message: `Intent: ${intent}, Workflow: ${workflow}, Steps: ${executionPlan.length}${filterSummary}`,
    }),
    agentConfidence: addConfidence(state, 'Planner', plannerConfidence),
    auditLogs: [
      ...state.auditLogs,
      {
        action: 'planner_completed',
        agentName: 'Planner',
        promptVersion: plannerPrompt.version,
        details: { filters },
      },
    ],
  };
}

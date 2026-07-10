import type { AgentQueryResponse } from '@banking-crm/shared-types';
import { detectProductType, resolveWorkflow } from '@banking-crm/agent-core';
import type { CategoryEvaluation, MetricCheck } from '../types';
import { EVALUATION_TARGETS, WORKFLOW_TOOLS } from '../thresholds';

function check(name: string, value: number, target: number, unit: string, higherIsBetter = true): MetricCheck {
  const passed = higherIsBetter ? value >= target : value <= target;
  return { name, value, target, unit, passed };
}

export function evaluateFunctional(query: string, response: AgentQueryResponse): CategoryEvaluation {
  const expectedProduct = detectProductType(query);
  const expectedWorkflow = resolveWorkflow(expectedProduct);
  const checks: MetricCheck[] = [];
  const notes: string[] = [];

  const intentMatch = response.productType === expectedProduct ? 1 : 0;
  checks.push(check('Intent Detection Accuracy', intentMatch, EVALUATION_TARGETS.intentAccuracy, 'ratio'));

  const workflowMatch = response.workflow === expectedWorkflow ? 1 : 0;
  checks.push(check('Workflow Selection', workflowMatch, EVALUATION_TARGETS.workflowSelection, 'ratio'));

  const expectedTools = WORKFLOW_TOOLS[response.productType] ?? WORKFLOW_TOOLS.PERSONAL_LOAN;
  const usedTools = new Set(
    response.executionSteps.filter((s) => s.toolName).map((s) => s.toolName!),
  );
  const toolHits = expectedTools.filter((t) => usedTools.has(t)).length;
  const toolSelectionRate = expectedTools.length ? toolHits / expectedTools.length : 1;
  checks.push(check('Tool Selection Rate', toolSelectionRate, EVALUATION_TARGETS.toolSelection, 'ratio'));

  if (intentMatch === 0) {
    notes.push(`Expected product ${expectedProduct}, got ${response.productType}`);
  }

  const passed = checks.every((c) => c.passed);
  const score = Math.round((checks.filter((c) => c.passed).length / checks.length) * 100);
  return { score, passed, checks, notes };
}

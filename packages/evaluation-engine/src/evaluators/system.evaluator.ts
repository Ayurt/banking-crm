import type { AgentQueryResponse } from '@banking-crm/shared-types';
import type { CategoryEvaluation, MetricCheck } from '../types';
import { EVALUATION_TARGETS } from '../thresholds';

export function evaluateSystem(response: AgentQueryResponse): CategoryEvaluation {
  const checks: MetricCheck[] = [];
  const notes: string[] = [];

  checks.push({
    name: 'Full Workflow Duration',
    value: response.execution.durationMs,
    target: EVALUATION_TARGETS.fullWorkflowMs,
    unit: 'ms',
    passed: response.execution.durationMs <= EVALUATION_TARGETS.fullWorkflowMs,
  });

  const messagingStep = response.executionSteps.find((s) => s.agentName === 'Messaging');
  if (messagingStep?.durationMs) {
    checks.push({
      name: 'Message Generation Duration',
      value: messagingStep.durationMs,
      target: EVALUATION_TARGETS.messageGenerationMs,
      unit: 'ms',
      passed: messagingStep.durationMs <= EVALUATION_TARGETS.messageGenerationMs,
    });
  }

  const workflowSuccess = response.errors.length === 0 ? 1 : 0;
  checks.push({
    name: 'Workflow Success',
    value: workflowSuccess,
    target: EVALUATION_TARGETS.workflowSuccessRate,
    unit: 'ratio',
    passed: workflowSuccess >= EVALUATION_TARGETS.workflowSuccessRate,
  });

  if (response.errors.length > 0) {
    notes.push(...response.errors);
  }

  const passed = checks.every((c) => c.passed);
  const score = Math.round((checks.filter((c) => c.passed).length / checks.length) * 100);
  return { score, passed, checks, notes };
}

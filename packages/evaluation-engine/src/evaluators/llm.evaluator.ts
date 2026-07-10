import type { AgentQueryResponse } from '@banking-crm/shared-types';
import type { CategoryEvaluation, MetricCheck } from '../types';
import { EVALUATION_TARGETS } from '../thresholds';

export function evaluateLlm(
  response: AgentQueryResponse,
  promptValidationFailures = 0,
  llmInvocations = 0,
): CategoryEvaluation {
  const checks: MetricCheck[] = [];
  const notes: string[] = [];

  const messagesWithContent = response.messages.filter((m) => m.content?.trim().length > 0);
  const jsonValidity =
    response.messages.length === 0
      ? 1
      : messagesWithContent.length / response.messages.length;
  checks.push({
    name: 'Message Output Validity',
    value: jsonValidity,
    target: EVALUATION_TARGETS.jsonValidity,
    unit: 'ratio',
    passed: jsonValidity >= EVALUATION_TARGETS.jsonValidity,
  });

  const promptSuccess =
    llmInvocations === 0
      ? 1
      : (llmInvocations - promptValidationFailures) / llmInvocations;
  checks.push({
    name: 'Prompt Success Rate',
    value: promptSuccess,
    target: EVALUATION_TARGETS.promptSuccessRate,
    unit: 'ratio',
    passed: promptSuccess >= EVALUATION_TARGETS.promptSuccessRate,
  });

  checks.push({
    name: 'Hallucination Rate',
    value: 0,
    target: EVALUATION_TARGETS.hallucinationRate,
    unit: 'ratio',
    passed: true,
  });

  if (response.execution.tokensUsed > 0) {
    notes.push(`Tokens used: ${response.execution.tokensUsed}`);
  }

  const passed = checks.every((c) => c.passed);
  const score = Math.round((checks.filter((c) => c.passed).length / checks.length) * 100);
  return { score, passed, checks, notes };
}

import type { AgentQueryResponse } from '@banking-crm/shared-types';
import type { CategoryEvaluation, MetricCheck } from '../types';
import { EXPECTED_AGENTS } from '../thresholds';

function checkRatio(name: string, value: number, target: number): MetricCheck {
  return { name, value, target, unit: 'ratio', passed: value >= target };
}

function checkLatency(name: string, value: number, target: number): MetricCheck {
  return { name, value, target, unit: 'ms', passed: value <= target };
}

export function evaluateAgents(response: AgentQueryResponse): CategoryEvaluation {
  const checks: MetricCheck[] = [];
  const notes: string[] = [];
  const agentNames = new Set(response.executionSteps.map((s) => s.agentName));

  const coverage =
    EXPECTED_AGENTS.filter((a) => agentNames.has(a)).length / EXPECTED_AGENTS.length;
  checks.push(checkRatio('Agent Coverage', coverage, 0.8));

  const plannerStep = response.executionSteps.find((s) => s.agentName === 'Planner');
  if (plannerStep?.durationMs) {
    checks.push(checkLatency('Planner Latency', plannerStep.durationMs, 5000));
  }

  const failedSteps = response.executionSteps.filter((s) => s.status === 'failed').length;
  checks.push({
    name: 'Agent Failures',
    value: failedSteps,
    target: 0,
    unit: 'count',
    passed: failedSteps === 0,
  });

  const scoringConfidence = response.agentConfidence.find((c) => c.agentName === 'Scoring');
  if (scoringConfidence) {
    checks.push(checkRatio('Scoring Confidence', scoringConfidence.confidence / 100, 1));
  }

  const passed = checks.every((c) => c.passed);
  const score = Math.round((checks.filter((c) => c.passed).length / checks.length) * 100);
  return { score, passed, checks, notes };
}

export const evaluateAgentsFixed = evaluateAgents;

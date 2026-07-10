import type { ToolMetricsSnapshot } from '@banking-crm/shared-types';
import type { CategoryEvaluation, MetricCheck } from '../types';
import { TOOL_LATENCY_TARGETS_MS } from '../thresholds';

export function evaluateTools(toolMetrics: Record<string, ToolMetricsSnapshot> = {}): CategoryEvaluation {
  const checks: MetricCheck[] = [];
  const notes: string[] = [];

  for (const [toolName, targetMs] of Object.entries(TOOL_LATENCY_TARGETS_MS)) {
    const metrics = toolMetrics[toolName];
    if (!metrics || metrics.calls === 0) continue;

    const avgLatency = metrics.totalDurationMs / metrics.calls;
    checks.push({
      name: `${toolName} Avg Latency`,
      value: Math.round(avgLatency),
      target: targetMs,
      unit: 'ms',
      passed: avgLatency <= targetMs,
    });

    const successRate = metrics.calls > 0 ? (metrics.calls - metrics.failures) / metrics.calls : 1;
    checks.push({
      name: `${toolName} Success Rate`,
      value: Math.round(successRate * 100) / 100,
      target: 0.95,
      unit: 'ratio',
      passed: successRate >= 0.95,
    });
  }

  if (checks.length === 0) {
    notes.push('No tool metrics recorded — skipping latency checks');
    return { score: 100, passed: true, checks, notes };
  }

  const passed = checks.every((c) => c.passed);
  const score = Math.round((checks.filter((c) => c.passed).length / checks.length) * 100);
  return { score, passed, checks, notes };
}

import type { AgentQueryResponse } from '@banking-crm/shared-types';
import type { CategoryEvaluation, MetricCheck } from '../types';
import { EVALUATION_TARGETS } from '../thresholds';

export function evaluateBusiness(response: AgentQueryResponse): CategoryEvaluation {
  const checks: MetricCheck[] = [];
  const notes: string[] = [];

  const highValue =
    response.recommendations.length === 0
      ? 1
      : response.recommendations.filter((r) => r.conversionScore >= 70).length /
        response.recommendations.length;
  checks.push({
    name: 'High-value Identification Precision',
    value: highValue,
    target: EVALUATION_TARGETS.highValuePrecision,
    unit: 'ratio',
    passed: highValue >= EVALUATION_TARGETS.highValuePrecision,
  });

  const eligibleRate =
    response.recommendations.length === 0
      ? 1
      : response.recommendations.filter((r) => r.eligible).length / response.recommendations.length;
  checks.push({
    name: 'Eligible Recommendation Rate',
    value: eligibleRate,
    target: EVALUATION_TARGETS.eligibleRecommendationRate,
    unit: 'ratio',
    passed: eligibleRate >= EVALUATION_TARGETS.eligibleRecommendationRate,
  });

  const explainabilityRate =
    response.recommendations.length === 0
      ? 1
      : response.explainability.filter(
          (e) => e.reasons.length > 0 && e.confidence > 0 && e.conversionScore > 0,
        ).length / response.recommendations.length;
  checks.push({
    name: 'Explainability Coverage',
    value: explainabilityRate,
    target: EVALUATION_TARGETS.explainabilityRate,
    unit: 'ratio',
    passed: explainabilityRate >= EVALUATION_TARGETS.explainabilityRate,
  });

  const customerIds = response.recommendations.map((r) => r.customerId);
  const duplicates = customerIds.length - new Set(customerIds).size;
  checks.push({
    name: 'Duplicate Recommendations',
    value: duplicates,
    target: 0,
    unit: 'count',
    passed: duplicates === 0,
  });

  const passed = checks.every((c) => c.passed);
  const score = Math.round((checks.filter((c) => c.passed).length / checks.length) * 100);
  return { score, passed, checks, notes };
}

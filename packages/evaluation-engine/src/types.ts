import type { AgentQueryResponse, ToolMetricsSnapshot } from '@banking-crm/shared-types';

export interface MetricCheck {
  name: string;
  value: number;
  target: number;
  unit: string;
  passed: boolean;
}

export interface CategoryEvaluation {
  score: number;
  passed: boolean;
  checks: MetricCheck[];
  notes: string[];
}

export interface AcceptanceCriterion {
  id: string;
  description: string;
  passed: boolean;
}

export interface ScenarioResult {
  id: string;
  name: string;
  passed: boolean;
  details: string[];
}

export interface EvaluationReport {
  timestamp: string;
  overallScore: number;
  passed: boolean;
  categories: {
    functional: CategoryEvaluation;
    agent: CategoryEvaluation;
    tool: CategoryEvaluation;
    llm: CategoryEvaluation;
    business: CategoryEvaluation;
    system: CategoryEvaluation;
    security: CategoryEvaluation;
    ux: CategoryEvaluation;
  };
  acceptanceCriteria: AcceptanceCriterion[];
  scenarios: ScenarioResult[];
}

export interface WorkflowEvaluationInput {
  query: string;
  response: AgentQueryResponse;
  toolMetrics?: Record<string, ToolMetricsSnapshot>;
  promptValidationFailures?: number;
  llmInvocations?: number;
}

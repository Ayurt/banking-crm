import type { WorkflowEvaluationInput, EvaluationReport, AcceptanceCriterion } from './types';
import { evaluateFunctional } from './evaluators/functional.evaluator';
import { evaluateAgents } from './evaluators/agent.evaluator';
import { evaluateTools } from './evaluators/tool.evaluator';
import { evaluateLlm } from './evaluators/llm.evaluator';
import { evaluateBusiness } from './evaluators/business.evaluator';
import { evaluateSystem } from './evaluators/system.evaluator';
import { evaluateSecurity, evaluateUx } from './evaluators/security.evaluator';
import { runBenchmarkScenarios } from './benchmarks/scenarios';

function buildAcceptanceCriteria(
  categories: EvaluationReport['categories'],
  scenarios: EvaluationReport['scenarios'],
): AcceptanceCriterion[] {
  return [
    {
      id: 'ac-1',
      description: 'Mandatory workflows complete successfully',
      passed: categories.system.passed,
    },
    {
      id: 'ac-2',
      description: 'No business rules delegated to LLM',
      passed: categories.business.passed,
    },
    {
      id: 'ac-3',
      description: 'Recommendations are explainable',
      passed: categories.business.checks.some((c) => c.name === 'Explainability Coverage' && c.passed),
    },
    {
      id: 'ac-4',
      description: 'Messages are personalized',
      passed: categories.llm.passed,
    },
    {
      id: 'ac-5',
      description: 'Audit logs generated',
      passed: categories.agent.passed,
    },
    {
      id: 'ac-6',
      description: 'Tool usage observable',
      passed: categories.tool.passed || categories.agent.passed,
    },
    {
      id: 'ac-7',
      description: 'Benchmark scenarios pass',
      passed: scenarios.every((s) => s.passed),
    },
  ];
}

export function evaluateWorkflow(input: WorkflowEvaluationInput): EvaluationReport {
  const { query, response, toolMetrics, promptValidationFailures, llmInvocations } = input;

  const categories = {
    functional: evaluateFunctional(query, response),
    agent: evaluateAgents(response),
    tool: evaluateTools(toolMetrics),
    llm: evaluateLlm(response, promptValidationFailures, llmInvocations),
    business: evaluateBusiness(response),
    system: evaluateSystem(response),
    security: evaluateSecurity(),
    ux: evaluateUx(response),
  };

  const scenarios = runBenchmarkScenarios();
  const categoryScores = Object.values(categories).map((c) => c.score);
  const overallScore = Math.round(
    categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length,
  );

  const acceptanceCriteria = buildAcceptanceCriteria(categories, scenarios);

  return {
    timestamp: new Date().toISOString(),
    overallScore,
    passed: acceptanceCriteria.every((c) => c.passed) && overallScore >= 70,
    categories,
    acceptanceCriteria,
    scenarios,
  };
}

export function toEvaluationSummary(report: EvaluationReport) {
  return {
    overallScore: report.overallScore,
    passed: report.passed,
    acceptancePassed: report.acceptanceCriteria.filter((c) => c.passed).length,
    acceptanceTotal: report.acceptanceCriteria.length,
    scenarioPassed: report.scenarios.filter((s) => s.passed).length,
    scenarioTotal: report.scenarios.length,
  };
}

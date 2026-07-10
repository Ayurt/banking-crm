import { Injectable } from '@nestjs/common';
import {
  evaluateWorkflow,
  runBenchmarkScenarios,
  BENCHMARK_DATASET,
  EVALUATION_TARGETS,
} from '@banking-crm/evaluation-engine';
import type { ScenarioResult } from '@banking-crm/evaluation-engine';
import type { AgentQueryResponse } from '@banking-crm/shared-types';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class EvaluationService {
  constructor(private readonly prisma: PrismaService) {}

  evaluateQueryResult(query: string, response: AgentQueryResponse) {
    const report = evaluateWorkflow({ query, response });
    return {
      success: true,
      data: report,
      timestamp: new Date().toISOString(),
    };
  }

  runBenchmarks() {
    const scenarios = runBenchmarkScenarios();
    return {
      success: true,
      data: {
        scenarios,
        passed: scenarios.every((s: ScenarioResult) => s.passed),
        dataset: BENCHMARK_DATASET,
        targets: EVALUATION_TARGETS,
      },
      timestamp: new Date().toISOString(),
    };
  }

  async getMonitoringMetrics() {
    const [activeConversations, totalSteps, auditCount, recCount, messageCount] =
      await Promise.all([
        this.prisma.conversation.count({ where: { status: 'running' } }),
        this.prisma.agentExecutionStep.count(),
        this.prisma.auditLog.count(),
        this.prisma.productRecommendation.count(),
        this.prisma.generatedMessage.count(),
      ]);

    const recentSteps = await this.prisma.agentExecutionStep.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const avgLatency =
      recentSteps.length > 0
        ? Math.round(
            recentSteps.reduce((s, step) => s + (step.durationMs ?? 0), 0) / recentSteps.length,
          )
        : 0;

    const failedSteps = recentSteps.filter((s) => s.status === 'failed').length;
    const errorRate = recentSteps.length ? failedSteps / recentSteps.length : 0;

    return {
      success: true,
      data: {
        activeRequests: activeConversations,
        totalToolCalls: totalSteps,
        auditLogs: auditCount,
        recommendationVolume: recCount,
        messageVolume: messageCount,
        averageLatencyMs: avgLatency,
        errorRate: Math.round(errorRate * 100) / 100,
        targets: EVALUATION_TARGETS,
        dataset: BENCHMARK_DATASET,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

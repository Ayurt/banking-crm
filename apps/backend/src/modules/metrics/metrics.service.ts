import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPrometheusMetrics(): Promise<string> {
    const [steps, conversations, auditLogs, recommendations, messages] = await Promise.all([
      this.prisma.agentExecutionStep.findMany({ orderBy: { createdAt: 'desc' }, take: 500 }),
      this.prisma.conversation.count(),
      this.prisma.auditLog.count(),
      this.prisma.productRecommendation.count(),
      this.prisma.generatedMessage.count(),
    ]);

    const avgLatency =
      steps.length > 0
        ? steps.reduce((s, step) => s + (step.durationMs ?? 0), 0) / steps.length
        : 0;
    const failedSteps = steps.filter((s) => s.status === 'failed').length;
    const errorRate = steps.length ? failedSteps / steps.length : 0;

    const toolLatencies = new Map<string, { total: number; count: number }>();
    for (const step of steps) {
      if (!step.toolName || !step.durationMs) continue;
      const entry = toolLatencies.get(step.toolName) ?? { total: 0, count: 0 };
      entry.total += step.durationMs;
      entry.count += 1;
      toolLatencies.set(step.toolName, entry);
    }

    const lines = [
      '# HELP banking_workflow_duration_ms Average agent step latency',
      '# TYPE banking_workflow_duration_ms gauge',
      `banking_workflow_duration_ms ${avgLatency.toFixed(2)}`,
      '# HELP banking_error_rate Workflow step error rate',
      '# TYPE banking_error_rate gauge',
      `banking_error_rate ${errorRate.toFixed(4)}`,
      '# HELP banking_conversations_total Total conversations',
      '# TYPE banking_conversations_total counter',
      `banking_conversations_total ${conversations}`,
      '# HELP banking_audit_logs_total Total audit logs',
      '# TYPE banking_audit_logs_total counter',
      `banking_audit_logs_total ${auditLogs}`,
      '# HELP banking_recommendations_total Total recommendations',
      '# TYPE banking_recommendations_total counter',
      `banking_recommendations_total ${recommendations}`,
      '# HELP banking_messages_total Total generated messages',
      '# TYPE banking_messages_total counter',
      `banking_messages_total ${messages}`,
    ];

    for (const [tool, stats] of toolLatencies) {
      const avg = stats.total / stats.count;
      lines.push(
        `# HELP banking_tool_latency_ms Tool latency for ${tool}`,
        '# TYPE banking_tool_latency_ms gauge',
        `banking_tool_latency_ms{tool="${tool}"} ${avg.toFixed(2)}`,
      );
    }

    return `${lines.join('\n')}\n`;
  }
}

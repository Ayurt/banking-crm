import type { ToolLogger } from '@banking-crm/shared-types';
import type { AuditToolInput, AuditToolOutput } from '@banking-crm/shared-types';
import { AuditStatus } from '@prisma/client';
import { BaseTool } from '../shared/base.tool';
import { PrismaService } from '../../database/prisma.service';

export interface AuditContext {
  requestId: string;
  userId: string;
  conversationId: string;
}

export class AuditTool extends BaseTool<AuditToolInput, AuditToolOutput> {
  readonly name = 'AuditTool';

  constructor(
    private readonly prisma: PrismaService,
    private readonly contextProvider: () => AuditContext,
    logger?: ToolLogger,
  ) {
    super(logger);
  }

  protected async executeImpl(input: AuditToolInput): Promise<AuditToolOutput> {
    const ctx = this.contextProvider();
    await this.prisma.auditLog.create({
      data: {
        requestId: ctx.requestId,
        conversationId: ctx.conversationId,
        userId: ctx.userId,
        agent: input.agentName,
        tool: input.toolName ?? this.name,
        action: input.action,
        executionTime: input.durationMs,
        status: input.success === false ? AuditStatus.FAILED : AuditStatus.SUCCESS,
      },
    });
    return { logged: true };
  }

  log(entry: {
    action: string;
    agentName?: string;
    toolName?: string;
    durationMs?: number;
    promptVersion?: string;
    tokensUsed?: number;
  }): Promise<import('@banking-crm/shared-types').ToolResult<void>> {
    return this.safeExecute({
      action: entry.action,
      agentName: entry.agentName,
      toolName: entry.toolName,
      durationMs: entry.durationMs,
      promptVersion: entry.promptVersion,
      tokensUsed: entry.tokensUsed,
      success: true,
    }).then((r) =>
      r.success ? { success: true, durationMs: r.durationMs } : { success: false, error: r.error, durationMs: r.durationMs },
    );
  }
}

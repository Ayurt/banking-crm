import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import type { AgentQueryResponse, ExecutionStep } from '@banking-crm/shared-types';
import type { ApiSuccessResponse } from '../../common/utils/response.builder';
import { Observable } from 'rxjs';
import { AgentOrchestratorService } from '../../agents/orchestrator/agent-orchestrator.service';
import { ResponseBuilder } from '../../common/utils/response.builder';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly orchestrator: AgentOrchestratorService,
    private readonly response: ResponseBuilder,
    private readonly prisma: PrismaService,
  ) {}

  async executeQuery(userId: string, query: string) {
    const data = await this.orchestrator.executeQuery(userId, query);
    return this.response.success(
      data,
      'Request processed successfully',
      { sessionId: data.sessionId, intent: data.intent },
    );
  }

  executeQueryStream(
    userId: string,
    query: string,
  ): {
    observable: Observable<ExecutionStep>;
    result: Promise<ApiSuccessResponse<AgentQueryResponse>>;
  } {
    const { observable, result } = this.orchestrator.executeQueryStream(userId, query);
    const wrapped = result.then((data) =>
      this.response.success(data, 'Request processed successfully', {
        sessionId: data.sessionId,
        intent: data.intent,
      }),
    );
    return { observable, result: wrapped };
  }

  async create(userId: string, title?: string) {
    const conversation = await this.prisma.conversation.create({
      data: { userId, title: title ?? 'New conversation', status: 'active' },
    });
    return this.response.success(conversation, 'Conversation created successfully');
  }

  async findAll(userId: string, page = 1, pageSize = 20) {
    const [data, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: { userId, status: { not: 'archived' } },
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.conversation.count({ where: { userId, status: { not: 'archived' } } }),
    ]);
    return this.response.paginated(data, { page, limit: pageSize, total });
  }

  async findOne(userId: string, id: string) {
    const session = await this.orchestrator.getSession(id);
    if (!session) {
      throw new NotFoundException({ message: 'Conversation not found', errorCode: 'CONVERSATION_NOT_FOUND' });
    }
    if (session.userId !== userId) {
      throw new ForbiddenException({ message: 'Access denied', errorCode: 'UNAUTHORIZED' });
    }
    return this.response.success(session, 'Conversation retrieved successfully');
  }

  async archive(userId: string, id: string) {
    const conversation = await this.prisma.conversation.findUnique({ where: { id } });
    if (!conversation) {
      throw new NotFoundException({ message: 'Conversation not found', errorCode: 'CONVERSATION_NOT_FOUND' });
    }
    if (conversation.userId !== userId) {
      throw new ForbiddenException({ message: 'Access denied', errorCode: 'UNAUTHORIZED' });
    }
    const updated = await this.prisma.conversation.update({
      where: { id },
      data: { status: 'archived' },
    });
    return this.response.success(updated, 'Conversation archived successfully');
  }

  getSessions(userId: string) {
    return this.findAll(userId);
  }

  getSession(userId: string, id: string) {
    return this.findOne(userId, id);
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditStatus, ConversationRole, MessageStatus } from '@prisma/client';
import { Subject, Observable } from 'rxjs';
import { config } from '@banking-crm/config';
import {
  createBankingAgentWorkflow,
  createInitialState,
  toAgentQueryResponse,
  type GraphState,
} from '@banking-crm/agent-core';
import { PROMPT_VERSION } from '@banking-crm/prompts';
import { evaluateWorkflow, toEvaluationSummary } from '@banking-crm/evaluation-engine';
import type { AgentQueryResponse, ExecutionStep } from '@banking-crm/shared-types';
import { PrismaService } from '../../database/prisma.service';
import { CustomerRepository } from '../../modules/customers/customer.repository';
import { TransactionRepository } from '../../modules/transactions/transaction.repository';
import { CrmRepository } from '../../modules/crm/crm.repository';
import { LoanRepository } from '../../modules/loans/loan.repository';
import { ProductRepository } from '../../modules/products/product.repository';
import {
  CustomerTool,
  TransactionTool,
  CrmTool,
  LoanTool,
  ProductTool,
  MemoryTool,
  CampaignTool,
  AuditTool,
} from '../../tools';
import { MemoryRepository } from '../../modules/conversations/memory.repository';
import { CampaignRepository } from '../../modules/campaigns/campaign.repository';

@Injectable()
export class AgentOrchestratorService {
  private readonly logger = new Logger(AgentOrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly customerRepo: CustomerRepository,
    private readonly transactionRepo: TransactionRepository,
    private readonly crmRepo: CrmRepository,
    private readonly loanRepo: LoanRepository,
    private readonly productRepo: ProductRepository,
    private readonly memoryRepo: MemoryRepository,
    private readonly campaignRepo: CampaignRepository,
  ) {}

  async executeQuery(
    userId: string,
    query: string,
    onStep?: (step: ExecutionStep) => void,
  ): Promise<AgentQueryResponse> {
    const requestId = randomUUID();
    const conversation = await this.prisma.conversation.create({
      data: { userId, title: query.slice(0, 100), requestId, status: 'running' },
    });

    const initialState = createInitialState({
      sessionId: conversation.id,
      userId,
      query,
      requestId,
    });

    const { workflow, threadConfig } = this.buildWorkflow(requestId, userId, conversation.id, onStep);

    try {
      const result = await this.runWorkflow(workflow, initialState, threadConfig, onStep);
      await this.persistResults(conversation.id, requestId, userId, query, result);
      const response = toAgentQueryResponse(result);
      const evaluationReport = evaluateWorkflow({ query, response });
      return { ...response, evaluation: toEvaluationSummary(evaluationReport) };
    } catch (error) {
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { status: 'failed' },
      });
      throw error;
    }
  }

  executeQueryStream(userId: string, query: string) {
    const subject = new Subject<ExecutionStep>();
    const result = this.executeQuery(userId, query, (step) => subject.next(step)).finally(() =>
      subject.complete(),
    );
    return { observable: subject.asObservable(), result };
  }

  private buildWorkflow(
    requestId: string,
    userId: string,
    conversationId: string,
    onStep?: (step: ExecutionStep) => void,
  ) {
    const toolLogger = {
      info: (msg: string, meta?: Record<string, unknown>) => this.logger.log(msg, meta),
      error: (msg: string, meta?: Record<string, unknown>) => this.logger.error(msg, meta),
    };

    const auditContext = () => ({ requestId, userId, conversationId });

    const workflow = createBankingAgentWorkflow(
      {
        customerTool: new CustomerTool(this.customerRepo, toolLogger),
        transactionTool: new TransactionTool(this.transactionRepo, toolLogger),
        crmTool: new CrmTool(this.crmRepo, toolLogger),
        loanTool: new LoanTool(this.loanRepo, toolLogger),
        productTool: new ProductTool(this.productRepo, toolLogger),
        memoryTool: new MemoryTool(this.memoryRepo, toolLogger),
        campaignTool: new CampaignTool(this.campaignRepo, toolLogger),
        auditTool: new AuditTool(this.prisma, auditContext, toolLogger),
        onStep: async (step) => {
          onStep?.(step);
          await this.prisma.agentExecutionStep.create({
            data: {
              conversationId,
              agentName: step.agentName,
              toolName: step.toolName,
              status: step.status,
              durationMs: step.durationMs,
            },
          });
        },
      },
      { interruptBeforeApproval: false },
    );

    return {
      workflow,
      threadConfig: { configurable: { thread_id: conversationId } },
    };
  }

  private async runWorkflow(
    workflow: ReturnType<typeof createBankingAgentWorkflow>,
    initialState: GraphState,
    threadConfig: { configurable: { thread_id: string } },
    onStep?: (step: ExecutionStep) => void,
  ): Promise<GraphState> {
    if (config.features.streaming && onStep) {
      let lastStepCount = 0;
      let latestState: GraphState = initialState;

      const stream = await workflow.stream(initialState, {
        ...threadConfig,
        streamMode: 'values',
      });

      for await (const chunk of stream) {
        latestState = chunk as GraphState;
        const newSteps = latestState.executionSteps.slice(lastStepCount);
        for (const step of newSteps) {
          onStep(step);
        }
        lastStepCount = latestState.executionSteps.length;
      }

      return latestState;
    }

    return (await workflow.invoke(initialState, threadConfig)) as GraphState;
  }

  private async persistResults(
    conversationId: string,
    requestId: string,
    userId: string,
    query: string,
    state: GraphState,
  ) {
    const product = await this.productRepo.findByType(state.productType);
    const promptVersion = await this.prisma.promptVersion.findFirst({
      where: { name: 'Messaging Prompt', version: PROMPT_VERSION },
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.conversation.update({
        where: { id: conversationId },
        data: { status: 'completed', intent: state.intent, lastActivity: new Date() },
      });

      if (product) {
        for (const rec of state.recommendations) {
          await tx.productRecommendation.create({
            data: {
              customerId: rec.customerId,
              productId: product.id,
              conversationId,
              conversionScore: rec.conversionScore,
              confidence: rec.confidence,
              reason: rec.reasons,
            },
          });
        }
      }

      for (const msg of state.messages) {
        await tx.generatedMessage.create({
          data: {
            customerId: msg.customerId,
            conversationId,
            promptVersionId: promptVersion?.id,
            channel: 'WHATSAPP',
            message: msg.content,
            status: MessageStatus.DRAFT,
          },
        });
      }

      for (const log of state.auditLogs) {
        await tx.auditLog.create({
          data: {
            requestId,
            conversationId,
            userId,
            agent: log.agentName,
            tool: log.toolName,
            action: log.action,
            executionTime: log.durationMs,
            status: AuditStatus.SUCCESS,
          },
        });
      }

      await tx.conversationMessage.createMany({
        data: [
          { conversationId, role: ConversationRole.USER, content: query },
          {
            conversationId,
            role: ConversationRole.ASSISTANT,
            content: state.summary ?? `Found ${state.recommendations.length} customers.`,
          },
        ],
      });
    });
  }

  async getSession(sessionId: string) {
    return this.prisma.conversation.findUnique({
      where: { id: sessionId },
      include: {
        executionSteps: { orderBy: { createdAt: 'asc' } },
        generatedMessages: { include: { customer: true } },
        productRecommendations: { include: { product: true, customer: true } },
      },
    });
  }

  async getSessions(userId: string) {
    return this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 20,
    });
  }
}

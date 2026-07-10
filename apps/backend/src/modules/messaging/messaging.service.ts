import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditStatus, MessageStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ResponseBuilder } from '../../common/utils/response.builder';
import { UpdateMessageDto } from './dto/update-message.dto';
import { GenerateMessageDto } from '../messages/dto/generate-message.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { CustomerRepository } from '../customers/customer.repository';
import { CrmRepository } from '../crm/crm.repository';
import { ProductRepository } from '../products/product.repository';
import { MessageGenerationTool } from '../../tools';

@Injectable()
export class MessagingService {
  private readonly messageTool = new MessageGenerationTool();

  constructor(
    private readonly prisma: PrismaService,
    private readonly response: ResponseBuilder,
    private readonly customerRepo: CustomerRepository,
    private readonly crmRepo: CrmRepository,
    private readonly productRepo: ProductRepository,
  ) {}

  async findPending() {
    const messages = await this.prisma.generatedMessage.findMany({
      where: { status: MessageStatus.DRAFT },
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    });
    return this.response.success(
      messages.map((m) => this.mapMessage(m)),
      'Pending messages retrieved successfully',
    );
  }

  async findAll(query: PaginationQueryDto) {
    const [messages, total] = await Promise.all([
      this.prisma.generatedMessage.findMany({
        include: { customer: true },
        orderBy: { createdAt: query.order },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.generatedMessage.count(),
    ]);
    return this.response.paginated(
      messages.map((m) => this.mapMessage(m)),
      { page: query.page, limit: query.pageSize, total },
    );
  }

  async findBySession(sessionId: string) {
    const messages = await this.prisma.generatedMessage.findMany({
      where: { conversationId: sessionId },
      include: { customer: true },
    });
    return this.response.success(
      messages.map((m) => this.mapMessage(m)),
      'Messages retrieved successfully',
    );
  }

  async generate(dto: GenerateMessageDto) {
    const customer = await this.customerRepo.findById(dto.customerId);
    if (!customer) {
      throw new NotFoundException({ message: 'Customer not found', errorCode: 'CUSTOMER_NOT_FOUND' });
    }

    const product = await this.productRepo.findByType(dto.productType);
    if (!product) {
      throw new NotFoundException({ message: 'Product not found', errorCode: 'PRODUCT_NOT_FOUND' });
    }

    const crmNotes = await this.crmRepo.findByCustomerIds([dto.customerId]);
    const result = await this.messageTool.execute({
      customer,
      recommendation: {
        customerId: customer.id,
        customerName: customer.name,
        productType: dto.productType,
        productName: product.name,
        conversionScore: 0,
        confidence: 0,
        reasons: ['Targeted outreach'],
        evidence: [],
        eligible: true,
        segment: 'Bronze',
        riskLevel: 'LOW',
      },
      language: customer.preferredLanguage,
      crmNotes: crmNotes.map((n) => n.note),
    });

    const saved = await this.prisma.generatedMessage.create({
      data: {
        customerId: dto.customerId,
        conversationId: dto.conversationId,
        channel: 'WHATSAPP',
        message: result.message.content,
        status: MessageStatus.DRAFT,
      },
      include: { customer: true },
    });

    return this.response.success(
      { message: result.message, persisted: this.mapMessage(saved), tokensUsed: result.tokensUsed },
      'Message generated successfully',
    );
  }

  async update(id: string, userId: string, dto: UpdateMessageDto) {
    const message = await this.prisma.generatedMessage.findUnique({ where: { id } });
    if (!message) {
      throw new NotFoundException({ message: 'Message not found', errorCode: 'MESSAGE_NOT_FOUND' });
    }

    const updated = await this.prisma.generatedMessage.update({
      where: { id },
      data: {
        message: dto.content ?? message.message,
        status: dto.status,
        approvedById: dto.status === MessageStatus.APPROVED ? userId : null,
        approvedAt: dto.status === MessageStatus.APPROVED ? new Date() : null,
      },
      include: { customer: true },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: `message_${dto.status.toLowerCase()}`,
        status: AuditStatus.SUCCESS,
      },
    });

    return this.response.success(this.mapMessage(updated), 'Message updated successfully');
  }

  private mapMessage(m: {
    id: string;
    customerId: string;
    conversationId: string | null;
    channel: string;
    message: string;
    status: MessageStatus;
    createdAt: Date;
    customer: { firstName: string; lastName: string; [key: string]: unknown };
  }) {
    return {
      ...m,
      content: m.message,
      customer: {
        ...m.customer,
        name: `${m.customer.firstName} ${m.customer.lastName}`,
      },
    };
  }
}

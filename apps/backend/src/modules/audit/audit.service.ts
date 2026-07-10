import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ResponseBuilder } from '../../common/utils/response.builder';
import { AuditQueryDto } from './dto/audit-query.dto';

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly response: ResponseBuilder,
  ) {}

  async findAll(query: AuditQueryDto) {
    const where: Prisma.AuditLogWhereInput = {};
    if (query.agent) where.agent = query.agent;
    if (query.tool) where.tool = query.tool;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: query.order },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return this.response.paginated(data, { page: query.page, limit: query.pageSize, total });
  }

  async findByRequestId(requestId: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: { requestId },
      orderBy: { createdAt: 'asc' },
    });
    if (!logs.length) {
      throw new NotFoundException({ message: 'Audit logs not found', errorCode: 'AUDIT_NOT_FOUND' });
    }
    return this.response.success(logs, 'Audit execution details retrieved successfully');
  }
}

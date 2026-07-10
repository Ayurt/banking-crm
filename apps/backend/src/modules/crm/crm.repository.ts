import { Injectable } from '@nestjs/common';
import type { CrmNote } from '@banking-crm/shared-types';
import type { ICrmRepository } from '@banking-crm/shared-types';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CrmRepository implements ICrmRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByCustomerIds(customerIds: string[]): Promise<CrmNote[]> {
    const notes = await this.prisma.crmNote.findMany({
      where: { customerId: { in: customerIds } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    return notes.map((n) => ({
      id: n.id,
      customerId: n.customerId,
      note: n.note,
      category: n.sentiment,
      createdAt: n.createdAt,
    }));
  }
}

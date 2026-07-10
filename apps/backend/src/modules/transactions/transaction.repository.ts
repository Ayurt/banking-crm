import { Injectable } from '@nestjs/common';
import type { Transaction } from '@banking-crm/shared-types';
import type { ITransactionRepository } from '@banking-crm/shared-types';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class TransactionRepository implements ITransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByCustomerIds(customerIds: string[]): Promise<Transaction[]> {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const txns = await this.prisma.transaction.findMany({
      where: {
        customerId: { in: customerIds },
        transactionDate: { gte: threeMonthsAgo },
      },
      orderBy: { transactionDate: 'desc' },
    });

    return txns.map((t) => ({
      id: t.id,
      customerId: t.customerId,
      type: t.transactionType,
      amount: t.amount,
      category: t.category,
      description: t.description,
      txnDate: t.transactionDate,
    }));
  }
}

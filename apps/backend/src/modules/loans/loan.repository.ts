import { Injectable } from '@nestjs/common';
import type { Loan, ProductType } from '@banking-crm/shared-types';
import type { ILoanRepository } from '@banking-crm/shared-types';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class LoanRepository implements ILoanRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByCustomerIds(customerIds: string[]): Promise<Loan[]> {
    const loans = await this.prisma.loan.findMany({
      where: { customerId: { in: customerIds } },
    });
    return loans.map((l) => ({
      id: l.id,
      customerId: l.customerId,
      productType: l.loanType as ProductType,
      amount: l.loanAmount,
      interestRate: l.interestRate,
      tenureMonths: l.endDate
        ? Math.max(1, Math.round((l.endDate.getTime() - l.startDate.getTime()) / (30 * 86400000)))
        : 36,
      status: l.status,
      startDate: l.startDate,
    }));
  }
}

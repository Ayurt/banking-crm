import { Injectable } from '@nestjs/common';
import type { ProductType, Customer } from '@banking-crm/shared-types';
import type { ICustomerRepository } from '@banking-crm/shared-types';
import { PrismaService } from '../../database/prisma.service';
import type { Customer as PrismaCustomer, Prisma } from '@prisma/client';
import { config } from '@banking-crm/config';

type CustomerWithProducts = PrismaCustomer & {
  customerProducts?: Array<{ product: { name: string } }>;
};

export interface CustomerSearchFilters {
  q?: string;
  city?: string;
  minCreditScore?: number;
  minIncome?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

@Injectable()
export class CustomerRepository implements ICustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findHighValueCandidates(productType: ProductType, limit = 50): Promise<Customer[]> {
    const { scoring } = config;
    const customers = await this.prisma.customer.findMany({
      where: {
        deletedAt: null,
        monthlyIncome: { gte: scoring.minIncomePersonalLoan },
        creditScore: { gte: scoring.minCreditScorePersonalLoan - 50 },
        relationshipYears: { gte: scoring.minRelationshipYears },
      },
      include: {
        customerProducts: { include: { product: { select: { name: true } } } },
      },
      orderBy: [{ creditScore: 'desc' }, { monthlyIncome: 'desc' }],
      take: limit,
    });
    return customers.map((c) => this.mapCustomer(c));
  }

  async findByIds(ids: string[]): Promise<Customer[]> {
    const customers = await this.prisma.customer.findMany({
      where: { id: { in: ids }, deletedAt: null },
      include: {
        customerProducts: { include: { product: { select: { name: true } } } },
      },
    });
    return customers.map((c) => this.mapCustomer(c));
  }

  async findAll(page = 1, limit = 20, filters: CustomerSearchFilters = {}) {
    return this.search(page, limit, filters);
  }

  async search(page = 1, limit = 20, filters: CustomerSearchFilters = {}) {
    const where: Prisma.CustomerWhereInput = { deletedAt: null };
    if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' };
    if (filters.minCreditScore) where.creditScore = { gte: filters.minCreditScore };
    if (filters.minIncome) where.monthlyIncome = { gte: filters.minIncome };
    if (filters.q) {
      where.OR = [
        { firstName: { contains: filters.q, mode: 'insensitive' } },
        { lastName: { contains: filters.q, mode: 'insensitive' } },
        { customerCode: { contains: filters.q, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.CustomerOrderByWithRelationInput =
      filters.sort === 'creditScore'
        ? { creditScore: filters.order ?? 'desc' }
        : filters.sort === 'monthlyIncome'
          ? { monthlyIncome: filters.order ?? 'desc' }
          : { createdAt: filters.order ?? 'desc' };

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          customerProducts: { include: { product: { select: { name: true } } } },
        },
        orderBy,
      }),
      this.prisma.customer.count({ where }),
    ]);
    return { data: data.map((c) => this.mapCustomer(c)), total, page, limit };
  }

  async findById(id: string): Promise<Customer | null> {
    const customer = await this.prisma.customer.findFirst({
      where: { id, deletedAt: null },
      include: {
        customerProducts: { include: { product: { select: { name: true } } } },
      },
    });
    return customer ? this.mapCustomer(customer) : null;
  }

  private mapCustomer(c: CustomerWithProducts): Customer {
    return {
      id: c.id,
      customerCode: c.customerCode,
      name: `${c.firstName} ${c.lastName}`,
      email: c.email,
      phone: c.phone,
      occupation: c.occupation,
      monthlyIncome: c.monthlyIncome,
      creditScore: c.creditScore,
      avgMonthlyBalance: c.avgMonthlyBalance,
      relationshipYears: c.relationshipYears,
      preferredLanguage: c.preferredLanguage,
      city: c.city,
      riskProfile: c.riskProfile as string,
      existingProducts: c.customerProducts?.map((cp) => cp.product.name) ?? [],
    };
  }
}

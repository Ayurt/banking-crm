import { Injectable } from '@nestjs/common';
import type { Product, ProductType } from '@banking-crm/shared-types';
import type { IProductRepository } from '@banking-crm/shared-types';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByType(type: ProductType): Promise<Product | null> {
    const product = await this.prisma.product.findUnique({ where: { category: type } });
    if (!product || product.deletedAt) return null;
    return this.mapProduct(product);
  }

  async findAll(): Promise<Product[]> {
    const products = await this.prisma.product.findMany({
      where: { active: true, deletedAt: null },
    });
    return products.map((p) => this.mapProduct(p));
  }

  private mapProduct(p: {
    id: string;
    name: string;
    category: string;
    description: string | null;
    minimumIncome: number;
    minimumCreditScore: number;
    maximumLoanAmount: number | null;
    minimumRelationshipYears: number;
    interestRate: number | null;
  }): Product {
    return {
      id: p.id,
      name: p.name,
      type: p.category as ProductType,
      description: p.description,
      minIncome: p.minimumIncome,
      minCreditScore: p.minimumCreditScore,
      maxExistingDebt: p.maximumLoanAmount,
      minRelationship: p.minimumRelationshipYears,
      interestRate: p.interestRate,
    };
  }
}

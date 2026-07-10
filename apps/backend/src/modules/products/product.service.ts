import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductRepository } from './product.repository';
import { ResponseBuilder } from '../../common/utils/response.builder';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepo: ProductRepository,
    private readonly prisma: PrismaService,
    private readonly response: ResponseBuilder,
  ) {}

  async findAll() {
    const products = await this.productRepo.findAll();
    return this.response.success(products, 'Products retrieved successfully');
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null, active: true },
    });
    if (!product) {
      throw new NotFoundException({ message: 'Product not found', errorCode: 'PRODUCT_NOT_FOUND' });
    }
    return this.response.success(
      {
        id: product.id,
        name: product.name,
        type: product.category,
        description: product.description,
        minIncome: product.minimumIncome,
        minCreditScore: product.minimumCreditScore,
        maxExistingDebt: product.maximumLoanAmount,
        minRelationship: product.minimumRelationshipYears,
        interestRate: product.interestRate,
      },
      'Product retrieved successfully',
    );
  }
}

import { Injectable } from '@nestjs/common';
import type { ProductType } from '@banking-crm/shared-types';
import { PrismaService } from '../../database/prisma.service';
import { EvaluationService } from '../evaluation/evaluation.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evaluationService: EvaluationService,
  ) {}

  async getSummary() {
    const [customerCount, recAgg, pendingMessages, productRecs, monitoring] = await Promise.all([
      this.prisma.customer.count({ where: { deletedAt: null } }),
      this.prisma.productRecommendation.aggregate({
        _avg: { conversionScore: true },
        _count: true,
      }),
      this.prisma.generatedMessage.count({ where: { status: 'DRAFT' } }),
      this.prisma.productRecommendation.groupBy({
        by: ['productId'],
        _count: true,
        _avg: { conversionScore: true },
      }),
      this.evaluationService.getMonitoringMetrics(),
    ]);

    const products = await this.prisma.product.findMany({
      where: { id: { in: productRecs.map((p) => p.productId) } },
    });

    const productBreakdown: Record<string, number> = {};
    let topProduct: ProductType = 'PERSONAL_LOAN';
    let maxCount = 0;

    for (const p of productRecs) {
      const product = products.find((pr) => pr.id === p.productId);
      const key = product?.category ?? 'UNKNOWN';
      productBreakdown[key] = p._count;
      if (p._count > maxCount) {
        maxCount = p._count;
        topProduct = key as ProductType;
      }
    }

    return {
      success: true,
      data: {
        customersAnalyzed: recAgg._count || customerCount,
        averageConversionScore: Math.round(recAgg._avg.conversionScore ?? 0),
        topProduct,
        productBreakdown,
        pendingApprovals: pendingMessages,
        totalCustomers: customerCount,
        monitoring: monitoring.data,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

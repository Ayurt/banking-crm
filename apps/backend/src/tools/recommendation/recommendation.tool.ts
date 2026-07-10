import { RecommendationEngine } from '@banking-crm/recommendation-engine';
import type { ToolLogger, IProductRepository } from '@banking-crm/shared-types';
import type { RecommendationToolInput, RecommendationToolOutput } from '@banking-crm/shared-types';
import { BaseTool } from '../shared/base.tool';

export class RecommendationTool extends BaseTool<RecommendationToolInput, RecommendationToolOutput> {
  readonly name = 'RecommendationTool';
  private readonly engine: RecommendationEngine;

  constructor(
    productRepo: IProductRepository,
    logger?: ToolLogger,
  ) {
    super(logger);
    this.engine = new RecommendationEngine({
      getProduct: (type) => productRepo.findByType(type),
    });
  }

  protected async executeImpl(input: RecommendationToolInput): Promise<RecommendationToolOutput> {
    const recommendations = await this.engine.recommend(
      input.customers,
      input.scores,
      input.productType,
      input.transactions,
      input.crmNotes,
    );
    return { recommendations };
  }
}

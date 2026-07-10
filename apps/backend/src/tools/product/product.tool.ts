import type { ToolLogger } from '@banking-crm/shared-types';
import type {
  IProductRepository,
  ProductToolInput,
  ProductToolOutput,
} from '@banking-crm/shared-types';
import { ProductNotFoundException } from '@banking-crm/shared-types';
import type { ProductType } from '@banking-crm/shared-types';
import { BaseTool } from '../shared/base.tool';

export class ProductTool extends BaseTool<ProductToolInput, ProductToolOutput> {
  readonly name = 'ProductTool';

  constructor(
    private readonly repo: IProductRepository,
    logger?: ToolLogger,
  ) {
    super(logger);
  }

  protected async executeImpl(input: ProductToolInput): Promise<ProductToolOutput> {
    const product = await this.repo.findByType(input.productType);
    if (!product) {
      throw new ProductNotFoundException(input.productType);
    }

    let eligible = true;
    if (input.customerProfile) {
      const profile = input.customerProfile;
      eligible =
        profile.monthlyIncome >= product.minIncome &&
        profile.creditScore >= product.minCreditScore &&
        profile.relationshipYears >= product.minRelationship;
    }

    return { product, eligible };
  }

  getProduct(type: ProductType) {
    return this.safeExecute({ productType: type }).then((r) =>
      r.success ? { ...r, data: r.data?.product ?? null } : { ...r, data: null },
    );
  }

  getAll() {
    return this.repo.findAll().then((data) => ({
      success: true as const,
      data,
      durationMs: 0,
    }));
  }
}

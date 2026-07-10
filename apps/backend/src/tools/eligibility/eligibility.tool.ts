import { checkPersonalLoanEligibility } from '@banking-crm/scoring-engine';
import type { ToolLogger } from '@banking-crm/shared-types';
import type {
  EligibilityToolInput,
  EligibilityToolOutput,
  IProductRepository,
} from '@banking-crm/shared-types';
import { ProductNotFoundException } from '@banking-crm/shared-types';
import { BaseTool } from '../shared/base.tool';

export class EligibilityTool extends BaseTool<EligibilityToolInput, EligibilityToolOutput> {
  readonly name = 'EligibilityTool';

  constructor(
    private readonly productRepo: IProductRepository,
    logger?: ToolLogger,
  ) {
    super(logger);
  }

  protected async executeImpl(input: EligibilityToolInput): Promise<EligibilityToolOutput> {
    const product = await this.productRepo.findByType(input.productType);
    if (!product) {
      throw new ProductNotFoundException(input.productType);
    }

    const eligibleScores = input.scores.filter((score) => {
      if (!score.eligible) return false;
      const customer = input.customers.find((c) => c.id === score.customerId);
      if (!customer) return false;
      const result = checkPersonalLoanEligibility(customer, [], input.productType);
      return result.eligible;
    });

    return {
      eligibleCustomerIds: eligibleScores.map((s) => s.customerId),
      eligibleScores,
      product,
    };
  }
}

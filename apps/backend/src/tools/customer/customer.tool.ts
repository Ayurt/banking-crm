import type { ToolLogger } from '@banking-crm/shared-types';
import type {
  CustomerToolInput,
  CustomerToolOutput,
  ICustomerRepository,
} from '@banking-crm/shared-types';
import { CustomerNotFoundException } from '@banking-crm/shared-types';
import type { ProductType, ToolResult } from '@banking-crm/shared-types';
import { BaseTool } from '../shared/base.tool';

export class CustomerTool extends BaseTool<CustomerToolInput, CustomerToolOutput> {
  readonly name = 'CustomerTool';

  constructor(
    private readonly repo: ICustomerRepository,
    logger?: ToolLogger,
  ) {
    super(logger);
  }

  protected async executeImpl(input: CustomerToolInput): Promise<CustomerToolOutput> {
    let customers;

    if (input.customerIds?.length) {
      customers = await this.repo.findByIds(input.customerIds);
      if (customers.length === 0) {
        throw new CustomerNotFoundException(input.customerIds.join(','));
      }
    } else if (input.filters?.productType) {
      customers = await this.repo.findHighValueCandidates(
        input.filters.productType,
        input.filters.limit ?? 50,
      );
      if (input.filters.minIncome) {
        customers = customers.filter((c) => c.monthlyIncome >= input.filters!.minIncome!);
      }
      if (input.filters.minCreditScore) {
        customers = customers.filter((c) => c.creditScore >= input.filters!.minCreditScore!);
      }
      if (input.filters.minLoanAmount) {
        // Affordability: monthly income × 20 should cover requested loan size
        customers = customers.filter(
          (c) => c.monthlyIncome * 20 >= input.filters!.minLoanAmount!,
        );
      }
      if (input.filters.city) {
        const city = input.filters.city.toLowerCase();
        customers = customers.filter((c) => c.city?.toLowerCase() === city);
      }
    } else {
      throw new CustomerNotFoundException();
    }

    return { customers };
  }

  /** @deprecated Use execute() — kept for agent-core compatibility */
  retrieve(productType: ProductType, limit = 50): Promise<ToolResult<import('@banking-crm/shared-types').Customer[]>> {
    return this.safeExecute({ filters: { productType, limit } }).then((r) =>
      r.success ? { ...r, data: r.data?.customers } : { ...r, data: undefined },
    );
  }

  getByIds(ids: string[]) {
    return this.safeExecute({ customerIds: ids }).then((r) =>
      r.success ? { ...r, data: r.data?.customers } : { ...r, data: undefined },
    );
  }
}

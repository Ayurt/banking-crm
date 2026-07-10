import type { ToolLogger } from '@banking-crm/shared-types';
import type { ILoanRepository, LoanToolInput, LoanToolOutput } from '@banking-crm/shared-types';
import { BaseTool } from '../shared/base.tool';

export class LoanTool extends BaseTool<LoanToolInput, LoanToolOutput> {
  readonly name = 'LoanTool';

  constructor(
    private readonly repo: ILoanRepository,
    logger?: ToolLogger,
  ) {
    super(logger);
  }

  protected async executeImpl(input: LoanToolInput): Promise<LoanToolOutput> {
    let loans = await this.repo.findByCustomerIds(input.customerIds);

    if (!input.includeClosed) {
      loans = loans.filter((l) => l.status !== 'CLOSED' && l.status !== 'REJECTED');
    }

    return { loans };
  }

  retrieve(customerIds: string[]) {
    return this.safeExecute({ customerIds, includeClosed: true }).then((r) =>
      r.success ? { ...r, data: r.data?.loans } : { ...r, data: undefined },
    );
  }
}

import type { ToolLogger } from '@banking-crm/shared-types';
import type {
  ITransactionRepository,
  TransactionToolInput,
  TransactionToolOutput,
} from '@banking-crm/shared-types';
import { BaseTool } from '../shared/base.tool';

export class TransactionTool extends BaseTool<TransactionToolInput, TransactionToolOutput> {
  readonly name = 'TransactionTool';

  constructor(
    private readonly repo: ITransactionRepository,
    logger?: ToolLogger,
  ) {
    super(logger);
  }

  protected async executeImpl(input: TransactionToolInput): Promise<TransactionToolOutput> {
    let transactions = await this.repo.findByCustomerIds(input.customerIds);

    if (input.dateRange?.from) {
      transactions = transactions.filter((t) => t.txnDate >= input.dateRange!.from!);
    }
    if (input.dateRange?.to) {
      transactions = transactions.filter((t) => t.txnDate <= input.dateRange!.to!);
    }
    if (input.categories?.length) {
      transactions = transactions.filter(
        (t) => t.category && input.categories!.includes(t.category),
      );
    }
    if (input.minAmount !== undefined) {
      transactions = transactions.filter((t) => t.amount >= input.minAmount!);
    }
    if (input.maxAmount !== undefined) {
      transactions = transactions.filter((t) => t.amount <= input.maxAmount!);
    }

    const offset = input.offset ?? 0;
    const limit = input.limit ?? transactions.length;
    transactions = transactions.slice(offset, offset + limit);

    return { transactions };
  }

  retrieve(customerIds: string[]) {
    return this.safeExecute({ customerIds }).then((r) =>
      r.success ? { ...r, data: r.data?.transactions } : { ...r, data: undefined },
    );
  }
}

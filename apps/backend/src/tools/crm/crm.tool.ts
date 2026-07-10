import type { ToolLogger } from '@banking-crm/shared-types';
import type { CrmToolInput, CrmToolOutput, ICrmRepository } from '@banking-crm/shared-types';
import { InfrastructureException } from '@banking-crm/shared-types';
import { BaseTool } from '../shared/base.tool';

export class CrmTool extends BaseTool<CrmToolInput, CrmToolOutput> {
  readonly name = 'CrmTool';

  constructor(
    private readonly repo: ICrmRepository,
    logger?: ToolLogger,
  ) {
    super(logger);
  }

  protected async executeImpl(input: CrmToolInput): Promise<CrmToolOutput> {
    try {
      const notes = await this.repo.findByCustomerIds(input.customerIds);
      return { notes };
    } catch (error) {
      throw new InfrastructureException(
        error instanceof Error ? error.message : 'CRM service unavailable',
      );
    }
  }

  retrieve(customerIds: string[]) {
    return this.safeExecute({ customerIds }).then((r) =>
      r.success ? { ...r, data: r.data?.notes } : { ...r, data: undefined },
    );
  }
}

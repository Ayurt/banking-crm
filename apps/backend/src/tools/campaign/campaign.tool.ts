import type { ToolLogger } from '@banking-crm/shared-types';
import type {
  CampaignToolInput,
  CampaignToolOutput,
  ICampaignRepository,
} from '@banking-crm/shared-types';
import { CampaignUnavailableException } from '@banking-crm/shared-types';
import { BaseTool } from '../shared/base.tool';

export class CampaignTool extends BaseTool<CampaignToolInput, CampaignToolOutput> {
  readonly name = 'CampaignTool';

  constructor(
    private readonly repo: ICampaignRepository,
    logger?: ToolLogger,
  ) {
    super(logger);
  }

  protected async executeImpl(input: CampaignToolInput): Promise<CampaignToolOutput> {
    try {
      const campaigns = await this.repo.findByCustomerIds(input.customerIds);
      return { campaigns };
    } catch (error) {
      throw new CampaignUnavailableException(
        error instanceof Error ? error.message : undefined,
      );
    }
  }

  retrieve(customerIds: string[]) {
    return this.safeExecute({ customerIds }).then((r) =>
      r.success ? { ...r, data: r.data?.campaigns } : { ...r, data: undefined },
    );
  }
}

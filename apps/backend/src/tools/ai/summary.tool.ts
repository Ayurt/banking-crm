import type { ToolLogger } from '@banking-crm/shared-types';
import type { SummaryToolInput, SummaryToolOutput } from '@banking-crm/shared-types';
import { BaseTool } from '../shared/base.tool';
import { generateSummaryContent } from './llm.client';

export class SummaryTool extends BaseTool<SummaryToolInput, SummaryToolOutput> {
  readonly name = 'SummaryTool';

  constructor(logger?: ToolLogger) {
    super(logger);
  }

  protected async executeImpl(input: SummaryToolInput): Promise<SummaryToolOutput> {
    const { summary, tokensUsed } = await generateSummaryContent({
      query: input.query,
      customerCount: input.customerCount,
      topScore: input.topScore,
      productType: input.productType,
    });
    return { summary, tokensUsed };
  }
}

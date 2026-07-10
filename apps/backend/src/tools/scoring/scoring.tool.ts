import { ScoringEngine } from '@banking-crm/scoring-engine';
import type { ToolLogger } from '@banking-crm/shared-types';
import type { ScoringToolInput, ScoringToolOutput } from '@banking-crm/shared-types';
import { BaseTool } from '../shared/base.tool';

export class ScoringTool extends BaseTool<ScoringToolInput, ScoringToolOutput> {
  readonly name = 'ScoringTool';
  private readonly engine = new ScoringEngine();

  constructor(logger?: ToolLogger) {
    super(logger);
  }

  protected async executeImpl(input: ScoringToolInput): Promise<ScoringToolOutput> {
    const minScore = input.minScore ?? (input.customers.length > 100 ? 60 : 40);
    const scores = this.engine.scoreBatch(
      input.customers,
      input.productType,
      input.transactions,
      input.crmNotes,
      input.loanHistory,
      minScore,
      (input as ScoringToolInput & { campaigns?: import('@banking-crm/shared-types').CampaignRecord[] }).campaigns ?? [],
    );
    return { scores };
  }
}

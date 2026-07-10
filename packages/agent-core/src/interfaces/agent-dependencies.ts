import type {
  Customer,
  ProductType,
  ToolResult,
  Transaction,
  CrmNote,
  Loan,
} from '@banking-crm/shared-types';
import type {
  CustomerToolInput,
  CustomerToolOutput,
  TransactionToolInput,
  TransactionToolOutput,
  CrmToolInput,
  CrmToolOutput,
  LoanToolInput,
  LoanToolOutput,
  ProductToolInput,
  ProductToolOutput,
  ScoringToolInput,
  ScoringToolOutput,
  EligibilityToolInput,
  EligibilityToolOutput,
  RecommendationToolInput,
  RecommendationToolOutput,
  MemoryToolInput,
  MemoryToolOutput,
  CampaignToolInput,
  CampaignToolOutput,
  AuditToolInput,
  AuditToolOutput,
} from '@banking-crm/shared-types';

/** Agent-facing contracts — tools implement these via safeExecute() adapters. */
export interface ICustomerTool {
  readonly name: string;
  execute(input: CustomerToolInput): Promise<CustomerToolOutput>;
  safeExecute(input: CustomerToolInput): Promise<ToolResult<CustomerToolOutput>>;
  retrieve(productType: ProductType, limit?: number): Promise<ToolResult<Customer[]>>;
}

export interface ITransactionTool {
  readonly name: string;
  execute(input: TransactionToolInput): Promise<TransactionToolOutput>;
  safeExecute(input: TransactionToolInput): Promise<ToolResult<TransactionToolOutput>>;
  retrieve(customerIds: string[]): Promise<ToolResult<Transaction[]>>;
}

export interface ICrmTool {
  readonly name: string;
  execute(input: CrmToolInput): Promise<CrmToolOutput>;
  safeExecute(input: CrmToolInput): Promise<ToolResult<CrmToolOutput>>;
  retrieve(customerIds: string[]): Promise<ToolResult<CrmNote[]>>;
}

export interface ILoanTool {
  readonly name: string;
  execute(input: LoanToolInput): Promise<LoanToolOutput>;
  safeExecute(input: LoanToolInput): Promise<ToolResult<LoanToolOutput>>;
  retrieve(customerIds: string[]): Promise<ToolResult<Loan[]>>;
}

export interface IProductTool {
  readonly name: string;
  execute(input: ProductToolInput): Promise<ProductToolOutput>;
  safeExecute(input: ProductToolInput): Promise<ToolResult<ProductToolOutput>>;
  getProduct(type: ProductType): Promise<ToolResult<import('@banking-crm/shared-types').Product | null>>;
}

export interface IScoringTool {
  readonly name: string;
  execute(input: ScoringToolInput): Promise<ScoringToolOutput>;
  safeExecute(input: ScoringToolInput): Promise<ToolResult<ScoringToolOutput>>;
}

export interface IEligibilityTool {
  readonly name: string;
  execute(input: EligibilityToolInput): Promise<EligibilityToolOutput>;
  safeExecute(input: EligibilityToolInput): Promise<ToolResult<EligibilityToolOutput>>;
}

export interface IRecommendationTool {
  readonly name: string;
  execute(input: RecommendationToolInput): Promise<RecommendationToolOutput>;
  safeExecute(input: RecommendationToolInput): Promise<ToolResult<RecommendationToolOutput>>;
}

export interface IMemoryTool {
  readonly name: string;
  execute(input: MemoryToolInput): Promise<MemoryToolOutput>;
  safeExecute(input: MemoryToolInput): Promise<ToolResult<MemoryToolOutput>>;
  load(userId: string): Promise<ToolResult<import('@banking-crm/shared-types').ConversationMemoryEntry[]>>;
}

export interface ICampaignTool {
  readonly name: string;
  execute(input: CampaignToolInput): Promise<CampaignToolOutput>;
  safeExecute(input: CampaignToolInput): Promise<ToolResult<CampaignToolOutput>>;
  retrieve(customerIds: string[]): Promise<ToolResult<import('@banking-crm/shared-types').CampaignRecord[]>>;
}

export interface IAuditTool {
  readonly name: string;
  execute(input: AuditToolInput): Promise<AuditToolOutput>;
  safeExecute(input: AuditToolInput): Promise<ToolResult<AuditToolOutput>>;
  log(entry: {
    action: string;
    agentName?: string;
    toolName?: string;
    durationMs?: number;
    promptVersion?: string;
    tokensUsed?: number;
  }): Promise<ToolResult<void>>;
}

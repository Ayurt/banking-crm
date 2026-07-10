import type {
  CampaignRecord,
  ConversationMemoryEntry,
  CrmNote,
  Customer,
  CustomerScore,
  Loan,
  OutreachMessage,
  Product,
  ProductType,
  Recommendation,
  Transaction,
} from '../index';

export interface ToolContext {
  requestId?: string;
  agentName?: string;
  userId?: string;
  conversationId?: string;
}

export interface ToolMetricsSnapshot {
  calls: number;
  failures: number;
  retries: number;
  totalDurationMs: number;
  cacheHits: number;
}

export interface CustomerFilter {
  productType?: ProductType;
  minIncome?: number;
  minCreditScore?: number;
  limit?: number;
}

export interface CustomerToolInput {
  customerIds?: string[];
  filters?: CustomerFilter;
}

export interface CustomerToolOutput {
  customers: Customer[];
}

export interface TransactionToolInput {
  customerIds: string[];
  dateRange?: { from?: Date; to?: Date };
  categories?: string[];
  minAmount?: number;
  maxAmount?: number;
  limit?: number;
  offset?: number;
}

export interface TransactionToolOutput {
  transactions: Transaction[];
}

export interface LoanToolInput {
  customerIds: string[];
  includeClosed?: boolean;
}

export interface LoanToolOutput {
  loans: Loan[];
}

export interface CrmToolInput {
  customerIds: string[];
}

export interface CrmToolOutput {
  notes: CrmNote[];
}

export interface CampaignToolInput {
  customerIds: string[];
}

export interface CampaignToolOutput {
  campaigns: CampaignRecord[];
}

export interface ProductToolInput {
  productType: ProductType;
  customerProfile?: Pick<Customer, 'monthlyIncome' | 'creditScore' | 'relationshipYears'>;
}

export interface ProductToolOutput {
  product: Product;
  eligible: boolean;
}

export interface ScoringToolInput {
  customers: Customer[];
  productType: ProductType;
  transactions: Transaction[];
  crmNotes: CrmNote[];
  loanHistory: Loan[];
  campaigns?: CampaignRecord[];
  minScore?: number;
}

export interface ScoringToolOutput {
  scores: CustomerScore[];
}

export interface EligibilityToolInput {
  customers: Customer[];
  scores: CustomerScore[];
  productType: ProductType;
}

export interface EligibilityToolOutput {
  eligibleCustomerIds: string[];
  eligibleScores: CustomerScore[];
  product: Product;
}

export interface RecommendationToolInput {
  customers: Customer[];
  scores: CustomerScore[];
  productType: ProductType;
  transactions: Transaction[];
  crmNotes: CrmNote[];
}

export interface RecommendationToolOutput {
  recommendations: Recommendation[];
}

export interface MessageGenerationToolInput {
  customer: Customer;
  recommendation: Recommendation;
  crmNotes: string[];
  language: string;
  channel?: string;
}

export interface MessageGenerationToolOutput {
  message: OutreachMessage;
  tokensUsed: number;
}

export interface SummaryToolInput {
  query: string;
  customerCount: number;
  topScore: number;
  productType: ProductType;
}

export interface SummaryToolOutput {
  summary: string;
  tokensUsed: number;
}

export interface MemoryToolInput {
  userId: string;
  action: 'read' | 'write';
  entries?: ConversationMemoryEntry[];
}

export interface MemoryToolOutput {
  entries: ConversationMemoryEntry[];
}

export interface AuditToolInput {
  action: string;
  agentName?: string;
  toolName?: string;
  durationMs?: number;
  promptVersion?: string;
  tokensUsed?: number;
  success?: boolean;
}

export interface AuditToolOutput {
  logged: boolean;
}

export interface CacheToolInput {
  action: 'get' | 'set' | 'invalidate';
  key: string;
  value?: string;
  ttlSeconds?: number;
}

export interface CacheToolOutput {
  hit: boolean;
  value?: string;
}

export interface FeatureFlagToolInput {
  flags?: string[];
}

export interface FeatureFlagToolOutput {
  flags: Record<string, boolean>;
}

import type {
  CampaignRecord,
  Customer,
  Product,
  ProductType,
  Transaction,
  CrmNote,
  Loan,
  ToolResult,
  ConversationMemoryEntry,
} from './index';

export interface ICustomerRepository {
  findHighValueCandidates(productType: ProductType, limit?: number): Promise<Customer[]>;
  findByIds(ids: string[]): Promise<Customer[]>;
}

export interface ITransactionRepository {
  findByCustomerIds(customerIds: string[]): Promise<Transaction[]>;
}

export interface ICrmRepository {
  findByCustomerIds(customerIds: string[]): Promise<CrmNote[]>;
}

export interface ILoanRepository {
  findByCustomerIds(customerIds: string[]): Promise<Loan[]>;
}

export interface IProductRepository {
  findByType(type: ProductType): Promise<Product | null>;
  findAll(): Promise<Product[]>;
}

export interface ICampaignRepository {
  findByCustomerIds(customerIds: string[]): Promise<CampaignRecord[]>;
}

export interface IMemoryRepository {
  loadForUser(userId: string): Promise<ConversationMemoryEntry[]>;
}

export interface ToolLogger {
  info(msg: string, meta?: Record<string, unknown>): void;
  error(msg: string, meta?: Record<string, unknown>): void;
}

export type { ToolResult };

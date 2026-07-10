import type { ExecutionStep } from '@banking-crm/shared-types';
import type {
  ICrmTool,
  ICustomerTool,
  ILoanTool,
  IProductTool,
  ITransactionTool,
} from '../interfaces/agent-dependencies';
import type { IAuditTool, ICampaignTool, IMemoryTool } from '../interfaces/agent-tools';

export interface AgentRuntimeDeps {
  customerTool: ICustomerTool;
  transactionTool: ITransactionTool;
  crmTool: ICrmTool;
  loanTool: ILoanTool;
  productTool: IProductTool;
  memoryTool?: IMemoryTool;
  campaignTool?: ICampaignTool;
  auditTool?: IAuditTool;
  onStep?: (step: ExecutionStep) => void;
}

export type { AgentRuntimeDeps as AgentDependencies };

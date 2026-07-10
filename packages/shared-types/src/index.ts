export type ProductType =
  | 'PERSONAL_LOAN'
  | 'CREDIT_CARD'
  | 'FIXED_DEPOSIT'
  | 'HOME_LOAN'
  | 'INSURANCE';

export type MessageStatus = 'DRAFT' | 'APPROVED' | 'SENT' | 'REJECTED';

export type UserRole = 'Admin' | 'Relationship Manager' | 'Supervisor';

export interface Customer {
  id: string;
  customerCode: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  occupation?: string | null;
  monthlyIncome: number;
  creditScore: number;
  avgMonthlyBalance: number;
  relationshipYears: number;
  preferredLanguage: string;
  city?: string | null;
  riskProfile: string;
  existingProducts: string[];
  age?: number;
  accountStatus?: 'ACTIVE' | 'CLOSED';
  isBlacklisted?: boolean;
  isDeceased?: boolean;
}

export interface Transaction {
  id: string;
  customerId: string;
  type: string;
  amount: number;
  category?: string | null;
  description?: string | null;
  txnDate: Date;
}

export interface CrmNote {
  id: string;
  customerId: string;
  note: string;
  category?: string | null;
  createdAt: Date;
}

export interface Loan {
  id: string;
  customerId: string;
  productType: ProductType;
  amount: number;
  interestRate: number;
  tenureMonths: number;
  status: string;
  startDate: Date;
}

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  description?: string | null;
  minIncome: number;
  minCreditScore: number;
  maxExistingDebt?: number | null;
  minRelationship: number;
  interestRate?: number | null;
}

export type CustomerSegment = 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | 'Low Priority';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type OutreachPriority = 'Very High' | 'High' | 'Medium' | 'Low' | 'Ignore';

export interface ConversionScoreBreakdown {
  income: number;
  credit: number;
  relationship: number;
  transactions: number;
  campaign: number;
  crm: number;
  existingProducts: number;
}

export interface CustomerScore {
  customerId: string;
  productType: ProductType;
  conversionScore: number;
  riskScore: number;
  relationshipScore: number;
  valueScore: number;
  reasons: string[];
  confidence: number;
  segment: CustomerSegment;
  riskLevel: RiskLevel;
  outreachPriority: OutreachPriority;
  eligible: boolean;
  scoreBreakdown: ConversionScoreBreakdown;
}

export interface Recommendation {
  customerId: string;
  customerName: string;
  productType: ProductType;
  productName: string;
  conversionScore: number;
  confidence: number;
  reasons: string[];
  evidence: string[];
  eligible: boolean;
  segment?: CustomerSegment;
  riskLevel?: RiskLevel;
  eligibleProducts?: string[];
  rankingScore?: number;
}

export interface OutreachMessage {
  customerId: string;
  customerName: string;
  productType: ProductType;
  channel: string;
  content: string;
  language: string;
  status: MessageStatus;
}

export interface ExecutionStep {
  agentName: string;
  toolName?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  message: string;
  durationMs?: number;
  timestamp: Date;
}

export interface AuditLogEntry {
  action: string;
  agentName?: string;
  toolName?: string;
  details?: Record<string, unknown>;
  promptVersion?: string;
  tokensUsed?: number;
  durationMs?: number;
}

export interface CampaignRecord {
  id: string;
  customerId: string;
  campaignName: string;
  channel: string;
  opened: boolean;
  clicked: boolean;
  converted: boolean;
  sentDate?: Date | null;
}

export interface ConversationMemoryEntry {
  role: string;
  content: string;
  timestamp?: Date;
}

export interface AgentConfidence {
  agentName: string;
  confidence: number;
}

export interface ExplainabilityEntry {
  customerId: string;
  customerName: string;
  productName: string;
  reasons: string[];
  evidence: string[];
  confidence: number;
  conversionScore: number;
}

export interface WorkflowExecutionMeta {
  executionId: string;
  requestId: string;
  workflowVersion: string;
  agentVersion: string;
  promptVersion?: string;
  durationMs: number;
  toolCalls: number;
  tokensUsed: number;
  retries: number;
  llmLatencyMs?: number;
}

export interface AgentState {
  requestId: string;
  executionId: string;
  sessionId: string;
  conversationId: string;
  userId: string;
  query: string;
  intent: string;
  workflow: string;
  executionPlan: string[];
  productType: ProductType;
  customerIds: string[];
  customers: Customer[];
  transactions: Transaction[];
  crmNotes: CrmNote[];
  loanHistory: Loan[];
  campaigns: CampaignRecord[];
  scores: CustomerScore[];
  recommendations: Recommendation[];
  messages: OutreachMessage[];
  auditLogs: AuditLogEntry[];
  executionSteps: ExecutionStep[];
  conversationMemory: ConversationMemoryEntry[];
  agentConfidence: AgentConfidence[];
  errors: string[];
  metadata: Record<string, unknown>;
  status: 'initializing' | 'planning' | 'retrieving' | 'scoring' | 'recommending' | 'messaging' | 'awaiting_approval' | 'auditing' | 'completed' | 'failed';
  error?: string;
}

export interface PlannerOutput {
  intent: string;
  productType: ProductType;
  steps: string[];
}

export interface ToolResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  durationMs: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errorCode?: string;
  timestamp: string;
}

export interface EvaluationSummary {
  overallScore: number;
  passed: boolean;
  acceptancePassed: number;
  acceptanceTotal: number;
  scenarioPassed: number;
  scenarioTotal: number;
}

export interface AgentQueryResponse {
  requestId: string;
  sessionId: string;
  intent: string;
  workflow: string;
  executionPlan: string[];
  productType: ProductType;
  customers: Customer[];
  recommendations: Recommendation[];
  messages: OutreachMessage[];
  explainability: ExplainabilityEntry[];
  executionSteps: ExecutionStep[];
  agentConfidence: AgentConfidence[];
  errors: string[];
  summary: string;
  execution: WorkflowExecutionMeta;
  evaluation?: EvaluationSummary;
}

export interface AnalyticsSummary {
  customersAnalyzed: number;
  averageConversionScore: number;
  topProduct: ProductType;
  productBreakdown: Record<string, number>;
  pendingApprovals: number;
  totalCustomers?: number;
  monitoring?: {
    activeRequests: number;
    totalToolCalls: number;
    auditLogs: number;
    recommendationVolume: number;
    messageVolume: number;
    averageLatencyMs: number;
    errorRate: number;
  };
}

export * from './interfaces';
export * from './tools';

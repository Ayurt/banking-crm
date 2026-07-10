export const EVALUATION_TARGETS = {
  intentAccuracy: 0.95,
  workflowSelection: 1.0,
  toolSelection: 1.0,
  jsonValidity: 1.0,
  promptSuccessRate: 0.98,
  hallucinationRate: 0,
  highValuePrecision: 0.9,
  eligibleRecommendationRate: 1.0,
  explainabilityRate: 1.0,
  humanApprovalRate: 0.8,
  workflowSuccessRate: 0.99,
  fullWorkflowMs: 5000,
  messageGenerationMs: 3000,
  auditLoggingMs: 100,
  memoryRetrievalMs: 200,
  customerSearchMs: 500,
} as const;

export const TOOL_LATENCY_TARGETS_MS: Record<string, number> = {
  CustomerTool: 300,
  TransactionTool: 500,
  CrmTool: 300,
  LoanTool: 300,
  CampaignTool: 300,
  ScoringTool: 100,
  RecommendationTool: 100,
  MessageGenerationTool: 3000,
  MemoryTool: 200,
  AuditTool: 100,
};

export const EXPECTED_AGENTS = [
  'Initialize',
  'Planner',
  'Customer Retrieval',
  'Scoring',
  'Eligibility',
  'Recommendation',
  'Messaging',
  'Human Approval',
  'Response Builder',
] as const;

export const WORKFLOW_TOOLS: Record<string, string[]> = {
  PERSONAL_LOAN: [
    'CustomerTool',
    'TransactionTool',
    'LoanTool',
    'CrmTool',
    'ScoringTool',
    'RecommendationTool',
    'MessageGenerationTool',
  ],
  FIXED_DEPOSIT: [
    'CustomerTool',
    'TransactionTool',
    'ScoringTool',
    'RecommendationTool',
  ],
  CREDIT_CARD: [
    'CustomerTool',
    'TransactionTool',
    'CrmTool',
    'RecommendationTool',
  ],
};

export const BENCHMARK_DATASET = {
  customers: 1000,
  transactions: 100_000,
  crmNotes: 5000,
  loans: 1500,
  campaigns: 4000,
} as const;

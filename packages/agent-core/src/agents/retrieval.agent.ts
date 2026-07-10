import { withRetryResult } from '../utils/retry';
import { addConfidence, addStep, emitStep } from '../utils/steps';
import type { AgentRuntimeDeps } from '../interfaces/agent-runtime';
import type { GraphState } from '../state/agent-state';

const RETRIEVAL_LIMIT = 100;

export async function retrievalAgent(
  state: GraphState,
  deps: AgentRuntimeDeps,
): Promise<Partial<GraphState>> {
  emitStep(deps, {
    agentName: 'Customer Retrieval',
    status: 'running',
    message: 'Gathering customer intelligence (parallel)...',
  });

  const customerResult = await withRetryResult(() =>
    deps.customerTool.retrieve(state.productType, RETRIEVAL_LIMIT),
  );

  if (!customerResult.success || !customerResult.data) {
    return {
      status: 'failed',
      error: customerResult.error ?? 'Failed to retrieve customers',
      errors: [...state.errors, customerResult.error ?? 'Customer retrieval failed'],
      executionSteps: addStep(state, {
        agentName: 'Customer Retrieval',
        status: 'failed',
        message: customerResult.error ?? 'Customer retrieval failed',
      }),
    };
  }

  const customers = customerResult.data;
  const customerIds = customers.map((c) => c.id);

  const [txnResult, crmResult, loanResult, campaignResult] = await Promise.all([
    withRetryResult(() => deps.transactionTool.retrieve(customerIds)),
    withRetryResult(() => deps.crmTool.retrieve(customerIds)),
    withRetryResult(() => deps.loanTool.retrieve(customerIds)),
    deps.campaignTool
      ? withRetryResult(() => deps.campaignTool!.retrieve(customerIds))
      : Promise.resolve({ success: true, data: [] }),
  ]);

  const errors = [...state.errors];
  if (!crmResult.success) {
    errors.push(`CRM tool degraded: ${crmResult.error}`);
  }

  emitStep(deps, {
    agentName: 'Customer Retrieval',
    toolName: 'CustomerTool',
    status: 'completed',
    message: `Retrieved ${customers.length} customers, ${txnResult.data?.length ?? 0} txns, ${crmResult.data?.length ?? 0} CRM notes`,
    durationMs: customerResult.success ? undefined : 0,
  });

  const retrievalConfidence = crmResult.success ? 100 : 85;

  return {
    customers,
    customerIds,
    transactions: txnResult.data ?? [],
    crmNotes: crmResult.data ?? [],
    loanHistory: loanResult.data ?? [],
    campaigns: campaignResult.data ?? [],
    errors,
    status: 'retrieving',
    agentConfidence: addConfidence(state, 'Customer Retrieval', retrievalConfidence),
    executionSteps: addStep(state, {
      agentName: 'Customer Retrieval',
      toolName: 'CustomerTool',
      status: 'completed',
      message: `Intelligence package: ${customers.length} customers`,
    }),
    auditLogs: [
      ...state.auditLogs,
      {
        action: 'retrieval_completed',
        agentName: 'Customer Retrieval',
        toolName: 'CustomerTool',
        details: {
          customers: customers.length,
          transactions: txnResult.data?.length ?? 0,
          crmNotes: crmResult.data?.length ?? 0,
          loans: loanResult.data?.length ?? 0,
          campaigns: campaignResult.data?.length ?? 0,
        },
      },
    ],
  };
}

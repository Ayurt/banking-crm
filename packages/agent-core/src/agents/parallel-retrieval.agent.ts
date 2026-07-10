import { mergePartials } from '../utils/merge-state';
import { retrieveCrmAgent } from './retrieve-crm.agent';
import { retrieveLoansAgent } from './retrieve-loans.agent';
import { retrieveTransactionsAgent } from './retrieve-transactions.agent';
import { retrieveCampaignsAgent } from './retrieve-campaigns.agent';
import { addConfidence, addStep, emitStep } from '../utils/steps';
import type { AgentRuntimeDeps } from '../interfaces/agent-runtime';
import type { GraphState } from '../state/agent-state';

/** Runs CRM, Loan, Transaction, Campaign retrieval in parallel. */
export async function parallelRetrievalAgent(
  state: GraphState,
  deps: AgentRuntimeDeps,
): Promise<Partial<GraphState>> {
  emitStep(deps, {
    agentName: 'Parallel Retrieval',
    status: 'running',
    message: 'Running parallel data retrieval (CRM, Loans, Transactions, Campaigns)...',
  });

  const results = await Promise.all([
    retrieveCrmAgent(state, deps),
    retrieveLoansAgent(state, deps),
    retrieveTransactionsAgent(state, deps),
    retrieveCampaignsAgent(state, deps),
  ]);

  const merged = mergePartials(state, results);
  const crmDegraded = (merged.errors?.length ?? 0) > state.errors.length;
  const retrievalConfidence = crmDegraded ? 85 : 100;

  emitStep(deps, {
    agentName: 'Parallel Retrieval',
    status: 'completed',
    message: 'Parallel retrieval complete',
  });

  return {
    ...merged,
    status: 'retrieving',
    agentConfidence: addConfidence(
      { ...state, agentConfidence: merged.agentConfidence ?? state.agentConfidence },
      'Parallel Retrieval',
      retrievalConfidence,
    ),
    executionSteps: addStep(
      { ...state, executionSteps: merged.executionSteps ?? state.executionSteps },
      {
        agentName: 'Merge',
        status: 'completed',
        message: `Merged: ${state.customers.length} customers, ${merged.transactions?.length ?? 0} txns, ${merged.crmNotes?.length ?? 0} CRM notes`,
      },
    ),
    auditLogs: [
      ...(merged.auditLogs ?? state.auditLogs),
      {
        action: 'retrieval_merged',
        agentName: 'Merge',
        details: {
          customers: state.customers.length,
          transactions: merged.transactions?.length ?? 0,
          crmNotes: merged.crmNotes?.length ?? 0,
          loans: merged.loanHistory?.length ?? 0,
          campaigns: merged.campaigns?.length ?? 0,
        },
      },
    ],
  };
}

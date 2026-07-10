import { Annotation, StateGraph, END, START, MemorySaver } from '@langchain/langgraph';
import { config } from '@banking-crm/config';
import type { AgentState, ExplainabilityEntry, WorkflowExecutionMeta } from '@banking-crm/shared-types';
import { initializeAgent } from '../agents/initialize.agent';
import { memoryAgent } from '../agents/memory.agent';
import { plannerAgent } from '../agents/planner.agent';
import { retrieveCustomersAgent } from '../agents/retrieve-customers.agent';
import { parallelRetrievalAgent } from '../agents/parallel-retrieval.agent';
import { scoringAgent } from '../agents/scoring.agent';
import { eligibilityAgent } from '../agents/eligibility.agent';
import { recommendationAgent } from '../agents/recommendation.agent';
import { messagingAgent } from '../agents/messaging.agent';
import { humanApprovalAgent } from '../agents/human-approval.agent';
import { auditAgent } from '../agents/audit.agent';
import { responseBuilderAgent } from '../agents/response-builder.agent';
import type { AgentRuntimeDeps } from '../interfaces/agent-runtime';
import type { GraphState } from '../state/agent-state';

const AgentGraphState = Annotation.Root({
  requestId: Annotation<string>,
  executionId: Annotation<string>,
  sessionId: Annotation<string>,
  conversationId: Annotation<string>,
  userId: Annotation<string>,
  query: Annotation<string>,
  intent: Annotation<string>,
  workflow: Annotation<string>,
  executionPlan: Annotation<string[]>,
  productType: Annotation<AgentState['productType']>,
  customerIds: Annotation<string[]>,
  customers: Annotation<AgentState['customers']>,
  transactions: Annotation<AgentState['transactions']>,
  crmNotes: Annotation<AgentState['crmNotes']>,
  loanHistory: Annotation<AgentState['loanHistory']>,
  campaigns: Annotation<AgentState['campaigns']>,
  scores: Annotation<AgentState['scores']>,
  recommendations: Annotation<AgentState['recommendations']>,
  messages: Annotation<AgentState['messages']>,
  auditLogs: Annotation<AgentState['auditLogs']>,
  executionSteps: Annotation<AgentState['executionSteps']>,
  conversationMemory: Annotation<AgentState['conversationMemory']>,
  agentConfidence: Annotation<AgentState['agentConfidence']>,
  errors: Annotation<string[]>,
  metadata: Annotation<Record<string, unknown>>,
  status: Annotation<AgentState['status']>,
  error: Annotation<string | undefined>,
  summary: Annotation<string | undefined>,
  explainability: Annotation<ExplainabilityEntry[] | undefined>,
  execution: Annotation<WorkflowExecutionMeta | undefined>,
});

export interface WorkflowCompileOptions {
  checkpointer?: MemorySaver;
  interruptBeforeApproval?: boolean;
}

function routeAfterCustomers(state: GraphState): 'parallelRetrieval' | 'failed' {
  return state.status === 'failed' ? 'failed' : 'parallelRetrieval';
}

function routeAfterPlanner(_state: GraphState): 'retrieveCustomers' {
  return 'retrieveCustomers';
}

function routeAfterHumanApproval(state: GraphState): 'audit' | 'responseBuilder' {
  return config.features.audit ? 'audit' : 'responseBuilder';
}

function wrapNode<T extends GraphState>(
  name: string,
  fn: (state: T, deps: AgentRuntimeDeps) => Promise<Partial<T>>,
  deps: AgentRuntimeDeps,
) {
  return async (state: T) => {
    const update = await fn(state, deps);
    if (config.features.audit) {
      const checkpoint = {
        node: name,
        at: new Date().toISOString(),
        status: update.status ?? state.status,
      };
      const checkpoints = (state.metadata.checkpoints as unknown[]) ?? [];
      return {
        ...update,
        metadata: {
          ...state.metadata,
          ...update.metadata,
          checkpoints: [...checkpoints, checkpoint],
        },
      };
    }
    return update;
  };
}

export function createBankingWorkflow(deps: AgentRuntimeDeps, options: WorkflowCompileOptions = {}) {
  const checkpointer = options.checkpointer ?? new MemorySaver();

  const graph = new StateGraph(AgentGraphState)
    .addNode('initialize', wrapNode('initialize', initializeAgent, deps))
    .addNode('memory', wrapNode('memory', memoryAgent, deps))
    .addNode('planner', wrapNode('planner', plannerAgent, deps))
    .addNode('retrieveCustomers', wrapNode('retrieveCustomers', retrieveCustomersAgent, deps))
    .addNode('parallelRetrieval', wrapNode('parallelRetrieval', parallelRetrievalAgent, deps))
    .addNode('scoring', wrapNode('scoring', scoringAgent, deps))
    .addNode('eligibility', wrapNode('eligibility', eligibilityAgent, deps))
    .addNode('recommendation', wrapNode('recommendation', recommendationAgent, deps))
    .addNode('messaging', wrapNode('messaging', messagingAgent, deps))
    .addNode('humanApproval', wrapNode('humanApproval', humanApprovalAgent, deps))
    .addNode('audit', wrapNode('audit', auditAgent, deps))
    .addNode('responseBuilder', wrapNode('responseBuilder', responseBuilderAgent, deps))
    .addNode('failed', (s) => ({ ...s, status: 'failed' as const }))
    .addEdge(START, 'initialize')
    .addEdge('initialize', 'memory')
    .addEdge('memory', 'planner')
    .addConditionalEdges('planner', (s) => routeAfterPlanner(s as GraphState), {
      retrieveCustomers: 'retrieveCustomers',
    })
    .addConditionalEdges('retrieveCustomers', (s) => routeAfterCustomers(s as GraphState), {
      parallelRetrieval: 'parallelRetrieval',
      failed: 'failed',
    })
    .addEdge('parallelRetrieval', 'scoring')
    .addEdge('scoring', 'eligibility')
    .addEdge('eligibility', 'recommendation')
    .addEdge('recommendation', 'messaging')
    .addEdge('messaging', 'humanApproval')
    .addConditionalEdges('humanApproval', (s) => routeAfterHumanApproval(s as GraphState), {
      audit: 'audit',
      responseBuilder: 'responseBuilder',
    })
    .addEdge('audit', 'responseBuilder')
    .addEdge('responseBuilder', END)
    .addEdge('failed', END);

  const compileOpts: Parameters<typeof graph.compile>[0] = { checkpointer };
  if (options.interruptBeforeApproval) {
    compileOpts.interruptBefore = ['humanApproval'];
  }

  return graph.compile(compileOpts);
}

export const createLoanRecommendationWorkflow = createBankingWorkflow;
export const createBankingAgentWorkflow = createBankingWorkflow;

export { buildExplainability, buildExecutionMeta } from '../agents/response-builder.agent';

import { memoryAgent } from './memory.agent';
import { retrievalAgent } from './retrieval.agent';
import type { AgentRuntimeDeps } from '../interfaces/agent-runtime';
import type { GraphState } from '../state/agent-state';

/** Runs Memory + Retrieval in parallel after Planner (per 08-agent-design.md). */
export async function intelligenceAgent(
  state: GraphState,
  deps: AgentRuntimeDeps,
): Promise<Partial<GraphState>> {
  const stepsBefore = state.executionSteps.length;
  const confidenceBefore = state.agentConfidence.length;
  const auditBefore = state.auditLogs.length;

  const [memoryUpdate, retrievalUpdate] = await Promise.all([
    memoryAgent(state, deps),
    retrievalAgent(state, deps),
  ]);

  const newSteps = [
    ...(memoryUpdate.executionSteps?.slice(stepsBefore) ?? []),
    ...(retrievalUpdate.executionSteps?.slice(stepsBefore) ?? []),
  ];

  const newConfidence = [
    ...(memoryUpdate.agentConfidence?.slice(confidenceBefore) ?? []),
    ...(retrievalUpdate.agentConfidence?.slice(confidenceBefore) ?? []),
  ];

  const newAudit = [
    ...(memoryUpdate.auditLogs?.slice(auditBefore) ?? []),
    ...(retrievalUpdate.auditLogs?.slice(auditBefore) ?? []),
  ];

  return {
    ...retrievalUpdate,
    conversationMemory: memoryUpdate.conversationMemory ?? state.conversationMemory,
    executionSteps: [...state.executionSteps, ...newSteps],
    agentConfidence: [...state.agentConfidence, ...newConfidence],
    auditLogs: [...state.auditLogs, ...newAudit],
    errors: [
      ...state.errors,
      ...(memoryUpdate.errors ?? []),
      ...(retrievalUpdate.errors ?? []),
    ],
  };
}

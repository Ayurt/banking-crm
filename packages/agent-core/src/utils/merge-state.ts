import type { GraphState } from '../state/agent-state';

/** Merge partial agent updates without duplicating execution steps / confidence. */
export function mergePartials(
  base: GraphState,
  updates: Partial<GraphState>[],
): Partial<GraphState> {
  const merged: Partial<GraphState> = {};
  const stepsBefore = base.executionSteps.length;
  const confidenceBefore = base.agentConfidence.length;
  const auditBefore = base.auditLogs.length;
  const errors: string[] = [...base.errors];

  for (const update of updates) {
    Object.assign(merged, update);
    if (update.errors?.length) {
      for (const e of update.errors) {
        if (!errors.includes(e)) errors.push(e);
      }
    }
  }

  const newSteps = updates.flatMap((u) => u.executionSteps?.slice(stepsBefore) ?? []);
  const newConfidence = updates.flatMap((u) => u.agentConfidence?.slice(confidenceBefore) ?? []);
  const newAudit = updates.flatMap((u) => u.auditLogs?.slice(auditBefore) ?? []);

  merged.executionSteps = [...base.executionSteps, ...newSteps];
  merged.agentConfidence = [...base.agentConfidence, ...newConfidence];
  merged.auditLogs = [...base.auditLogs, ...newAudit];
  merged.errors = errors;

  return merged;
}

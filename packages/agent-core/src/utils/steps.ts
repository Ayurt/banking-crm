import type { ExecutionStep } from '@banking-crm/shared-types';
import type { GraphState } from '../state/agent-state';

export function addStep(
  state: GraphState,
  step: Omit<ExecutionStep, 'timestamp'>,
): ExecutionStep[] {
  return [...state.executionSteps, { ...step, timestamp: new Date() }];
}

export function emitStep(
  deps: { onStep?: (step: ExecutionStep) => void },
  step: Omit<ExecutionStep, 'timestamp'>,
): void {
  deps.onStep?.({ ...step, timestamp: new Date() });
}

export function addConfidence(
  state: GraphState,
  agentName: string,
  confidence: number,
): GraphState['agentConfidence'] {
  return [...state.agentConfidence, { agentName, confidence }];
}

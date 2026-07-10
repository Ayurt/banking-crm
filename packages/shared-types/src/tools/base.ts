import type { ToolResult } from '../index';
import type { ToolContext, ToolMetricsSnapshot } from './types';

export interface Tool<I, O> {
  readonly name: string;
  execute(input: I): Promise<O>;
  safeExecute(input: I): Promise<ToolResult<O>>;
  getMetrics(): ToolMetricsSnapshot;
  withContext(context: Partial<ToolContext>): this;
}

export type { ToolContext, ToolMetricsSnapshot };

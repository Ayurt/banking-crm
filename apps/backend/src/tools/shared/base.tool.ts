import type { ToolResult, ToolLogger } from '@banking-crm/shared-types';
import type { Tool, ToolContext, ToolMetricsSnapshot } from '@banking-crm/shared-types';
import { InfrastructureException, isRetryableToolError } from '@banking-crm/shared-types';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 100;

function backoffDelay(attempt: number): number {
  return BASE_DELAY_MS * Math.pow(2, attempt);
}

export abstract class BaseTool<I, O> implements Tool<I, O> {
  abstract readonly name: string;

  protected context: ToolContext = {};
  private metrics: ToolMetricsSnapshot = {
    calls: 0,
    failures: 0,
    retries: 0,
    totalDurationMs: 0,
    cacheHits: 0,
  };

  constructor(protected readonly logger?: ToolLogger) {}

  withContext(context: Partial<ToolContext>): this {
    this.context = { ...this.context, ...context };
    return this;
  }

  getMetrics(): ToolMetricsSnapshot {
    return { ...this.metrics };
  }

  async execute(input: I): Promise<O> {
    const start = Date.now();
    this.metrics.calls += 1;

    try {
      const output = await this.runWithRetry(() => this.executeImpl(input));
      const durationMs = Date.now() - start;
      this.metrics.totalDurationMs += durationMs;
      this.logSuccess(durationMs);
      return output;
    } catch (error) {
      const durationMs = Date.now() - start;
      this.metrics.failures += 1;
      this.metrics.totalDurationMs += durationMs;
      this.logFailure(durationMs, error);
      throw error;
    }
  }

  async safeExecute(input: I): Promise<ToolResult<O>> {
    const start = Date.now();
    try {
      const data = await this.execute(input);
      return { success: true, data, durationMs: Date.now() - start };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message, durationMs: Date.now() - start };
    }
  }

  protected abstract executeImpl(input: I): Promise<O>;

  protected async runWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        const retryable =
          isRetryableToolError(error) ||
          error instanceof InfrastructureException ||
          (error instanceof Error && error.message.includes('timeout'));

        if (!retryable || attempt === MAX_RETRIES) {
          if (error instanceof Error && !(error instanceof InfrastructureException)) {
            throw error;
          }
          throw error instanceof Error
            ? error
            : new InfrastructureException('Tool execution failed');
        }

        this.metrics.retries += 1;
        await new Promise((r) => setTimeout(r, backoffDelay(attempt)));
      }
    }
    throw lastError instanceof Error ? lastError : new InfrastructureException('Tool execution failed');
  }

  protected recordCacheHit(): void {
    this.metrics.cacheHits += 1;
  }

  private logSuccess(durationMs: number): void {
    this.logger?.info(`${this.name} completed`, {
      requestId: this.context.requestId,
      agentName: this.context.agentName,
      durationMs,
      success: true,
    });
  }

  private logFailure(durationMs: number, error: unknown): void {
    this.logger?.error(`${this.name} failed`, {
      requestId: this.context.requestId,
      agentName: this.context.agentName,
      durationMs,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

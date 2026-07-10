import { MAX_RETRIES } from './workflow-constants';

const BASE_DELAY_MS = 100;

function backoffDelay(attempt: number): number {
  return BASE_DELAY_MS * Math.pow(2, attempt);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, backoffDelay(attempt)));
      }
    }
  }
  throw lastError ?? new Error('Tool execution failed after retries');
}

export async function withRetryResult<T>(
  fn: () => Promise<{ success: boolean; data?: T; error?: string; durationMs?: number }>,
  retries = MAX_RETRIES,
): Promise<{ success: boolean; data?: T; error?: string; durationMs?: number }> {
  let lastResult: { success: boolean; data?: T; error?: string; durationMs?: number } = {
    success: false,
    error: 'Unknown',
  };
  for (let attempt = 0; attempt <= retries; attempt++) {
    lastResult = await fn();
    if (lastResult.success) return lastResult;
    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, backoffDelay(attempt)));
    }
  }
  return lastResult;
}

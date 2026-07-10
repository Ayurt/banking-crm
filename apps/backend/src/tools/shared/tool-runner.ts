import type { ToolResult } from '@banking-crm/shared-types';
import type { ToolLogger } from '@banking-crm/shared-types';

export async function withTimeout<T>(fn: () => Promise<T>, timeoutMs = 5000): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Tool execution timeout')), timeoutMs),
    ),
  ]);
}

export async function executeTool<T>(
  toolName: string,
  fn: () => Promise<T>,
  logger?: ToolLogger,
): Promise<ToolResult<T>> {
  const start = Date.now();
  try {
    const data = await withTimeout(fn);
    const durationMs = Date.now() - start;
    logger?.info(`${toolName} completed`, { durationMs });
    return { success: true, data, durationMs };
  } catch (error) {
    const durationMs = Date.now() - start;
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger?.error(`${toolName} failed`, { error: message, durationMs });
    return { success: false, error: message, durationMs };
  }
}

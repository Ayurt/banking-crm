export async function withNodeTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  nodeName: string,
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${nodeName} timed out after ${timeoutMs}ms`)), timeoutMs),
    ),
  ]);
}

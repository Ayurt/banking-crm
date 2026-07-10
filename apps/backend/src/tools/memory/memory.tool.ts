import type { ToolLogger } from '@banking-crm/shared-types';
import type {
  IMemoryRepository,
  MemoryToolInput,
  MemoryToolOutput,
} from '@banking-crm/shared-types';
import { InfrastructureException } from '@banking-crm/shared-types';
import { BaseTool } from '../shared/base.tool';

export class MemoryTool extends BaseTool<MemoryToolInput, MemoryToolOutput> {
  readonly name = 'MemoryTool';

  constructor(
    private readonly repo: IMemoryRepository,
    logger?: ToolLogger,
  ) {
    super(logger);
  }

  protected async executeImpl(input: MemoryToolInput): Promise<MemoryToolOutput> {
    if (input.action === 'read') {
      try {
        const entries = await this.repo.loadForUser(input.userId);
        return { entries };
      } catch (error) {
        throw new InfrastructureException(
          error instanceof Error ? error.message : 'Memory store unavailable',
        );
      }
    }

    return { entries: input.entries ?? [] };
  }

  load(userId: string) {
    return this.safeExecute({ userId, action: 'read' }).then((r) =>
      r.success ? { ...r, data: r.data?.entries } : { ...r, data: undefined },
    );
  }
}

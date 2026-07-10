import { config } from '@banking-crm/config';
import type { ToolLogger } from '@banking-crm/shared-types';
import type { FeatureFlagToolInput, FeatureFlagToolOutput } from '@banking-crm/shared-types';
import { BaseTool } from '../shared/base.tool';

const ALL_FLAGS: Record<string, boolean> = {
  ENABLE_MEMORY: config.features.memory,
  ENABLE_STREAMING: config.features.streaming,
  ENABLE_AUDIT: config.features.audit,
  ENABLE_CACHE: config.features.cache,
};

export class FeatureFlagTool extends BaseTool<FeatureFlagToolInput, FeatureFlagToolOutput> {
  readonly name = 'FeatureFlagTool';

  constructor(logger?: ToolLogger) {
    super(logger);
  }

  protected async executeImpl(input: FeatureFlagToolInput): Promise<FeatureFlagToolOutput> {
    if (!input.flags?.length) {
      return { flags: { ...ALL_FLAGS } };
    }

    const flags: Record<string, boolean> = {};
    for (const flag of input.flags) {
      flags[flag] = ALL_FLAGS[flag] ?? false;
    }
    return { flags };
  }

  isEnabled(flag: string): boolean {
    return ALL_FLAGS[flag] ?? false;
  }
}

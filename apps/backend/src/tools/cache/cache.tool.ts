import { config } from '@banking-crm/config';
import type { ToolLogger } from '@banking-crm/shared-types';
import type { CacheToolInput, CacheToolOutput } from '@banking-crm/shared-types';
import { InfrastructureException } from '@banking-crm/shared-types';
import Redis from 'ioredis';
import { BaseTool } from '../shared/base.tool';

export class CacheTool extends BaseTool<CacheToolInput, CacheToolOutput> {
  readonly name = 'CacheTool';
  private client: Redis | null = null;

  constructor(logger?: ToolLogger) {
    super(logger);
  }

  private getClient(): Redis | null {
    if (!config.features.cache) return null;
    if (!this.client) {
      try {
        this.client = new Redis(config.redisUrl, {
          maxRetriesPerRequest: 1,
          lazyConnect: true,
          connectTimeout: 2000,
        });
      } catch {
        return null;
      }
    }
    return this.client;
  }

  protected async executeImpl(input: CacheToolInput): Promise<CacheToolOutput> {
    const client = this.getClient();
    if (!client) {
      return { hit: false };
    }

    try {
      if (!client.status || client.status === 'wait') {
        await client.connect();
      }

      if (input.action === 'get') {
        const value = await client.get(input.key);
        if (value !== null) {
          this.recordCacheHit();
          return { hit: true, value };
        }
        return { hit: false };
      }

      if (input.action === 'set' && input.value !== undefined) {
        const ttl = input.ttlSeconds ?? config.cacheTtl;
        await client.set(input.key, input.value, 'EX', ttl);
        return { hit: false, value: input.value };
      }

      if (input.action === 'invalidate') {
        await client.del(input.key);
        return { hit: false };
      }

      return { hit: false };
    } catch (error) {
      throw new InfrastructureException(
        error instanceof Error ? error.message : 'Redis unavailable',
      );
    }
  }
}

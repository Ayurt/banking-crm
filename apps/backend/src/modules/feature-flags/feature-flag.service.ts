import { Injectable, NotFoundException } from '@nestjs/common';
import { config } from '@banking-crm/config';
import { PrismaService } from '../../database/prisma.service';
import { ResponseBuilder } from '../../common/utils/response.builder';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';

const DEFAULT_FLAGS: Record<string, { enabled: boolean; description: string }> = {
  ENABLE_MEMORY: { enabled: config.features.memory, description: 'Agent memory persistence' },
  ENABLE_STREAMING: { enabled: config.features.streaming, description: 'SSE workflow streaming' },
  ENABLE_AUDIT: { enabled: config.features.audit, description: 'Audit log generation' },
  ENABLE_CACHE: { enabled: config.features.cache, description: 'Tool result caching' },
};

@Injectable()
export class FeatureFlagService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly response: ResponseBuilder,
  ) {}

  async findAll() {
    const dbFlags = await this.prisma.featureFlag.findMany();
    const flags = Object.entries(DEFAULT_FLAGS).map(([key, meta]) => {
      const db = dbFlags.find((f) => f.key === key);
      return {
        key,
        enabled: db?.enabled ?? meta.enabled,
        description: db?.description ?? meta.description,
      };
    });
    return this.response.success(flags, 'Feature flags retrieved successfully');
  }

  async update(key: string, dto: UpdateFeatureFlagDto) {
    if (!DEFAULT_FLAGS[key]) {
      throw new NotFoundException({ message: 'Feature flag not found', errorCode: 'FLAG_NOT_FOUND' });
    }

    const flag = await this.prisma.featureFlag.upsert({
      where: { key },
      create: { key, enabled: dto.enabled, description: DEFAULT_FLAGS[key].description },
      update: { enabled: dto.enabled },
    });
    return this.response.success(flag, 'Feature flag updated successfully');
  }
}

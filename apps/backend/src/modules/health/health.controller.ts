import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SkipThrottle } from '../../common/decorators/skip-throttle.decorator';
import { PrismaService } from '../../database/prisma.service';
import { ResponseBuilder } from '../../common/utils/response.builder';

@ApiTags('Health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly response: ResponseBuilder,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  async check() {
    return this.probe('healthy');
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe — checks database connectivity' })
  async ready() {
    return this.probe('ready');
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe — process is running' })
  live() {
    return this.response.success({ status: 'alive' }, 'Service is live');
  }

  private async probe(status: string) {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return this.response.success({ status, database: 'connected' }, 'Health check passed');
    } catch {
      return this.response.success({ status: 'unhealthy', database: 'disconnected' }, 'Health check failed');
    }
  }
}

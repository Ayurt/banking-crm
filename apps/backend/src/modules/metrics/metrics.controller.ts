import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SkipThrottle } from '../../common/decorators/skip-throttle.decorator';
import { MetricsService } from './metrics.service';

@ApiTags('Metrics')
@SkipThrottle()
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @ApiOperation({ summary: 'Prometheus-compatible metrics export' })
  @Header('Content-Type', 'text/plain; version=0.0.4')
  getMetrics() {
    return this.metricsService.getPrometheusMetrics();
  }
}

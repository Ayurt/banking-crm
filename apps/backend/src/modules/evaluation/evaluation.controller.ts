import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { EvaluationService } from './evaluation.service';
import { AgentQueryDto } from '../conversations/dto/agent-query.dto';
import type { AgentQueryResponse } from '@banking-crm/shared-types';

@ApiTags('Evaluation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('evaluation')
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @Get('benchmarks')
  @ApiOperation({ summary: 'Run benchmark scenarios' })
  runBenchmarks() {
    return this.evaluationService.runBenchmarks();
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get monitoring metrics for evaluation dashboard' })
  getMetrics() {
    return this.evaluationService.getMonitoringMetrics();
  }

  @Post('report')
  @ApiOperation({ summary: 'Evaluate a workflow response' })
  evaluateResponse(@Body() body: AgentQueryDto & { response: AgentQueryResponse }) {
    return this.evaluationService.evaluateQueryResult(body.query, body.response);
  }
}

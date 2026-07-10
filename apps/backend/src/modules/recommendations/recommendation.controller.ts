import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RecommendationService } from './recommendation.service';
import { GenerateRecommendationDto } from './dto/generate-recommendation.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

interface AuthRequest {
  user: { sub: string };
}

@ApiTags('Recommendations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate recommendations without messaging (testing)' })
  generate(@Req() req: AuthRequest, @Body() dto: GenerateRecommendationDto) {
    return this.recommendationService.generate(dto, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Recommendation history' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.recommendationService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Recommendation details' })
  @ApiParam({ name: 'id', description: 'Recommendation UUID' })
  findOne(@Param('id') id: string) {
    return this.recommendationService.findOne(id);
  }
}

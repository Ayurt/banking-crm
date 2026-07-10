import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { FeatureFlagService } from './feature-flag.service';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';

@ApiTags('Feature Flags')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('feature-flags')
export class FeatureFlagController {
  constructor(private readonly featureFlagService: FeatureFlagService) {}

  @Get()
  @ApiOperation({ summary: 'List feature flags' })
  findAll() {
    return this.featureFlagService.findAll();
  }

  @Patch(':key')
  @ApiOperation({ summary: 'Enable or disable a feature flag' })
  @ApiParam({ name: 'key', example: 'ENABLE_STREAMING' })
  update(@Param('key') key: string, @Body() dto: UpdateFeatureFlagDto) {
    return this.featureFlagService.update(key, dto);
  }
}

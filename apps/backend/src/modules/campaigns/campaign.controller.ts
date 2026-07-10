import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CampaignService } from './campaign.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

@ApiTags('Campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Get()
  @ApiOperation({ summary: 'List campaign history' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.campaignService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new campaign' })
  create(@Body() dto: CreateCampaignDto) {
    return this.campaignService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign details' })
  @ApiParam({ name: 'id', description: 'Campaign UUID' })
  findOne(@Param('id') id: string) {
    return this.campaignService.findOne(id);
  }
}

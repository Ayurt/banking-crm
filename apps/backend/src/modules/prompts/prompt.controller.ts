import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PromptService } from './prompt.service';
import { CreatePromptDto } from './dto/create-prompt.dto';

@ApiTags('Prompts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('prompts')
export class PromptController {
  constructor(private readonly promptService: PromptService) {}

  @Get()
  @ApiOperation({ summary: 'List prompt versions' })
  findAll() {
    return this.promptService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a prompt version record' })
  create(@Body() dto: CreatePromptDto) {
    return this.promptService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get prompt version details' })
  @ApiParam({ name: 'id', description: 'Prompt version UUID' })
  findOne(@Param('id') id: string) {
    return this.promptService.findOne(id);
  }
}

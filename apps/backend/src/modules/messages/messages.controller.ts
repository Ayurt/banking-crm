import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { MessageStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MessagingService } from '../messaging/messaging.service';
import { GenerateMessageDto } from './dto/generate-message.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

interface AuthRequest {
  user: { sub: string };
}

@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate a message without full workflow' })
  generate(@Body() dto: GenerateMessageDto) {
    return this.messagingService.generate(dto);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a draft message' })
  @ApiParam({ name: 'id', description: 'Message UUID' })
  approve(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.messagingService.update(id, req.user.sub, { status: MessageStatus.APPROVED });
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a draft message' })
  @ApiParam({ name: 'id', description: 'Message UUID' })
  reject(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.messagingService.update(id, req.user.sub, { status: MessageStatus.REJECTED });
  }

  @Get()
  @ApiOperation({ summary: 'Message history' })
  findAll(@Query() query: PaginationQueryDto, @Query('sessionId') sessionId?: string) {
    if (sessionId) {
      return this.messagingService.findBySession(sessionId);
    }
    return this.messagingService.findAll(query);
  }
}

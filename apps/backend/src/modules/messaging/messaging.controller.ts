import { Controller, Get, Patch, Param, Body, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MessagingService } from './messaging.service';
import { UpdateMessageDto } from './dto/update-message.dto';

interface AuthRequest {
  user: { sub: string };
}

@ApiTags('Messaging')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get('pending')
  @ApiOperation({ summary: 'Get messages pending RM approval' })
  findPending() {
    return this.messagingService.findPending();
  }

  @Get()
  @ApiOperation({ summary: 'Get messages by conversation session' })
  findBySession(@Query('sessionId') sessionId: string) {
    return this.messagingService.findBySession(sessionId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Approve, reject, or edit a message' })
  update(@Req() req: AuthRequest, @Param('id') id: string, @Body() dto: UpdateMessageDto) {
    return this.messagingService.update(id, req.user.sub, dto);
  }
}

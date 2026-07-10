import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Sse,
  MessageEvent,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ConversationsService } from './conversations.service';
import { AgentQueryDto } from './dto/agent-query.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

interface AuthRequest {
  user: { sub: string; email: string; role: string; name: string };
}

@ApiTags('Conversations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({ status: 201, description: 'Conversation created' })
  create(@Req() req: AuthRequest, @Body() dto: CreateConversationDto) {
    return this.conversationsService.create(req.user.sub, dto.title);
  }

  @Get()
  @ApiOperation({ summary: 'List conversations for the current RM' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  findAll(@Req() req: AuthRequest, @Query() query: PaginationQueryDto) {
    return this.conversationsService.findAll(req.user.sub, query.page, query.pageSize);
  }

  @Post('query')
  @ApiOperation({ summary: 'Execute agent workflow (alias of POST /agent/query)' })
  @ApiResponse({ status: 200, description: 'Agent workflow completed' })
  query(@Req() req: AuthRequest, @Body() dto: AgentQueryDto) {
    return this.conversationsService.executeQuery(req.user.sub, dto.query);
  }

  @Sse('query/stream')
  @ApiOperation({ summary: 'Stream agent execution steps via SSE' })
  streamQuery(@Req() req: AuthRequest, @Body() dto: AgentQueryDto): Observable<MessageEvent> {
    const { observable, result } = this.conversationsService.executeQueryStream(
      req.user.sub,
      dto.query,
    );
    return new Observable<MessageEvent>((subscriber) => {
      const sub = observable.subscribe({
        next: (step) => subscriber.next({ data: step }),
        error: (err) => subscriber.error(err),
        complete: async () => {
          try {
            const finalResult = await result;
            subscriber.next({ data: { type: 'complete', result: finalResult } });
            subscriber.complete();
          } catch (err) {
            subscriber.error(err);
          }
        },
      });
      return () => sub.unsubscribe();
    });
  }

  @Get('sessions')
  @ApiOperation({ summary: 'List conversation sessions (legacy alias)' })
  getSessions(@Req() req: AuthRequest, @Query() query: PaginationQueryDto) {
    return this.conversationsService.findAll(req.user.sub, query.page, query.pageSize);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get session details (legacy alias)' })
  getSession(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.conversationsService.findOne(req.user.sub, id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve conversation history and results' })
  @ApiParam({ name: 'id', description: 'Conversation UUID' })
  findOne(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.conversationsService.findOne(req.user.sub, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Archive a conversation' })
  @ApiParam({ name: 'id', description: 'Conversation UUID' })
  archive(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.conversationsService.archive(req.user.sub, id);
  }
}

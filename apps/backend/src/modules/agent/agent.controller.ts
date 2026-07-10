import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ConversationsService } from '../conversations/conversations.service';
import { AgentQueryDto } from '../conversations/dto/agent-query.dto';

interface AuthRequest {
  user: { sub: string };
}

@ApiTags('Agent')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agent')
export class AgentController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post('query')
  @ApiOperation({
    summary: 'Primary AI endpoint — orchestrates the full agentic workflow',
    description:
      'Powers Planner → Retrieval → Scoring → Recommendation → Messaging → Audit → Response',
  })
  @ApiBody({
    type: AgentQueryDto,
    examples: {
      personalLoan: {
        summary: 'Personal loan campaign',
        value: {
          query:
            'Find high-value customers likely to convert for a personal loan this month and generate personalized WhatsApp messages.',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Workflow completed successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Rate limited' })
  query(@Req() req: AuthRequest, @Body() dto: AgentQueryDto) {
    return this.conversationsService.executeQuery(req.user.sub, dto.query);
  }
}

import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { ConversationsModule } from '../conversations/conversations.module';

@Module({
  imports: [ConversationsModule],
  controllers: [AgentController],
})
export class AgentModule {}

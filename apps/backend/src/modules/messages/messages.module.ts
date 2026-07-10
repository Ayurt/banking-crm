import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagingModule } from '../messaging/messaging.module';

@Module({
  imports: [MessagingModule],
  controllers: [MessagesController],
})
export class MessagesModule {}

import { Injectable } from '@nestjs/common';
import type { ConversationMemoryEntry } from '@banking-crm/shared-types';
import type { IMemoryRepository } from '@banking-crm/shared-types';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class MemoryRepository implements IMemoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async loadForUser(userId: string): Promise<ConversationMemoryEntry[]> {
    const messages = await this.prisma.conversationMessage.findMany({
      where: { conversation: { userId } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return messages.reverse().map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.createdAt,
    }));
  }
}

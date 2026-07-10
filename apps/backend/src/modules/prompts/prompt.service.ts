import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ResponseBuilder } from '../../common/utils/response.builder';
import { CreatePromptDto } from './dto/create-prompt.dto';

@Injectable()
export class PromptService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly response: ResponseBuilder,
  ) {}

  async findAll() {
    const prompts = await this.prisma.promptVersion.findMany({ orderBy: { createdAt: 'desc' } });
    return this.response.success(prompts, 'Prompt versions retrieved successfully');
  }

  async findOne(id: string) {
    const prompt = await this.prisma.promptVersion.findUnique({ where: { id } });
    if (!prompt) {
      throw new NotFoundException({ message: 'Prompt not found', errorCode: 'PROMPT_NOT_FOUND' });
    }
    return this.response.success(prompt, 'Prompt retrieved successfully');
  }

  async create(dto: CreatePromptDto) {
    const prompt = await this.prisma.promptVersion.create({ data: dto });
    return this.response.success(prompt, 'Prompt version created successfully');
  }
}

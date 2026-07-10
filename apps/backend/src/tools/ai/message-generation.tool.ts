import type { ToolLogger } from '@banking-crm/shared-types';
import type {
  MessageGenerationToolInput,
  MessageGenerationToolOutput,
} from '@banking-crm/shared-types';
import { MessageGenerationException } from '@banking-crm/shared-types';
import { BaseTool } from '../shared/base.tool';
import { generateMessageContent } from './llm.client';

export class MessageGenerationTool extends BaseTool<
  MessageGenerationToolInput,
  MessageGenerationToolOutput
> {
  readonly name = 'MessageGenerationTool';

  constructor(logger?: ToolLogger) {
    super(logger);
  }

  protected async executeImpl(
    input: MessageGenerationToolInput,
  ): Promise<MessageGenerationToolOutput> {
    try {
      const { content, tokensUsed } = await generateMessageContent({
        customerName: input.customer.name,
        occupation: input.customer.occupation ?? 'Professional',
        productName: input.recommendation.productName,
        reasons: input.recommendation.reasons,
        language: input.language,
        crmNotes: input.crmNotes,
      });

      return {
        message: {
          customerId: input.customer.id,
          customerName: input.customer.name,
          productType: input.recommendation.productType,
          channel: input.channel ?? 'whatsapp',
          content,
          language: input.language,
          status: 'DRAFT',
        },
        tokensUsed,
      };
    } catch (error) {
      if (error instanceof MessageGenerationException) throw error;
      throw new MessageGenerationException(
        error instanceof Error ? error.message : 'Message generation failed',
      );
    }
  }
}

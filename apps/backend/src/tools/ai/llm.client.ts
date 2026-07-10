import {
  messagingPrompt,
  summaryPrompt,
  parseAndValidate,
  type MessagingOutput,
  type ExplanationOutput,
} from '@banking-crm/prompts';
import { config } from '@banking-crm/config';
import { ChatOpenAI } from '@langchain/openai';
import { MessageGenerationException } from '@banking-crm/shared-types';

export function createLlmClient(): ChatOpenAI | null {
  if (!config.openaiApiKey || config.openaiApiKey === 'your-openai-api-key') {
    return null;
  }
  return new ChatOpenAI({
    model: config.openaiModel,
    apiKey: config.openaiApiKey,
    temperature: 0.3,
  });
}

export async function generateMessageContent(params: {
  customerName: string;
  occupation: string;
  productName: string;
  reasons: string[];
  language: string;
  crmNotes: string[];
  relationshipYears?: number;
}): Promise<{ content: string; tokensUsed: number }> {
  const llm = createLlmClient();
  if (!llm) {
    return {
      content: `Hi ${params.customerName}, based on your banking relationship, you may qualify for our ${params.productName}. Reply YES to learn more.`,
      tokensUsed: 0,
    };
  }

  try {
    const response = await llm.invoke([
      { role: 'system', content: messagingPrompt.system },
      {
        role: 'user',
        content: messagingPrompt.user({
          ...params,
          channel: 'whatsapp',
        }),
      },
    ]);
    const raw = typeof response.content === 'string' ? response.content.trim() : '';
    const validated = parseAndValidate<MessagingOutput>('messaging', raw);
    if (validated.success && validated.data?.message) {
      return { content: validated.data.message, tokensUsed: 150 };
    }
    if (raw && !raw.startsWith('{')) {
      return { content: raw, tokensUsed: 150 };
    }
    throw new MessageGenerationException('Invalid messaging JSON output');
  } catch (error) {
    if (error instanceof MessageGenerationException) throw error;
    throw new MessageGenerationException(
      error instanceof Error ? error.message : 'LLM invocation failed',
    );
  }
}

export async function generateSummaryContent(params: {
  query: string;
  customerCount: number;
  topScore: number;
  productType: string;
}): Promise<{ summary: string; tokensUsed: number }> {
  const llm = createLlmClient();
  const fallback = `Analyzed ${params.customerCount} customers for ${params.productType}. Top score: ${params.topScore}.`;

  if (!llm) {
    return { summary: fallback, tokensUsed: 0 };
  }

  try {
    const response = await llm.invoke([
      { role: 'system', content: summaryPrompt.system },
      { role: 'user', content: summaryPrompt.user(params) },
    ]);
    const raw = typeof response.content === 'string' ? response.content.trim() : '';
    const validated = parseAndValidate<ExplanationOutput>('summary', raw);
    if (validated.success && validated.data?.summary) {
      return { summary: validated.data.summary, tokensUsed: 80 };
    }
    if (raw && !raw.startsWith('{')) {
      return { summary: raw, tokensUsed: 80 };
    }
    return { summary: fallback, tokensUsed: 0 };
  } catch {
    return { summary: fallback, tokensUsed: 0 };
  }
}

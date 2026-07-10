import { ChatOpenAI } from '@langchain/openai';
import { config } from '@banking-crm/config';

export function createLlm(): ChatOpenAI | null {
  if (!config.openaiApiKey || config.openaiApiKey === 'your-openai-api-key') return null;
  return new ChatOpenAI({
    model: config.openaiModel,
    apiKey: config.openaiApiKey,
    temperature: 0.3,
  });
}

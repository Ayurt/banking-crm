import { loadPromptFile, loadSharedSection } from './loader';
import { formatCrmNotesForPrompt, renderTemplate } from './templates';

export const PROMPT_VERSION = '1.0.0';
export const PROMPT_MODEL = 'GPT-5.5';

const AVAILABLE_TOOLS = [
  'CustomerTool',
  'TransactionTool',
  'LoanTool',
  'CrmTool',
  'CampaignTool',
  'ScoringTool',
  'EligibilityTool',
  'RecommendationTool',
  'MessageGenerationTool',
  'MemoryTool',
  'AuditTool',
].join(', ');

const AVAILABLE_PRODUCTS =
  'PERSONAL_LOAN, CREDIT_CARD, FIXED_DEPOSIT, HOME_LOAN, INSURANCE';

function buildSystemPrompt(domainPromptPath: string): string {
  const guardrails = loadSharedSection('banking.guardrails');
  const style = loadSharedSection('style-guide');
  const domain = loadPromptFile(domainPromptPath).body;
  return [guardrails, style, domain].join('\n\n');
}

const plannerSystem = buildSystemPrompt('planner/planner.system.prompt.md');
const plannerUserTemplate = loadPromptFile('planner/planner.user.prompt.md').body;

export interface PlannerOutput {
  intent: string;
  workflow: string;
  productType?: string;
  requiredTools: string[];
  steps?: string[];
  reasoning: string;
  status?: 'INSUFFICIENT_DATA';
}

export const plannerPrompt = {
  version: PROMPT_VERSION,
  model: PROMPT_MODEL,
  name: 'planner-system',
  description: 'Creates execution plans for RM queries',
  owner: 'AI Team',
  variables: ['query', 'availableTools', 'availableProducts', 'currentDate'] as const,
  system: plannerSystem,
  user: (query: string, currentDate = new Date().toISOString().slice(0, 10)) =>
    renderTemplate(plannerUserTemplate, {
      query,
      currentDate,
      availableTools: AVAILABLE_TOOLS,
      availableProducts: AVAILABLE_PRODUCTS,
    }),
};

const messagingSystem = buildSystemPrompt('messaging/whatsapp.system.prompt.md');
const messagingUserTemplate = loadPromptFile('messaging/whatsapp.user.prompt.md').body;

export interface MessagingOutput {
  message: string;
  status?: 'INSUFFICIENT_DATA';
}

export const messagingPrompt = {
  version: PROMPT_VERSION,
  model: PROMPT_MODEL,
  name: 'whatsapp-system',
  description: 'Generates personalized WhatsApp outreach messages',
  owner: 'AI Team',
  variables: ['customer', 'recommendation', 'crmNotes', 'preferredLanguage', 'channel'] as const,
  system: messagingSystem,
  user: (params: {
    customerName: string;
    occupation: string;
    productName: string;
    reasons: string[];
    language: string;
    crmNotes: string[];
    relationshipYears?: number;
    channel?: string;
  }) =>
    renderTemplate(messagingUserTemplate, {
      customerName: params.customerName,
      occupation: params.occupation,
      productName: params.productName,
      reasons: params.reasons.join('; '),
      preferredLanguage: params.language === 'hi' ? 'Hindi' : 'English',
      crmNotes: formatCrmNotesForPrompt(params.crmNotes),
      relationshipYears: String(params.relationshipYears ?? 0),
      channel: params.channel ?? 'whatsapp',
    }),
};

const explanationSystem = buildSystemPrompt('reasoning/explanation.system.prompt.md');
const explanationUserTemplate = loadPromptFile('reasoning/explanation.user.prompt.md').body;

export interface ExplanationOutput {
  summary: string;
  status?: 'INSUFFICIENT_DATA';
}

export const reasoningPrompt = {
  version: PROMPT_VERSION,
  model: PROMPT_MODEL,
  name: 'explanation-system',
  description: 'Converts deterministic outputs into human-readable explanations',
  owner: 'AI Team',
  variables: ['score', 'confidence', 'reasons'] as const,
  system: explanationSystem,
  user: (params: {
    customerName: string;
    productName: string;
    conversionScore: number;
    confidence: number;
    reasons: string[];
  }) =>
    renderTemplate(explanationUserTemplate, {
      customerName: params.customerName,
      productName: params.productName,
      score: String(params.conversionScore),
      confidence: String(params.confidence),
      reasons: params.reasons.join('; '),
    }),
};

const summarySystem = buildSystemPrompt('summary/summary.system.prompt.md');
const summaryUserTemplate = loadPromptFile('summary/summary.user.prompt.md').body;

export const summaryPrompt = {
  version: PROMPT_VERSION,
  model: PROMPT_MODEL,
  name: 'summary-system',
  description: 'Summarizes agent workflow results for RMs',
  owner: 'AI Team',
  variables: ['query', 'customerCount', 'topScore', 'productType'] as const,
  system: summarySystem,
  user: (params: {
    query: string;
    customerCount: number;
    topScore: number;
    productType: string;
  }) =>
    renderTemplate(summaryUserTemplate, {
      query: params.query,
      customerCount: String(params.customerCount),
      topScore: String(params.topScore),
      productType: params.productType,
    }),
};

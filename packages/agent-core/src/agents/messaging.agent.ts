import { messagingPrompt, parseAndValidateWithRetry, type MessagingOutput } from '@banking-crm/prompts';
import type { OutreachMessage, Recommendation } from '@banking-crm/shared-types';
import { createLlm } from '../utils/llm';
import { addConfidence, addStep, emitStep } from '../utils/steps';
import type { AgentRuntimeDeps } from '../interfaces/agent-runtime';
import type { GraphState } from '../state/agent-state';

function buildFallbackMessage(name: string, rec: Recommendation): string {
  return `Hi ${name}, based on your banking relationship with us, you may qualify for our ${rec.productName}. ${rec.reasons[0] ?? 'You meet our eligibility criteria'}. Reply YES to learn more.`;
}

export async function messagingAgent(
  state: GraphState,
  deps: AgentRuntimeDeps,
): Promise<Partial<GraphState>> {
  emitStep(deps, {
    agentName: 'Messaging',
    status: 'running',
    message: 'Generating personalized WhatsApp messages...',
  });

  const llm = createLlm();
  const messages: OutreachMessage[] = [];
  let tokensUsed = 0;

  for (const rec of state.recommendations.slice(0, 10)) {
    const customer = state.customers.find((c) => c.id === rec.customerId);
    if (!customer) continue;

    const notes = state.crmNotes
      .filter((n) => n.customerId === customer.id)
      .map((n) => n.note);

    const priorCampaigns = state.campaigns
      .filter((c) => c.customerId === customer.id && c.clicked)
      .map((c) => c.campaignName);

    let content: string;

    if (llm) {
      try {
        const enrichedNotes = [
          ...notes,
          ...(priorCampaigns.length ? [`Previously engaged: ${priorCampaigns.join(', ')}`] : []),
        ];
        const response = await llm.invoke([
          { role: 'system', content: messagingPrompt.system },
          {
            role: 'user',
            content: messagingPrompt.user({
              customerName: customer.name,
              occupation: customer.occupation ?? 'Professional',
              productName: rec.productName,
              reasons: rec.reasons,
              language: customer.preferredLanguage,
              crmNotes: enrichedNotes,
              relationshipYears: customer.relationshipYears,
              channel: 'whatsapp',
            }),
          },
        ]);
        const raw = typeof response.content === 'string' ? response.content.trim() : '';
        const validated = parseAndValidateWithRetry<MessagingOutput>('messaging', raw);
        if (validated.success && validated.data?.message) {
          content = validated.data.message;
        } else if (raw && !raw.startsWith('{')) {
          content = raw;
        } else {
          content = buildFallbackMessage(customer.name, rec);
        }
        tokensUsed += 150;
      } catch {
        content = buildFallbackMessage(customer.name, rec);
      }
    } else {
      content = buildFallbackMessage(customer.name, rec);
    }

    messages.push({
      customerId: customer.id,
      customerName: customer.name,
      productType: rec.productType,
      channel: 'whatsapp',
      content,
      language: customer.preferredLanguage,
      status: 'DRAFT',
    });
  }

  emitStep(deps, {
    agentName: 'Messaging',
    status: 'completed',
    message: `${messages.length} messages ready for RM approval`,
  });

  return {
    messages,
    status: 'messaging',
    metadata: {
      ...state.metadata,
      tokensUsed: Number(state.metadata.tokensUsed ?? 0) + tokensUsed,
    },
    agentConfidence: addConfidence(state, 'Messaging', llm ? 90 : 75),
    executionSteps: addStep(state, {
      agentName: 'Messaging',
      status: 'completed',
      message: `${messages.length} draft messages generated`,
    }),
    auditLogs: [
      ...state.auditLogs,
      {
        action: 'messages_generated',
        agentName: 'Messaging',
        promptVersion: messagingPrompt.version,
        tokensUsed,
        details: { count: messages.length },
      },
    ],
  };
}

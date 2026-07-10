import type {
  CampaignRecord,
  CrmNote,
  Customer,
  Transaction,
} from '@banking-crm/shared-types';
import { getBusinessRules } from './config';

export function calculateConfidence(
  customer: Customer,
  transactions: Transaction[],
  crmNotes: CrmNote[],
  campaigns: CampaignRecord[],
): number {
  const rules = getBusinessRules();
  let confidence = rules.baseConfidence;

  const profileComplete =
    Boolean(customer.email) &&
    Boolean(customer.phone) &&
    Boolean(customer.occupation) &&
    customer.existingProducts.length > 0;
  if (profileComplete) confidence += 5;

  if (crmNotes.some((n) => n.customerId === customer.id)) confidence += 5;

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  if (
    transactions.some(
      (t) => t.customerId === customer.id && new Date(t.txnDate) >= ninetyDaysAgo,
    )
  ) {
    confidence += 5;
  }

  if (campaigns.some((c) => c.customerId === customer.id)) confidence += 5;

  if (customer.occupation && !customer.occupation.toLowerCase().includes('unknown')) {
    confidence += 5;
  }

  if (customer.relationshipYears >= rules.minimumRelationshipYears) confidence += 5;

  const hasNegativeCrm = crmNotes
    .filter((n) => n.customerId === customer.id)
    .some((n) => (n.category ?? '').toUpperCase().includes('NEGATIVE'));
  if (hasNegativeCrm) {
    confidence = Math.min(confidence, rules.baseConfidence);
  }

  return Math.min(100, confidence);
}

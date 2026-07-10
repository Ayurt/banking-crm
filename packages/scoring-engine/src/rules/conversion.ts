import type {
  CampaignRecord,
  ConversionScoreBreakdown,
  CrmNote,
  Customer,
  Transaction,
} from '@banking-crm/shared-types';

export function scoreIncome(monthlyIncome: number): number {
  if (monthlyIncome < 30000) return 0;
  if (monthlyIncome < 50000) return 8;
  if (monthlyIncome < 100000) return 15;
  return 20;
}

export function scoreCredit(creditScore: number): number {
  if (creditScore < 650) return 0;
  if (creditScore < 700) return 10;
  if (creditScore < 750) return 18;
  if (creditScore < 800) return 22;
  return 25;
}

export function scoreRelationship(years: number): number {
  if (years < 1) return 0;
  if (years < 3) return 8;
  if (years < 5) return 12;
  return 15;
}

export function scoreTransactionActivity(transactions: Transaction[], customerId: string): number {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const recent = transactions.filter(
    (t) => t.customerId === customerId && new Date(t.txnDate) >= ninetyDaysAgo,
  );

  if (recent.length >= 15) return 15;
  if (recent.length >= 5) return 10;
  if (recent.length >= 1) return 5;
  return 0;
}

export function scoreCampaignEngagement(campaigns: CampaignRecord[], customerId: string): number {
  const customerCampaigns = campaigns.filter((c) => c.customerId === customerId);
  if (!customerCampaigns.length) return 0;
  if (customerCampaigns.some((c) => c.converted)) return 10;
  if (customerCampaigns.some((c) => c.clicked)) return 7;
  if (customerCampaigns.some((c) => c.opened)) return 4;
  return 0;
}

export function scoreCrmSentiment(notes: CrmNote[], customerId: string): number {
  const customerNotes = notes.filter((n) => n.customerId === customerId);
  if (!customerNotes.length) return 3;

  const sentiments = customerNotes.map((n) => (n.category ?? 'NEUTRAL').toUpperCase());
  if (sentiments.some((s) => s.includes('NEGATIVE'))) return 0;
  if (sentiments.some((s) => s.includes('POSITIVE'))) return 5;
  return 3;
}

export function scoreExistingProducts(products: string[]): number {
  let score = 0;
  const normalized = products.map((p) => p.toLowerCase());

  if (normalized.some((p) => p.includes('savings'))) score += 2;
  if (normalized.some((p) => p.includes('credit card'))) score += 2;
  if (normalized.some((p) => p.includes('fixed deposit') || p.includes('fd'))) score += 3;
  if (normalized.some((p) => p.includes('salary'))) score += 3;

  return Math.min(10, score);
}

export function calculateConversionScore(
  customer: Customer,
  transactions: Transaction[],
  crmNotes: CrmNote[],
  campaigns: CampaignRecord[],
): { total: number; breakdown: ConversionScoreBreakdown } {
  const breakdown: ConversionScoreBreakdown = {
    income: scoreIncome(customer.monthlyIncome),
    credit: scoreCredit(customer.creditScore),
    relationship: scoreRelationship(customer.relationshipYears),
    transactions: scoreTransactionActivity(transactions, customer.id),
    campaign: scoreCampaignEngagement(campaigns, customer.id),
    crm: scoreCrmSentiment(crmNotes, customer.id),
    existingProducts: scoreExistingProducts(customer.existingProducts),
  };

  const total = Math.min(
    100,
    breakdown.income +
      breakdown.credit +
      breakdown.relationship +
      breakdown.transactions +
      breakdown.campaign +
      breakdown.crm +
      breakdown.existingProducts,
  );

  return { total, breakdown };
}

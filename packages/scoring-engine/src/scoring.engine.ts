import type {
  CampaignRecord,
  CrmNote,
  Customer,
  CustomerScore,
  Loan,
  ProductType,
  QueryFilters,
  Transaction,
} from '@banking-crm/shared-types';
import { getBusinessRules } from './rules/config';
import {
  calculateConversionScore,
  scoreCrmSentiment,
} from './rules/conversion';
import { checkPersonalLoanEligibility } from './rules/eligibility';
import { calculateConfidence } from './rules/confidence';
import { classifyRisk, riskScoreFromLevel } from './rules/risk';
import { getCustomerSegment, getOutreachPriority } from './rules/segmentation';
import { validateCustomerData } from './rules/validation';

export class ScoringEngine {
  scoreCustomer(
    customer: Customer,
    productType: ProductType,
    transactions: Transaction[],
    crmNotes: CrmNote[],
    loans: Loan[],
    campaigns: CampaignRecord[] = [],
    filters: QueryFilters = {},
  ): CustomerScore | null {
    const validation = validateCustomerData(customer);
    if (!validation.valid) return null;

    const eligibility = checkPersonalLoanEligibility(customer, loans, productType, { filters });
    const { total: baseConversion, breakdown } = calculateConversionScore(
      customer,
      transactions,
      crmNotes,
      campaigns,
    );

    let conversionScore = baseConversion;
    const reasons: string[] = [...eligibility.reasons];

    if (breakdown.income >= 15) reasons.push('Strong monthly income');
    if (breakdown.credit >= 18) reasons.push('Excellent credit score');
    if (breakdown.relationship >= 12) reasons.push('Long banking relationship');
    if (breakdown.transactions >= 10) reasons.push('High transaction activity');
    if (breakdown.campaign >= 7) reasons.push('Strong campaign engagement');
    if (breakdown.crm === 5) reasons.push('Positive CRM sentiment');

    const crmSentiment = scoreCrmSentiment(crmNotes, customer.id);
    if (crmSentiment === 0) {
      conversionScore = Math.max(0, conversionScore - 10);
      reasons.push('Negative CRM sentiment reduces conversion score');
    }

    const rules = getBusinessRules();
    const inactiveCutoff = new Date();
    inactiveCutoff.setMonth(inactiveCutoff.getMonth() - rules.inactiveCustomerMonths);
    const hasRecentActivity = transactions.some(
      (t) => t.customerId === customer.id && new Date(t.txnDate) >= inactiveCutoff,
    );
    if (!hasRecentActivity && transactions.length > 0) {
      conversionScore = Math.max(0, conversionScore - 5);
      reasons.push('Inactive customer — reduced outreach priority');
    }

    conversionScore = Math.min(100, Math.round(conversionScore));
    const segment = getCustomerSegment(conversionScore);
    const riskLevel = classifyRisk(customer.creditScore);
    const confidence = calculateConfidence(customer, transactions, crmNotes, campaigns);
    const eligible = eligibility.eligible;

    if (!eligible) {
      reasons.push(...eligibility.failures.map((f) => `NOT_ELIGIBLE: ${f}`));
    }

    return {
      customerId: customer.id,
      productType,
      conversionScore,
      riskScore: riskScoreFromLevel(riskLevel),
      relationshipScore: breakdown.relationship,
      valueScore: Math.min(100, Math.round(customer.monthlyIncome / 2000 + customer.avgMonthlyBalance / 10000)),
      reasons: [...new Set(reasons)],
      confidence,
      segment,
      riskLevel,
      outreachPriority: getOutreachPriority(segment),
      eligible,
      scoreBreakdown: breakdown,
    };
  }

  scoreBatch(
    customers: Customer[],
    productType: ProductType,
    transactions: Transaction[],
    crmNotes: CrmNote[],
    loans: Loan[],
    minScore = 40,
    campaigns: CampaignRecord[] = [],
    filters: QueryFilters = {},
  ): CustomerScore[] {
    return customers
      .map((c) => this.scoreCustomer(c, productType, transactions, crmNotes, loans, campaigns, filters))
      .filter((s): s is CustomerScore => s !== null && s.conversionScore >= minScore)
      .sort((a, b) => b.conversionScore - a.conversionScore);
  }
}

export { ScoringEngine as ScoringTool };
export * from './rules';

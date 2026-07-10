import { config } from '@banking-crm/config';
import type {
  Customer,
  CustomerScore,
  Loan,
  ProductType,
  Transaction,
} from '@banking-crm/shared-types';

export interface ProductCandidate {
  productName: string;
  productType: ProductType;
  rankingScore: number;
  reasons: string[];
}

export function getEligibleProductCandidates(
  customer: Customer,
  score: CustomerScore,
  loans: Loan[],
  transactions: Transaction[],
): ProductCandidate[] {
  const rules = config.businessRules;
  const candidates: ProductCandidate[] = [];

  const hasActivePersonalLoan = loans.some(
    (l) =>
      l.customerId === customer.id &&
      l.productType === 'PERSONAL_LOAN' &&
      l.status === 'ACTIVE',
  );

  const productFitBonus = (fit: number) => fit;
  const relationshipBonus = customer.relationshipYears >= 5 ? 5 : customer.relationshipYears >= 3 ? 3 : 0;
  const campaignBonus = score.scoreBreakdown.campaign >= 7 ? 5 : score.scoreBreakdown.campaign >= 4 ? 2 : 0;

  if (
    score.eligible &&
    score.conversionScore >= rules.premiumLoanMinConversion &&
    customer.monthlyIncome > rules.premiumLoanIncome &&
    customer.creditScore >= rules.premiumLoanMinCredit &&
    customer.relationshipYears >= rules.premiumLoanMinRelationship &&
    !hasActivePersonalLoan
  ) {
    candidates.push({
      productName: 'Premium Personal Loan',
      productType: 'PERSONAL_LOAN',
      rankingScore:
        score.conversionScore + productFitBonus(10) + relationshipBonus + campaignBonus,
      reasons: [
        'Excellent credit score',
        'High monthly income',
        'Long banking relationship',
        'Premium loan conversion threshold met',
      ],
    });
  }

  if (
    score.eligible &&
    score.conversionScore >= rules.personalLoanMinConversion &&
    !hasActivePersonalLoan
  ) {
    candidates.push({
      productName: 'Personal Loan',
      productType: 'PERSONAL_LOAN',
      rankingScore: score.conversionScore + productFitBonus(5) + relationshipBonus + campaignBonus,
      reasons: [
        'Meets personal loan eligibility',
        `Conversion score ${score.conversionScore}`,
        ...score.reasons.slice(0, 3),
      ],
    });
  }

  const hasFd = customer.existingProducts.some((p) =>
    p.toLowerCase().includes('fixed deposit'),
  );
  const stableSalary = transactions.some(
    (t) =>
      t.customerId === customer.id &&
      (t.category?.toLowerCase().includes('salary') ||
        t.description?.toLowerCase().includes('salary')),
  );
  if (
    customer.avgMonthlyBalance >= rules.highBalanceThreshold &&
    !hasFd &&
    stableSalary
  ) {
    candidates.push({
      productName: 'Fixed Deposit',
      productType: 'FIXED_DEPOSIT',
      rankingScore: score.conversionScore + productFitBonus(8) + relationshipBonus,
      reasons: ['High average balance', 'Stable salary credits', 'No active fixed deposit'],
    });
  }

  const hasPremiumCard = customer.existingProducts.some((p) =>
    p.toLowerCase().includes('premium') && p.toLowerCase().includes('card'),
  );
  const goodRepayment = !loans.some(
    (l) => l.customerId === customer.id && (l.status === 'DEFAULTED' || l.status === 'OVERDUE'),
  );
  if (
    customer.creditScore >= rules.creditCardMinCredit &&
    goodRepayment &&
    !hasPremiumCard
  ) {
    candidates.push({
      productName: 'Premium Credit Card',
      productType: 'CREDIT_CARD',
      rankingScore: score.conversionScore + productFitBonus(6) + campaignBonus,
      reasons: ['Strong credit score', 'Good repayment history', 'No premium card held'],
    });
  }

  return candidates.sort((a, b) => b.rankingScore - a.rankingScore);
}

export function pickBestProduct(
  customer: Customer,
  score: CustomerScore,
  loans: Loan[],
  transactions: Transaction[],
  targetProductType: ProductType,
): ProductCandidate | null {
  const candidates = getEligibleProductCandidates(customer, score, loans, transactions);
  const matching = candidates.filter((c) => c.productType === targetProductType);
  return matching[0] ?? null;
}

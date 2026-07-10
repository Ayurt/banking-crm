import { getEligibleProductCandidates } from '../src/rules/product-matrix';
import type { Customer, CustomerScore, Loan } from '@banking-crm/shared-types';

const customer: Customer = {
  id: 'c1',
  customerCode: 'C001',
  name: 'Rahul',
  monthlyIncome: 150000,
  creditScore: 800,
  avgMonthlyBalance: 350000,
  relationshipYears: 6,
  preferredLanguage: 'en',
  riskProfile: 'LOW',
  existingProducts: ['Savings Account'],
};

const score: CustomerScore = {
  customerId: 'c1',
  productType: 'PERSONAL_LOAN',
  conversionScore: 92,
  riskScore: 20,
  relationshipScore: 15,
  valueScore: 90,
  reasons: ['Excellent credit'],
  confidence: 95,
  segment: 'Platinum',
  riskLevel: 'LOW',
  outreachPriority: 'Very High',
  eligible: true,
  scoreBreakdown: {
    income: 20,
    credit: 25,
    relationship: 15,
    transactions: 10,
    campaign: 7,
    crm: 5,
    existingProducts: 2,
  },
};

describe('Product recommendation matrix', () => {
  it('recommends premium personal loan for platinum customers', () => {
    const candidates = getEligibleProductCandidates(customer, score, [], []);
    expect(candidates.some((c) => c.productName === 'Premium Personal Loan')).toBe(true);
  });

  it('does not recommend personal loan when active loan exists', () => {
    const loans: Loan[] = [
      {
        id: 'l1',
        customerId: 'c1',
        productType: 'PERSONAL_LOAN',
        amount: 100000,
        interestRate: 10,
        tenureMonths: 24,
        status: 'ACTIVE',
        startDate: new Date(),
      },
    ];
    const candidates = getEligibleProductCandidates(customer, score, loans, []);
    expect(candidates.some((c) => c.productType === 'PERSONAL_LOAN')).toBe(false);
  });
});

import { ScoringEngine } from '../src/scoring.engine';
import type { Customer, Transaction, CrmNote, Loan } from '@banking-crm/shared-types';

describe('ScoringEngine', () => {
  const engine = new ScoringEngine();

  const baseCustomer: Customer = {
    id: '1',
    customerCode: 'C001',
    name: 'Rahul Sharma',
    monthlyIncome: 150000,
    creditScore: 790,
    avgMonthlyBalance: 300000,
    relationshipYears: 6,
    preferredLanguage: 'en',
    riskProfile: 'LOW',
    existingProducts: ['Savings Account', 'Salary Account'],
  };

  it('should score high-value customer with segment and breakdown', () => {
    const score = engine.scoreCustomer(
      baseCustomer,
      'PERSONAL_LOAN',
      Array.from({ length: 8 }, (_, i) => ({
        id: `t${i}`,
        customerId: '1',
        type: 'CREDIT',
        amount: 10000,
        txnDate: new Date(),
      })),
      [{ id: '1', customerId: '1', note: 'Inquired about personal loan', category: 'POSITIVE', createdAt: new Date() }],
      [],
    );

    expect(score).not.toBeNull();
    expect(score!.conversionScore).toBeGreaterThanOrEqual(60);
    expect(score!.segment).toBeDefined();
    expect(score!.scoreBreakdown.income).toBe(20);
    expect(score!.eligible).toBe(true);
  });

  it('should filter low-score customers in batch', () => {
    const lowCustomer: Customer = {
      ...baseCustomer,
      id: '2',
      customerCode: 'C002',
      monthlyIncome: 25000,
      creditScore: 550,
      relationshipYears: 0.5,
    };

    const scores = engine.scoreBatch(
      [baseCustomer, lowCustomer],
      'PERSONAL_LOAN',
      [] as Transaction[],
      [] as CrmNote[],
      [] as Loan[],
      60,
    );

    expect(scores.every((s) => s.conversionScore >= 60)).toBe(true);
    expect(scores[0].customerId).toBe('1');
  });
});

import {
  scoreIncome,
  scoreCredit,
  scoreRelationship,
  scoreTransactionActivity,
  scoreCampaignEngagement,
  scoreCrmSentiment,
  scoreExistingProducts,
  calculateConversionScore,
} from './conversion';
import { validateCustomerData, deriveAge } from './validation';
import { checkPersonalLoanEligibility } from './eligibility';
import { getCustomerSegment, getOutreachPriority } from './segmentation';
import { classifyRisk } from './risk';
import { calculateConfidence } from './confidence';
import type { Customer, Transaction, CrmNote, Loan } from '@banking-crm/shared-types';

const baseCustomer: Customer = {
  id: 'c1',
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

describe('Conversion scoring rules', () => {
  it('scores income at boundary values', () => {
    expect(scoreIncome(25000)).toBe(0);
    expect(scoreIncome(30000)).toBe(8);
    expect(scoreIncome(50000)).toBe(15);
    expect(scoreIncome(100000)).toBe(20);
  });

  it('scores credit at boundary values', () => {
    expect(scoreCredit(649)).toBe(0);
    expect(scoreCredit(700)).toBe(18);
    expect(scoreCredit(800)).toBe(25);
  });

  it('scores relationship duration', () => {
    expect(scoreRelationship(0.5)).toBe(0);
    expect(scoreRelationship(2)).toBe(8);
    expect(scoreRelationship(6)).toBe(15);
  });

  it('calculates max conversion score of 100', () => {
    const txns: Transaction[] = Array.from({ length: 10 }, (_, i) => ({
      id: `t${i}`,
      customerId: 'c1',
      type: 'CREDIT',
      amount: 5000,
      txnDate: new Date(),
    }));
    const { total } = calculateConversionScore(baseCustomer, txns, [], []);
    expect(total).toBeLessThanOrEqual(100);
    expect(total).toBeGreaterThan(70);
  });
});

describe('Validation rules', () => {
  it('rejects missing income', () => {
    expect(validateCustomerData({ ...baseCustomer, monthlyIncome: 0 }).valid).toBe(false);
  });

  it('rejects blacklisted customers', () => {
    expect(validateCustomerData({ ...baseCustomer, isBlacklisted: true }).valid).toBe(false);
  });
});

describe('Eligibility rules', () => {
  it('marks high-value customer eligible for personal loan', () => {
    const result = checkPersonalLoanEligibility(baseCustomer, [], 'PERSONAL_LOAN');
    expect(result.eligible).toBe(true);
  });

  it('fails eligibility for low income', () => {
    const result = checkPersonalLoanEligibility(
      { ...baseCustomer, monthlyIncome: 20000 },
      [],
      'PERSONAL_LOAN',
    );
    expect(result.eligible).toBe(false);
    expect(result.failures.some((f) => f.includes('Income'))).toBe(true);
  });

  it('fails when active personal loan exists', () => {
    const loans: Loan[] = [
      {
        id: 'l1',
        customerId: 'c1',
        productType: 'PERSONAL_LOAN',
        amount: 500000,
        interestRate: 10,
        tenureMonths: 36,
        status: 'ACTIVE',
        startDate: new Date(),
      },
    ];
    const result = checkPersonalLoanEligibility(baseCustomer, loans, 'PERSONAL_LOAN');
    expect(result.eligible).toBe(false);
  });
});

describe('Segmentation rules', () => {
  it('assigns Platinum segment for score >= 90', () => {
    expect(getCustomerSegment(92)).toBe('Platinum');
    expect(getOutreachPriority('Platinum')).toBe('Very High');
  });

  it('assigns Low Priority for score < 40', () => {
    expect(getCustomerSegment(35)).toBe('Low Priority');
    expect(getOutreachPriority('Low Priority')).toBe('Ignore');
  });
});

describe('Risk classification', () => {
  it('classifies credit score thresholds', () => {
    expect(classifyRisk(800)).toBe('LOW');
    expect(classifyRisk(750)).toBe('MEDIUM');
    expect(classifyRisk(650)).toBe('HIGH');
  });
});

describe('Confidence calculation', () => {
  it('starts at base 70% and adds bonuses', () => {
    const confidence = calculateConfidence(
      { ...baseCustomer, email: 'a@b.com', phone: '999', occupation: 'Engineer' },
      [{ id: 't1', customerId: 'c1', type: 'CREDIT', amount: 1000, txnDate: new Date() }],
      [{ id: 'n1', customerId: 'c1', note: 'Positive', category: 'POSITIVE', createdAt: new Date() }],
      [{ id: 'camp1', customerId: 'c1', campaignName: 'Loan', channel: 'EMAIL', opened: true, clicked: false, converted: false }],
    );
    expect(confidence).toBeGreaterThanOrEqual(85);
    expect(confidence).toBeLessThanOrEqual(100);
  });

  it('does not increase confidence for negative CRM', () => {
    const confidence = calculateConfidence(
      baseCustomer,
      [],
      [{ id: 'n1', customerId: 'c1', note: 'Unhappy', category: 'NEGATIVE', createdAt: new Date() }],
      [],
    );
    expect(confidence).toBeLessThanOrEqual(70);
  });
});

describe('deriveAge', () => {
  it('returns deterministic age from customer code', () => {
    const age = deriveAge(baseCustomer);
    expect(age).toBeGreaterThanOrEqual(21);
    expect(age).toBeLessThanOrEqual(60);
  });
});

import type { Customer, CustomerScore } from '@banking-crm/shared-types';
import { ScoringTool } from '../scoring/scoring.tool';

const customer: Customer = {
  id: 'c1',
  customerCode: 'C001',
  name: 'Rahul',
  monthlyIncome: 150000,
  creditScore: 800,
  avgMonthlyBalance: 350000,
  relationshipYears: 7,
  preferredLanguage: 'en',
  riskProfile: 'LOW',
  existingProducts: ['Savings'],
};

describe('ScoringTool', () => {
  it('returns deterministic scores without LLM', async () => {
    const tool = new ScoringTool();
    const result = await tool.execute({
      customers: [customer],
      productType: 'PERSONAL_LOAN',
      transactions: [],
      crmNotes: [],
      loanHistory: [],
    });

    expect(result.scores.length).toBeGreaterThan(0);
    expect(result.scores[0].conversionScore).toBeGreaterThanOrEqual(55);
    expect(result.scores[0].riskScore).toBeDefined();
  });
});

describe('FeatureFlagTool', () => {
  it('returns all feature flags', async () => {
    const { FeatureFlagTool } = await import('../feature-flag/feature-flag.tool');
    const tool = new FeatureFlagTool();
    const result = await tool.execute({});
    expect(result.flags.ENABLE_MEMORY).toBeDefined();
    expect(result.flags.ENABLE_STREAMING).toBeDefined();
  });
});

describe('EligibilityTool', () => {
  it('filters scores by product rules', async () => {
    const { EligibilityTool } = await import('../eligibility/eligibility.tool');
    const productRepo = {
      findByType: jest.fn().mockResolvedValue({
        id: 'p1',
        name: 'Personal Loan',
        type: 'PERSONAL_LOAN',
        minIncome: 50000,
        minCreditScore: 650,
        minRelationship: 1,
      }),
      findAll: jest.fn(),
    };

    const scores: CustomerScore[] = [
      {
        customerId: 'c1',
        productType: 'PERSONAL_LOAN',
        conversionScore: 85,
        riskScore: 20,
        relationshipScore: 80,
        valueScore: 90,
        reasons: ['High income'],
        confidence: 90,
        segment: 'Gold',
        riskLevel: 'LOW',
        outreachPriority: 'High',
        eligible: true,
        scoreBreakdown: {
          income: 20,
          credit: 22,
          relationship: 15,
          transactions: 10,
          campaign: 0,
          crm: 3,
          existingProducts: 2,
        },
      },
    ];

    const tool = new EligibilityTool(productRepo);
    const result = await tool.execute({
      customers: [customer],
      scores,
      productType: 'PERSONAL_LOAN',
    });

    expect(result.eligibleScores).toHaveLength(1);
    expect(result.eligibleCustomerIds).toContain('c1');
  });
});

import {
  parseIndianAmount,
  parseQueryFilters,
  canAffordLoanAmount,
} from './query-filters';

describe('parseIndianAmount', () => {
  it('parses lakh amounts', () => {
    expect(parseIndianAmount('at least 5 lakh')).toBe(500_000);
    expect(parseIndianAmount('minimum 5L loan')).toBe(500_000);
  });

  it('parses crore amounts', () => {
    expect(parseIndianAmount('1 crore home loan')).toBe(10_000_000);
  });
});

describe('parseQueryFilters', () => {
  it('extracts min loan amount and message constraints', () => {
    const filters = parseQueryFilters(
      'Find customers who can take loan of atleast 5 lakh and prepare a whatsapp message draft for them and also mention in draft message that its min 5 lakh loan',
    );
    expect(filters.minLoanAmount).toBe(500_000);
    expect(filters.minIncome).toBe(25_000);
    expect(filters.messageConstraints?.[0]).toContain('5,00,000');
  });
});

describe('canAffordLoanAmount', () => {
  it('uses income × 20 heuristic', () => {
    expect(canAffordLoanAmount(30_000, 500_000)).toBe(true);
    expect(canAffordLoanAmount(20_000, 500_000)).toBe(false);
  });
});

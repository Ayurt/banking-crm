import type { QueryFilters } from '@banking-crm/shared-types';

/**
 * Parse Indian-currency phrases from an RM query into INR numbers.
 * Examples: "5 lakh", "5L", "₹5,00,000", "10 crore", "at least 500000"
 */
export function parseIndianAmount(text: string): number | undefined {
  const q = text.toLowerCase().replace(/,/g, '');

  const crore = q.match(/(\d+(?:\.\d+)?)\s*(?:crore|cr)\b/);
  if (crore) return Math.round(parseFloat(crore[1]) * 10_000_000);

  const lakh = q.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|lacs|lakhs|l)\b/);
  if (lakh) return Math.round(parseFloat(lakh[1]) * 100_000);

  const rupees = q.match(/(?:₹|rs\.?\s*|inr\s*)(\d+(?:\.\d+)?)\b/);
  if (rupees) {
    const n = parseFloat(rupees[1]);
    if (n >= 10_000) return Math.round(n);
  }

  const bare = q.match(
    /(?:at\s*least|minimum|min(?:imum)?|above|over|>=?|of)\s+(\d{5,})\b/,
  );
  if (bare) return Math.round(parseFloat(bare[1]));

  return undefined;
}

function extractCity(query: string): string | undefined {
  const m = query.match(/\b(?:in|from|based\s+in)\s+([A-Za-z][A-Za-z\s]{2,20})(?:\s|,|\.|$)/i);
  if (!m) return undefined;
  const city = m[1].trim();
  const skip = new Set(['the', 'a', 'an', 'our', 'this', 'that', 'high', 'loan', 'personal']);
  if (skip.has(city.toLowerCase())) return undefined;
  return city;
}

function extractMinIncome(query: string): number | undefined {
  const q = query.toLowerCase();
  if (!/(?:income|salary|earn)/.test(q)) return undefined;
  return parseIndianAmount(query);
}

/**
 * Rule-based extraction of query constraints so custom RM queries work
 * even when the LLM planner is unavailable or incomplete.
 */
export function parseQueryFilters(query: string): QueryFilters {
  const q = query.toLowerCase();
  const filters: QueryFilters = {};
  const messageConstraints: string[] = [];

  const amount = parseIndianAmount(query);
  const isLoanAmount =
    amount != null &&
    (/(?:loan|lending|borrow|emi|disburs)/.test(q) ||
      /(?:at\s*least|minimum|min)\s+\d/.test(q) ||
      /\d+(?:\.\d+)?\s*(?:lakh|lac|lakhs|l)\b/.test(q));

  if (amount != null && isLoanAmount) {
    filters.minLoanAmount = amount;
    const formatted = `₹${amount.toLocaleString('en-IN')}`;
    messageConstraints.push(
      `Explicitly mention that this is a minimum ${formatted} loan (at least ${formatted}).`,
    );
  }

  const income = extractMinIncome(query);
  if (income != null && !filters.minLoanAmount) {
    filters.minIncome = income;
  } else if (filters.minLoanAmount) {
    // Affordability heuristic: monthly income should support ~1/20 of loan size
    filters.minIncome = Math.max(filters.minIncome ?? 0, Math.ceil(filters.minLoanAmount / 20));
  }

  const credit = q.match(/credit\s*score\s*(?:of\s*|above\s*|at\s*least\s*|>=?\s*)(\d{3})/);
  if (credit) filters.minCreditScore = parseInt(credit[1], 10);

  const city = extractCity(query);
  if (city) filters.city = city;

  if (messageConstraints.length) {
    filters.messageConstraints = messageConstraints;
  }

  return filters;
}

export function mergeQueryFilters(
  base: QueryFilters = {},
  override: QueryFilters = {},
): QueryFilters {
  return {
    ...base,
    ...Object.fromEntries(
      Object.entries(override).filter(([, v]) => v !== undefined && v !== null && v !== ''),
    ),
    messageConstraints: [
      ...(base.messageConstraints ?? []),
      ...(override.messageConstraints ?? []),
    ].filter((v, i, arr) => arr.indexOf(v) === i),
  };
}

export function formatLoanAmountInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

/** Simple affordability: can support loan if monthly income * 20 >= amount. */
export function canAffordLoanAmount(monthlyIncome: number, minLoanAmount: number): boolean {
  return monthlyIncome * 20 >= minLoanAmount;
}

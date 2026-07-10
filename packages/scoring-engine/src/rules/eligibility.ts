import type { Customer, Loan, ProductType, QueryFilters } from '@banking-crm/shared-types';
import { getBusinessRules } from './config';
import { deriveAge } from './validation';

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
  failures: string[];
}

export interface EligibilityOptions {
  filters?: QueryFilters;
}

function countMissedEmi(loans: Loan[], customerId: string): number {
  return loans.filter(
    (l) =>
      l.customerId === customerId &&
      (l.status === 'DEFAULTED' || l.status === 'OVERDUE'),
  ).length;
}

function hasActivePersonalLoan(loans: Loan[], customerId: string): boolean {
  return loans.some(
    (l) =>
      l.customerId === customerId &&
      l.productType === 'PERSONAL_LOAN' &&
      l.status === 'ACTIVE',
  );
}

/** Affordability heuristic: monthly income × 20 should cover the requested loan. */
function canSupportLoanAmount(monthlyIncome: number, minLoanAmount: number): boolean {
  return monthlyIncome * 20 >= minLoanAmount;
}

export function checkPersonalLoanEligibility(
  customer: Customer,
  loans: Loan[],
  productType: ProductType = 'PERSONAL_LOAN',
  options: EligibilityOptions = {},
): EligibilityResult {
  const rules = getBusinessRules();
  const failures: string[] = [];
  const reasons: string[] = [];
  const filters = options.filters ?? {};

  if (productType !== 'PERSONAL_LOAN' && productType !== 'HOME_LOAN') {
    if (filters.minIncome && customer.monthlyIncome < filters.minIncome) {
      return {
        eligible: false,
        reasons: [],
        failures: [`Income below query minimum ₹${filters.minIncome.toLocaleString('en-IN')}`],
      };
    }
    if (filters.city && customer.city && customer.city.toLowerCase() !== filters.city.toLowerCase()) {
      return {
        eligible: false,
        reasons: [],
        failures: [`City does not match ${filters.city}`],
      };
    }
    return { eligible: true, reasons: ['Product-specific eligibility deferred'], failures: [] };
  }

  const age = deriveAge(customer);
  if (age < rules.minAge || age > rules.maxAge) {
    failures.push(`Age ${age} outside ${rules.minAge}–${rules.maxAge} range`);
  } else {
    reasons.push(`Age ${age} within eligible range`);
  }

  const incomeFloor = Math.max(
    rules.minimumPersonalLoanIncome,
    filters.minIncome ?? 0,
  );
  if (customer.monthlyIncome < incomeFloor) {
    failures.push(`Income below ₹${incomeFloor.toLocaleString('en-IN')}`);
  } else {
    reasons.push('Income meets minimum threshold');
  }

  const creditFloor = Math.max(rules.minimumCreditScore, filters.minCreditScore ?? 0);
  if (customer.creditScore < creditFloor) {
    failures.push(`Credit score below ${creditFloor}`);
  } else {
    reasons.push(`Credit score ${customer.creditScore} meets minimum`);
  }

  if (hasActivePersonalLoan(loans, customer.id)) {
    failures.push('Existing active personal loan');
  } else {
    reasons.push('No active personal loan');
  }

  const missedEmi = countMissedEmi(loans, customer.id);
  if (missedEmi > rules.maximumMissedPayments) {
    failures.push(`Missed EMI (${missedEmi}) exceeds limit`);
  } else {
    reasons.push('Acceptable EMI history');
  }

  if (customer.relationshipYears < rules.minimumRelationshipYears) {
    failures.push(`Relationship duration below ${rules.minimumRelationshipYears} year(s)`);
  } else {
    reasons.push('Sufficient banking relationship');
  }

  if (filters.minLoanAmount) {
    if (!canSupportLoanAmount(customer.monthlyIncome, filters.minLoanAmount)) {
      failures.push(
        `Income insufficient for ₹${filters.minLoanAmount.toLocaleString('en-IN')} loan`,
      );
    } else {
      reasons.push(
        `Can support loan of at least ₹${filters.minLoanAmount.toLocaleString('en-IN')}`,
      );
    }
  }

  if (filters.city && customer.city) {
    if (customer.city.toLowerCase() !== filters.city.toLowerCase()) {
      failures.push(`City does not match ${filters.city}`);
    } else {
      reasons.push(`Located in ${customer.city}`);
    }
  }

  return {
    eligible: failures.length === 0,
    reasons,
    failures,
  };
}

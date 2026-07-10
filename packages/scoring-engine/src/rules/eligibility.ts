import type { Customer, Loan, ProductType } from '@banking-crm/shared-types';
import { getBusinessRules } from './config';
import { deriveAge } from './validation';

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
  failures: string[];
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

export function checkPersonalLoanEligibility(
  customer: Customer,
  loans: Loan[],
  productType: ProductType = 'PERSONAL_LOAN',
): EligibilityResult {
  const rules = getBusinessRules();
  const failures: string[] = [];
  const reasons: string[] = [];

  if (productType !== 'PERSONAL_LOAN') {
    return { eligible: true, reasons: ['Product-specific eligibility deferred'], failures: [] };
  }

  const age = deriveAge(customer);
  if (age < rules.minAge || age > rules.maxAge) {
    failures.push(`Age ${age} outside ${rules.minAge}–${rules.maxAge} range`);
  } else {
    reasons.push(`Age ${age} within eligible range`);
  }

  if (customer.monthlyIncome < rules.minimumPersonalLoanIncome) {
    failures.push(`Income below ₹${rules.minimumPersonalLoanIncome.toLocaleString('en-IN')}`);
  } else {
    reasons.push('Income meets minimum threshold');
  }

  if (customer.creditScore < rules.minimumCreditScore) {
    failures.push(`Credit score below ${rules.minimumCreditScore}`);
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

  return {
    eligible: failures.length === 0,
    reasons,
    failures,
  };
}

import type { Customer } from '@banking-crm/shared-types';
import { getBusinessRules } from './config';

export interface ValidationResult {
  valid: boolean;
  rejectReason?: string;
}

export function deriveAge(customer: Customer): number {
  if (customer.age !== undefined) return customer.age;
  const hash = customer.customerCode
    .split('')
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return getBusinessRules().minAge + (hash % (getBusinessRules().maxAge - getBusinessRules().minAge + 1));
}

export function validateCustomerData(customer: Customer): ValidationResult {
  if (!customer.id?.trim()) {
    return { valid: false, rejectReason: 'Missing customer ID' };
  }
  if (!customer.monthlyIncome || customer.monthlyIncome <= 0) {
    return { valid: false, rejectReason: 'Missing monthly income' };
  }
  if (!customer.creditScore || customer.creditScore <= 0) {
    return { valid: false, rejectReason: 'Missing credit score' };
  }
  if (customer.accountStatus === 'CLOSED') {
    return { valid: false, rejectReason: 'Closed account' };
  }
  if (customer.isBlacklisted) {
    return { valid: false, rejectReason: 'Blacklisted customer' };
  }
  if (customer.isDeceased) {
    return { valid: false, rejectReason: 'Deceased customer' };
  }
  return { valid: true };
}

import type { ProductType } from '@banking-crm/shared-types';

export function detectProductType(query: string): ProductType {
  const q = query.toLowerCase();
  if (q.includes('credit card')) return 'CREDIT_CARD';
  if (q.includes('fixed deposit') || q.includes('fd')) return 'FIXED_DEPOSIT';
  if (q.includes('home loan') || q.includes('mortgage')) return 'HOME_LOAN';
  if (q.includes('insurance')) return 'INSURANCE';
  return 'PERSONAL_LOAN';
}

export function resolveWorkflow(productType: ProductType): string {
  const map: Record<ProductType, string> = {
    PERSONAL_LOAN: 'loan-recommendation',
    CREDIT_CARD: 'credit-card',
    FIXED_DEPOSIT: 'fixed-deposit',
    HOME_LOAN: 'home-loan',
    INSURANCE: 'insurance',
  };
  return map[productType];
}

export const DEFAULT_EXECUTION_PLAN = [
  'retrieve_customers',
  'retrieve_transactions',
  'retrieve_crm_notes',
  'retrieve_loans',
  'retrieve_campaigns',
  'load_memory',
  'calculate_scores',
  'recommend_products',
  'generate_messages',
  'save_audit',
];

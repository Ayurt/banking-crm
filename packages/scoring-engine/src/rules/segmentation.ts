import type { CustomerSegment, OutreachPriority } from '@banking-crm/shared-types';

export function getCustomerSegment(conversionScore: number): CustomerSegment {
  if (conversionScore >= 90) return 'Platinum';
  if (conversionScore >= 75) return 'Gold';
  if (conversionScore >= 60) return 'Silver';
  if (conversionScore >= 40) return 'Bronze';
  return 'Low Priority';
}

export function getOutreachPriority(segment: CustomerSegment): OutreachPriority {
  const map: Record<CustomerSegment, OutreachPriority> = {
    Platinum: 'Very High',
    Gold: 'High',
    Silver: 'Medium',
    Bronze: 'Low',
    'Low Priority': 'Ignore',
  };
  return map[segment];
}

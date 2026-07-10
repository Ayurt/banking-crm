export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export function classifyRisk(creditScore: number): RiskLevel {
  if (creditScore >= 780) return 'LOW';
  if (creditScore >= 700) return 'MEDIUM';
  return 'HIGH';
}

export function riskScoreFromLevel(level: RiskLevel): number {
  if (level === 'LOW') return 20;
  if (level === 'MEDIUM') return 50;
  return 80;
}

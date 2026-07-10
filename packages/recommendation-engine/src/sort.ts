export interface ConfidenceScored {
  confidence: number;
  conversionScore: number;
}

/** Higher confidence first, then higher conversion score. */
export function sortByConfidenceAndScore<T extends ConfidenceScored>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const confidenceDiff = b.confidence - a.confidence;
    if (confidenceDiff !== 0) return confidenceDiff;
    return b.conversionScore - a.conversionScore;
  });
}

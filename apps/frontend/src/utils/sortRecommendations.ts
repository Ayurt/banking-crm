export function sortByConfidenceAndScore<T extends { confidence: number; conversionScore: number }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    const confidenceDiff = b.confidence - a.confidence;
    if (confidenceDiff !== 0) return confidenceDiff;
    return b.conversionScore - a.conversionScore;
  });
}

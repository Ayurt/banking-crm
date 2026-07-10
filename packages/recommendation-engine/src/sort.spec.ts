import { sortByConfidenceAndScore } from '../src/sort';

describe('sortByConfidenceAndScore', () => {
  it('sorts by confidence descending, then conversion score', () => {
    const sorted = sortByConfidenceAndScore([
      { confidence: 80, conversionScore: 90 },
      { confidence: 95, conversionScore: 70 },
      { confidence: 95, conversionScore: 85 },
      { confidence: 70, conversionScore: 99 },
    ]);

    expect(sorted).toEqual([
      { confidence: 95, conversionScore: 85 },
      { confidence: 95, conversionScore: 70 },
      { confidence: 80, conversionScore: 90 },
      { confidence: 70, conversionScore: 99 },
    ]);
  });
});

import type {
  CampaignRecord,
  CrmNote,
  Customer,
  CustomerScore,
  Loan,
  Product,
  ProductType,
  Recommendation,
  Transaction,
} from '@banking-crm/shared-types';
import { getEligibleProductCandidates, pickBestProduct } from './rules/product-matrix';
import { sortByConfidenceAndScore } from './sort';

export interface IProductLookup {
  getProduct(type: ProductType): Promise<Product | null>;
}

export class RecommendationEngine {
  constructor(private readonly productLookup: IProductLookup) {}

  async recommend(
    customers: Customer[],
    scores: CustomerScore[],
    productType: ProductType,
    transactions: Transaction[],
    crmNotes: CrmNote[],
    loans: Loan[] = [],
    _campaigns: CampaignRecord[] = [],
  ): Promise<Recommendation[]> {
    const product = await this.productLookup.getProduct(productType);
    if (!product) {
      throw new Error(`Product not found: ${productType}`);
    }

    const recommendations: Recommendation[] = [];

    for (const score of scores) {
      const customer = customers.find((c) => c.id === score.customerId);
      if (!customer || !score.eligible) continue;

      const best = pickBestProduct(customer, score, loans, transactions, productType);
      if (!best) continue;

      const allCandidates = getEligibleProductCandidates(customer, score, loans, transactions);

      const evidence: string[] = [
        `Monthly income: ₹${customer.monthlyIncome.toLocaleString('en-IN')}`,
        `Credit score: ${customer.creditScore}`,
        `Relationship: ${customer.relationshipYears} years`,
        `Segment: ${score.segment}`,
        `Risk: ${score.riskLevel}`,
      ];

      const txnCount = transactions.filter((t) => t.customerId === customer.id).length;
      if (txnCount > 0) evidence.push(`${txnCount} recent transactions`);

      const notes = crmNotes.filter((n) => n.customerId === customer.id);
      if (notes.length > 0) evidence.push(`${notes.length} CRM notes on file`);

      recommendations.push({
        customerId: customer.id,
        customerName: customer.name,
        productType: best.productType,
        productName: best.productName,
        conversionScore: score.conversionScore,
        confidence: score.confidence,
        reasons: best.reasons,
        evidence,
        eligible: true,
        segment: score.segment,
        riskLevel: score.riskLevel,
        eligibleProducts: allCandidates.map((c) => c.productName),
        rankingScore: best.rankingScore,
      });
    }

    return sortByConfidenceAndScore(recommendations).slice(0, 20);
  }
}

export { RecommendationEngine as RecommendationTool };

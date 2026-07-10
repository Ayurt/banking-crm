export { RecommendationEngine, RecommendationTool, type IProductLookup } from './recommendation.engine';
export { sortByConfidenceAndScore } from './sort';
export {
  getEligibleProductCandidates,
  pickBestProduct,
  type ProductCandidate,
} from './rules/product-matrix';

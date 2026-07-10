# Business Rules Engine

Deterministic decision-making per `12-business-rules.md`. The LLM never makes financial decisions.

## Decision Flow

```text
Customer Data → Validation → Eligibility → Conversion Score → Risk → Segmentation
  → Product Ranking → Recommendation → LLM Personalization
```

## Packages

| Package | Responsibility |
|---------|----------------|
| `@banking-crm/scoring-engine` | Validation, eligibility, conversion scoring, segmentation, risk, confidence |
| `@banking-crm/recommendation-engine` | Product matrix, ranking, recommendations |

## Rule Modules (`scoring-engine/src/rules/`)

| Module | Rules |
|--------|-------|
| `validation.ts` | Reject missing ID/income/credit, closed/blacklisted/deceased |
| `eligibility.ts` | Personal loan: age 21–60, income ≥ ₹30k, credit ≥ 700, no active PL, EMI history |
| `conversion.ts` | Income (20) + Credit (25) + Relationship (15) + Transactions (15) + Campaign (10) + CRM (5) + Products (10) |
| `segmentation.ts` | Platinum/Gold/Silver/Bronze/Low Priority |
| `risk.ts` | LOW ≥780, MEDIUM 700–779, HIGH <700 |
| `confidence.ts` | Base 70% + up to 30% bonus for data completeness |

## Configuration

All thresholds in `@banking-crm/config` → `businessRules`:

```yaml
MIN_PERSONAL_LOAN_INCOME: 30000
MIN_CREDIT_SCORE: 700
PREMIUM_LOAN_INCOME: 100000
```

## Product Matrix (`recommendation-engine`)

| Product | Conditions |
|---------|------------|
| Premium Personal Loan | Income > ₹100k, credit ≥ 780, relationship ≥ 5y, score ≥ 90 |
| Personal Loan | Eligible, conversion ≥ 70 |
| Fixed Deposit | High balance, no FD, salary credits |
| Premium Credit Card | Credit ≥ 730, good repayment, no premium card |

## Testing

```bash
npm run test -w @banking-crm/scoring-engine
npm run test -w @banking-crm/recommendation-engine
```

Target: full coverage for rule boundary values.

## Explainability

Every `CustomerScore` includes `scoreBreakdown`, `segment`, `riskLevel`, `reasons`.

Every `Recommendation` includes `eligibleProducts`, `rankingScore`, `evidence`.

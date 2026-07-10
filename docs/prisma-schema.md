# Prisma Schema

Aligned with **07-schema-prisma-spec.md**.

## Enums

`UserRole`, `CustomerRiskProfile`, `TransactionType`, `LoanStatus`, `CampaignChannel`, `CampaignStatus`, `RecommendationStatus`, `MessageStatus`, `ConversationRole`, `AuditStatus`, `ProductCategory`

## Models (16 + AgentExecutionStep)

User, Customer, Product, CustomerProduct, Transaction, Loan, CrmNote, Campaign, ProductRecommendation, GeneratedMessage, Conversation, ConversationMessage, PromptVersion, AuditLog, FeatureFlag, AgentExecutionStep

## Key Design Choices

- UUID primary keys on all tables
- `createdAt` / `updatedAt` on business entities
- Soft delete (`deletedAt`) on User, Customer, Product, Campaign
- Named relations (e.g. `@relation("CustomerTransactions")`)
- Composite indexes on high-query paths

## Apply Schema

```bash
npm run db:push
npm run db:seed
```

## Migrations

```bash
npm run db:migrate
# Suggested names: init_schema, add_campaigns, add_prompt_versions
```

# Database Design

See project specification **04-database-design.md** for the full ER diagram and table definitions.

## Implemented Tables

All 16 tables from the specification are implemented in `prisma/schema.prisma`:

1. `roles` — RBAC roles (Admin, Relationship Manager, Supervisor)
2. `users` — System users with soft delete
3. `customers` — Master customer records with soft delete
4. `customer_products` — Junction table for existing banking products
5. `products` — Available banking products with eligibility rules
6. `transactions` — Transaction history with merchant and balance
7. `loans` — Loan history with EMI and missed payments
8. `crm_notes` — RM notes with sentiment and priority
9. `campaigns` — Per-customer campaign engagement history
10. `product_recommendations` — AI-generated recommendations with scores
11. `generated_messages` — AI messages linked to prompt versions
12. `conversations` — RM chat sessions (replaces agent sessions)
13. `conversation_messages` — Chat message history
14. `prompt_versions` — Versioned LLM prompts
15. `audit_logs` — Enterprise audit trail with requestId
16. `feature_flags` — Runtime feature toggles

## Agent Workflow Mapping

| Agent Concept | Database Table |
|---------------|----------------|
| Agent Session | `conversations` |
| Session Memory | `conversation_messages` |
| Execution Steps | `agent_execution_steps` |
| Scores | `product_recommendations` |
| Messages | `generated_messages` |
| Audit Trail | `audit_logs` |

## Running Migrations

```bash
npm run db:push      # Apply schema to database
npm run db:seed      # Generate seed data (~2-3 min)
```

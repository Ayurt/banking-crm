# Banking CRM Agentic AI

**Author:** Ayush Rawat  
**Version:** 1.0

An Agentic AI system that assists Relationship Managers (RMs) in identifying high-value customers, estimating conversion likelihood, recommending banking products, and generating personalized WhatsApp outreach — with full explainability and human-in-the-loop approval.

---

## Architecture

```mermaid
flowchart TD
    RM[Relationship Manager] --> UI[React Dashboard]
    UI --> API[NestJS Backend]
    API --> Orchestrator[Agent Orchestrator]
    Orchestrator --> LG[LangGraph Workflow]
    LG --> Planner[Planner Agent]
    LG --> Retrieval[Customer Retrieval]
    LG --> Scoring[Scoring Agent]
    LG --> Rec[Recommendation Agent]
    LG --> Msg[Messaging Agent]
    LG --> Audit[Audit Agent]
    Retrieval --> Tools[Tool Layer]
    Tools --> Postgres[(PostgreSQL)]
    Msg --> OpenAI[OpenAI API]
    Orchestrator --> Redis[(Redis)]
    API --> Chroma[(ChromaDB)]
```

## Execution Flow

1. **RM submits natural language query** via React dashboard
2. **Planner Agent** parses intent and product type (personal loan, credit card, etc.)
3. **Customer Retrieval Agent** calls tools to fetch customers, transactions, CRM notes, loans
4. **Scoring Agent** applies deterministic business rules (0–100 conversion score)
5. **Recommendation Agent** checks product eligibility and ranks customers
6. **Messaging Agent** generates personalized WhatsApp messages via OpenAI
7. **Audit Agent** logs all steps, prompt versions, and timing
8. **RM reviews and approves** messages before any outreach

## Project Structure

```
banking-crm/
├── apps/
│   ├── backend/          # NestJS REST API
│   └── frontend/         # React + Vite dashboard
├── packages/
│   ├── agents/           # LangGraph workflow
│   ├── tools/              # Customer, CRM, Scoring, Product tools
│   ├── prompts/            # Versioned LLM prompts
│   ├── types/              # Shared TypeScript types
│   └── config/             # Environment config & feature flags
├── prisma/                 # Schema, migrations, seed data
├── docker/                 # Dockerfiles
└── docker-compose.yml
```

## Tool Design

| Tool | Purpose | Data Source |
|------|---------|-------------|
| `CustomerTool` | Retrieve high-value candidates | PostgreSQL |
| `TransactionTool` | Fetch recent transactions | PostgreSQL |
| `CrmTool` | Retrieve CRM notes | PostgreSQL |
| `LoanTool` | Fetch loan history | PostgreSQL |
| `ProductTool` | Get product eligibility rules | PostgreSQL |
| `ScoringTool` | Deterministic conversion scoring | Business rules |
| `RecommendationTool` | Product matching & eligibility | Rules engine |

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| LangGraph for orchestration | State management, conditional flows, extensibility |
| Deterministic scoring | Explainable, testable, no LLM hallucination on numbers |
| LLM only for planning & messaging | Separation of reasoning vs. business logic |
| Monorepo with shared packages | Type safety across backend, agents, frontend |
| Human approval workflow | Prevents accidental customer outreach |
| NestJS DI throughout | Enterprise patterns, testability |

## Trade-offs & Limitations

- **ChromaDB** is configured but semantic search is a future enhancement; session memory uses PostgreSQL
- **SSE streaming** endpoint is available; frontend currently uses synchronous query for simplicity
- **Scoring rules** are heuristic-based, not ML-trained models
- **No actual WhatsApp sending** — messages are generated for RM approval only
- **Seed data** includes 50 customers; production scale (100K+) requires indexing optimization

---

## Prerequisites

- Node.js 22+
- Docker & Docker Compose
- OpenAI API key (optional — fallback messages work without it)

## Quick Start

### 1. Clone and configure

```bash
cp .env.example .env
# Edit .env and set OPENAI_API_KEY (optional)
```

### 2. Start infrastructure

```bash
docker compose up postgres redis chroma -d
```

### 3. Install dependencies

```bash
npm install
```

### 4. Setup database

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 5. Run development servers

```bash
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000/api/v1
- **Swagger Docs:** http://localhost:3000/api/docs

### 6. Login

```
Email: rm@bank.com
Password: password123
```

## Docker (Full Stack)

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | JWT authentication |
| POST | `/api/v1/agents/query` | Run agent workflow |
| GET | `/api/v1/agents/sessions` | List agent sessions |
| GET | `/api/v1/messages/pending` | Messages awaiting approval |
| PATCH | `/api/v1/messages/:id` | Approve/reject/edit message |
| GET | `/api/v1/analytics/summary` | Dashboard analytics |
| GET | `/api/v1/customers` | List customers |
| GET | `/api/v1/health` | Health check |

## Database Schema

The database follows the specification in `docs/04-database-design.md` with 16 tables:

| Category | Tables |
|----------|--------|
| Core Banking | `roles`, `users`, `customers`, `customer_products`, `products`, `transactions`, `loans`, `crm_notes`, `campaigns` |
| AI & Recommendations | `product_recommendations`, `generated_messages`, `conversations`, `conversation_messages`, `prompt_versions`, `audit_logs`, `feature_flags` |

Key design choices:
- **UUID primary keys** on all tables
- **Soft deletes** (`deletedAt`) on users, customers, products, campaigns
- **Normalized schema** with foreign key constraints
- **Indexes** on customerId, creditScore, transactionDate, requestId

### Seed Data Volumes

| Entity | Count |
|--------|-------|
| Customers | 1,000 |
| Transactions | ~5,000 |
| CRM Notes | 5,000 |
| Loans | 1,500 |
| Campaigns | 4,000 |
| Recommendations | 1,000 |
| Generated Messages | 1,000 |
| Audit Logs | 10,000 |
| Prompt Versions | 6 |
| Feature Flags | 5 |

---

1. **Personal Loan Discovery** — "Find high-value customers likely to convert for a personal loan and generate WhatsApp messages"
2. **Credit Card Upsell** — "Identify customers eligible for premium credit cards"
3. **Fixed Deposit Campaign** — "Find customers suitable for fixed deposits with high balance"

## Environment Variables

See `.env.example` for all configuration options including feature flags:

- `ENABLE_MEMORY` — Session conversation memory
- `ENABLE_STREAMING` — SSE progress updates
- `ENABLE_AUDIT` — Audit trail logging
- `ENABLE_CACHE` — Redis caching

## Testing

```bash
npm run test -w @banking-crm/backend
```

## License

MIT

# Project Structure

See `05-project-structure.md` for the full specification.

## Monorepo Layout

```
banking-crm/
├── apps/
│   ├── backend/          # NestJS API
│   └── frontend/         # React + Vite dashboard
├── packages/
│   ├── shared-types/     # Shared DTOs, interfaces, enums
│   ├── prompts/          # Versioned LLM prompts
│   ├── agent-core/       # LangGraph workflows & agent state
│   ├── scoring-engine/   # Deterministic scoring (no LLM)
│   └── recommendation-engine/  # Product matching
├── prisma/
├── scripts/
├── docker/
├── docs/
└── .cursor/
```

## Backend Layers

```
Controller → Service → Agent Orchestrator → Agents → Tools → Repository → Prisma
```

## Key Module Paths

| Module | Path |
|--------|------|
| Customers | `apps/backend/src/modules/customers/` |
| Conversations | `apps/backend/src/modules/conversations/` |
| Messaging | `apps/backend/src/modules/messaging/` |
| Agent Orchestrator | `apps/backend/src/agents/orchestrator/` |
| Tools | `apps/backend/src/tools/` |

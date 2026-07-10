# Architecture Reference

See also: `docs/project-structure.md`, `docs/database-design.md`, and `.cursor/rules.md`.

## Dependency Chain

```
Controller → Service → Agent Orchestrator → Agent → Tool → Repository → Prisma
```

## Package Map

| Package | Responsibility |
|---------|----------------|
| `shared-types` | DTOs, interfaces, enums shared across apps |
| `prompts` | Versioned LLM prompts (never inline) |
| `agent-core` | LangGraph workflows, shared AgentState |
| `scoring-engine` | Deterministic conversion scoring (no LLM) |
| `recommendation-engine` | Product eligibility & matching (no LLM) |

## Agent Workflow

```
Planner → Customer Retrieval → Scoring → Recommendation → Messaging → Audit
```

## LLM vs Deterministic

| LLM | Deterministic |
|-----|---------------|
| Planning | Scoring |
| Reasoning | Eligibility |
| Summarization | SQL / Prisma queries |
| Message generation | Product rules |

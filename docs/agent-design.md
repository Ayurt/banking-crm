# Agent Design

Multi-agent LangGraph workflow for Banking CRM tasks. See `08-agent-design.md` for the full specification.

## Architecture

```
RM Query → Planner → Intelligence (Memory ∥ Retrieval) → Scoring → Recommendation → Messaging → Audit
```

Agents communicate only through shared `AgentState` — never directly.

## Agents

| Agent | LLM | Responsibility |
|-------|-----|----------------|
| Planner | Yes | Intent, workflow, execution plan |
| Memory | No | Load prior RM conversations |
| Retrieval | No | Customer profiles, txns, loans, CRM, campaigns |
| Scoring | No | Deterministic conversion scores |
| Recommendation | No | Eligibility rules + product ranking |
| Messaging | Yes | Personalized WhatsApp drafts |
| Audit | Summary only | Audit trail + RM summary |

## Package Layout

```
packages/agent-core/src/
├── agents/           # One file per agent
├── workflows/        # LangGraph orchestration
├── state/            # AgentState factory
├── interfaces/       # Tool contracts
└── utils/            # Retry, steps, LLM helpers
```

## Workflow

`createBankingAgentWorkflow(deps)` in `@banking-crm/agent-core` compiles the LangGraph graph.

Backend wiring: `apps/backend/src/agents/orchestrator/agent-orchestrator.service.ts`

## Tools (Backend)

| Tool | Used By |
|------|---------|
| CustomerTool | Retrieval |
| TransactionTool | Retrieval |
| CrmTool | Retrieval |
| LoanTool | Retrieval |
| CampaignTool | Retrieval |
| MemoryTool | Memory |
| ProductTool | Recommendation |
| AuditTool | Audit |

## Testing

```bash
npm run test -w @banking-crm/agent-core
```

Each agent is independently unit-testable with mocked tool dependencies.

## Extension

Add a new agent by:

1. Create `packages/agent-core/src/agents/<name>.agent.ts`
2. Register node in `workflows/banking.workflow.ts`
3. Add backend tool if needed
4. Export from `packages/agent-core/src/index.ts`

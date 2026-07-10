# LangGraph Workflow

Production orchestration for the Banking CRM agent pipeline per `09-langgraph-workflow.md`.

## Graph

```text
START → Initialize → Memory → Planner → Retrieve Customers
      → Parallel Retrieval (CRM ∥ Loans ∥ Transactions ∥ Campaigns)
      → Scoring → Eligibility → Recommendation → Messaging
      → Human Approval → Audit → Response Builder → END
```

## Node Responsibilities

| Node | Timeout | LLM | Notes |
|------|---------|-----|-------|
| Initialize | — | No | Request/execution IDs, feature flags |
| Memory | 3s | No | Skipped when `ENABLE_MEMORY=false` |
| Planner | 5s | Yes | Intent, workflow, execution plan |
| Retrieve Customers | 3s | No | Product-filtered customer list |
| Parallel Retrieval | 3s | No | CRM, loans, transactions, campaigns |
| Scoring | 2s | No | Deterministic conversion scores |
| Eligibility | 2s | No | Product rule filtering |
| Recommendation | 2s | No | Ranked product matches |
| Messaging | 15s | Yes | WhatsApp drafts |
| Human Approval | — | No | DRAFT messages for RM review |
| Audit | 3s | Summary | Skipped when `ENABLE_AUDIT=false` |
| Response Builder | 2s | No | Final JSON + execution metadata |

## Retry Policy

All tool calls use exponential backoff with **max 3 attempts** (`utils/retry.ts`).

CRM failures degrade gracefully — workflow continues with reduced confidence.

## Feature Flags

| Flag | Effect |
|------|--------|
| `ENABLE_MEMORY` | Load prior RM conversations |
| `ENABLE_AUDIT` | Audit node + checkpoint metadata |
| `ENABLE_STREAMING` | `workflow.stream()` with live step events |
| `ENABLE_CACHE` | Reserved for Redis lookup |

## Checkpointing

`MemorySaver` checkpointer stores state after each node when audit is enabled.

Thread ID = `conversationId` for recovery.

## Human Approval

Messages are created in `DRAFT` status. The workflow emits a **Waiting for RM approval** step; actual approval happens via the Messaging UI (`PATCH /api/v1/messaging/:id`).

Optional `interruptBeforeApproval` compiles the graph with `interruptBefore: ['humanApproval']` for durable pause/resume.

## API Response

```json
{
  "requestId": "...",
  "summary": "...",
  "customers": [],
  "recommendations": [],
  "messages": [],
  "explainability": [],
  "execution": {
    "durationMs": 4200,
    "toolCalls": 6,
    "tokens": 150,
    "workflowVersion": "v1.0.0"
  }
}
```

## Usage

```typescript
import { createBankingAgentWorkflow, createInitialState } from '@banking-crm/agent-core';

const workflow = createBankingAgentWorkflow(deps);
const result = await workflow.invoke(initialState, {
  configurable: { thread_id: conversationId },
});
```

Orchestrator: `apps/backend/src/agents/orchestrator/agent-orchestrator.service.ts`

## Streaming

`POST /api/v1/conversations/query/stream` (SSE) emits `ExecutionStep` events as nodes complete when `ENABLE_STREAMING=true`.

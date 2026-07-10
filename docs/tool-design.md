# Tool Layer Design

Reusable, typed tool abstractions per `10-tool-design.md`. Agents reason; tools execute.

## Architecture

```text
Agent → Tool.execute(input) → Repository → Prisma → PostgreSQL
```

Agents never call repositories or databases directly.

## Base Interface

```typescript
export interface Tool<I, O> {
  readonly name: string;
  execute(input: I): Promise<O>;       // throws typed ToolException
  safeExecute(input: I): Promise<ToolResult<O>>;  // for graceful agent degradation
  getMetrics(): ToolMetricsSnapshot;
  withContext(ctx: ToolContext): this;
}
```

All tools extend `BaseTool<I, O>` in `apps/backend/src/tools/shared/base.tool.ts`.

## Tool Categories

| Category | Tools |
|----------|-------|
| **Retrieval** | CustomerTool, TransactionTool, LoanTool, CrmTool, CampaignTool, ProductTool |
| **Business Logic** | ScoringTool, EligibilityTool, RecommendationTool |
| **AI** | MessageGenerationTool, SummaryTool |
| **Infrastructure** | AuditTool, MemoryTool, CacheTool, FeatureFlagTool |

Only AI tools call OpenAI.

## Typed Exceptions

| Exception | Retryable |
|-----------|-----------|
| `CustomerNotFoundException` | No |
| `ProductNotFoundException` | No |
| `CampaignUnavailableException` | Yes |
| `MessageGenerationException` | Yes |
| `InfrastructureException` | Yes |

Business validation errors never retry. Infrastructure failures retry up to 3 times with exponential backoff.

## Logging & Metrics

Every execution logs: request ID, agent name, tool name, duration, success/failure.

`tool.getMetrics()` returns calls, failures, retries, cache hits, total duration.

## Testing

```bash
npm run test -w @banking-crm/backend
```

Each tool has unit tests with mocked repositories.

## Location

```
apps/backend/src/tools/
├── shared/base.tool.ts
├── customer/customer.tool.ts
├── scoring/scoring.tool.ts
├── ai/message-generation.tool.ts
├── cache/cache.tool.ts
└── ...
```

Contracts: `packages/shared-types/src/tools/`

## Agent Compatibility

Legacy adapter methods (`retrieve()`, `load()`, `log()`) wrap `execute()` and return `ToolResult<T>` for existing agent-core workflows.

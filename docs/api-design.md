# API Design Specification

REST API for the Banking CRM Agentic AI platform. Base URL: `/api/v1`.

## Philosophy

The AI agent is the primary entry point. A single conversational endpoint orchestrates the full workflow internally. Supporting APIs provide administration, configuration, testing, and reporting.

## Authentication

```http
Authorization: Bearer <JWT_TOKEN>
```

Obtain a token via `POST /api/v1/auth/login`.

## Standard Response Format

**Success:**
```json
{
  "success": true,
  "message": "Request processed successfully",
  "data": {},
  "meta": {},
  "timestamp": "2026-07-06T00:00:00.000Z"
}
```

**Failure:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "timestamp": "2026-07-06T00:00:00.000Z"
}
```

## Primary AI Endpoint

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/agent/query` | Full agentic workflow (Planner → Retrieval → Scoring → Recommendation → Messaging → Audit) |
| `POST` | `/conversations/query` | Alias of `/agent/query` |
| `SSE` | `/conversations/query/stream` | Stream execution steps |

## API Reference

### Agent
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/agent/query` | JWT | Primary AI workflow |

### Conversations
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/conversations` | JWT | Create conversation |
| GET | `/conversations` | JWT | List conversations |
| GET | `/conversations/:id` | JWT | Conversation history |
| DELETE | `/conversations/:id` | JWT | Archive conversation |
| POST | `/conversations/query` | JWT | Execute agent workflow |

### Customers
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/customers` | JWT | Search with pagination, filters, sorting |
| GET | `/customers/:id` | JWT | Customer details |
| GET | `/customers/:id/profile` | JWT | Full CRM profile |

**Query params:** `page`, `pageSize`, `sort`, `order`, `q`, `city`, `minCreditScore`, `minIncome`

### Recommendations
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/recommendations/generate` | JWT | Generate without messaging |
| GET | `/recommendations` | JWT | History |
| GET | `/recommendations/:id` | JWT | Details |

### Messages
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/messages/generate` | JWT | Generate message only |
| POST | `/messages/:id/approve` | JWT | Approve message |
| POST | `/messages/:id/reject` | JWT | Reject message |
| GET | `/messages` | JWT | Message history |

**Legacy:** `/messaging/*` routes remain for backward compatibility.

### Products
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/products` | JWT | List products |
| GET | `/products/:id` | JWT | Product details |

### Campaigns
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/campaigns` | JWT | Campaign history |
| POST | `/campaigns` | JWT | Create campaign |
| GET | `/campaigns/:id` | JWT | Campaign details |

### Prompts
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/prompts` | JWT | Prompt versions |
| POST | `/prompts` | JWT | Create version record |
| GET | `/prompts/:id` | JWT | Prompt details |

### Audit
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/audit` | JWT | Execution logs (date/agent/tool filters) |
| GET | `/audit/:requestId` | JWT | Execution details |

### Feature Flags
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/feature-flags` | JWT | List flags |
| PATCH | `/feature-flags/:key` | JWT | Enable/disable |

### Health
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | Public | Health check |
| GET | `/health/ready` | Public | Readiness probe |
| GET | `/health/live` | Public | Liveness probe |

### Metrics
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/metrics` | Public | Prometheus metrics |

### Evaluation
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/evaluation/benchmarks` | JWT | Run benchmarks |
| GET | `/evaluation/metrics` | JWT | Monitoring metrics |
| POST | `/evaluation/report` | JWT | Evaluate workflow response |

### Analytics
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/analytics/summary` | JWT | Dashboard summary |

## Rate Limiting

| Endpoint type | Limit |
|---------------|-------|
| Agent (`/agent/query`, `/conversations/query`) | 30 req/min per RM |
| Read APIs | 100 req/min |
| Health / Metrics | Unlimited |

Returns `429` with `errorCode: RATE_LIMITED`.

## HTTP Status Codes

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Validation error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |
| 422 | Business rule failed |
| 429 | Rate limited |
| 500 | Internal error |

## Error Codes

`CUSTOMER_NOT_FOUND`, `INVALID_QUERY`, `PROMPT_VALIDATION_FAILED`, `NOT_ELIGIBLE`, `MESSAGE_NOT_FOUND`, `TOOL_TIMEOUT`, `LLM_TIMEOUT`, `UNAUTHORIZED`, `RATE_LIMITED`

## Swagger

Interactive docs: `http://localhost:3000/api/docs`

## Security

JWT authentication, Helmet, CORS, rate limiting, DTO validation (`class-validator`), prompt injection protection via prompt sanitization layer.

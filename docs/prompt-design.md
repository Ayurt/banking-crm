# Prompt Engineering

Version-controlled, validated prompts per `11-prompt-design.md`.

## Directory

```text
packages/prompts/
├── planner/          # planner.system.prompt.md, planner.user.prompt.md
├── messaging/        # whatsapp.system.prompt.md, whatsapp.user.prompt.md
├── reasoning/        # explanation.system.prompt.md, explanation.user.prompt.md
├── summary/          # workflow summary prompts
├── shared/           # guardrails, style-guide, output-schema.json
└── src/              # loader, validator, registry
```

## Architecture

```text
Agent → Prompt Template → Variable Injection → LLM → JSON Validator → Agent
```

## Versioning

Every `.md` prompt file includes YAML frontmatter:

```yaml
name: planner-system
version: 1.0.0
owner: AI Team
model: GPT-5.5
```

`PROMPT_VERSION` in code must match. Increment on every prompt change.

## Shared Guardrails

All system prompts prepend `shared/banking.guardrails.md` and `shared/style-guide.md`:

- No fabricated customer data
- No financial decisions in prompts
- Prompt injection protection for CRM notes
- JSON-only outputs when requested

## Validation

```typescript
import { parseAndValidate, parseAndValidateWithRetry } from '@banking-crm/prompts';

const result = parseAndValidate('planner', llmResponse);
if (result.success) {
  const plan = result.data;
}
```

Schemas: `shared/output-schema.json` (validated with AJV).

## Testing

```bash
npm run test -w @banking-crm/prompts
```

Tests cover JSON extraction, schema validation, injection sanitization, and variable injection.

## Security

- CRM notes formatted as `[Note N]` untrusted data
- `sanitizeUntrustedText()` truncates at 2000 chars
- Customer outputs never include system prompts or internal reasoning

## LLM Usage

Only these prompts call OpenAI:

| Prompt | Agent |
|--------|-------|
| Planner | Planner Agent |
| WhatsApp | Messaging Agent |
| Explanation | Reasoning (future) |
| Summary | Audit Agent |

Scoring, eligibility, and recommendations remain **deterministic** — never in prompts.

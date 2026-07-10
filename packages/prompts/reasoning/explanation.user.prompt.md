---
name: explanation-user
version: 1.0.0
owner: AI Team
lastUpdated: 2026-07-06
description: User template for explainability prompt.
model: GPT-5.5
---

## Customer

{{customerName}}

## Product

{{productName}}

## Deterministic Outputs (do not recalculate)

- Conversion Score: {{score}}
- Confidence: {{confidence}}
- Reasons: {{reasons}}

Explain why this recommendation makes sense as JSON.

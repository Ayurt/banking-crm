---
name: summary-user
version: 1.0.0
owner: AI Team
lastUpdated: 2026-07-06
description: User template for workflow summary.
model: GPT-5.5
---

- Query: {{query}}
- Customers analyzed: {{customerCount}}
- Top conversion score: {{topScore}}
- Product: {{productType}}

Summarize as JSON.

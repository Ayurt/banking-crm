---
name: planner-user
version: 1.0.0
owner: AI Team
lastUpdated: 2026-07-06
description: User template for planner prompt variable injection.
model: GPT-5.5
---

## RM Query

{{query}}

## Context

- Current Date: {{currentDate}}
- Available Products: {{availableProducts}}
- Available Tools: {{availableTools}}

Create an execution plan as JSON.

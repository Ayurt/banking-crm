export function renderTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? '');
}

/** Strip markdown code fences and extract JSON object from LLM output. */
export function extractJsonFromResponse(content: string): string {
  const trimmed = content.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start !== -1 && end > start) {
    return trimmed.slice(start, end + 1);
  }
  return trimmed;
}

/** Sanitize CRM notes — flag injection patterns for the model context. */
export function sanitizeUntrustedText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .slice(0, 2000);
}

export function formatCrmNotesForPrompt(notes: string[]): string {
  if (!notes.length) return 'None';
  return notes.map((n, i) => `[Note ${i + 1}] ${sanitizeUntrustedText(n)}`).join('\n');
}

import Ajv, { type ValidateFunction } from 'ajv';
import { loadSchemas } from './loader';
import { extractJsonFromResponse } from './templates';

export type PromptSchemaName = 'planner' | 'messaging' | 'explanation' | 'summary';

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  status?: 'INSUFFICIENT_DATA';
}

const ajv = new Ajv({ allErrors: true, strict: false });
const schemas = loadSchemas();
const validators = new Map<PromptSchemaName, ValidateFunction>();

for (const name of Object.keys(schemas) as PromptSchemaName[]) {
  validators.set(name, ajv.compile(schemas[name] as object));
}

export function validatePromptOutput<T extends object>(
  schemaName: PromptSchemaName,
  data: unknown,
): ValidationResult<T> {
  if (data && typeof data === 'object' && (data as { status?: string }).status === 'INSUFFICIENT_DATA') {
    return { success: false, status: 'INSUFFICIENT_DATA', error: 'Insufficient data' };
  }

  const validate = validators.get(schemaName);
  if (!validate) {
    return { success: false, error: `Unknown schema: ${schemaName}` };
  }

  if (!validate(data)) {
    const error = ajv.errorsText(validate.errors);
    return { success: false, error };
  }

  return { success: true, data: data as T };
}

export function parseAndValidate<T extends object>(
  schemaName: PromptSchemaName,
  rawContent: string,
): ValidationResult<T> {
  try {
    const jsonStr = extractJsonFromResponse(rawContent);
    const parsed = JSON.parse(jsonStr) as unknown;
    return validatePromptOutput<T>(schemaName, parsed);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'JSON parse failed',
    };
  }
}

export interface ParseWithRetryResult<T> extends ValidationResult<T> {
  validationRetries: number;
}

/** Parse LLM output, validate schema, retry once on failure. */
export function parseAndValidateWithRetry<T extends object>(
  schemaName: PromptSchemaName,
  rawContent: string,
  retryContent?: string,
): ParseWithRetryResult<T> {
  const first = parseAndValidate<T>(schemaName, rawContent);
  if (first.success || first.status === 'INSUFFICIENT_DATA') {
    return { ...first, validationRetries: 0 };
  }

  if (retryContent) {
    const second = parseAndValidate<T>(schemaName, retryContent);
    if (second.success || second.status === 'INSUFFICIENT_DATA') {
      return { ...second, validationRetries: 1 };
    }
    return { ...second, validationRetries: 1 };
  }

  return { ...first, validationRetries: 0 };
}

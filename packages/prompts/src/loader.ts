import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface PromptMetadata {
  name: string;
  version: string;
  owner: string;
  lastUpdated: string;
  description: string;
  model: string;
}

export interface LoadedPrompt {
  metadata: PromptMetadata;
  body: string;
}

function resolvePromptsRoot(): string {
  const candidates = [
    join(__dirname, '..'),
    join(__dirname, '..', '..'),
  ];
  for (const root of candidates) {
    if (existsSync(join(root, 'shared', 'banking.guardrails.md'))) {
      return root;
    }
  }
  return join(__dirname, '..');
}

const PROMPTS_ROOT = resolvePromptsRoot();

export function parseFrontmatter(raw: string): LoadedPrompt {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return {
      metadata: {
        name: 'unknown',
        version: '1.0.0',
        owner: 'AI Team',
        lastUpdated: '',
        description: '',
        model: 'GPT-5.5',
      },
      body: raw.trim(),
    };
  }

  const metaBlock = match[1];
  const body = match[2].trim();
  const metadata = {} as Record<string, string>;

  for (const line of metaBlock.split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    metadata[key] = value;
  }

  return {
    metadata: metadata as unknown as PromptMetadata,
    body,
  };
}

export function loadPromptFile(relativePath: string): LoadedPrompt {
  const fullPath = join(PROMPTS_ROOT, relativePath);
  const raw = readFileSync(fullPath, 'utf-8');
  return parseFrontmatter(raw);
}

export function loadSharedSection(name: 'banking.guardrails' | 'style-guide'): string {
  return loadPromptFile(`shared/${name}.md`).body;
}

export function loadSchemas(): Record<string, unknown> {
  const raw = readFileSync(join(PROMPTS_ROOT, 'shared', 'output-schema.json'), 'utf-8');
  return JSON.parse(raw) as Record<string, unknown>;
}

export const PROMPTS_ROOT_PATH = PROMPTS_ROOT;

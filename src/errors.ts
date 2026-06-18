import type { Logger } from './types';

export function parseErrorLocation(stack?: string): string | undefined {
  if (!stack) return undefined;
  const lines = stack.split('\n');
  for (const line of lines) {
    const match = line.match(/(?:at\s+.*?\s+\()?([^():]+\.(?:ts|js|tsx|jsx)):(\d+)(?::\d+)?\)?/);
    if (match && !match[1].includes('node_modules')) {
      return `${match[1]}:${match[2]}`;
    }
  }
  return undefined;
}

export function extractErrorFields(err: unknown): {
  error_message: string;
  error_type?: string;
  stack_trace?: string;
  error_location?: string;
} {
  if (err instanceof Error) {
    return {
      error_message: err.message,
      error_type: err.name,
      stack_trace: err.stack,
      error_location: parseErrorLocation(err.stack),
    };
  }
  if (typeof err === 'string') {
    return { error_message: err };
  }
  try {
    return { error_message: JSON.stringify(err) };
  } catch {
    return { error_message: String(err) };
  }
}

export interface StructuredErrorInput {
  err: unknown;
  event?: string;
  functionality?: string;
  extra?: Record<string, unknown>;
}

export function logStructuredError(
  logger: Logger,
  input: StructuredErrorInput & { source?: string },
): void {
  const fields = extractErrorFields(input.err);
  logger.error(input.event ?? 'error', {
    functionality: input.functionality,
    error_source: input.source,
    ...fields,
    ...input.extra,
    outcome: 'error',
  });
}

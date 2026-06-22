import type { LogEvent, LogLevel } from './types.js';

export interface ExtractedErrorDetails {
  name?: string;
  message: string;
  stack?: string;
  causeChain: Array<{ name?: string; message: string }>;
  fingerprint: string;
}

function messagePrefix(message: string, max = 120): string {
  const trimmed = message.trim();
  return trimmed.length <= max ? trimmed : trimmed.slice(0, max);
}

export function fingerprintError(source: string, name: string | undefined, message: string): string {
  const basis = `${source}|${name ?? 'Error'}|${messagePrefix(message)}`;
  let hash = 2166136261;
  for (let i = 0; i < basis.length; i++) {
    hash ^= basis.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fp_${(hash >>> 0).toString(16)}`;
}

export function extractErrorDetails(error: unknown): ExtractedErrorDetails {
  const causeChain: Array<{ name?: string; message: string }> = [];
  let current: unknown = error;
  let name: string | undefined;
  let message = 'Unknown error';
  let stack: string | undefined;

  for (let depth = 0; depth < 8 && current; depth++) {
    if (current instanceof Error) {
      if (depth === 0) {
        name = current.name;
        message = current.message || message;
        stack = current.stack;
      } else {
        causeChain.push({ name: current.name, message: current.message || String(current) });
      }
      current = (current as Error & { cause?: unknown }).cause;
      continue;
    }
    if (typeof current === 'string') {
      if (depth === 0) message = current;
      else causeChain.push({ message: current });
      break;
    }
    try {
      const serialized = JSON.stringify(current);
      if (depth === 0) message = serialized;
      else causeChain.push({ message: serialized });
    } catch {
      if (depth === 0) message = String(current);
      else causeChain.push({ message: String(current) });
    }
    break;
  }

  return {
    name,
    message,
    stack,
    causeChain,
    fingerprint: fingerprintError('unknown', name, message),
  };
}

export function normalizeLogEvent(
  input: LogEvent,
  defaults: { service: string; occurredAt: string },
): Record<string, unknown> {
  const extracted = input.error != null ? extractErrorDetails(input.error) : null;
  const message = input.message || extracted?.message || 'Unknown error';
  const source = input.source.trim();
  const fingerprint = extracted
    ? fingerprintError(source, extracted.name, message)
    : fingerprintError(source, undefined, message);

  return {
    kind: 'log',
    level: input.level satisfies LogLevel,
    service: input.service ?? defaults.service,
    source,
    message,
    user_id: input.userId ?? null,
    session_key: input.sessionKey ?? null,
    request_id: input.requestId ?? null,
    trace_id: input.traceId ?? null,
    occurred_at: input.occurredAt ?? defaults.occurredAt,
    error_name: extracted?.name ?? null,
    stack_trace: extracted?.stack ?? null,
    cause_chain_json: extracted?.causeChain.length ? JSON.stringify(extracted.causeChain) : null,
    context_json: input.context ? JSON.stringify(input.context) : null,
    fingerprint,
  };
}

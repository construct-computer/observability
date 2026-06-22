import { normalizeLogEvent } from './log-events.js';
import { enqueueEnvelope } from './queue-forward.js';
import type { ExecutionContextLike, LogEvent, ObservabilityEnv } from './types.js';

export function log(env: ObservabilityEnv, event: LogEvent, ctx?: ExecutionContextLike): void {
  try {
    if (!event.source?.trim()) return;
    if (event.level !== 'error' && event.level !== 'warn') return;

    const body = normalizeLogEvent(event, {
      service: env.SERVICE_NAME ?? 'construct-api',
      occurredAt: new Date().toISOString(),
    });

    if (env.ENVIRONMENT === 'staging') {
      console.error(JSON.stringify(body));
    }

    enqueueEnvelope(body, ctx);
  } catch {
    // never throw
  }
}

import { normalizeAnalyticsEvent, validateAnalyticsEvent } from './events.js';
import { enqueueEnvelope } from './queue-forward.js';
import type { AnalyticsEvent, ExecutionContextLike, ObservabilityEnv } from './types.js';

export function track(
  env: ObservabilityEnv,
  event: AnalyticsEvent,
  ctx?: ExecutionContextLike,
): void {
  try {
    const error = validateAnalyticsEvent(event);
    if (error) return;

    const body = normalizeAnalyticsEvent(event, {
      service: env.SERVICE_NAME ?? 'construct-api',
      occurredAt: new Date().toISOString(),
      appVersion: env.APP_VERSION,
    });

    enqueueEnvelope(body, env, ctx);
  } catch {
    // never throw
  }
}

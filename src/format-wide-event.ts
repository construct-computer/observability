import type { DeploymentContext, WideEvent, WideEventPartial } from './types';
import { forwardWideEvent } from './logs-queue-forward';
import { validateEventName } from './event-name';

/** Snake_case aliases for common camelCase context keys. */
function flattenContext(ctx: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const alias: Record<string, string> = {
    userId: 'user_id',
    sessionKey: 'session_key',
    requestId: 'request_id',
    traceId: 'trace_id',
    correlationId: 'correlation_id',
    cfRay: 'cf_ray',
    cfColo: 'cf_colo',
    durationMs: 'duration_ms',
    toolName: 'tool_name',
  };
  for (const [key, value] of Object.entries(ctx)) {
    if (value === undefined) continue;
    const target = alias[key] ?? key;
    if (out[target] === undefined) out[target] = value;
  }
  return out;
}

export function formatWideEvent(
  deployment: DeploymentContext,
  partial: WideEventPartial,
  ctx: Record<string, unknown> = {},
): WideEvent {
  const flatCtx = flattenContext(ctx);
  const { extra, ...restPartial } = partial;

  const event: WideEvent = {
    service_name: deployment.service_name,
    environment: deployment.environment,
    version: deployment.version,
    worker_name: deployment.worker_name,
    timestamp: new Date().toISOString(),
    ...flatCtx,
    ...restPartial,
  };

  if (extra && Object.keys(extra).length > 0) {
    event.extra = flattenContext(extra as Record<string, unknown>);
  }

  return event;
}

export function emitWideEvent(event: WideEvent): void {
  validateEventName(event.event, event.environment === 'local' || event.environment === 'staging');

  const payload = JSON.stringify(event);
  if (event.level === 'error') {
    console.error(payload);
  } else {
    console.log(payload);
  }

  forwardWideEvent(event);
}

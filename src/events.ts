import type { AnalyticsEvent, AnalyticsEventName } from './types.js';

const EVENT_NAMES = new Set<AnalyticsEventName>([
  'llm_call',
  'tool_call',
  'agent_turn',
  'incident',
  'user_activity',
  'system_event',
]);

export function validateAnalyticsEvent(event: AnalyticsEvent): string | null {
  if (!EVENT_NAMES.has(event.event)) return `Unknown analytics event: ${String((event as AnalyticsEvent).event)}`;
  if (!event.trigger) return 'Missing trigger';
  if (event.event === 'tool_call' && !event.toolName) return 'tool_call requires toolName';
  if (event.event === 'llm_call' && !event.model) return 'llm_call requires model';
  if (event.event === 'incident' && !event.kind) return 'incident requires kind';
  if (event.event === 'user_activity' && !event.activityType) return 'user_activity requires activityType';
  if (event.event === 'system_event' && (!event.name || !event.source)) {
    return 'system_event requires name and source';
  }
  return null;
}

export function normalizeAnalyticsEvent(
  event: AnalyticsEvent,
  defaults: { service: string; occurredAt: string; appVersion?: string },
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    kind: 'analytics',
    event: event.event,
    trigger: event.trigger,
    service: event.service ?? defaults.service,
    occurred_at: event.occurredAt ?? defaults.occurredAt,
    user_id: event.userId ?? null,
    session_key: event.sessionKey ?? null,
    request_id: event.requestId ?? null,
    trace_id: event.traceId ?? null,
    app_version: defaults.appVersion ?? null,
  };

  switch (event.event) {
    case 'llm_call':
      return {
        ...base,
        model: event.model,
        provider: event.provider ?? null,
        action: event.action ?? null,
        prompt_tokens: event.promptTokens ?? null,
        completion_tokens: event.completionTokens ?? null,
        cost_usd: event.costUsd ?? null,
        billed_to: event.billedTo ?? null,
        ttft_ms: event.ttftMs ?? null,
        latency_ms: event.latencyMs ?? null,
      };
    case 'tool_call':
      return {
        ...base,
        tool_name: event.toolName,
        provider: event.provider ?? null,
        duration_ms: event.durationMs ?? null,
        success: event.success ? 1 : 0,
        error_class: event.errorClass ?? null,
        attempt: event.attempt ?? null,
      };
    case 'agent_turn':
      return {
        ...base,
        iterations: event.iterations ?? null,
        tool_count: event.toolCount ?? null,
        tool_failures: event.toolFailures ?? null,
        input_tokens: event.inputTokens ?? null,
        output_tokens: event.outputTokens ?? null,
        cost_usd: event.costUsd ?? null,
        terminal_reason: event.terminalReason ?? null,
        duration_ms: event.durationMs ?? null,
      };
    case 'incident':
      return {
        ...base,
        incident_kind: event.kind,
        scope: event.scope ?? null,
        severity: event.severity ?? null,
        tool_name: event.toolName ?? null,
        recoverability: event.recoverability ?? null,
      };
    case 'user_activity':
      return {
        ...base,
        activity_type: event.activityType,
        surface: event.surface ?? null,
      };
    case 'system_event':
      return {
        ...base,
        name: event.name,
        source: event.source,
        detail_json: event.detail ? JSON.stringify(event.detail) : null,
      };
    default:
      return base;
  }
}

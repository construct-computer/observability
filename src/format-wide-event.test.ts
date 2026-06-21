import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatWideEvent } from './format-wide-event';

const deployment = {
  service_name: 'construct-api',
  environment: 'staging',
  version: 'test',
  worker_name: 'construct-api-staging',
};

test('formatWideEvent — camelCase aliases flatten to snake_case', () => {
  const event = formatWideEvent(
    deployment,
    { level: 'info', event: 'alarm_firing', source: 'agent', outcome: 'success' },
    { durationMs: 42, sessionKey: 'sess-1', correlationId: 'corr-1', toolName: 'web_search' },
  );
  assert.equal(event.duration_ms, 42);
  assert.equal(event.session_key, 'sess-1');
  assert.equal(event.correlation_id, 'corr-1');
  assert.equal(event.tool_name, 'web_search');
});

test('formatWideEvent — extra keys are snake_cased', () => {
  const event = formatWideEvent(
    deployment,
    {
      level: 'info',
      event: 'tool_executed',
      source: 'tools.executor',
      outcome: 'success',
      extra: { durationMs: 99, retryAttempt: 2 },
    },
  );
  assert.equal(event.extra?.duration_ms, 99);
  assert.equal(event.extra?.retryAttempt, 2);
});

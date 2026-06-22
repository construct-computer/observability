import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateAnalyticsEvent, normalizeAnalyticsEvent } from '../src/events.js';
import { extractErrorDetails, fingerprintError } from '../src/log-events.js';

describe('validateAnalyticsEvent', () => {
  it('accepts llm_call with model', () => {
    assert.equal(
      validateAnalyticsEvent({
        event: 'llm_call',
        trigger: 'user',
        model: 'gpt-4o',
      }),
      null,
    );
  });

  it('rejects tool_call without toolName', () => {
    assert.match(
      validateAnalyticsEvent({ event: 'tool_call', trigger: 'user', success: true } as never),
      /toolName/,
    );
  });
});

describe('normalizeAnalyticsEvent', () => {
  it('maps llm_call fields', () => {
    const row = normalizeAnalyticsEvent(
      {
        event: 'llm_call',
        trigger: 'user',
        model: 'claude-sonnet',
        costUsd: 0.01,
        ttftMs: 120,
      },
      { service: 'construct-api-staging', occurredAt: '2026-01-01T00:00:00.000Z' },
    );
    assert.equal(row.kind, 'analytics');
    assert.equal(row.model, 'claude-sonnet');
    assert.equal(row.cost_usd, 0.01);
    assert.equal(row.ttft_ms, 120);
  });
});

describe('extractErrorDetails', () => {
  it('walks cause chain', () => {
    const root = new Error('root failed');
    (root as Error & { cause?: unknown }).cause = new Error('inner');
    const details = extractErrorDetails(root);
    assert.equal(details.message, 'root failed');
    assert.equal(details.causeChain.length, 1);
    assert.equal(details.causeChain[0]?.message, 'inner');
  });

  it('fingerprint is stable for same input', () => {
    const a = fingerprintError('agent.loop', 'TypeError', 'Cannot read properties');
    const b = fingerprintError('agent.loop', 'TypeError', 'Cannot read properties');
    assert.equal(a, b);
  });
});

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { enqueueEnvelope, flushQueue, resetQueueForwardForTests } from './queue-forward.js';
import type { ObservabilityEnv } from './types.js';

describe('queue-forward', () => {
  beforeEach(() => {
    resetQueueForwardForTests();
  });

  it('sends enqueued messages when env provides ANALYTICS_QUEUE', async () => {
    const sent: unknown[] = [];
    const env: ObservabilityEnv = {
      ANALYTICS_QUEUE: {
        send: async (message: unknown) => {
          sent.push(message);
        },
      },
    };

    enqueueEnvelope({ kind: 'analytics', event: 'llm_call' }, env);
    await flushQueue(env);

    assert.equal(sent.length, 1);
  });

  it('drops messages when ANALYTICS_QUEUE is missing', async () => {
    const sent: unknown[] = [];
    const env: ObservabilityEnv = {
      ANALYTICS_QUEUE: {
        send: async (message: unknown) => {
          sent.push(message);
        },
      },
    };

    enqueueEnvelope({ kind: 'log', level: 'error' }, env);
    await flushQueue(undefined);

    assert.equal(sent.length, 0);
  });
});

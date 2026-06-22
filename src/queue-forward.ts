import type { ExecutionContextLike, ObservabilityEnv, QueueEnvelope } from './types.js';

const MAX_BATCH_BYTES = 120_000;
const MAX_BATCH_MESSAGES = 50;

let pending: QueueEnvelope[] = [];
let pendingBytes = 0;
let flushScheduled = false;

function envelopeBytes(body: Record<string, unknown>): number {
  try {
    return new TextEncoder().encode(JSON.stringify(body)).length;
  } catch {
    return 512;
  }
}

export function enqueueEnvelope(body: Record<string, unknown>, ctx?: ExecutionContextLike): void {
  pending.push(body as unknown as QueueEnvelope);
  pendingBytes += envelopeBytes(body);

  if (pending.length >= MAX_BATCH_MESSAGES || pendingBytes >= MAX_BATCH_BYTES) {
    void flushQueue(undefined, ctx);
    return;
  }

  if (!flushScheduled) {
    flushScheduled = true;
    queueMicrotask(() => {
      flushScheduled = false;
      void flushQueue(undefined, ctx);
    });
  }
}

export async function flushQueue(env?: ObservabilityEnv, ctx?: ExecutionContextLike): Promise<void> {
  if (pending.length === 0) return;
  const batch = pending;
  pending = [];
  pendingBytes = 0;

  const queue = env?.ANALYTICS_QUEUE;
  if (!queue) return;

  const send = async () => {
    for (const message of batch) {
      try {
        await queue.send(message);
      } catch {
        // fire-and-forget — never throw to callers
      }
    }
  };

  if (ctx) ctx.waitUntil(send());
  else await send();
}

export function resetQueueForwardForTests(): void {
  pending = [];
  pendingBytes = 0;
  flushScheduled = false;
}

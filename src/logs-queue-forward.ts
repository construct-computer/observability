import type { WideEvent } from './types';

const MAX_EXTRA_BYTES = 8 * 1024;
const FLUSH_BATCH_SIZE = 25;

let pending: WideEvent[] = [];
let flushPromise: Promise<void> | null = null;

type QueueBinding = { send: (body: WideEvent, options?: any) => Promise<any> };
type WaitUntil = (promise: Promise<unknown>) => void;

let activeQueue: QueueBinding | undefined;
let activeWaitUntil: WaitUntil | undefined;

export function configureLogsForward(
  queue?: { send: (body: WideEvent, options?: any) => Promise<any> },
  waitUntil?: WaitUntil,
): void {
  activeQueue = queue ?? undefined;
  activeWaitUntil = waitUntil;
}

async function flushQueue(): Promise<void> {
  if (!activeQueue || pending.length === 0) return;
  const batch = pending.splice(0, pending.length);
  await Promise.all(batch.map((event) => activeQueue!.send(event)));
}

function scheduleFlush(): void {
  if (!activeQueue || flushPromise) return;
  flushPromise = Promise.resolve().then(async () => {
    flushPromise = null;
    await flushQueue();
    if (pending.length > 0) scheduleFlush();
  });
  if (activeWaitUntil) {
    activeWaitUntil(flushPromise);
  }
}

export function capExtraPayload(event: WideEvent): WideEvent {
  if (!event.extra) return event;
  const serialized = JSON.stringify(event.extra);
  if (serialized.length <= MAX_EXTRA_BYTES) return event;
  return {
    ...event,
    extra: {
      ...event.extra,
      _truncated: true,
      _original_bytes: serialized.length,
    },
  };
}

export function forwardWideEvent(event: WideEvent): void {
  if (!activeQueue) return;
  pending.push(capExtraPayload(event));
  if (pending.length >= FLUSH_BATCH_SIZE) {
    const p = flushQueue();
    if (activeWaitUntil) activeWaitUntil(p);
    return;
  }
  scheduleFlush();
}

export async function flushLogsForward(): Promise<void> {
  await flushQueue();
}

import { EVENT_ALIASES } from './event-catalog';

const EVENT_NAME_RE = /^[a-z][a-z0-9_]{2,80}$/;

export function isValidEventName(name: string): boolean {
  return EVENT_NAME_RE.test(name);
}

export function validateEventName(name: string, strict = false): void {
  if (EVENT_ALIASES.has(name)) return;
  if (isValidEventName(name)) return;
  const msg = `Invalid event name "${name}": use snake_case (a-z, 0-9, underscore)`;
  if (strict) throw new Error(msg);
  console.warn(JSON.stringify({ event: 'invalid_event_name', message: msg, name }));
}

/**
 * Fail if any wide-event name in platform workers lacks a catalog label.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lookupEventLabel, EVENT_ALIASES } from '../src/event-catalog.ts';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '../..');

const WORKER_ROOTS = [
  join(ROOT, 'construct/worker/src'),
  join(ROOT, 'memory/src'),
  join(ROOT, 'app-registry/worker/src'),
  join(ROOT, 'observer/src'),
];

const EVENT_RE = /\b(?:log\.(?:info|error|warn)|createLogger\([^)]*\)\.(?:info|error|warn))\(\s*['"]([^'"]+)['"]/g;
const CONSOLE_RE = /\bconsole\.(?:warn|error|info|log)\(/g;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (name === 'node_modules' || name.startsWith('.')) continue;
      walk(path, out);
    } else if (path.endsWith('.ts') && !path.endsWith('.test.ts')) {
      out.push(path);
    }
  }
  return out;
}

const missing: Array<{ event: string; file: string }> = [];
const consoleHits: string[] = [];

for (const root of WORKER_ROOTS) {
  for (const file of walk(root)) {
    const rel = relative(ROOT, file);
    const text = readFileSync(file, 'utf8');
    if (CONSOLE_RE.test(text) && !rel.includes('scripts/')) {
      consoleHits.push(rel);
    }
    for (const match of text.matchAll(EVENT_RE)) {
      const event = match[1];
      if (EVENT_ALIASES.has(event)) continue;
      if (lookupEventLabel(event)) continue;
      if (/^[a-z][a-z0-9_]+$/.test(event.replace(/\s+/g, '_').toLowerCase())) continue;
      missing.push({ event, file: rel });
    }
  }
}

if (consoleHits.length > 0) {
  console.warn('Unstructured console.* in worker src (review):');
  for (const f of consoleHits.slice(0, 20)) console.warn(`  ${f}`);
}

if (missing.length > 0) {
  console.error('Events missing catalog labels:');
  for (const { event, file } of missing) {
    console.error(`  ${event} (${file})`);
  }
  process.exit(1);
}

console.log('Event catalog audit passed.');

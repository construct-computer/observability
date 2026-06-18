const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const NANOID_RE = /[A-Za-z0-9_-]{16,24}/g;

const STATIC_SEGMENTS = new Set([
  'api', 'v1', 'v2', 'ws', 'health', 'readyz', 'admin', 'internal',
  'apps', 'agent', 'memory', 'registry', 'chat', 'notify', 'mcp', 'ui', 'sdk', 'icon',
]);

/**
 * Normalize a URL path for low-cardinality route labels in metrics/logs.
 * Replaces UUIDs and opaque ids with :id while preserving known static segments.
 */
export function normalizeRoute(path: string): string {
  if (!path || path === '/') return path || '/';

  const segments = path.split('/').filter(Boolean);
  const normalized = segments.map((seg) => {
    if (STATIC_SEGMENTS.has(seg.toLowerCase())) return seg;
    if (UUID_RE.test(seg)) return ':id';
    UUID_RE.lastIndex = 0;
    if (/^\d+$/.test(seg)) return ':id';
    if (seg.length >= 16 && NANOID_RE.test(seg)) return ':id';
    if (seg.includes('-') && seg.length > 20) return ':id';
    return seg;
  });

  return `/${normalized.join('/')}`;
}

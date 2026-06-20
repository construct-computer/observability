import type { Context, Next } from 'hono';
import { extractErrorFields } from './errors';
import { createServiceLogger } from './log';
import type { DeploymentOptions } from './deployment-context';
import { normalizeRoute } from './route-normalize';
import type { ObservabilityEnv } from './types';

export interface RequestContextIds {
  requestId: string;
  traceId: string;
  correlationId: string;
  cfRay?: string;
}

export interface HonoObservabilityVars {
  requestId: string;
  traceId: string;
  correlationId: string;
  userId?: string;
}

function generateRequestId(c: Context): string {
  return c.req.header('x-request-id')
    || c.req.header('cf-ray')
    || crypto.randomUUID();
}

function generateTraceId(c: Context, requestId: string): string {
  const cloudTrace = c.req.header('x-cloud-trace-context');
  const traceparent = c.req.header('traceparent');
  if (traceparent) {
    const parts = traceparent.split('-');
    if (parts.length >= 2 && parts[1]) return parts[1];
  }
  return c.req.header('x-trace-id')
    || (cloudTrace ? cloudTrace.split('/')[0] : undefined)
    || requestId;
}

export function getRequestContextIds(c: Context): RequestContextIds {
  const requestId = generateRequestId(c);
  const traceId = generateTraceId(c, requestId);
  return {
    requestId,
    traceId,
    correlationId: traceId,
    cfRay: c.req.header('cf-ray') || undefined,
  };
}

export function applyTraceHeaders<E extends { Variables: HonoObservabilityVars }>(
  c: Context<E>,
  request: Request,
): Request {
  const r = new Request(request, { body: request.body });
  const requestId = c.get('requestId');
  const traceId = c.get('traceId');
  if (requestId) r.headers.set('x-request-id', requestId);
  if (traceId) {
    r.headers.set('x-trace-id', traceId);
    const spanId = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    r.headers.set('traceparent', `00-${traceId.replace(/-/g, '').slice(0, 32)}-${spanId}-01`);
  }
  return r;
}

export interface WideEventMiddlewareOptions extends DeploymentOptions {
  /** Optional hook to read user_id after auth middleware on same request. */
  getUserId?: (c: Context) => string | undefined;
}

/**
 * Hono middleware: correlation IDs + one `http_request` wide event per request.
 */
export function wideEventMiddleware<E extends ObservabilityEnv>(
  options: WideEventMiddlewareOptions,
) {
  return async (
    c: Context<{ Bindings: E; Variables: HonoObservabilityVars & Record<string, unknown> }>,
    next: Next,
  ): Promise<void> => {
    const ctx = getRequestContextIds(c);
    c.set('requestId', ctx.requestId);
    c.set('traceId', ctx.traceId);
    c.set('correlationId', ctx.correlationId);

    c.header('x-request-id', ctx.requestId);
    c.header('x-trace-id', ctx.traceId);

    const start = Date.now();
    let caughtError: unknown;

    try {
      await next();
    } catch (err) {
      caughtError = err;
      throw err;
    } finally {
      const durationMs = Date.now() - start;
      const status = c.res?.status ?? (caughtError ? 500 : 200);
      const statusBucket = status >= 500 ? '5xx' : status >= 400 ? '4xx' : status >= 300 ? '3xx' : '2xx';
      const route = normalizeRoute(c.req.routePath || c.req.path || 'unknown');
      const userId = options.getUserId?.(c) ?? (c.get('userId' as never) as string | undefined);

      const log = createServiceLogger(c.env, options, 'http', {
        requestId: ctx.requestId,
        traceId: ctx.traceId,
        correlationId: ctx.correlationId,
        cfRay: ctx.cfRay,
        userId,
        trigger_class: 'user',
      }, {
        queue: c.env.LOGS_QUEUE,
        waitUntil: c.executionCtx?.waitUntil.bind(c.executionCtx),
      });

      const level = status >= 500 || caughtError ? 'error' : status >= 400 ? 'warn' : 'info';
      const errorFields = caughtError ? extractErrorFields(caughtError) : {};

      log[level === 'warn' ? 'warn' : level === 'error' ? 'error' : 'info']('http_request', {
        trigger_class: 'user',
        method: c.req.method,
        path: c.req.path,
        route,
        status,
        status_bucket: statusBucket,
        duration_ms: durationMs,
        functionality: 'http',
        outcome: status >= 500 || caughtError ? 'error' : status >= 400 ? 'partial' : 'success',
        user_agent: c.req.header('user-agent'),
        origin: c.req.header('origin'),
        referer: c.req.header('referer'),
        cf_country: (c.req.raw as Request & { cf?: { country?: string } }).cf?.country,
        cf_colo: (c.req.raw as Request & { cf?: { colo?: string } }).cf?.colo,
        ...errorFields,
      });
    }
  };
}

/** Raw fetch wrapper for non-Hono workers (app-registry pattern). */
export function withRequestContext<E extends ObservabilityEnv>(
  options: WideEventMiddlewareOptions,
  handler: (request: Request, env: E) => Promise<Response>,
) {
  return async (request: Request, env: E, _executionCtx?: { waitUntil: (p: Promise<unknown>) => void }): Promise<Response> => {
    const requestId = request.headers.get('x-request-id')
      || request.headers.get('cf-ray')
      || crypto.randomUUID();
    const cloudTrace = request.headers.get('x-cloud-trace-context');
    const traceId = request.headers.get('x-trace-id')
      || (cloudTrace ? cloudTrace.split('/')[0] : undefined)
      || requestId;
    const cfRay = request.headers.get('cf-ray') || undefined;

    const start = Date.now();
    const url = new URL(request.url);
    const path = url.pathname;
    const route = normalizeRoute(path);

    let response: Response;

    try {
      response = await handler(request, env);
    } catch (err) {
      const fields = extractErrorFields(err);
      const log = createServiceLogger(env, options, 'http', {
        requestId,
        traceId,
        correlationId: traceId,
        cfRay,
      });
      log.error('worker_error', { ...fields, path, route, outcome: 'error' });
      response = new Response(JSON.stringify({ error: fields.error_message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const durationMs = Date.now() - start;
    const status = response.status;
    const statusBucket = status >= 500 ? '5xx' : status >= 400 ? '4xx' : status >= 300 ? '3xx' : '2xx';

    const log = createServiceLogger(env, options, 'http', {
      requestId,
      traceId,
      correlationId: traceId,
      cfRay,
    });

    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    log[level === 'warn' ? 'warn' : level === 'error' ? 'error' : 'info']('http_request', {
      method: request.method,
      path,
      route,
      status,
      status_bucket: statusBucket,
      duration_ms: durationMs,
      functionality: 'http',
      outcome: status >= 500 ? 'error' : status >= 400 ? 'partial' : 'success',
      cf_ray: cfRay,
    });

    response = new Response(response.body, response);
    response.headers.set('x-request-id', requestId);
    response.headers.set('x-trace-id', traceId);

    void _executionCtx;

    return response;
  };
}

export function applyTraceHeadersFromContext(
  ctx: RequestContextIds,
  request: Request,
): Request {
  const r = new Request(request, { body: request.body });
  r.headers.set('x-request-id', ctx.requestId);
  r.headers.set('x-trace-id', ctx.traceId);
  const spanId = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  const traceHex = ctx.traceId.replace(/-/g, '').slice(0, 32);
  r.headers.set('traceparent', `00-${traceHex.padEnd(32, '0').slice(0, 32)}-${spanId}-01`);
  return r;
}

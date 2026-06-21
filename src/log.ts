import { deploymentContext, type DeploymentOptions } from './deployment-context';
import { getDeployment } from './deployment-store';
import { configureLogsForward, forwardWideEvent } from './logs-queue-forward';
import type {
  DeploymentContext,
  LogContext,
  Logger,
  LoggerForwardOptions,
  ObservabilityEnv,
  TriggerClass,
  WideEventLevel,
  WideEventOutcome,
  WideEventSeverity,
} from './types';
import { EVENT_ALIASES } from './event-catalog';
import { isValidEventName } from './event-name';
import { normalizeEventKey } from './event-text';
import { emitWideEvent, formatWideEvent } from './format-wide-event';

export interface CreateLoggerOptions extends DeploymentOptions {
  env?: ObservabilityEnv;
  forward?: LoggerForwardOptions;
  defaultTriggerClass?: TriggerClass;
}

function mapLevel(level: WideEventLevel | 'warn' | 'debug'): WideEventLevel {
  if (level === 'error') return 'error';
  return 'info';
}

function mapSeverity(level: WideEventLevel | 'warn' | 'debug'): WideEventSeverity {
  if (level === 'error') return 'error';
  if (level === 'warn') return 'warn';
  if (level === 'debug') return 'debug';
  return 'info';
}

/** Legacy human-readable names are normalized to snake_case at emit time. */
export function resolveEventName(event: string): string {
  if (EVENT_ALIASES.has(event) || isValidEventName(event)) return event;
  const normalized = normalizeEventKey(event);
  if (normalized && isValidEventName(normalized)) return normalized;
  return event;
}

function resolveDeployment(options?: CreateLoggerOptions) {
  if (options?.env && options?.serviceName) {
    return deploymentContext(options.env, {
      serviceName: options.serviceName,
      workerName: options.workerName,
    });
  }
  const fromStore = getDeployment();
  if (fromStore) return fromStore;
  return {
    service_name: options?.serviceName ?? 'unknown',
    environment: options?.env?.ENVIRONMENT ?? 'local',
    version: options?.env?.APP_VERSION ?? 'unknown',
    worker_name: options?.workerName,
  };
}

/** Deterministic sampling so related debug lines for one request stay together. */
function shouldForwardDebug(
  deployment: DeploymentContext,
  options: CreateLoggerOptions | undefined,
  ctx: LogContext,
  event: string,
): boolean {
  if (deployment.environment !== 'production') return true;
  const rawRate = options?.env?.LOG_DEBUG_SAMPLE_RATE;
  const rate = rawRate != null && rawRate !== '' ? Number(rawRate) : 0.02;
  if (!Number.isFinite(rate) || rate <= 0) return false;
  if (rate >= 1) return true;
  const record = ctx as Record<string, unknown>;
  const requestId = String(record.requestId ?? record.request_id ?? '');
  let hash = 0;
  const key = `${requestId}:${event}`;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
  }
  return (Math.abs(hash) % 100) < rate * 100;
}

export function createLogger(
  source: string,
  ctx: LogContext = {},
  options?: CreateLoggerOptions,
): Logger {
  const deployment = resolveDeployment(options);

  const queue = options?.forward?.queue ?? options?.env?.LOGS_QUEUE;
  const waitUntil = options?.forward?.waitUntil;
  if (queue) {
    configureLogsForward(queue, waitUntil);
  }

  function write(
    level: WideEventLevel | 'warn' | 'debug',
    event: string,
    extra?: Record<string, unknown>,
  ): void {
    const mapped = mapLevel(level);
    const outcome = (extra?.outcome ?? ctx.outcome ?? (mapped === 'error' ? 'error' : 'success')) as WideEventOutcome;
    const triggerClass = (extra?.trigger_class ?? ctx.trigger_class ?? options?.defaultTriggerClass ?? 'user') as TriggerClass;

    const eventName = resolveEventName(event);
    const wide = formatWideEvent(
      deployment,
      {
        level: mapped,
        severity: mapSeverity(level),
        event: eventName,
        source,
        outcome,
        trigger_class: triggerClass,
        extra: extra && Object.keys(extra).length > 0 ? extra : undefined,
        ...(level === 'warn' ? { error_message: extra?.error_message as string | undefined } : {}),
      },
      ctx as Record<string, unknown>,
    );

    if (level === 'debug') {
      console.debug(JSON.stringify(wide));
      if (shouldForwardDebug(deployment, options, ctx, eventName)) {
        forwardWideEvent(wide);
      }
      return;
    }

    emitWideEvent(wide);
  }

  return {
    debug: (event, extra) => write('debug', event, extra),
    info: (event, extra) => write('info', event, extra),
    warn: (event, extra) => write('warn', event, { ...extra, outcome: extra?.outcome ?? 'partial' }),
    error: (event, extra) => write('error', event, { ...extra, outcome: extra?.outcome ?? 'error' }),
  };
}

export function createServiceLogger(
  env: ObservabilityEnv,
  options: DeploymentOptions,
  source: string,
  ctx: LogContext = {},
  forward?: LoggerForwardOptions,
): Logger {
  return createLogger(source, ctx, { ...options, env, forward });
}

import { deploymentContext, type DeploymentOptions } from './deployment';
import { emitWideEvent, formatWideEvent } from './format-wide-event';
import type { LogContext, Logger, ObservabilityEnv, WideEventLevel, WideEventOutcome } from './types';

export interface CreateLoggerOptions extends DeploymentOptions {
  env?: ObservabilityEnv;
}

function mapLevel(level: WideEventLevel | 'warn' | 'debug'): WideEventLevel {
  if (level === 'error') return 'error';
  return 'info';
}

export function createLogger(
  source: string,
  ctx: LogContext = {},
  options?: CreateLoggerOptions,
): Logger {
  const deployment = options?.env && options?.serviceName
    ? deploymentContext(options.env, { serviceName: options.serviceName, workerName: options.workerName })
    : {
        service_name: options?.serviceName ?? 'unknown',
        environment: options?.env?.ENVIRONMENT ?? 'local',
        version: options?.env?.APP_VERSION ?? 'unknown',
        worker_name: options?.workerName,
      };

  function write(
    level: WideEventLevel | 'warn' | 'debug',
    event: string,
    extra?: Record<string, unknown>,
  ): void {
    const mapped = mapLevel(level);
    const outcome = (extra?.outcome ?? ctx.outcome ?? (mapped === 'error' ? 'error' : 'success')) as WideEventOutcome;

    const wide = formatWideEvent(
      deployment,
      {
        level: mapped,
        event,
        source,
        outcome,
        extra: extra && Object.keys(extra).length > 0 ? extra : undefined,
        ...(level === 'warn' ? { error_message: extra?.error_message as string | undefined } : {}),
      },
      ctx as Record<string, unknown>,
    );

    if (level === 'debug') {
      console.debug(JSON.stringify(wide));
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

/** Factory bound to env + service metadata (preferred for workers). */
export function createServiceLogger(
  env: ObservabilityEnv,
  options: DeploymentOptions,
  source: string,
  ctx: LogContext = {},
): Logger {
  return createLogger(source, ctx, { ...options, env });
}

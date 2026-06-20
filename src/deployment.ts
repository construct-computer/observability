import { createLogger } from './log';
import type { ObservabilityEnv } from './types';

export interface EmitDeployEventOptions {
  env: ObservabilityEnv;
  serviceName: string;
  workerName: string;
  extra?: Record<string, unknown>;
}

const deployEmitted = new Set<string>();

/** Emit one `worker_deploy` wide event per worker isolate cold start. */
export function emitDeployEvent(options: EmitDeployEventOptions): void {
  const key = options.workerName || options.serviceName;
  if (deployEmitted.has(key)) return;
  deployEmitted.add(key);

  const log = createLogger('deployment', {}, {
    env: options.env,
    serviceName: options.serviceName,
    workerName: options.workerName,
  });
  log.info('worker_deploy', {
    outcome: 'success',
    trigger_class: 'system',
    worker_name: options.workerName,
    ...options.extra,
  });
}

export { deploymentContext, type DeploymentOptions } from './deployment-context';

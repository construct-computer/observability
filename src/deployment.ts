import type { DeploymentContext, ObservabilityEnv } from './types';

export interface DeploymentOptions {
  serviceName: string;
  workerName?: string;
}

export function deploymentContext(
  env: ObservabilityEnv,
  options: DeploymentOptions,
): DeploymentContext {
  return {
    service_name: options.serviceName,
    worker_name: options.workerName,
    environment: env.ENVIRONMENT ?? 'local',
    version: env.APP_VERSION ?? 'unknown',
  };
}

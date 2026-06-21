import type { DeploymentContext } from './types';

type AsyncLocalStorageLike<T> = {
  run<R>(store: T, fn: () => R): R;
  getStore(): T | undefined;
};

function createDeploymentStore(): AsyncLocalStorageLike<DeploymentContext> {
  const ALS = (globalThis as { AsyncLocalStorage?: new () => AsyncLocalStorageLike<DeploymentContext> }).AsyncLocalStorage;
  if (ALS) return new ALS();
  // Fallback for typecheck / environments without nodejs_compat (single-request isolate).
  let current: DeploymentContext | undefined;
  return {
    run<R>(deployment: DeploymentContext, fn: () => R): R {
      const prev = current;
      current = deployment;
      try {
        return fn();
      } finally {
        current = prev;
      }
    },
    getStore(): DeploymentContext | undefined {
      return current;
    },
  };
}

const deploymentStore = createDeploymentStore();

export function runWithDeployment<T>(deployment: DeploymentContext, fn: () => T): T {
  return deploymentStore.run(deployment, fn);
}

export function getDeployment(): DeploymentContext | undefined {
  return deploymentStore.getStore();
}

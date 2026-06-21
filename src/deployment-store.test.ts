import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLogger } from './log';
import { deploymentContext } from './deployment-context';
import { getDeployment, runWithDeployment } from './deployment-store';

test('createLogger resolves deployment from AsyncLocalStorage when env omitted', () => {
  const deployment = deploymentContext(
    { ENVIRONMENT: 'production', APP_VERSION: 'abc' },
    { serviceName: 'construct-api', workerName: 'construct-api-production' },
  );
  let workerName: string | undefined;
  runWithDeployment(deployment, () => {
    const log = createLogger('llm', {}, { serviceName: 'ignored' });
    log.info('ai_gateway_error', { outcome: 'error' });
    workerName = getDeployment()?.worker_name;
  });
  assert.equal(workerName, 'construct-api-production');
});

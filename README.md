# @construct/observability

Shared wide-event structured logging for Construct platform Cloudflare Workers.

## Usage

```typescript
import {
  createServiceLogger,
  wideEventMiddleware,
  AgentTurnRecorder,
} from '@construct/observability';

const log = createServiceLogger(env, {
  serviceName: 'construct-api',
  workerName: 'construct-api-staging',
}, 'my.module', { userId: '...' });

app.use('*', wideEventMiddleware({
  serviceName: 'construct-api',
  workerName: 'construct-api-staging',
  getUserId: (c) => c.get('userId'),
}));
```

## Submodule

Add to consumer repos:

```bash
git submodule add git@github.com:construct-computer/observability.git observability
```

```json
"@construct/observability": "file:../observability"
```

## Wrangler

See `wrangler-snippet.toml` for observability blocks.

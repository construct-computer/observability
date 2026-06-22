# @construct/observability

Minimal analytics + essential error logging for Construct platform workers.

## API

```ts
import { track, log } from '@construct/observability';

track(env, {
  event: 'llm_call',
  trigger: 'user',
  userId,
  model: 'gpt-4o',
  costUsd: 0.002,
});

log(env, {
  kind: 'log',
  level: 'error',
  source: 'agent.loop',
  message: 'Turn crashed',
  error,
  userId,
  sessionKey,
  context: { iteration: 3 },
});
```

Both functions are fire-and-forget and never throw. Messages are sent to `ANALYTICS_QUEUE` with envelope `kind: 'analytics' | 'log'`.

## Logging policy

- **log(error|warn)** — actionable failures only (5xx, turn crash, hard tool/LLM failure, billing/webhook errors)
- **track()** — metrics (llm_call, tool_call, agent_turn, incident, user_activity, system_event)
- Do not duplicate full stack traces in analytics payloads — use `log()` for stacks

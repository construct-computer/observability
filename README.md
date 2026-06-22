# @construct/observability — archived

This package has been **removed** as part of the observability teardown (June 2026).

The previous wide-event logging pipeline (`createLogger`, `LOGS_QUEUE` → Observer D1) did not deliver actionable user analytics and has been deleted across all platform workers.

## Replacement

A new analytics SDK and Observer data model will be built under:

- `@construct/analytics` (TBD) — minimal event emission from construct/memory/app-registry workers
- [construct-observer](https://github.com/construct-computer/observer) — user-first analytics UI

Do not add new dependencies on this package.

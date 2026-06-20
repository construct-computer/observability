import { humanizeEventKey, normalizeEventKey } from './event-text';

export function lookupEventLabel(eventKey: string): string | undefined {
  if (!eventKey) return undefined;
  const normalized = normalizeEventKey(eventKey);
  return EVENT_LABELS[normalized] ?? EVENT_LABELS[eventKey];
}

export function resolveEventTitle(eventKey: string, errorSource?: string): string {
  if (eventKey === 'error' && errorSource && ERROR_SOURCE_LABELS[errorSource]) {
    return ERROR_SOURCE_LABELS[errorSource];
  }
  return lookupEventLabel(eventKey) ?? humanizeEventKey(eventKey);
}

export const ERROR_SOURCE_LABELS: Record<string, string> = {
  alarm: 'Agent alarm handler error',
  agent_loop: 'Agent loop error',
  agent_do_execute_session_loop_unexpected: 'Unexpected agent session error',
  websocket: 'WebSocket error',
  memory_ingest: 'Memory ingest error',
  process_queued_messages: 'Queued message processing error',
  schedule_alarm: 'Alarm scheduling error',
  slack_tool: 'Slack tool error',
  composio: 'Composio integration error',
  webhook: 'Webhook handler error',
};

export const EVENT_LABELS: Record<string, string> = {
  http_request: 'HTTP request',
  worker_error: 'Unhandled worker error',
  worker_deploy: 'Worker deployed',
  agent_turn: 'Agent turn completed',
  error: 'Structured error',

  logs_ingest_batch: 'Log ingest batch processed',
  logs_ingest_rejected: 'Log ingest rejected',
  logs_query: 'Log query executed',
  logs_retention_pruned: 'Log retention prune completed',

  query_executed: 'Telemetry query',
  user_ids_index: 'User ID index refreshed',

  memory_ingest: 'Memory ingest',
  memory_recall: 'Memory recall',
  memory_do_error: 'Memory DO error',
  do_metrics_snapshot_failed: 'Memory metrics snapshot failed',
  memory_vector_sync_failed: 'Memory vector index sync failed',
  memory_vector_batch_sync_failed: 'Memory vector batch sync failed',
  memory_vector_recall_failed: 'Memory vector recall failed',
  memory_fts_recall_failed: 'Memory full-text recall failed',
  memory_rerank_timeout: 'Memory rerank timed out',
  memory_rerank_failed: 'Memory rerank failed',
  memory_llm_extraction_unusable: 'Memory LLM extraction unusable',
  memory_recall_embedding_failed: 'Memory recall embedding failed',

  registry_sync: 'App registry sync',
  registry_sync_failed: 'App registry sync failed',
  registry_sync_parse_failed: 'App registry parse failed',
  registry_sync_rejected_app: 'App registry rejected app',
  registry_sync_subdomain_allocate_failed: 'Registry subdomain allocation failed',
  registry_sync_owner_mismatch: 'Registry app owner mismatch',
  registry_env_encryption_missing: 'Registry env encryption key missing',
  registry_env_decrypt_failed: 'Registry app env decrypt failed',
  registry_call_token_mint_failed: 'Registry call token mint failed',
  dev_dashboard_error: 'App registry dev dashboard error',

  cron_run: 'Scheduled cron job',
  cron_browser_screenshots_cleanup_failed: 'Browser screenshots cleanup failed',
  cron_backfill_existence_check_failed: 'Browser screenshot backfill check failed',
  unhandled_request_error: 'Unhandled request error',
  optional_env_vars_missing: 'Optional env vars missing',

  agent_do_initialized: 'Agent DO initialized',
  ws_session: 'WebSocket session',
  session_stalled: 'Agent session stalled',
  queue_recovery_reopened: 'Message queue recovered',
  queue_recovery_skipped: 'Message queue recovery skipped',
  process_queued_messages_failed: 'Failed to process queued messages',
  alarm_handler_complete: 'Alarm handler completed',
  alarm_firing: 'Alarm firing',
  alarm_tick_no_due_alarms: 'Alarm tick — no due alarms',
  agent_email_received: 'New email routed to agent',
  agent_calendar_reminder_sent: 'Calendar reminder sent',
  agent_scheduled_task_executed: 'Scheduled task executed',
  agent_schedule_reconciled: 'Schedule reconciliation',
  agent_resumed: 'Agent resumed',
  browser_session_cleanup: 'Browser session cleanup',
  browser_idle_stop: 'Browser idle stopped',
  unknown_alarm_type: 'Unknown alarm type',
  background_tick: 'Agent background tick',

  agent_turn_start: 'Agent turn started',
  agent_iteration: 'Agent iteration',
  agent_tools_requested: 'Agent requested tools',
  model_call_start: 'LLM call started',
  model_call_end: 'LLM call finished',
  llm_call: 'LLM gateway call',
  first_token: 'First LLM token received',
  empty_llm_response: 'Empty LLM response',
  billed_empty_completion: 'Billed empty completion',
  billed_empty_completion_recovered: 'Empty completion recovered',
  billed_empty_completion_retry: 'Empty completion retry',
  billed_empty_completion_retry_failed: 'Empty completion retry failed',
  billed_empty_response_retry: 'Empty response retry',
  llm_usage_missing: 'LLM usage missing',
  model_policy: 'Model policy decision',
  max_output_escalated: 'Max output escalated',
  hybrid_classifier_override: 'Hybrid classifier override',
  semantic_router_hits: 'Semantic router hits',
  semantic_router_failed: 'Semantic router failed',
  context_budget_pressure: 'Context budget pressure',
  context_needs_compaction: 'Context needs compaction',
  history_slimmed_for_budget: 'History slimmed for budget',
  deferred_tools_auto_discovered: 'Deferred tools auto-discovered',
  discovered_tools_pruned: 'Discovered tools pruned',
  tool_schemas_compressed: 'Tool schemas compressed',
  planner_injected: 'Planner injected',
  planner_failed: 'Planner failed',
  verifier_issues_found: 'Verifier found issues',
  verifier_failed: 'Verifier failed',
  session_heal_failed: 'Session heal failed',
  session_autocompacted: 'Session autocompacted',
  session_memory_extraction_failed: 'Session memory extraction failed',
  usage_notification_sent: 'Usage notification sent',
  usage_record_failed: 'Usage record failed',
  memory_ingest_failed: 'Memory ingest failed',
  memory_ingest_retry_ok: 'Memory ingest retry succeeded',
  memory_ingest_retry_failed: 'Memory ingest retry failed',
  memory_ingest_retry_enqueue_failed: 'Memory ingest retry enqueue failed',
  memory_prompt_cache_invalidation_failed: 'Memory prompt cache invalidation failed',

  billing_checkout_failed: 'Billing checkout failed',
  auth_google_token_exchange_failed: 'Google sign-in token exchange failed',
  memories_list_failed: 'Memory list failed',
  memories_search_failed: 'Memory search failed',
  memories_delete_failed: 'Memory delete failed',

  api_overloaded_retrying: 'API overloaded — retrying',
  rate_limit_waiting: 'Rate limit — waiting',
  rate_limit_switching_fallback: 'Rate limit — switching model',
  rate_limit_switch_capped: 'Rate limit — switch capped',
  prompt_too_long_escalating_model: 'Prompt too long — escalating model',
  prompt_too_long_forcing_compaction: 'Prompt too long — forcing compaction',
  emergency_compaction_failed: 'Emergency compaction failed',
  server_error_retrying: 'Server error — retrying',
  stream_parse_error_retrying: 'Stream parse error — retrying',
  tool_incapable_fallback_skipped: 'Tool-incapable fallback skipped',
  media_size_error_stripping_context: 'Media size error — stripping context',
  ai_gateway_error: 'AI gateway error',
  ai_gateway_fallback_step: 'AI gateway fallback step',
  provider_cooldown_wait: 'Provider cooldown wait',
  provider_queue_pressure: 'Provider queue pressure',
  non_streaming_error_body: 'Non-streaming error body',

  ingest_request: 'Memory provider ingest request',
  ingest_result: 'Memory provider ingest result',
  enqueued_failed_ingest: 'Enqueued failed memory ingest',
  request_ok: 'Memory provider request OK',
  request_failed: 'Memory provider request failed',
  ingest_turn: 'Session memory ingest turn',

  tool_validation_invalid_input: 'Tool validation — invalid input',
  tool_validation_parse_error: 'Tool validation — parse error',
  tool_validation_semantic_block: 'Tool validation — semantic block',

  slack_api_failure: 'Slack API failure',
  slack_operation_failed: 'Slack operation failed',

  client_log: 'Frontend client log',

  internal_fetch: 'Internal service call',
};

export const INTERNAL_PATH_LABELS: Record<string, string> = {
  '/stats/summary': 'System stats summary',
  '/stats/timeseries': 'Stats time series',
  '/stats/cache-status': 'Public status cache',
  '/stats/update': 'Stats update publish',
  '/stats/ops-event': 'Ops event publish',
  '/admin/profiles/list': 'Admin profile list',
  '/admin/profiles/get': 'Admin profile get',
  '/admin/wipe-stats': 'Admin wipe stats',
};

export const SPAN_LABELS: Record<string, string> = {
  d1_all: 'Database query',
  d1_first: 'Database query',
  d1_exec: 'Database execute',
  durable_object_storage_setAlarm: 'Durable Object alarm schedule',
  durable_object_storage_exec: 'Durable Object storage',
  fetch: 'HTTP fetch',
};

export const NOISE_SPAN_PREFIXES = ['d1_', 'durable_object_', 'kv_', 'r2_'] as const;

/** Events allowed without snake_case strict validation. */
export const EVENT_ALIASES = new Set(['error', 'http_request', 'agent_turn', 'worker_deploy', 'client_log']);

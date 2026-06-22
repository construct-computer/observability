export type AnalyticsTrigger =
  | 'user'
  | 'scheduled'
  | 'background'
  | 'webhook'
  | 'system'
  | 'platform';

export type AnalyticsEventName =
  | 'llm_call'
  | 'tool_call'
  | 'agent_turn'
  | 'incident'
  | 'user_activity'
  | 'system_event';

export interface BaseAnalyticsFields {
  event: AnalyticsEventName;
  trigger: AnalyticsTrigger;
  userId?: string;
  sessionKey?: string;
  requestId?: string;
  traceId?: string;
  occurredAt?: string;
  service?: string;
}

export interface LlmCallEvent extends BaseAnalyticsFields {
  event: 'llm_call';
  model: string;
  provider?: string;
  action?: string;
  promptTokens?: number;
  completionTokens?: number;
  costUsd?: number;
  billedTo?: string;
  ttftMs?: number;
  latencyMs?: number;
}

export interface ToolCallEvent extends BaseAnalyticsFields {
  event: 'tool_call';
  toolName: string;
  provider?: string;
  durationMs?: number;
  success: boolean;
  errorClass?: string;
  attempt?: number;
}

export interface AgentTurnEvent extends BaseAnalyticsFields {
  event: 'agent_turn';
  iterations?: number;
  toolCount?: number;
  toolFailures?: number;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  terminalReason?: string;
  durationMs?: number;
}

export interface IncidentEvent extends BaseAnalyticsFields {
  event: 'incident';
  kind: string;
  scope?: string;
  severity?: string;
  toolName?: string;
  recoverability?: string;
}

export interface UserActivityEvent extends BaseAnalyticsFields {
  event: 'user_activity';
  activityType: string;
  surface?: string;
}

export interface SystemEvent extends BaseAnalyticsFields {
  event: 'system_event';
  name: string;
  source: string;
  detail?: Record<string, unknown>;
}

export type AnalyticsEvent =
  | LlmCallEvent
  | ToolCallEvent
  | AgentTurnEvent
  | IncidentEvent
  | UserActivityEvent
  | SystemEvent;

export type LogLevel = 'error' | 'warn';

export interface LogEvent {
  kind: 'log';
  level: LogLevel;
  source: string;
  message: string;
  error?: unknown;
  userId?: string;
  sessionKey?: string;
  requestId?: string;
  traceId?: string;
  occurredAt?: string;
  service?: string;
  context?: Record<string, unknown>;
}

export type QueueEnvelope =
  | ({ kind: 'analytics' } & AnalyticsEvent)
  | LogEvent;

export interface ObservabilityEnv {
  ANALYTICS_QUEUE?: Queue;
  ENVIRONMENT?: string;
  APP_VERSION?: string;
  /** Wrangler script name, e.g. construct-api-staging */
  SERVICE_NAME?: string;
}

export interface ExecutionContextLike {
  waitUntil(promise: Promise<unknown>): void;
}

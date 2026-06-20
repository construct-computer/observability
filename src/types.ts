export type WideEventLevel = 'info' | 'error';

export type WideEventSeverity = 'debug' | 'info' | 'warn' | 'error';

export type WideEventOutcome = 'success' | 'error' | 'partial' | 'timeout';

export type TriggerClass = 'user' | 'user_async' | 'system' | 'system_background';

export interface DeploymentContext {
  service_name: string;
  environment: string;
  version: string;
  worker_name?: string;
}

export interface WideEventPartial {
  level: WideEventLevel;
  event: string;
  source: string;
  outcome: WideEventOutcome;
  severity?: WideEventSeverity;
  trigger_class?: TriggerClass;

  request_id?: string;
  trace_id?: string;
  correlation_id?: string;
  cf_ray?: string;
  cf_colo?: string;
  cf_country?: string;

  method?: string;
  path?: string;
  route?: string;
  status?: number;
  status_bucket?: '2xx' | '3xx' | '4xx' | '5xx';
  duration_ms?: number;

  user_id?: string;
  username?: string;
  session_key?: string;
  platform?: string;
  functionality?: string;
  plan?: string;

  tool_calls?: number;
  input_tokens?: number;
  output_tokens?: number;
  model?: string;
  cost_usd?: number;

  error_message?: string;
  error_type?: string;
  error_source?: string;
  error_location?: string;
  stack_trace?: string;

  extra?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface WideEvent extends WideEventPartial {
  service_name: string;
  environment: string;
  version: string;
  worker_name?: string;
  timestamp: string;
}

export interface ObservabilityEnv {
  ENVIRONMENT?: string;
  APP_VERSION?: string;
  LOGS_QUEUE?: { send: (body: WideEvent, options?: any) => Promise<any> };
}

export interface LogContext {
  correlationId?: string;
  userId?: string;
  user_id?: string;
  sessionKey?: string;
  session_key?: string;
  requestId?: string;
  request_id?: string;
  traceId?: string;
  trace_id?: string;
  username?: string;
  platform?: string;
  plan?: string;
  functionality?: string;
  cfRay?: string;
  cf_ray?: string;
  cfColo?: string;
  cf_colo?: string;
  outcome?: WideEventOutcome;
  trigger_class?: TriggerClass;
  [key: string]: unknown;
}

export interface Logger {
  info: (event: string, extra?: Record<string, unknown>) => void;
  error: (event: string, extra?: Record<string, unknown>) => void;
  warn: (event: string, extra?: Record<string, unknown>) => void;
  debug: (event: string, extra?: Record<string, unknown>) => void;
}

export interface LoggerForwardOptions {
  queue?: ObservabilityEnv['LOGS_QUEUE'];
  waitUntil?: (promise: Promise<unknown>) => void;
}

export type WideEventLevel = 'info' | 'error';

export type WideEventOutcome = 'success' | 'error' | 'partial' | 'timeout';

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
  [key: string]: unknown;
}

export interface Logger {
  info: (event: string, extra?: Record<string, unknown>) => void;
  error: (event: string, extra?: Record<string, unknown>) => void;
  /** Maps to info level with outcome in payload (CF uses info + error for two-level policy). */
  warn: (event: string, extra?: Record<string, unknown>) => void;
  debug: (event: string, extra?: Record<string, unknown>) => void;
}

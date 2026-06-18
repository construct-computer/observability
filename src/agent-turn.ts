import type { Logger, WideEventOutcome } from './types';

export interface AgentTurnStats {
  model?: string;
  iterations?: number;
  tool_calls?: number;
  tool_failures?: number;
  memory_calls?: number;
  input_tokens?: number;
  output_tokens?: number;
  cost_usd?: number;
  duration_ms?: number;
  platform?: string;
  scheduled_run?: boolean;
  byok_active?: boolean;
  gateway_fallback_steps?: number;
  incident_count?: number;
  finish_reason?: string;
  terminal_reason?: string;
}

/**
 * Accumulates agent turn context and emits one canonical `agent_turn` wide event at completion.
 */
export class AgentTurnRecorder {
  private readonly startedAt = Date.now();
  private stats: AgentTurnStats = {};
  private outcome: WideEventOutcome = 'success';

  constructor(
    private readonly logger: Logger,
    private readonly base: Record<string, unknown> = {},
  ) {}

  setStat<K extends keyof AgentTurnStats>(key: K, value: AgentTurnStats[K]): void {
    this.stats[key] = value;
  }

  mergeStats(partial: AgentTurnStats): void {
    this.stats = { ...this.stats, ...partial };
  }

  markError(reason?: string): void {
    this.outcome = 'error';
    if (reason) this.stats.terminal_reason = reason;
  }

  markPartial(reason?: string): void {
    this.outcome = 'partial';
    if (reason) this.stats.terminal_reason = reason;
  }

  markTimeout(): void {
    this.outcome = 'timeout';
  }

  finish(extra?: Record<string, unknown>): void {
    const duration_ms = Date.now() - this.startedAt;
    this.logger.info('agent_turn', {
      ...this.base,
      outcome: this.outcome,
      duration_ms,
      extra: {
        ...this.stats,
        ...extra,
      },
    });
  }
}

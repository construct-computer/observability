import type { Logger, WideEventOutcome, TriggerClass } from './types';

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
    const trigger_class: TriggerClass = this.stats.scheduled_run ? 'user_async' : 'user';
    const overflow: Record<string, unknown> = {};
    const topLevel: Record<string, unknown> = {
      ...this.base,
      outcome: this.outcome,
      duration_ms,
      trigger_class,
      model: this.stats.model,
      tool_calls: this.stats.tool_calls,
      input_tokens: this.stats.input_tokens,
      output_tokens: this.stats.output_tokens,
      cost_usd: this.stats.cost_usd,
      platform: this.stats.platform,
    };

    for (const [key, value] of Object.entries(this.stats)) {
      if (value === undefined) continue;
      if (key in topLevel) continue;
      overflow[key] = value;
    }

    this.logger.info('agent_turn', {
      ...topLevel,
      ...(Object.keys(overflow).length > 0 || extra ? {
        extra: { ...overflow, ...extra },
      } : {}),
    });
  }
}

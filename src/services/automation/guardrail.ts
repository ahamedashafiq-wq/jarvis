import { Automation, AutomationTriggerType, NotificationItem } from '../../types';
import { getLocalStore, setLocalStore } from '../supabase';
import { realtimeService } from '../realtime';

export interface GuardrailCheckResult {
  allowed: boolean;
  reason?: string;
  isLoop?: boolean;
  isDuplicate?: boolean;
  isRateLimited?: boolean;
}

export class AutomationGuardrail {
  private static recentIdempotencyKeys: Map<string, number> = new Map();
  private static userHourlyRuns: Map<string, number[]> = new Map();

  private static MAX_HOURLY_RUNS = 30;
  private static MAX_CHAIN_DEPTH = 3;
  private static MAX_CONSECUTIVE_FAILURES = 3;

  /**
   * Pre-execution safety and guardrail check
   */
  public static checkSafety(
    automation: Automation,
    userId: string,
    triggerType: AutomationTriggerType,
    eventData?: any,
    chain: string[] = []
  ): GuardrailCheckResult {
    // 1. Status verification
    if (automation.status !== 'ACTIVE' && triggerType !== 'MANUAL') {
      return {
        allowed: false,
        reason: `Automation "${automation.name}" is currently ${automation.status}. Execution prevented.`,
      };
    }

    // 2. Loop Protection
    if (chain.includes(automation.id)) {
      this.handleLoopDetected(automation, userId, chain);
      return {
        allowed: false,
        isLoop: true,
        reason: `LOOP_DETECTED: Automation "${automation.name}" already in active execution chain [${chain.join(' -> ')}].`,
      };
    }

    if (chain.length >= this.MAX_CHAIN_DEPTH) {
      return {
        allowed: false,
        isLoop: true,
        reason: `MAX_DEPTH_EXCEEDED: Execution chain depth exceeded ${this.MAX_CHAIN_DEPTH}. Halted for safety.`,
      };
    }

    // 3. Duplicate Protection / Idempotency Key
    if (triggerType !== 'MANUAL') {
      const idempotencyKey = this.generateIdempotencyKey(automation.id, triggerType, eventData);
      const lastExecuted = this.recentIdempotencyKeys.get(idempotencyKey);
      const debounceMs = triggerType === 'SCHEDULE' ? 50 * 60 * 1000 : 3 * 60 * 1000; // 50m for schedule, 3m for events

      if (lastExecuted && Date.now() - lastExecuted < debounceMs) {
        return {
          allowed: false,
          isDuplicate: true,
          reason: `DUPLICATE_IGNORED: Same trigger event already executed within debounce window (${Math.round((Date.now() - lastExecuted) / 1000)}s ago).`,
        };
      }
    }

    // 4. Rate Limiting (Hourly max 30 runs per user)
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const userRuns = (this.userHourlyRuns.get(userId) || []).filter((t) => t > oneHourAgo);

    if (userRuns.length >= this.MAX_HOURLY_RUNS) {
      return {
        allowed: false,
        isRateLimited: true,
        reason: `RATE_LIMIT_EXCEEDED: Maximum allowed executions (${this.MAX_HOURLY_RUNS}/hour) reached. Automation deferred.`,
      };
    }

    // 5. Prompt Injection & Safe Policy Scan
    const safetyCheck = this.scanForPolicyViolations(automation);
    if (!safetyCheck.safe) {
      return {
        allowed: false,
        reason: safetyCheck.reason,
      };
    }

    return { allowed: true };
  }

  /**
   * Record a successful invocation in the idempotency and rate limiting stores
   */
  public static recordExecution(automationId: string, triggerType: AutomationTriggerType, userId: string, eventData?: any) {
    const key = this.generateIdempotencyKey(automationId, triggerType, eventData);
    this.recentIdempotencyKeys.set(key, Date.now());

    // Clean old keys periodically
    if (this.recentIdempotencyKeys.size > 500) {
      const threshold = Date.now() - 2 * 60 * 60 * 1000;
      for (const [k, timestamp] of this.recentIdempotencyKeys.entries()) {
        if (timestamp < threshold) {
          this.recentIdempotencyKeys.delete(k);
        }
      }
    }

    // Record rate limit timestamp
    const existing = this.userHourlyRuns.get(userId) || [];
    existing.push(Date.now());
    this.userHourlyRuns.set(userId, existing);
  }

  /**
   * Generates a stable deduplication key
   */
  private static generateIdempotencyKey(automationId: string, triggerType: AutomationTriggerType, eventData?: any): string {
    if (triggerType === 'SCHEDULE') {
      // Hour bucket: e.g. auto_123:SCHEDULE:2026-10-02-08
      const d = new Date();
      const dateStr = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}-${d.getHours()}`;
      return `${automationId}:SCHEDULE:${dateStr}`;
    }

    const eventId = eventData?.id || eventData?.title || eventData?.task_id || eventData?.mission_id || 'event';
    return `${automationId}:${triggerType}:${eventId}`;
  }

  /**
   * Handle an infinite loop situation
   */
  private static handleLoopDetected(automation: Automation, userId: string, chain: string[]) {
    // Automatically pause the recursive automation to prevent runaway behavior
    const automations = getLocalStore<Automation[]>(`automations_${userId}`, []);
    const updated = automations.map((a) =>
      a.id === automation.id ? { ...a, status: 'ERROR' as const, updated_at: Date.now() } : a
    );
    setLocalStore(`automations_${userId}`, updated);

    // Notify user of emergency halt
    const notif: NotificationItem = {
      id: 'notif_loop_' + Date.now(),
      user_id: userId,
      title: 'SECURITY HALT: LOOP DETECTED',
      message: `Automation "${automation.name}" was paused automatically after detecting a recursive trigger cycle: [${chain.join(
        ' → '
      )}].`,
      type: 'WARNING',
      read: false,
      created_at: Date.now(),
    };

    const existingNotifs = getLocalStore<NotificationItem[]>(`notifications_${userId}`, []);
    setLocalStore(`notifications_${userId}`, [notif, ...existingNotifs]);
    realtimeService.broadcast('NOTIFICATION_CREATED', notif);
    realtimeService.broadcast('AUTOMATION_PAUSED', { id: automation.id, reason: 'LOOP_DETECTED' });
  }

  /**
   * Handle consecutive failures
   */
  public static handleFailure(automation: Automation, userId: string, errorMsg: string): { autoPaused: boolean } {
    const automations = getLocalStore<Automation[]>(`automations_${userId}`, []);
    const target = automations.find((a) => a.id === automation.id);
    if (!target) return { autoPaused: false };

    const consecutiveFailures = (target.consecutive_failures || 0) + 1;
    const shouldPause = consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES;

    const updated = automations.map((a) => {
      if (a.id === automation.id) {
        return {
          ...a,
          consecutive_failures: consecutiveFailures,
          failure_runs: a.failure_runs + 1,
          total_runs: a.total_runs + 1,
          status: shouldPause ? ('ERROR' as const) : a.status,
          updated_at: Date.now(),
        };
      }
      return a;
    });

    setLocalStore(`automations_${userId}`, updated);

    if (shouldPause) {
      const notif: NotificationItem = {
        id: 'notif_err_' + Date.now(),
        user_id: userId,
        title: 'AUTOMATION PAUSED: REPEATED FAILURES',
        message: `Automation "${target.name}" failed ${consecutiveFailures} consecutive times and was paused automatically: ${errorMsg}`,
        type: 'ERROR',
        read: false,
        created_at: Date.now(),
      };

      const existingNotifs = getLocalStore<NotificationItem[]>(`notifications_${userId}`, []);
      setLocalStore(`notifications_${userId}`, [notif, ...existingNotifs]);
      realtimeService.broadcast('NOTIFICATION_CREATED', notif);
      realtimeService.broadcast('AUTOMATION_PAUSED', { id: automation.id, reason: 'CONSECUTIVE_FAILURES' });
    }

    return { autoPaused: shouldPause };
  }

  /**
   * Strict validation ensuring automation never attempts prohibited operations
   */
  private static scanForPolicyViolations(automation: Automation): { safe: boolean; reason?: string } {
    const serialized = JSON.stringify(automation).toLowerCase();

    // Check for prohibited deletion or system actions
    if (serialized.includes('delete from') || serialized.includes('drop table') || serialized.includes('rm -rf')) {
      return { safe: false, reason: 'Prohibited destructive pattern detected in automation configuration.' };
    }

    // Check for arbitrary command or code execution
    if (serialized.includes('eval(') || serialized.includes('process.exit') || serialized.includes('child_process')) {
      return { safe: false, reason: 'Arbitrary code execution is strictly prohibited by Automation Guardrail.' };
    }

    // Check for credential exfiltration
    if (serialized.includes('api_key') && (serialized.includes('exfiltrate') || serialized.includes('send to http'))) {
      return { safe: false, reason: 'Sensitive credential access prohibited.' };
    }

    return { safe: true };
  }
}

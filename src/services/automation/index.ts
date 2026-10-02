import {
  Automation,
  AutomationAnalyticsData,
  AutomationRun,
  AutomationStatus,
  AutomationTriggerConfig,
  AutomationTriggerType,
  Mission,
} from '../../types';
import { actionRegistry } from './actionRegistry';
import { ConditionEngine } from './conditionEngine';
import { AutomationGuardrail } from './guardrail';
import { MissionService } from '../mission';
import { getLocalStore, setLocalStore } from '../supabase';
import { realtimeService } from '../realtime';

export class AutomationService {
  // ----------------------------------------------------
  // 1. AUTOMATION CONFIGURATION CRUD
  // ----------------------------------------------------

  public static getAutomations(userId: string): Automation[] {
    const raw = getLocalStore<Automation[]>(`automations_${userId}`, []);
    return raw.filter((a) => a.user_id === userId);
  }

  public static getAutomationById(userId: string, id: string): Automation | null {
    const list = this.getAutomations(userId);
    return list.find((a) => a.id === id) || null;
  }

  public static createAutomation(userId: string, data: Partial<Automation>): Automation {
    const triggerType: AutomationTriggerType = data.trigger_type || 'MANUAL';
    const triggerConfig: AutomationTriggerConfig = data.trigger_config || {};

    const nextRun = triggerType === 'SCHEDULE' ? this.calculateNextRunTime(triggerConfig) : null;

    const automation: Automation = {
      id: 'auto_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      user_id: userId,
      name: (data.name || 'Automated Directive').trim(),
      description: (data.description || 'Configured automation workflow').trim(),
      status: (data.status as AutomationStatus) || 'ACTIVE',
      trigger_type: triggerType,
      trigger_config: triggerConfig,
      condition_config: data.condition_config || [],
      action_config: data.action_config || {
        type: 'CREATE_NOTIFICATION',
        parameters: { title: 'Workflow Executed', message: 'Directive triggered.' },
      },
      requires_confirmation: Boolean(data.requires_confirmation),
      notify_on_run: data.notify_on_run !== false,
      last_run_at: null,
      next_run_at: nextRun,
      total_runs: 0,
      success_runs: 0,
      failure_runs: 0,
      consecutive_failures: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    const existing = this.getAutomations(userId);
    const updated = [automation, ...existing];
    setLocalStore(`automations_${userId}`, updated);

    realtimeService.broadcast('AUTOMATION_CREATED', automation);
    return automation;
  }

  public static updateAutomation(userId: string, id: string, updates: Partial<Automation>): Automation | null {
    const automations = this.getAutomations(userId);
    const target = automations.find((a) => a.id === id);
    if (!target) return null;

    const triggerConfig = updates.trigger_config || target.trigger_config;
    const triggerType = updates.trigger_type || target.trigger_type;
    const nextRun =
      triggerType === 'SCHEDULE' ? this.calculateNextRunTime(triggerConfig) : target.next_run_at;

    const updatedAutomation: Automation = {
      ...target,
      ...updates,
      trigger_config: triggerConfig,
      trigger_type: triggerType,
      next_run_at: nextRun,
      updated_at: Date.now(),
    };

    const updatedList = automations.map((a) => (a.id === id ? updatedAutomation : a));
    setLocalStore(`automations_${userId}`, updatedList);

    realtimeService.broadcast('AUTOMATION_UPDATED', updatedAutomation);
    return updatedAutomation;
  }

  public static pauseAutomation(userId: string, id: string): boolean {
    const updated = this.updateAutomation(userId, id, { status: 'PAUSED' });
    if (updated) {
      realtimeService.broadcast('AUTOMATION_PAUSED', { id });
      return true;
    }
    return false;
  }

  public static resumeAutomation(userId: string, id: string): boolean {
    const target = this.getAutomationById(userId, id);
    if (!target) return false;

    const nextRun =
      target.trigger_type === 'SCHEDULE' ? this.calculateNextRunTime(target.trigger_config) : null;

    const updated = this.updateAutomation(userId, id, {
      status: 'ACTIVE',
      consecutive_failures: 0,
      next_run_at: nextRun,
    });

    if (updated) {
      realtimeService.broadcast('AUTOMATION_RESUMED', { id });
      return true;
    }
    return false;
  }

  public static deleteAutomation(userId: string, id: string): boolean {
    const automations = this.getAutomations(userId);
    const filtered = automations.filter((a) => a.id !== id);
    if (filtered.length === automations.length) return false;

    setLocalStore(`automations_${userId}`, filtered);
    realtimeService.broadcast('AUTOMATION_DELETED', { id });
    return true;
  }

  // ----------------------------------------------------
  // 2. AUTOMATION EXECUTION LOGS
  // ----------------------------------------------------

  public static getRuns(userId: string, automationId?: string): AutomationRun[] {
    const raw = getLocalStore<AutomationRun[]>(`automation_runs_${userId}`, []);
    const userRuns = raw.filter((r) => r.user_id === userId);
    if (automationId) {
      return userRuns.filter((r) => r.automation_id === automationId).sort((a, b) => b.started_at - a.started_at);
    }
    return userRuns.sort((a, b) => b.started_at - a.started_at);
  }

  public static recordRun(userId: string, run: AutomationRun) {
    const existing = this.getRuns(userId);
    const updated = [run, ...existing.filter((r) => r.id !== run.id)].slice(0, 100);
    setLocalStore(`automation_runs_${userId}`, updated);
  }

  // ----------------------------------------------------
  // 3. EXECUTION ENGINE (Trigger -> Condition -> Guardrail -> Action -> Verify)
  // ----------------------------------------------------

  /**
   * Event-driven trigger processor called by subsystem hooks
   */
  public static async triggerEvent(
    userId: string,
    triggerType: AutomationTriggerType,
    eventData?: any,
    chain: string[] = []
  ): Promise<AutomationRun[]> {
    const automations = this.getAutomations(userId);
    const matching = automations.filter((a) => a.status === 'ACTIVE' && a.trigger_type === triggerType);

    const executedRuns: AutomationRun[] = [];

    for (const automation of matching) {
      const run = await this.executeSingleAutomation(automation, userId, triggerType, eventData, chain);
      if (run) {
        executedRuns.push(run);
      }
    }

    return executedRuns;
  }

  /**
   * Manual invocation (Run Now)
   */
  public static async runNow(userId: string, automationId: string, manualReason?: string): Promise<AutomationRun> {
    const automation = this.getAutomationById(userId, automationId);
    if (!automation) {
      throw new Error(`Automation "${automationId}" not located.`);
    }

    const run = await this.executeSingleAutomation(
      automation,
      userId,
      'MANUAL',
      { manualReason: manualReason || 'Manual test triggered by operator' },
      []
    );

    return run;
  }

  /**
   * Core Single Automation Pipeline
   */
  private static async executeSingleAutomation(
    automation: Automation,
    userId: string,
    triggerType: AutomationTriggerType,
    eventData?: any,
    chain: string[] = []
  ): Promise<AutomationRun> {
    const startTime = performance.now();
    const runId = 'run_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    const initialRun: AutomationRun = {
      id: runId,
      automation_id: automation.id,
      automation_name: automation.name,
      user_id: userId,
      status: 'RUNNING',
      triggered_at: Date.now(),
      started_at: Date.now(),
      trigger_type: triggerType,
      trigger_detail: `Triggered by ${triggerType}${eventData?.title ? `: "${eventData.title}"` : ''}`,
      action_type: automation.action_config.type,
      result_summary: 'Initializing guardrail and condition checks...',
      verified: false,
    };

    realtimeService.broadcast('AUTOMATION_STARTED', { automationId: automation.id, runId });

    // Step 1: Guardrail & Policy Check
    const guardrail = AutomationGuardrail.checkSafety(automation, userId, triggerType, eventData, chain);
    if (!guardrail.allowed) {
      const skippedRun: AutomationRun = {
        ...initialRun,
        status: guardrail.isLoop ? 'FAILED' : 'SKIPPED',
        completed_at: Date.now(),
        duration_ms: Math.round(performance.now() - startTime),
        result_summary: guardrail.reason || 'Guardrail rejected automation execution.',
        error_message: guardrail.reason,
      };

      this.recordRun(userId, skippedRun);
      realtimeService.broadcast(guardrail.isLoop ? 'AUTOMATION_FAILED' : 'AUTOMATION_SKIPPED', skippedRun);
      return skippedRun;
    }

    // Step 2: Condition Evaluation against real data
    const conditionResult = ConditionEngine.evaluateConditions(automation.condition_config || [], {
      userId,
      eventData,
    });

    if (!conditionResult.passed) {
      const skippedRun: AutomationRun = {
        ...initialRun,
        status: 'SKIPPED',
        completed_at: Date.now(),
        duration_ms: Math.round(performance.now() - startTime),
        condition_evaluation: conditionResult,
        result_summary: `Conditions not satisfied: ${conditionResult.details.join('; ')}`,
      };

      this.recordRun(userId, skippedRun);
      realtimeService.broadcast('AUTOMATION_SKIPPED', skippedRun);
      return skippedRun;
    }

    // Step 3: Action Execution
    const actionDef = actionRegistry.getAction(automation.action_config.type);
    if (!actionDef) {
      const failRun: AutomationRun = {
        ...initialRun,
        status: 'FAILED',
        completed_at: Date.now(),
        duration_ms: Math.round(performance.now() - startTime),
        result_summary: `Unknown action type: "${automation.action_config.type}".`,
        error_message: 'Action not allowlisted in registry.',
      };
      this.recordRun(userId, failRun);
      AutomationGuardrail.handleFailure(automation, userId, failRun.error_message!);
      realtimeService.broadcast('AUTOMATION_FAILED', failRun);
      return failRun;
    }

    // Validate parameters
    const paramValidation = actionDef.validate(automation.action_config.parameters || {});
    if (!paramValidation.valid) {
      const failRun: AutomationRun = {
        ...initialRun,
        status: 'FAILED',
        completed_at: Date.now(),
        duration_ms: Math.round(performance.now() - startTime),
        result_summary: `Action parameter validation failed: ${paramValidation.error}`,
        error_message: paramValidation.error,
      };
      this.recordRun(userId, failRun);
      AutomationGuardrail.handleFailure(automation, userId, failRun.error_message!);
      realtimeService.broadcast('AUTOMATION_FAILED', failRun);
      return failRun;
    }

    // Step 4: Execute safe action
    try {
      const actionResult = await actionDef.execute(automation.action_config.parameters || {}, {
        userId,
        automationName: automation.name,
        eventData,
      });

      if (!actionResult.success) {
        throw new Error(actionResult.resultSummary || 'Action returned failure status.');
      }

      // Step 5: Verification Phase
      const verification = await actionDef.verify(
        automation.action_config.parameters || {},
        actionResult.data,
        userId
      );

      const durationMs = Math.round(performance.now() - startTime);

      const successRun: AutomationRun = {
        ...initialRun,
        status: 'SUCCESS',
        completed_at: Date.now(),
        duration_ms: durationMs,
        condition_evaluation: conditionResult,
        result_summary: `${actionResult.resultSummary} [Verified: ${verification.detail}]`,
        verified: verification.verified,
      };

      // Record successful execution in idempotency cache
      AutomationGuardrail.recordExecution(automation.id, triggerType, userId, eventData);

      // Update automation metadata
      const nextRun =
        automation.trigger_type === 'SCHEDULE' ? this.calculateNextRunTime(automation.trigger_config) : automation.next_run_at;

      this.updateAutomation(userId, automation.id, {
        last_run_at: Date.now(),
        next_run_at: nextRun,
        total_runs: automation.total_runs + 1,
        success_runs: automation.success_runs + 1,
        consecutive_failures: 0,
      });

      this.recordRun(userId, successRun);
      realtimeService.broadcast('AUTOMATION_COMPLETED', successRun);
      return successRun;
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - startTime);
      const errMsg = err?.message || 'Action execution exception occurred.';

      const failedRun: AutomationRun = {
        ...initialRun,
        status: 'FAILED',
        completed_at: Date.now(),
        duration_ms: durationMs,
        condition_evaluation: conditionResult,
        result_summary: `Execution failed: ${errMsg}`,
        error_message: errMsg,
        verified: false,
      };

      AutomationGuardrail.handleFailure(automation, userId, errMsg);
      this.recordRun(userId, failedRun);
      realtimeService.broadcast('AUTOMATION_FAILED', failedRun);
      return failedRun;
    }
  }

  // ----------------------------------------------------
  // 4. SCHEDULE & DEADLINE BACKGROUND RUNNER
  // ----------------------------------------------------

  public static async checkScheduledAndDeadlines(userId: string): Promise<number> {
    const automations = this.getAutomations(userId);
    const now = Date.now();
    let executedCount = 0;

    // 1. Process due SCHEDULE automations
    const dueSchedule = automations.filter(
      (a) => a.status === 'ACTIVE' && a.trigger_type === 'SCHEDULE' && a.next_run_at && a.next_run_at <= now
    );

    for (const auto of dueSchedule) {
      await this.executeSingleAutomation(auto, userId, 'SCHEDULE', { scheduledTime: auto.next_run_at }, []);
      executedCount++;
    }

    // 2. Process MISSION_DEADLINE_APPROACHING automations
    const deadlineWatchers = automations.filter(
      (a) => a.status === 'ACTIVE' && a.trigger_type === 'MISSION_DEADLINE_APPROACHING'
    );

    if (deadlineWatchers.length > 0) {
      const missions = MissionService.getMissions(userId);
      const activeMissions = missions.filter((m) => m.status === 'ACTIVE');

      for (const m of activeMissions) {
        const hours = ConditionEngine.calculateHoursUntilDeadline(m.deadline);
        for (const watcher of deadlineWatchers) {
          const thresholdHours = Number(watcher.trigger_config.hoursBefore) || 24;
          if (hours <= thresholdHours) {
            await this.executeSingleAutomation(watcher, userId, 'MISSION_DEADLINE_APPROACHING', m, []);
            executedCount++;
          }
        }
      }
    }

    return executedCount;
  }

  // ----------------------------------------------------
  // 5. TIMEZONE-AWARE NEXT RUN CALCULATOR
  // ----------------------------------------------------

  public static calculateNextRunTime(config: AutomationTriggerConfig): number | null {
    if (!config) return null;
    const timeStr = config.time || '08:00';
    const [hoursStr, minutesStr] = timeStr.split(':');
    const targetHours = parseInt(hoursStr, 10) || 8;
    const targetMinutes = parseInt(minutesStr, 10) || 0;

    const now = new Date();
    const target = new Date();
    target.setHours(targetHours, targetMinutes, 0, 0);

    const freq = config.frequency || 'DAILY';

    switch (freq) {
      case 'DAILY': {
        if (target.getTime() <= now.getTime()) {
          target.setDate(target.getDate() + 1);
        }
        return target.getTime();
      }

      case 'WEEKLY': {
        const targetDays = Array.isArray(config.daysOfWeek) && config.daysOfWeek.length > 0 ? config.daysOfWeek : [0]; // default Sunday
        const currentDay = now.getDay();

        // Find next day in daysOfWeek
        let daysToAdd = 0;
        for (let i = 0; i <= 7; i++) {
          const checkDay = (currentDay + i) % 7;
          if (targetDays.includes(checkDay)) {
            const checkDate = new Date();
            checkDate.setDate(now.getDate() + i);
            checkDate.setHours(targetHours, targetMinutes, 0, 0);
            if (checkDate.getTime() > now.getTime()) {
              return checkDate.getTime();
            }
          }
        }
        target.setDate(target.getDate() + 7);
        return target.getTime();
      }

      case 'MONTHLY': {
        const targetDay = config.dayOfMonth || 1;
        target.setDate(targetDay);
        if (target.getTime() <= now.getTime()) {
          target.setMonth(target.getMonth() + 1);
        }
        return target.getTime();
      }

      case 'ONCE': {
        if (config.specificDate) {
          const parsed = Date.parse(config.specificDate);
          if (!isNaN(parsed) && parsed > now.getTime()) return parsed;
        }
        return target.getTime() > now.getTime() ? target.getTime() : null;
      }

      default:
        return target.getTime() <= now.getTime() ? target.getTime() + 24 * 60 * 60 * 1000 : target.getTime();
    }
  }

  // ----------------------------------------------------
  // 6. AUTOMATION ANALYTICS
  // ----------------------------------------------------

  public static getAnalytics(userId: string): AutomationAnalyticsData {
    const automations = this.getAutomations(userId);
    const runs = this.getRuns(userId);

    const active = automations.filter((a) => a.status === 'ACTIVE').length;
    const paused = automations.filter((a) => a.status === 'PAUSED' || a.status === 'ERROR').length;

    const totalRuns = runs.length;
    const successRuns = runs.filter((r) => r.status === 'SUCCESS').length;
    const failedRuns = runs.filter((r) => r.status === 'FAILED').length;
    const skippedRuns = runs.filter((r) => r.status === 'SKIPPED').length;

    const successRate = totalRuns > 0 ? Math.round((successRuns / totalRuns) * 100) : 100;

    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentRunsCount24h = runs.filter((r) => r.started_at > oneDayAgo).length;

    // Trigger counts
    const triggerMap: Record<string, number> = {};
    for (const a of automations) {
      triggerMap[a.trigger_type] = (triggerMap[a.trigger_type] || 0) + 1;
    }
    const topTriggers = Object.entries(triggerMap)
      .map(([trigger, count]) => ({ trigger, count }))
      .sort((a, b) => b.count - a.count);

    // Action counts
    const actionMap: Record<string, number> = {};
    for (const a of automations) {
      actionMap[a.action_config.type] = (actionMap[a.action_config.type] || 0) + 1;
    }
    const topActions = Object.entries(actionMap)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalAutomations: automations.length,
      activeAutomations: active,
      pausedAutomations: paused,
      totalRuns,
      successRuns,
      failedRuns,
      skippedRuns,
      successRate,
      recentRunsCount24h,
      topTriggers,
      topActions,
    };
  }
}

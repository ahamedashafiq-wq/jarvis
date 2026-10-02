import { AutomationCondition, ConditionOperator, Mission, Task } from '../../types';
import { MissionService } from '../mission';
import { getLocalStore } from '../supabase';

export interface ConditionEvaluationResult {
  passed: boolean;
  details: string[];
}

export class ConditionEngine {
  /**
   * Evaluate a set of structured conditions against actual application data
   */
  public static evaluateConditions(
    conditions: AutomationCondition[],
    context: {
      userId: string;
      eventData?: any;
      mission?: Mission;
      task?: Task;
    }
  ): ConditionEvaluationResult {
    if (!conditions || conditions.length === 0) {
      return {
        passed: true,
        details: ['No conditional filters specified (Direct pass)'],
      };
    }

    const { userId, eventData } = context;
    const details: string[] = [];
    let allPassed = true;

    // Load actual context data if not directly provided
    const mission: Mission | undefined =
      context.mission ||
      (eventData?.mission_id ? MissionService.getMissionById(userId, eventData.mission_id) : undefined) ||
      (eventData?.id && eventData?.goal ? (eventData as Mission) : undefined);

    const task: Task | undefined =
      context.task ||
      (eventData?.title && eventData?.priority && !eventData?.goal ? (eventData as Task) : undefined);

    for (const cond of conditions) {
      const actualValue = this.resolveFieldValue(cond.field, { userId, eventData, mission, task });
      const pass = this.compareValues(actualValue, cond.operator, cond.value);

      const logStr = `Condition [${cond.field} ${cond.operator} ${JSON.stringify(cond.value)}]: Actual = ${JSON.stringify(
        actualValue
      )} -> ${pass ? 'PASSED' : 'FAILED'}`;
      details.push(logStr);

      if (!pass) {
        allPassed = false;
      }
    }

    return {
      passed: allPassed,
      details,
    };
  }

  private static resolveFieldValue(
    field: string,
    context: {
      userId: string;
      eventData?: any;
      mission?: Mission;
      task?: Task;
    }
  ): any {
    const { userId, eventData, mission, task } = context;

    switch (field.toLowerCase()) {
      // 1. Mission fields
      case 'mission.status':
        return mission?.status || eventData?.status || 'UNKNOWN';

      case 'mission.priority':
        return mission?.priority || eventData?.priority || 'UNKNOWN';

      case 'mission.progress':
        return mission?.progress !== undefined ? mission.progress : eventData?.progress !== undefined ? eventData.progress : 0;

      case 'mission.is_incomplete':
      case 'mission.incomplete': {
        const status = mission?.status || eventData?.status;
        return status !== 'COMPLETED' && status !== 'CANCELLED';
      }

      // 2. Task fields
      case 'task.priority':
        return task?.priority || eventData?.priority || 'UNKNOWN';

      case 'task.status':
        return task?.status || eventData?.status || 'UNKNOWN';

      case 'task.is_incomplete':
      case 'task.incomplete': {
        const status = task?.status || eventData?.status;
        return status !== 'COMPLETED';
      }

      // 3. Deadline calculations
      case 'deadline_hours_remaining':
      case 'mission.deadline_hours': {
        const deadlineStr = mission?.deadline || eventData?.deadline;
        return this.calculateHoursUntilDeadline(deadlineStr);
      }

      // 4. Focus fields
      case 'focus.duration':
        return eventData?.duration !== undefined ? Number(eventData.duration) : 25;

      // 5. Global user metrics
      case 'clearance_rate': {
        const tasks = getLocalStore<Task[]>(`tasks_${userId}`, []);
        const completed = tasks.filter((t) => t.status === 'COMPLETED');
        return tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0;
      }

      default: {
        // Fallback to checking eventData key
        if (eventData && typeof eventData === 'object' && field in eventData) {
          return eventData[field];
        }
        return undefined;
      }
    }
  }

  private static compareValues(actual: any, operator: ConditionOperator, target: any): boolean {
    if (actual === undefined || actual === null) {
      if (operator === 'EQUALS') return target === null || target === undefined;
      if (operator === 'NOT_EQUALS') return target !== null && target !== undefined;
      return false;
    }

    switch (operator) {
      case 'EQUALS':
        if (typeof target === 'boolean') return Boolean(actual) === target;
        return String(actual).toLowerCase() === String(target).toLowerCase();

      case 'NOT_EQUALS':
        if (typeof target === 'boolean') return Boolean(actual) !== target;
        return String(actual).toLowerCase() !== String(target).toLowerCase();

      case 'LESS_THAN':
        return Number(actual) < Number(target);

      case 'GREATER_THAN':
        return Number(actual) > Number(target);

      case 'LESS_THAN_OR_EQUAL':
        return Number(actual) <= Number(target);

      case 'GREATER_THAN_OR_EQUAL':
        return Number(actual) >= Number(target);

      case 'IN': {
        if (Array.isArray(target)) {
          return target.some((t) => String(t).toLowerCase() === String(actual).toLowerCase());
        }
        if (typeof target === 'string') {
          return target.split(',').map((s) => s.trim().toLowerCase()).includes(String(actual).toLowerCase());
        }
        return false;
      }

      case 'CONTAINS':
        return String(actual).toLowerCase().includes(String(target).toLowerCase());

      default:
        return false;
    }
  }

  /**
   * Helper to parse natural deadline strings into estimated hours remaining
   */
  public static calculateHoursUntilDeadline(deadline?: string): number {
    if (!deadline) return 999;
    const lower = deadline.toLowerCase().trim();

    if (lower === 'today') return 12;
    if (lower === 'tomorrow') return 36;
    if (lower.includes('1 day')) return 24;
    if (lower.includes('2 day') || lower.includes('2 days')) return 48;
    if (lower.includes('3 day') || lower.includes('3 days')) return 72;
    if (lower.includes('week') || lower.includes('14 days')) return 168;

    // Check if ISO date string or timestamp
    const parsed = Date.parse(deadline);
    if (!isNaN(parsed)) {
      const diffMs = parsed - Date.now();
      return Math.round(diffMs / (1000 * 60 * 60));
    }

    // Default safe far deadline
    return 72;
  }
}

import { AutomationService } from './index';
import { realtimeService } from '../realtime';

class AutomationSchedulerService {
  private timerId: any = null;
  private currentUserId: string | null = null;
  private isChecking = false;
  private unsubs: (() => void)[] = [];

  public start(userId: string) {
    if (this.currentUserId === userId && this.timerId) return;

    this.stop();
    this.currentUserId = userId;

    // 1. Subscribe to Realtime Application Events for Event-Driven Triggers
    const unsubMissionCreated = realtimeService.subscribe('MISSION_CREATED', (e) => {
      AutomationService.triggerEvent(userId, 'MISSION_CREATED', e.payload).catch((err) =>
        console.warn('Automation trigger error:', err)
      );
    });

    const unsubMissionCompleted = realtimeService.subscribe('MISSION_COMPLETED', (e) => {
      AutomationService.triggerEvent(userId, 'MISSION_COMPLETED', e.payload).catch((err) =>
        console.warn('Automation trigger error:', err)
      );
    });

    const unsubObjCompleted = realtimeService.subscribe('OBJECTIVE_COMPLETED', (e) => {
      AutomationService.triggerEvent(userId, 'OBJECTIVE_COMPLETED', e.payload).catch((err) =>
        console.warn('Automation trigger error:', err)
      );
    });

    const unsubTaskCreated = realtimeService.subscribe('TASK_CREATED', (e) => {
      AutomationService.triggerEvent(userId, 'TASK_CREATED', e.payload).catch((err) =>
        console.warn('Automation trigger error:', err)
      );
    });

    const unsubTaskCompleted = realtimeService.subscribe('TASK_COMPLETED', (e) => {
      AutomationService.triggerEvent(userId, 'TASK_COMPLETED', e.payload).catch((err) =>
        console.warn('Automation trigger error:', err)
      );
    });

    const unsubFocusCompleted = realtimeService.subscribe('FOCUS_SESSION_STOPPED', (e) => {
      AutomationService.triggerEvent(userId, 'FOCUS_COMPLETED', e.payload).catch((err) =>
        console.warn('Automation trigger error:', err)
      );
    });

    this.unsubs = [
      unsubMissionCreated,
      unsubMissionCompleted,
      unsubObjCompleted,
      unsubTaskCreated,
      unsubTaskCompleted,
      unsubFocusCompleted,
    ];

    // 2. Initial schedule check
    setTimeout(() => {
      this.check();
    }, 1500);

    // 3. Periodic schedule & deadline monitor check every 25 seconds
    this.timerId = setInterval(() => {
      this.check();
    }, 25000);
  }

  public stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.unsubs.forEach((u) => {
      try {
        u();
      } catch {
        // ignore
      }
    });
    this.unsubs = [];
    this.currentUserId = null;
    this.isChecking = false;
  }

  private async check() {
    if (!this.currentUserId || this.isChecking) return;
    this.isChecking = true;

    try {
      await AutomationService.checkScheduledAndDeadlines(this.currentUserId);
    } catch (err) {
      console.warn('[Automation Scheduler] Error executing scheduled checks:', err);
    } finally {
      this.isChecking = false;
    }
  }
}

export const automationScheduler = new AutomationSchedulerService();

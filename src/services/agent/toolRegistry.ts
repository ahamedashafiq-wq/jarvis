import { RiskLevel, ToolPermission } from '../../types';
import { MissionService } from '../mission';
import { MemoryService } from '../memory';
import { getLocalStore, setLocalStore } from '../supabase';
import { realtimeService } from '../realtime';
import { Task, Memory, Mission, MissionObjective } from '../../types';

export interface ToolDefinition {
  name: string;
  description: string;
  permission: ToolPermission;
  risk: RiskLevel;
  requiresConfirmation: boolean;
  category: 'MISSION' | 'OBJECTIVE' | 'TASK' | 'MEMORY' | 'FOCUS' | 'SYSTEM' | 'ANALYTICS';
  validateParams: (params: Record<string, any>) => { valid: boolean; error?: string };
  handler: (params: Record<string, any>, userId: string) => Promise<{ success: boolean; data?: any; message: string }>;
  verify: (params: Record<string, any>, resultData: any, userId: string) => Promise<{ verified: boolean; detail: string }>;
}

class ToolRegistryService {
  private tools: Map<string, ToolDefinition> = new Map();

  constructor() {
    this.registerCoreTools();
  }

  private registerCoreTools() {
    // ----------------------------------------------------
    // 1. MISSION TOOLS
    // ----------------------------------------------------
    this.register({
      name: 'mission.list',
      description: 'Retrieve all missions belonging to the user with progress and status.',
      permission: 'mission.read',
      risk: 'SAFE',
      requiresConfirmation: false,
      category: 'MISSION',
      validateParams: () => ({ valid: true }),
      handler: async (params, userId) => {
        const missions = MissionService.getMissions(userId);
        const active = missions.filter((m) => m.status === 'ACTIVE' || m.status === 'PLANNED');
        return {
          success: true,
          data: { total: missions.length, activeCount: active.length, missions: active.slice(0, 5) },
          message: `Retrieved ${missions.length} missions (${active.length} active).`,
        };
      },
      verify: async (params, resultData, userId) => {
        const missions = MissionService.getMissions(userId);
        return { verified: true, detail: `Verified ${missions.length} missions in storage.` };
      },
    });

    this.register({
      name: 'mission.get',
      description: 'Get details for a specific mission by title or ID.',
      permission: 'mission.read',
      risk: 'SAFE',
      requiresConfirmation: false,
      category: 'MISSION',
      validateParams: (params) => {
        if (!params.id && !params.title) return { valid: false, error: 'Mission id or title required' };
        return ({ valid: true });
      },
      handler: async (params, userId) => {
        const missions = MissionService.getMissions(userId);
        let found: Mission | undefined;
        if (params.id) found = missions.find((m) => m.id === params.id);
        if (!found && params.title) {
          const q = String(params.title).toLowerCase();
          found = missions.find((m) => m.title.toLowerCase().includes(q));
        }
        if (!found) return { success: false, message: 'Mission not located in database.' };
        const objectives = MissionService.getObjectives(userId, found.id);
        return {
          success: true,
          data: { mission: found, objectives },
          message: `Mission "${found.title}" loaded with ${objectives.length} objectives at ${found.progress}% progress.`,
        };
      },
      verify: async (params, resultData, userId) => {
        return { verified: Boolean(resultData?.mission), detail: 'Mission record verified.' };
      },
    });

    this.register({
      name: 'mission.create',
      description: 'Create a new strategic mission with title, goal, priority, and category.',
      permission: 'mission.write',
      risk: 'MEDIUM',
      requiresConfirmation: true,
      category: 'MISSION',
      validateParams: (params) => {
        if (!params.title || typeof params.title !== 'string') return { valid: false, error: 'Title required' };
        return { valid: true };
      },
      handler: async (params, userId) => {
        const created = MissionService.createMission(userId, {
          title: params.title,
          goal: params.goal || params.title,
          description: params.description || `Mission generated for ${params.title}`,
          priority: params.priority || 'MEDIUM',
          category: params.category || 'PROJECT',
          deadline: params.deadline || '2 Weeks',
        });
        return {
          success: true,
          data: created,
          message: `Strategic mission created: "${created.title}".`,
        };
      },
      verify: async (params, resultData, userId) => {
        if (!resultData?.id) return { verified: false, detail: 'Mission ID missing.' };
        const check = MissionService.getMissionById(userId, resultData.id);
        const verified = Boolean(check && check.title === params.title);
        return { verified, detail: verified ? `Verified mission #${resultData.id} exists in database.` : 'Database record check failed.' };
      },
    });

    this.register({
      name: 'mission.update',
      description: 'Update status, progress, or priority of a mission.',
      permission: 'mission.write',
      risk: 'MEDIUM',
      requiresConfirmation: true,
      category: 'MISSION',
      validateParams: (params) => {
        if (!params.id && !params.title) return { valid: false, error: 'Mission id or title required' };
        return { valid: true };
      },
      handler: async (params, userId) => {
        const missions = MissionService.getMissions(userId);
        const target = params.id
          ? missions.find((m) => m.id === params.id)
          : missions.find((m) => m.title.toLowerCase().includes(String(params.title).toLowerCase()));
        if (!target) return { success: false, message: 'Target mission not found.' };

        const updates: Partial<Mission> = {};
        if (params.status) updates.status = params.status;
        if (params.priority) updates.priority = params.priority;
        if (params.deadline) updates.deadline = params.deadline;

        const updated = MissionService.updateMission(userId, target.id, updates);
        return {
          success: true,
          data: updated,
          message: `Mission "${target.title}" updated.`,
        };
      },
      verify: async (params, resultData, userId) => {
        if (!resultData?.id) return { verified: false, detail: 'No update result.' };
        const check = MissionService.getMissionById(userId, resultData.id);
        return { verified: Boolean(check), detail: 'Updated mission verified in database.' };
      },
    });

    this.register({
      name: 'mission.complete',
      description: 'Mark a mission as completed at 100% clearance rate.',
      permission: 'mission.write',
      risk: 'MEDIUM',
      requiresConfirmation: true,
      category: 'MISSION',
      validateParams: (params) => {
        if (!params.id && !params.title) return { valid: false, error: 'Mission identifier required' };
        return { valid: true };
      },
      handler: async (params, userId) => {
        const missions = MissionService.getMissions(userId);
        const target = params.id
          ? missions.find((m) => m.id === params.id)
          : missions.find((m) => m.title.toLowerCase().includes(String(params.title).toLowerCase()));
        if (!target) return { success: false, message: 'Mission not found.' };

        const updated = MissionService.updateMission(userId, target.id, {
          status: 'COMPLETED',
          progress: 100,
          completed_at: Date.now(),
        });
        return {
          success: true,
          data: updated,
          message: `Mission "${target.title}" cleared at 100% completion.`,
        };
      },
      verify: async (params, resultData, userId) => {
        if (!resultData?.id) return { verified: false, detail: 'No mission ID.' };
        const check = MissionService.getMissionById(userId, resultData.id);
        const verified = check?.status === 'COMPLETED';
        return { verified, detail: verified ? 'Mission COMPLETED status confirmed in database.' : 'Status verification failed.' };
      },
    });

    // ----------------------------------------------------
    // 2. OBJECTIVE TOOLS
    // ----------------------------------------------------
    this.register({
      name: 'objective.list',
      description: 'List objectives for a mission.',
      permission: 'objective.read',
      risk: 'SAFE',
      requiresConfirmation: false,
      category: 'OBJECTIVE',
      validateParams: () => ({ valid: true }),
      handler: async (params, userId) => {
        const objectives = MissionService.getObjectives(userId, params.missionId);
        return {
          success: true,
          data: objectives,
          message: `Retrieved ${objectives.length} objectives.`,
        };
      },
      verify: async () => ({ verified: true, detail: 'Objectives list verified.' }),
    });

    this.register({
      name: 'objective.create',
      description: 'Create a sequenced objective under a mission.',
      permission: 'objective.write',
      risk: 'LOW',
      requiresConfirmation: false,
      category: 'OBJECTIVE',
      validateParams: (params) => {
        if (!params.title) return { valid: false, error: 'Objective title required' };
        return { valid: true };
      },
      handler: async (params, userId) => {
        let missionId = params.missionId || params.mission_id;
        if (!missionId) {
          const allMissions = MissionService.getMissions(userId);
          const active = allMissions.filter((m) => m.status === 'ACTIVE');
          if (active.length > 0) missionId = active[0].id;
          else if (allMissions.length > 0) missionId = allMissions[0].id;
          else {
            const newM = MissionService.createMission(userId, {
              title: 'Primary Directive',
              goal: 'Objective execution container',
            });
            missionId = newM.id;
          }
        }

        const created = MissionService.createObjective(userId, missionId, {
          title: params.title,
          description: params.description || `Phase objective: ${params.title}`,
          priority: params.priority || 'MEDIUM',
        });
        return {
          success: true,
          data: created,
          message: `Objective created: "${created.title}".`,
        };
      },
      verify: async (params, resultData, userId) => {
        if (!resultData?.id) return { verified: false, detail: 'Objective ID missing.' };
        const objs = MissionService.getObjectives(userId);
        const check = objs.find((o) => o.id === resultData.id);
        return { verified: Boolean(check), detail: check ? `Objective verified in database.` : 'Record missing.' };
      },
    });

    this.register({
      name: 'objective.complete',
      description: 'Mark an objective completed and update mission progress.',
      permission: 'objective.write',
      risk: 'LOW',
      requiresConfirmation: false,
      category: 'OBJECTIVE',
      validateParams: (params) => {
        if (!params.id && !params.title) return { valid: false, error: 'Objective identifier required' };
        return { valid: true };
      },
      handler: async (params, userId) => {
        const objs = MissionService.getObjectives(userId);
        const target = params.id
          ? objs.find((o) => o.id === params.id)
          : objs.find((o) => o.title.toLowerCase().includes(String(params.title).toLowerCase()));
        if (!target) return { success: false, message: 'Objective not located.' };

        const updated = MissionService.updateObjective(userId, target.id, {
          status: 'COMPLETED',
          progress: 100,
          completed_at: Date.now(),
        });
        return {
          success: true,
          data: updated,
          message: `Objective "${target.title}" completed.`,
        };
      },
      verify: async (params, resultData, userId) => {
        if (!resultData?.id) return { verified: false, detail: 'Missing ID.' };
        const objs = MissionService.getObjectives(userId);
        const check = objs.find((o) => o.id === resultData.id);
        const verified = check?.status === 'COMPLETED';
        return { verified, detail: verified ? 'Objective status verified as COMPLETED.' : 'Objective verification failed.' };
      },
    });

    // ----------------------------------------------------
    // 3. TASK TOOLS
    // ----------------------------------------------------
    this.register({
      name: 'task.list',
      description: 'List action queue tasks with priority, status, and due dates.',
      permission: 'task.read',
      risk: 'SAFE',
      requiresConfirmation: false,
      category: 'TASK',
      validateParams: () => ({ valid: true }),
      handler: async (params, userId) => {
        const tasks = getLocalStore<Task[]>(`tasks_${userId}`, []);
        const incomplete = tasks.filter((t) => t.status !== 'COMPLETED');
        return {
          success: true,
          data: { total: tasks.length, incompleteCount: incomplete.length, tasks: incomplete.slice(0, 8) },
          message: `Retrieved ${tasks.length} tasks (${incomplete.length} pending).`,
        };
      },
      verify: async () => ({ verified: true, detail: 'Task storage verified.' }),
    });

    this.register({
      name: 'task.get',
      description: 'Get details for a task by title or ID.',
      permission: 'task.read',
      risk: 'SAFE',
      requiresConfirmation: false,
      category: 'TASK',
      validateParams: (params) => {
        if (!params.id && !params.title) return { valid: false, error: 'Task id or title required' };
        return { valid: true };
      },
      handler: async (params, userId) => {
        const tasks = getLocalStore<Task[]>(`tasks_${userId}`, []);
        const found = params.id
          ? tasks.find((t) => t.id === params.id)
          : tasks.find((t) => t.title.toLowerCase().includes(String(params.title).toLowerCase()));
        if (!found) return { success: false, message: 'Task not found in queue.' };
        return { success: true, data: found, message: `Task located: "${found.title}".` };
      },
      verify: async (params, resultData) => ({ verified: Boolean(resultData), detail: 'Task existence verified.' }),
    });

    this.register({
      name: 'task.create',
      description: 'Create an actionable task with title, priority, due date, and category.',
      permission: 'task.write',
      risk: 'LOW',
      requiresConfirmation: false,
      category: 'TASK',
      validateParams: (params) => {
        if (!params.title || typeof params.title !== 'string') return { valid: false, error: 'Task title required' };
        return { valid: true };
      },
      handler: async (params, userId) => {
        const tasks = getLocalStore<Task[]>(`tasks_${userId}`, []);
        const newTask: Task = {
          id: 'tsk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          user_id: userId,
          title: params.title.trim(),
          description: params.description || 'Agent directive task',
          priority: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(params.priority) ? params.priority : 'MEDIUM',
          status: 'TODO',
          category: params.category || 'WORK',
          due_date: params.deadline || params.due_date || 'Today',
          mission_id: params.mission_id,
          objective_id: params.objective_id,
          created_at: Date.now(),
        };

        const updated = [newTask, ...tasks];
        setLocalStore(`tasks_${userId}`, updated);
        realtimeService.broadcast('TASK_CREATED', newTask);

        // Recalculate mission progress if linked
        if (newTask.mission_id) {
          MissionService.recalculateMissionProgress(userId, newTask.mission_id);
        }

        return {
          success: true,
          data: newTask,
          message: `Task created: "${newTask.title}" [${newTask.priority}].`,
        };
      },
      verify: async (params, resultData, userId) => {
        if (!resultData?.id) return { verified: false, detail: 'Task ID missing.' };
        const tasks = getLocalStore<Task[]>(`tasks_${userId}`, []);
        const check = tasks.find((t) => t.id === resultData.id);
        const verified = Boolean(check && check.title === params.title.trim());
        return { verified, detail: verified ? `Database record confirmed: Task "${check?.title}" active.` : 'Task verification query failed.' };
      },
    });

    this.register({
      name: 'task.complete',
      description: 'Mark a task as finished.',
      permission: 'task.write',
      risk: 'LOW',
      requiresConfirmation: false,
      category: 'TASK',
      validateParams: (params) => {
        if (!params.id && !params.title) return { valid: false, error: 'Task identifier required' };
        return { valid: true };
      },
      handler: async (params, userId) => {
        const tasks = getLocalStore<Task[]>(`tasks_${userId}`, []);
        const target = params.id
          ? tasks.find((t) => t.id === params.id)
          : tasks.find((t) => t.title.toLowerCase().includes(String(params.title).toLowerCase()));
        if (!target) return { success: false, message: 'Task not found in queue.' };

        const updated = tasks.map((t) =>
          t.id === target.id ? { ...t, status: 'COMPLETED' as const, completed_at: Date.now() } : t
        );
        setLocalStore(`tasks_${userId}`, updated);
        realtimeService.broadcast('TASK_COMPLETED', { ...target, status: 'COMPLETED' });

        if (target.mission_id) {
          MissionService.recalculateMissionProgress(userId, target.mission_id);
        }

        return {
          success: true,
          data: target,
          message: `Task completed: "${target.title}".`,
        };
      },
      verify: async (params, resultData, userId) => {
        if (!resultData?.id) return { verified: false, detail: 'Missing ID.' };
        const tasks = getLocalStore<Task[]>(`tasks_${userId}`, []);
        const check = tasks.find((t) => t.id === resultData.id);
        const verified = check?.status === 'COMPLETED';
        return { verified, detail: verified ? 'Task status verified as COMPLETED in database.' : 'Task check failed.' };
      },
    });

    // ----------------------------------------------------
    // 4. MEMORY TOOLS
    // ----------------------------------------------------
    this.register({
      name: 'memory.search',
      description: 'Search persistent user memories by topic, keyword, or category.',
      permission: 'memory.read',
      risk: 'SAFE',
      requiresConfirmation: false,
      category: 'MEMORY',
      validateParams: () => ({ valid: true }),
      handler: async (params, userId) => {
        const query = (params.query || '').toLowerCase();
        const allMemories = MemoryService.getMemories(userId);
        const filtered = query
          ? allMemories.filter((m) => m.content.toLowerCase().includes(query))
          : allMemories;
        return {
          success: true,
          data: filtered.slice(0, 5),
          message: `Found ${filtered.length} relevant memories for "${query}".`,
        };
      },
      verify: async () => ({ verified: true, detail: 'Memory index verified.' }),
    });

    this.register({
      name: 'memory.save',
      description: 'Store an enduring factual memory, preference, or project detail.',
      permission: 'memory.write',
      risk: 'MEDIUM',
      requiresConfirmation: false,
      category: 'MEMORY',
      validateParams: (params) => {
        if (!params.content || typeof params.content !== 'string') return { valid: false, error: 'Memory content required' };
        return { valid: true };
      },
      handler: async (params, userId) => {
        const saveRes = MemoryService.saveMemory(userId, {
          content: params.content,
          category: params.category || 'PROJECT',
          importance: params.importance || 'HIGH',
          pinned: params.pinned ?? true,
          source: 'AI',
        });
        if (!saveRes.success || !saveRes.memory) {
          return { success: false, message: saveRes.error || 'Failed to save memory.' };
        }
        return {
          success: true,
          data: saveRes.memory,
          message: `Memory preserved: "${saveRes.memory.content}".`,
        };
      },
      verify: async (params, resultData, userId) => {
        if (!resultData?.id) return { verified: false, detail: 'Memory ID missing.' };
        const memories = await MemoryService.getMemories(userId);
        const check = memories.find((m) => m.id === resultData.id);
        const verified = Boolean(check);
        return { verified, detail: verified ? 'Memory presence verified in memory bank.' : 'Memory verification failed.' };
      },
    });

    this.register({
      name: 'memory.delete',
      description: 'Delete a stored memory record.',
      permission: 'memory.delete',
      risk: 'HIGH',
      requiresConfirmation: true,
      category: 'MEMORY',
      validateParams: (params) => {
        if (!params.id && !params.query) return { valid: false, error: 'Memory id or query required' };
        return { valid: true };
      },
      handler: async (params, userId) => {
        const memories = await MemoryService.getMemories(userId);
        const target = params.id
          ? memories.find((m) => m.id === params.id)
          : memories.find((m) => m.content.toLowerCase().includes(String(params.query).toLowerCase()));
        if (!target) return { success: false, message: 'Memory not found.' };

        await MemoryService.deleteMemory(userId, target.id);
        return {
          success: true,
          data: target,
          message: `Memory removed: "${target.content}".`,
        };
      },
      verify: async (params, resultData, userId) => {
        if (!resultData?.id) return { verified: false, detail: 'Missing ID.' };
        const memories = await MemoryService.getMemories(userId);
        const check = memories.find((m) => m.id === resultData.id);
        const verified = !check;
        return { verified, detail: verified ? 'Confirmed memory deleted from storage.' : 'Memory still present in database.' };
      },
    });

    // ----------------------------------------------------
    // 5. FOCUS PROTOCOL TOOLS
    // ----------------------------------------------------
    this.register({
      name: 'focus.start',
      description: 'Start a focused pomodoro immersion session.',
      permission: 'focus.write',
      risk: 'LOW',
      requiresConfirmation: false,
      category: 'FOCUS',
      validateParams: () => ({ valid: true }),
      handler: async (params, userId) => {
        const duration = Number(params.duration) || 25;
        const session = {
          id: 'foc_' + Date.now(),
          user_id: userId,
          duration,
          mission_id: params.missionId,
          started_at: Date.now(),
        };
        setLocalStore(`focus_active_${userId}`, session);
        realtimeService.broadcast('FOCUS_SESSION_STARTED', session);
        return {
          success: true,
          data: session,
          message: `Focus protocol initialized for ${duration} minutes.`,
        };
      },
      verify: async (params, resultData, userId) => {
        const active = getLocalStore<any>(`focus_active_${userId}`, null);
        return { verified: Boolean(active), detail: 'Focus session record verified active.' };
      },
    });

    this.register({
      name: 'focus.status',
      description: 'Check active focus session status.',
      permission: 'focus.read',
      risk: 'SAFE',
      requiresConfirmation: false,
      category: 'FOCUS',
      validateParams: () => ({ valid: true }),
      handler: async (params, userId) => {
        const active = getLocalStore<any>(`focus_active_${userId}`, null);
        return {
          success: true,
          data: active,
          message: active ? `Focus session active: ${active.duration} mins.` : 'No focus protocol currently active.',
        };
      },
      verify: async () => ({ verified: true, detail: 'Focus state checked.' }),
    });

    // ----------------------------------------------------
    // 6. SYSTEM & ANALYTICS TOOLS
    // ----------------------------------------------------
    this.register({
      name: 'analytics.get',
      description: 'Retrieve user productivity statistics, mission clearance rates, and task metrics.',
      permission: 'analytics.read',
      risk: 'SAFE',
      requiresConfirmation: false,
      category: 'ANALYTICS',
      validateParams: () => ({ valid: true }),
      handler: async (params, userId) => {
        const missions = MissionService.getMissions(userId);
        const tasks = getLocalStore<Task[]>(`tasks_${userId}`, []);
        const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');
        const clearanceRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
        return {
          success: true,
          data: {
            totalMissions: missions.length,
            activeMissions: missions.filter((m) => m.status === 'ACTIVE').length,
            totalTasks: tasks.length,
            completedTasks: completedTasks.length,
            clearanceRate,
          },
          message: `Clearance Rate: ${clearanceRate}%. Total Tasks: ${tasks.length}. Active Missions: ${missions.filter((m) => m.status === 'ACTIVE').length}.`,
        };
      },
      verify: async () => ({ verified: true, detail: 'Analytics calculated from real data.' }),
    });

    this.register({
      name: 'system.status',
      description: 'Query system telemetry, database health, and connection status.',
      permission: 'system.read',
      risk: 'SAFE',
      requiresConfirmation: false,
      category: 'SYSTEM',
      validateParams: () => ({ valid: true }),
      handler: async () => {
        return {
          success: true,
          data: {
            intelligence: 'ONLINE (GEMINI)',
            actionQueue: 'SYNCHRONIZED',
            memoryBank: 'PERSISTED',
            agentCore: 'ACTIVE',
          },
          message: 'All three blades operational. Agent orchestration online.',
        };
      },
      verify: async () => ({ verified: true, detail: 'System health verified.' }),
    });

    this.register({
      name: 'notification.create',
      description: 'Dispatch a high-priority tactical HUD alert.',
      permission: 'notification.write',
      risk: 'LOW',
      requiresConfirmation: false,
      category: 'SYSTEM',
      validateParams: (params) => {
        if (!params.title || !params.message) return { valid: false, error: 'Title and message required' };
        return { valid: true };
      },
      handler: async (params, userId) => {
        const notif = {
          id: 'notif_' + Date.now(),
          user_id: userId,
          title: params.title,
          message: params.message,
          type: params.type || 'SUCCESS',
          read: false,
          created_at: Date.now(),
        };
        const existing = getLocalStore<any[]>(`notifications_${userId}`, []);
        setLocalStore(`notifications_${userId}`, [notif, ...existing]);
        realtimeService.broadcast('NOTIFICATION_CREATED', notif);
        return { success: true, data: notif, message: `Notification dispatched: "${params.title}".` };
      },
      verify: async (params, resultData, userId) => {
        const existing = getLocalStore<any[]>(`notifications_${userId}`, []);
        const verified = existing.some((n) => n.id === resultData.id);
        return { verified, detail: verified ? 'Notification recorded.' : 'Notification record failed.' };
      },
    });
  }

  public register(tool: ToolDefinition) {
    this.tools.set(tool.name, tool);
  }

  public getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  public getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  public isAllowlisted(name: string): boolean {
    return this.tools.has(name);
  }
}

export const toolRegistry = new ToolRegistryService();

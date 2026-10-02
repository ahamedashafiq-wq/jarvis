import { GoogleGenAI, Type, Schema } from '@google/genai';
import {
  AIMissionPlan,
  Mission,
  MissionActivity,
  MissionActivityType,
  MissionCategory,
  MissionObjective,
  MissionPriority,
  MissionProgressDetail,
  MissionStatus,
  NextMoveProposal,
  ObjectivePriority,
  ObjectiveStatus,
  Task,
  FocusSession,
} from '../types';
import { getLocalStore, setLocalStore, isSupabaseConfigured, supabase } from './supabase';
import { realtimeService } from './realtime';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const isGeminiConfigured = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY');
const ai = isGeminiConfigured ? new GoogleGenAI({ apiKey }) : null;

const VALID_STATUSES: MissionStatus[] = ['PLANNED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'];
const VALID_PRIORITIES: MissionPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const VALID_CATEGORIES: MissionCategory[] = [
  'ACADEMIC',
  'PROJECT',
  'CODING',
  'PERSONAL',
  'WORK',
  'HEALTH',
  'OTHER',
];
const VALID_OBJ_STATUSES: ObjectiveStatus[] = ['TODO', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'];

const AI_PLAN_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'Concise mission title (e.g. AI Assistant)' },
    goal: { type: Type.STRING, description: 'Clear overarching objective statement' },
    description: { type: Type.STRING, description: 'Tactical summary and scope' },
    priority: {
      type: Type.STRING,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    },
    category: {
      type: Type.STRING,
      enum: ['ACADEMIC', 'PROJECT', 'CODING', 'PERSONAL', 'WORK', 'HEALTH', 'OTHER'],
    },
    deadline: { type: Type.STRING, description: 'Estimated target schedule or date' },
    objectives: {
      type: Type.ARRAY,
      description: 'Ordered sequence of 4 to 8 concrete objectives',
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          priority: {
            type: Type.STRING,
            enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
          },
          tasks: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'List of 2 to 4 actionable tasks for this objective',
          },
        },
        required: ['title', 'description', 'priority'],
      },
    },
  },
  required: ['title', 'goal', 'priority', 'category', 'deadline', 'objectives'],
};

export class MissionService {
  // --------------------------------------------------------------------------
  // MISSIONS CRUD (User-Scored / RLS-Compliant)
  // --------------------------------------------------------------------------

  public static getMissions(userId: string): Mission[] {
    const raw = getLocalStore<Mission[]>(`missions_${userId}`, []);
    return raw.filter((m) => m.user_id === userId);
  }

  public static getMissionById(userId: string, id: string): Mission | null {
    const missions = this.getMissions(userId);
    return missions.find((m) => m.id === id) || null;
  }

  public static createMission(userId: string, data: Partial<Mission>): Mission {
    const status = VALID_STATUSES.includes(data.status as any) ? (data.status as MissionStatus) : 'ACTIVE';
    const priority = VALID_PRIORITIES.includes(data.priority as any) ? (data.priority as MissionPriority) : 'MEDIUM';
    const category = VALID_CATEGORIES.includes(data.category as any) ? (data.category as MissionCategory) : 'PROJECT';

    const mission: Mission = {
      id: 'msn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      user_id: userId,
      title: (data.title || 'Tactical Mission').trim(),
      description: (data.description || data.goal || '').trim(),
      goal: (data.goal || data.title || '').trim(),
      status,
      priority,
      category,
      deadline: data.deadline || 'In 14 Days',
      progress: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    const existing = this.getMissions(userId);
    const updated = [mission, ...existing];
    setLocalStore(`missions_${userId}`, updated);

    this.logActivity(userId, mission.id, 'MISSION_CREATED', `Mission "${mission.title}" initiated.`, {
      priority: mission.priority,
      category: mission.category,
    });

    realtimeService.broadcast('MISSION_CREATED', mission);
    return mission;
  }

  public static updateMission(userId: string, id: string, updates: Partial<Mission>): Mission | null {
    const missions = this.getMissions(userId);
    let target = missions.find((m) => m.id === id);
    if (!target) return null;

    const prevStatus = target.status;
    const nextStatus = updates.status && VALID_STATUSES.includes(updates.status) ? updates.status : target.status;

    target = {
      ...target,
      ...updates,
      status: nextStatus,
      updated_at: Date.now(),
      completed_at: nextStatus === 'COMPLETED' ? target.completed_at || Date.now() : undefined,
    };

    const updatedMissions = missions.map((m) => (m.id === id ? target! : m));
    setLocalStore(`missions_${userId}`, updatedMissions);

    if (prevStatus !== nextStatus) {
      if (nextStatus === 'PAUSED') {
        this.logActivity(userId, id, 'MISSION_PAUSED', `Mission "${target.title}" paused.`);
      } else if (nextStatus === 'ACTIVE' && prevStatus === 'PAUSED') {
        this.logActivity(userId, id, 'MISSION_RESUMED', `Mission "${target.title}" resumed.`);
      } else if (nextStatus === 'COMPLETED') {
        this.logActivity(userId, id, 'MISSION_COMPLETED', `Mission "${target.title}" marked as COMPLETED.`);
      }
    } else {
      this.logActivity(userId, id, 'MISSION_UPDATED', `Mission parameters updated.`);
    }

    realtimeService.broadcast(
      target.status === 'COMPLETED' ? 'MISSION_COMPLETED' : 'MISSION_UPDATED',
      target
    );
    return target;
  }

  public static deleteMission(userId: string, id: string): boolean {
    const missions = this.getMissions(userId);
    const target = missions.find((m) => m.id === id);
    if (!target) return false;

    const filtered = missions.filter((m) => m.id !== id);
    setLocalStore(`missions_${userId}`, filtered);

    // Also remove associated objectives
    const objectives = this.getObjectives(userId).filter((o) => o.mission_id !== id);
    setLocalStore(`objectives_${userId}`, objectives);

    realtimeService.broadcast('MISSION_DELETED', { id });
    return true;
  }

  // --------------------------------------------------------------------------
  // MISSION OBJECTIVES CRUD
  // --------------------------------------------------------------------------

  public static getObjectives(userId: string, missionId?: string): MissionObjective[] {
    const raw = getLocalStore<MissionObjective[]>(`objectives_${userId}`, []);
    const filtered = raw.filter((o) => o.user_id === userId);
    if (missionId) {
      return filtered.filter((o) => o.mission_id === missionId).sort((a, b) => a.position - b.position);
    }
    return filtered.sort((a, b) => a.position - b.position);
  }

  public static getObjectiveById(userId: string, objectiveId: string): MissionObjective | null {
    const objectives = this.getObjectives(userId);
    return objectives.find((o) => o.id === objectiveId) || null;
  }

  public static createObjective(
    userId: string,
    missionId: string,
    data: Partial<MissionObjective>
  ): MissionObjective {
    const existing = this.getObjectives(userId, missionId);
    const position = data.position !== undefined ? data.position : existing.length + 1;
    const status = VALID_OBJ_STATUSES.includes(data.status as any) ? (data.status as ObjectiveStatus) : 'TODO';
    const priority = VALID_PRIORITIES.includes(data.priority as any) ? (data.priority as ObjectivePriority) : 'MEDIUM';

    const objective: MissionObjective = {
      id: 'obj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      mission_id: missionId,
      user_id: userId,
      title: (data.title || 'Tactical Objective').trim(),
      description: (data.description || '').trim(),
      status,
      priority,
      position,
      progress: status === 'COMPLETED' ? 100 : 0,
      deadline: data.deadline,
      created_at: Date.now(),
      updated_at: Date.now(),
      completed_at: status === 'COMPLETED' ? Date.now() : undefined,
    };

    const allObjectives = this.getObjectives(userId);
    setLocalStore(`objectives_${userId}`, [...allObjectives, objective]);

    this.logActivity(userId, missionId, 'OBJECTIVE_CREATED', `Objective "${objective.title}" added to queue.`);
    realtimeService.broadcast('OBJECTIVE_CREATED', objective);

    this.recalculateMissionProgress(userId, missionId);
    return objective;
  }

  public static updateObjective(
    userId: string,
    id: string,
    updates: Partial<MissionObjective>
  ): MissionObjective | null {
    const allObjectives = this.getObjectives(userId);
    let target = allObjectives.find((o) => o.id === id);
    if (!target) return null;

    const prevStatus = target.status;
    const nextStatus = updates.status && VALID_OBJ_STATUSES.includes(updates.status) ? updates.status : target.status;

    target = {
      ...target,
      ...updates,
      status: nextStatus,
      progress: nextStatus === 'COMPLETED' ? 100 : (updates.progress !== undefined ? updates.progress : target.progress),
      updated_at: Date.now(),
      completed_at: nextStatus === 'COMPLETED' ? target.completed_at || Date.now() : undefined,
    };

    const updatedAll = allObjectives.map((o) => (o.id === id ? target! : o));
    setLocalStore(`objectives_${userId}`, updatedAll);

    if (prevStatus !== nextStatus && nextStatus === 'COMPLETED') {
      this.logActivity(userId, target.mission_id, 'OBJECTIVE_COMPLETED', `Objective "${target.title}" completed.`);
    }

    realtimeService.broadcast(
      target.status === 'COMPLETED' ? 'OBJECTIVE_COMPLETED' : 'OBJECTIVE_UPDATED',
      target
    );

    this.recalculateMissionProgress(userId, target.mission_id);
    return target;
  }

  public static deleteObjective(userId: string, id: string): boolean {
    const allObjectives = this.getObjectives(userId);
    const target = allObjectives.find((o) => o.id === id);
    if (!target) return false;

    const filtered = allObjectives.filter((o) => o.id !== id);
    setLocalStore(`objectives_${userId}`, filtered);

    realtimeService.broadcast('OBJECTIVE_DELETED', { id, mission_id: target.mission_id });
    this.recalculateMissionProgress(userId, target.mission_id);
    return true;
  }

  public static reorderObjectives(
    userId: string,
    missionId: string,
    orderedIds: string[]
  ): MissionObjective[] {
    const all = this.getObjectives(userId);
    const missionObjs = all.filter((o) => o.mission_id === missionId);
    const others = all.filter((o) => o.mission_id !== missionId);

    const reordered: MissionObjective[] = [];
    orderedIds.forEach((id, idx) => {
      const match = missionObjs.find((o) => o.id === id);
      if (match) {
        reordered.push({ ...match, position: idx + 1, updated_at: Date.now() });
      }
    });

    // Add any remaining not explicitly in orderedIds
    missionObjs.forEach((o) => {
      if (!orderedIds.includes(o.id)) {
        reordered.push({ ...o, position: reordered.length + 1, updated_at: Date.now() });
      }
    });

    const finalAll = [...others, ...reordered];
    setLocalStore(`objectives_${userId}`, finalAll);
    realtimeService.broadcast('OBJECTIVE_UPDATED', { mission_id: missionId, reordered: true });
    return reordered.sort((a, b) => a.position - b.position);
  }

  // --------------------------------------------------------------------------
  // EXPLAINABLE MISSION PROGRESS CALCULATION
  // --------------------------------------------------------------------------

  public static calculateMissionProgress(userId: string, missionId: string): MissionProgressDetail {
    const objectives = this.getObjectives(userId, missionId);
    const allTasks = getLocalStore<Task[]>(`tasks_${userId}`, []);
    const missionTasks = allTasks.filter((t) => t.mission_id === missionId);

    const totalObjectives = objectives.length;
    const completedObjectives = objectives.filter((o) => o.status === 'COMPLETED').length;

    const totalTasks = missionTasks.length;
    const completedTasks = missionTasks.filter((t) => t.status === 'COMPLETED').length;

    let percentage = 0;
    let explanation = '';

    if (totalObjectives > 0 && totalTasks > 0) {
      const objPct = (completedObjectives / totalObjectives) * 100;
      const tskPct = (completedTasks / totalTasks) * 100;
      // 50% weight to objectives, 50% weight to concrete tasks
      percentage = Math.round(objPct * 0.5 + tskPct * 0.5);
      explanation = `${percentage}% — ${completedObjectives} of ${totalObjectives} objectives, ${completedTasks} of ${totalTasks} tasks completed`;
    } else if (totalObjectives > 0) {
      percentage = Math.round((completedObjectives / totalObjectives) * 100);
      explanation = `${percentage}% — ${completedObjectives} of ${totalObjectives} objectives completed`;
    } else if (totalTasks > 0) {
      percentage = Math.round((completedTasks / totalTasks) * 100);
      explanation = `${percentage}% — ${completedTasks} of ${totalTasks} tasks completed`;
    } else {
      percentage = 0;
      explanation = '0% — No objectives or tasks established yet';
    }

    return {
      percentage: Math.min(100, Math.max(0, percentage)),
      totalObjectives,
      completedObjectives,
      totalTasks,
      completedTasks,
      explanation,
    };
  }

  public static recalculateMissionProgress(userId: string, missionId: string): Mission | null {
    const detail = this.calculateMissionProgress(userId, missionId);
    const mission = this.getMissionById(userId, missionId);
    if (!mission) return null;

    let status = mission.status;
    let completed_at = mission.completed_at;

    if (detail.percentage === 100 && (detail.totalObjectives > 0 || detail.totalTasks > 0)) {
      if (status !== 'COMPLETED') {
        status = 'COMPLETED';
        completed_at = Date.now();
        this.logActivity(userId, missionId, 'MISSION_COMPLETED', `All objectives achieved. Mission "${mission.title}" marked as COMPLETED.`);
      }
    } else if (status === 'COMPLETED' && detail.percentage < 100) {
      status = 'ACTIVE';
      completed_at = undefined;
    }

    const updated = this.updateMission(userId, missionId, {
      progress: detail.percentage,
      status,
      completed_at,
    });

    return updated;
  }

  // --------------------------------------------------------------------------
  // BLOCKER DETECTION ENGINE
  // --------------------------------------------------------------------------

  public static detectMissionBlockers(
    userId: string,
    missionId: string
  ): {
    hasBlockers: boolean;
    blockedObjectives: {
      objective: MissionObjective;
      reason: string;
      blockingTasks: Task[];
    }[];
  } {
    const objectives = this.getObjectives(userId, missionId);
    const allTasks = getLocalStore<Task[]>(`tasks_${userId}`, []);
    const missionTasks = allTasks.filter((t) => t.mission_id === missionId);

    const blockedObjectives: {
      objective: MissionObjective;
      reason: string;
      blockingTasks: Task[];
    }[] = [];

    objectives.forEach((obj, idx) => {
      // 1. Explicitly marked as BLOCKED
      if (obj.status === 'BLOCKED') {
        const objTasks = missionTasks.filter((t) => t.objective_id === obj.id);
        const incompleteTasks = objTasks.filter((t) => t.status !== 'COMPLETED');
        const reason =
          incompleteTasks.length > 0
            ? `Blocked by ${incompleteTasks.length} incomplete tasks (e.g. "${incompleteTasks[0].title}").`
            : `Objective flagged as blocked. Review dependencies before resuming.`;

        blockedObjectives.push({
          objective: obj,
          reason,
          blockingTasks: incompleteTasks,
        });
      }
      // 2. Sequential dependency check (e.g., if this objective is IN_PROGRESS but earlier objective is incomplete and critical)
      else if (obj.status === 'IN_PROGRESS' && idx > 0) {
        const prior = objectives.slice(0, idx);
        const incompletePrior = prior.filter((p) => p.status !== 'COMPLETED' && p.priority === 'CRITICAL');
        if (incompletePrior.length > 0) {
          const blockingObj = incompletePrior[0];
          const blockingTasks = missionTasks.filter(
            (t) => t.objective_id === blockingObj.id && t.status !== 'COMPLETED'
          );
          blockedObjectives.push({
            objective: obj,
            reason: `Preceded by incomplete critical objective: "${blockingObj.title}".`,
            blockingTasks,
          });
        }
      }
    });

    return {
      hasBlockers: blockedObjectives.length > 0,
      blockedObjectives,
    };
  }

  // --------------------------------------------------------------------------
  // NEXT MOVE ENGINE (Signature Feature)
  // --------------------------------------------------------------------------

  public static computeNextMove(userId: string, missionId?: string): NextMoveProposal | null {
    const missions = this.getMissions(userId);
    let targetMission: Mission | undefined;

    if (missionId) {
      targetMission = missions.find((m) => m.id === missionId);
    } else {
      // Pick highest priority active mission
      const activeMissions = missions.filter((m) => m.status === 'ACTIVE');
      if (activeMissions.length === 0) return null;

      // Sort by CRITICAL > HIGH > MEDIUM > LOW, then by deadline/progress
      const pWeight: Record<MissionPriority, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      activeMissions.sort((a, b) => pWeight[b.priority] - pWeight[a.priority] || a.progress - b.progress);
      targetMission = activeMissions[0];
    }

    if (!targetMission) return null;

    const objectives = this.getObjectives(userId, targetMission.id);
    const allTasks = getLocalStore<Task[]>(`tasks_${userId}`, []);
    const missionTasks = allTasks.filter((t) => t.mission_id === targetMission!.id);

    // Check blockers first
    const blockerReport = this.detectMissionBlockers(userId, targetMission.id);
    if (blockerReport.hasBlockers) {
      const topBlock = blockerReport.blockedObjectives[0];
      if (topBlock.blockingTasks.length > 0) {
        const t = topBlock.blockingTasks[0];
        return {
          action: `Resolve blocker: Complete "${t.title}"`,
          reason: [
            `• Explicitly blocks objective "${topBlock.objective.title}"`,
            `• Required for downstream workflow integrity`,
            `• High operational priority`,
          ],
          missionId: targetMission.id,
          missionTitle: targetMission.title,
          objectiveId: topBlock.objective.id,
          objectiveTitle: topBlock.objective.title,
          taskId: t.id,
          taskTitle: t.title,
        };
      }
    }

    // 1. Look for active or in-progress objective with incomplete tasks
    const inProgressObj = objectives.find((o) => o.status === 'IN_PROGRESS');
    if (inProgressObj) {
      const objTasks = missionTasks.filter(
        (t) => t.objective_id === inProgressObj.id && t.status !== 'COMPLETED'
      );
      if (objTasks.length > 0) {
        const topTask = objTasks[0];
        return {
          action: `Complete task: "${topTask.title}"`,
          reason: [
            `• Objective "${inProgressObj.title}" is currently active`,
            `• Direct progress milestone for mission "${targetMission.title}"`,
            `• Priority: ${topTask.priority}`,
          ],
          missionId: targetMission.id,
          missionTitle: targetMission.title,
          objectiveId: inProgressObj.id,
          objectiveTitle: inProgressObj.title,
          taskId: topTask.id,
          taskTitle: topTask.title,
        };
      } else {
        return {
          action: `Mark objective completed: "${inProgressObj.title}"`,
          reason: [
            `• All linked tasks in this objective are finished`,
            `• Advance mission progress to next phase`,
          ],
          missionId: targetMission.id,
          missionTitle: targetMission.title,
          objectiveId: inProgressObj.id,
          objectiveTitle: inProgressObj.title,
        };
      }
    }

    // 2. Look for the next TODO objective in position order
    const nextTodoObj = objectives.find((o) => o.status === 'TODO');
    if (nextTodoObj) {
      const objTasks = missionTasks.filter(
        (t) => t.objective_id === nextTodoObj.id && t.status !== 'COMPLETED'
      );
      return {
        action: `Initiate Objective ${String(nextTodoObj.position).padStart(2, '0')}: "${nextTodoObj.title}"`,
        reason: [
          `• Next sequential milestone in mission roadmap`,
          `• ${objTasks.length} pending directives logged inside`,
          `• Priority: ${nextTodoObj.priority}`,
        ],
        missionId: targetMission.id,
        missionTitle: targetMission.title,
        objectiveId: nextTodoObj.id,
        objectiveTitle: nextTodoObj.title,
        taskId: objTasks[0]?.id,
        taskTitle: objTasks[0]?.title,
      };
    }

    // 3. Fallback: Check any incomplete tasks in the mission
    const remainingTasks = missionTasks.filter((t) => t.status !== 'COMPLETED');
    if (remainingTasks.length > 0) {
      const t = remainingTasks[0];
      return {
        action: `Execute directive: "${t.title}"`,
        reason: [
          `• Incomplete task in Blade 02 queue`,
          `• Advances overall mission clearance rate`,
        ],
        missionId: targetMission.id,
        missionTitle: targetMission.title,
        taskId: t.id,
        taskTitle: t.title,
      };
    }

    // Mission is complete
    return {
      action: `Finalize Mission: "${targetMission.title}"`,
      reason: [
        `• All objectives and directives have been fulfilled`,
        `• Ready for final tactical review & replay`,
      ],
      missionId: targetMission.id,
      missionTitle: targetMission.title,
    };
  }

  // --------------------------------------------------------------------------
  // AI MISSION PLANNER (Structured Output & Approval Pipeline)
  // --------------------------------------------------------------------------

  /**
   * Generates a structured proposal.
   * NEVER writes to database until approved by user.
   */
  public static async generateMissionPlan(prompt: string): Promise<AIMissionPlan> {
    const cleanPrompt = prompt.trim();

    // 1. Try Gemini generation if configured
    if (ai && isGeminiConfigured) {
      try {
        const systemPrompt = `You are ZORO 2.0 OMNIA Tactical Planner. Address the operator as Commander.
Given the user's high-level goal, formulate a structured tactical mission with 4 to 8 sequenced objectives.
Each objective must have 2 to 4 concrete actionable tasks.
Ensure objectives represent a complete operational hierarchy:
Research -> Architecture -> Development / Execution -> Verification / Testing -> Deployment / Completion.
Return clean, strictly valid JSON conforming to the requested schema.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Create an operational mission plan for: "${cleanPrompt}"`,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            responseSchema: AI_PLAN_SCHEMA,
          },
        });

        const parsed = JSON.parse(response.text || '{}');
        const validated = this.validateAndSanitizePlan(parsed, cleanPrompt);
        if (validated) {
          return validated;
        }
      } catch (err) {
        console.warn('Gemini mission planner error, using tactical generator fallback', err);
      }
    }

    // 2. High-Fidelity Tactical Plan Generator (Deterministic & Domain-Aware)
    return this.generateTacticalPlanFallback(cleanPrompt);
  }

  private static validateAndSanitizePlan(raw: any, userPrompt: string): AIMissionPlan | null {
    if (!raw || typeof raw !== 'object') return null;

    const title = (raw.title || userPrompt || 'Tactical Mission').slice(0, 80);
    const goal = (raw.goal || userPrompt).slice(0, 200);
    const description = (raw.description || `Tactical roadmap synthesized for ${title}`).slice(0, 300);

    const priority: MissionPriority = VALID_PRIORITIES.includes(raw.priority) ? raw.priority : 'HIGH';
    const category: MissionCategory = VALID_CATEGORIES.includes(raw.category) ? raw.category : 'PROJECT';
    const deadline = raw.deadline || 'In 14 Days';

    if (!Array.isArray(raw.objectives) || raw.objectives.length === 0) {
      return null;
    }

    const objectives = raw.objectives.slice(0, 8).map((obj: any, idx: number) => {
      const objTitle = (obj.title || `Phase ${idx + 1}`).slice(0, 80);
      const objDesc = (obj.description || 'Operational execution milestone').slice(0, 200);
      const objPriority: ObjectivePriority = VALID_PRIORITIES.includes(obj.priority) ? obj.priority : 'MEDIUM';
      const tasks = Array.isArray(obj.tasks)
        ? obj.tasks.map((t: any) => String(t).slice(0, 80)).filter(Boolean).slice(0, 5)
        : [`Implement ${objTitle} fundamentals`];

      return {
        title: objTitle,
        description: objDesc,
        priority: objPriority,
        tasks,
      };
    });

    return {
      title,
      goal,
      description,
      priority,
      category,
      deadline,
      objectives,
    };
  }

  private static generateTacticalPlanFallback(prompt: string): AIMissionPlan {
    const lower = prompt.toLowerCase();
    let category: MissionCategory = 'PROJECT';
    let priority: MissionPriority = 'HIGH';

    if (lower.includes('study') || lower.includes('exam') || lower.includes('academic') || lower.includes('college')) {
      category = 'ACADEMIC';
    } else if (lower.includes('code') || lower.includes('api') || lower.includes('frontend') || lower.includes('backend') || lower.includes('software')) {
      category = 'CODING';
    } else if (lower.includes('health') || lower.includes('workout') || lower.includes('strength') || lower.includes('training')) {
      category = 'HEALTH';
    } else if (lower.includes('work') || lower.includes('client') || lower.includes('launch')) {
      category = 'WORK';
    }

    // Clean title extraction
    let cleanTitle = prompt
      .replace(/^(create a mission called|create a mission for|plan a mission for|plan mission|i want to|create mission called|create mission)/i, '')
      .replace(/^["']|["']$/g, '')
      .trim();

    if (!cleanTitle) cleanTitle = 'AI Assistant';

    // Standard 7-stage tactical objective sequence as required in Section 9 & 31:
    // Research, Architecture, Backend, AI Integration, Frontend, Testing, Deployment
    if (lower.includes('ai') || lower.includes('assistant') || lower.includes('study assistant')) {
      return {
        title: cleanTitle.toUpperCase(),
        goal: `Design, develop and deploy ${cleanTitle} with absolute tactical precision.`,
        description: `Full lifecycle deployment covering intelligence modeling, interface synthesis, and operational hardening.`,
        priority,
        category,
        deadline: 'In 3 Weeks',
        objectives: [
          {
            title: 'Research',
            description: 'Evaluate AI models, API specifications, and tactical prerequisites.',
            priority: 'HIGH',
            tasks: ['Benchmark Gemini capabilities', 'Draft architectural requirements', 'Define security boundaries'],
          },
          {
            title: 'Architecture',
            description: 'System schema, state synchronization, and component hierarchy design.',
            priority: 'CRITICAL',
            tasks: ['Model database entities', 'Define realtime sync protocol', 'Map intent routing matrix'],
          },
          {
            title: 'Backend',
            description: 'Core persistence, authentication, and secure endpoints.',
            priority: 'HIGH',
            tasks: ['Implement user authorization', 'Database migration scripts', 'Service layer hardening'],
          },
          {
            title: 'AI Integration',
            description: 'Gemini structured prompt orchestration, context injection, and streaming.',
            priority: 'CRITICAL',
            tasks: ['Configure system instruction', 'Build memory recall injector', 'Set up response streaming'],
          },
          {
            title: 'Frontend',
            description: 'Tactical user interface, responsive HUD, and visual feedback.',
            priority: 'MEDIUM',
            tasks: ['Construct mission dashboard', 'Implement interactive node universe', 'Mobile responsiveness audit'],
          },
          {
            title: 'Testing',
            description: 'Unit verification, load validation, and end-to-end user testing.',
            priority: 'HIGH',
            tasks: ['Execute intent benchmark suite', 'Verify realtime cross-tab synchronization', 'Simulate offline fallback'],
          },
          {
            title: 'Deployment',
            description: 'Final production build, verification, and live activation.',
            priority: 'MEDIUM',
            tasks: ['Optimize asset bundling', 'Verify security headers', 'Commence live monitoring'],
          },
        ],
      };
    }

    // Generic disciplined 5-stage plan
    return {
      title: cleanTitle.toUpperCase(),
      goal: `Execute ${cleanTitle} with discipline and structured phases.`,
      description: `Structured operational roadmap synthesized by ZORO 2.0 OMNIA.`,
      priority,
      category,
      deadline: 'In 2 Weeks',
      objectives: [
        {
          title: 'Scoping & Reconnaissance',
          description: 'Define clear milestones, evaluate constraints, and prepare resources.',
          priority: 'HIGH',
          tasks: ['Establish core parameters', 'Assemble required documentation', 'Define success criteria'],
        },
        {
          title: 'Core Architecture',
          description: 'Structure the operational framework and baseline components.',
          priority: 'CRITICAL',
          tasks: ['Establish foundation setup', 'Organize workflow dependencies'],
        },
        {
          title: 'Deep Execution Phase',
          description: 'Uninterrupted immersion and development of primary deliverables.',
          priority: 'CRITICAL',
          tasks: ['Execute phase 1 deliverables', 'Execute phase 2 deliverables'],
        },
        {
          title: 'Testing & Verification',
          description: 'Thorough quality check and boundary condition stress tests.',
          priority: 'HIGH',
          tasks: ['Review accuracy against goal', 'Refine edge cases'],
        },
        {
          title: 'Final Deployment & Review',
          description: 'Finalize output and record mission milestones.',
          priority: 'MEDIUM',
          tasks: ['Deliver final outputs', 'Record mission retrospective in memory'],
        },
      ],
    };
  }

  /**
   * Approves the plan and creates all records in database.
   * Only called when user clicks APPROVE PLAN.
   */
  public static approveAndCreatePlan(
    userId: string,
    plan: AIMissionPlan
  ): {
    mission: Mission;
    objectives: MissionObjective[];
    tasks: Task[];
  } {
    // 1. Create Mission
    const mission = this.createMission(userId, {
      title: plan.title,
      goal: plan.goal,
      description: plan.description || plan.goal,
      priority: plan.priority,
      category: plan.category,
      deadline: plan.deadline,
      status: 'ACTIVE',
    });

    const createdObjectives: MissionObjective[] = [];
    const createdTasks: Task[] = [];
    const existingTasks = getLocalStore<Task[]>(`tasks_${userId}`, []);

    // 2. Create Objectives and initial Tasks
    plan.objectives.forEach((objPlan, idx) => {
      const obj = this.createObjective(userId, mission.id, {
        title: objPlan.title,
        description: objPlan.description,
        priority: objPlan.priority,
        position: idx + 1,
        status: idx === 0 ? 'IN_PROGRESS' : 'TODO',
      });
      createdObjectives.push(obj);

      // Create linked tasks if provided
      if (Array.isArray(objPlan.tasks)) {
        objPlan.tasks.forEach((taskTitle) => {
          const newTask: Task = {
            id: 'tsk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            user_id: userId,
            title: taskTitle,
            description: `Directive for Objective: ${obj.title}`,
            priority: obj.priority,
            status: 'TODO',
            category: mission.category,
            due_date: mission.deadline,
            created_at: Date.now(),
            mission_id: mission.id,
            objective_id: obj.id,
          };
          createdTasks.push(newTask);
        });
      }
    });

    if (createdTasks.length > 0) {
      setLocalStore(`tasks_${userId}`, [...createdTasks, ...existingTasks]);
      createdTasks.forEach((t) => realtimeService.broadcast('TASK_CREATED', t));
    }

    this.recalculateMissionProgress(userId, mission.id);

    return {
      mission,
      objectives: createdObjectives,
      tasks: createdTasks,
    };
  }

  // --------------------------------------------------------------------------
  // MISSION ACTIVITY TIMELINE
  // --------------------------------------------------------------------------

  public static getMissionActivities(userId: string, missionId?: string): MissionActivity[] {
    const raw = getLocalStore<MissionActivity[]>(`mission_activity_${userId}`, []);
    const filtered = raw.filter((a) => a.user_id === userId);
    if (missionId) {
      return filtered.filter((a) => a.mission_id === missionId).sort((a, b) => b.created_at - a.created_at);
    }
    return filtered.sort((a, b) => b.created_at - a.created_at);
  }

  public static logActivity(
    userId: string,
    missionId: string,
    type: MissionActivityType,
    description: string,
    metadata?: Record<string, any>
  ): MissionActivity {
    const activity: MissionActivity = {
      id: 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      user_id: userId,
      mission_id: missionId,
      type,
      description,
      metadata: metadata || {},
      created_at: Date.now(),
    };

    const existing = this.getMissionActivities(userId);
    const updated = [activity, ...existing].slice(0, 200);
    setLocalStore(`mission_activity_${userId}`, updated);

    realtimeService.broadcast('MISSION_ACTIVITY_CREATED', activity);
    return activity;
  }

  // --------------------------------------------------------------------------
  // MISSION REPLAY GENERATOR
  // --------------------------------------------------------------------------

  public static getMissionReplay(userId: string, missionId: string) {
    const mission = this.getMissionById(userId, missionId);
    if (!mission) return null;

    const objectives = this.getObjectives(userId, missionId);
    const allTasks = getLocalStore<Task[]>(`tasks_${userId}`, []);
    const missionTasks = allTasks.filter((t) => t.mission_id === missionId);
    const activities = this.getMissionActivities(userId, missionId).reverse(); // chronological

    // Gather focus sessions for this mission
    const allSessions = getLocalStore<FocusSession[]>(`focus_sessions_${userId}`, []);
    const missionSessions = allSessions.filter((s) => s.mission_id === missionId && s.status === 'COMPLETED');
    const totalFocusMinutes = missionSessions.reduce((acc, s) => acc + s.duration, 0);

    const elapsedMs = (mission.completed_at || Date.now()) - mission.created_at;
    const daysElapsed = Math.max(1, Math.round(elapsedMs / (1000 * 60 * 60 * 24)));

    return {
      mission,
      objectivesCount: objectives.length,
      tasksCount: missionTasks.length,
      completedTasksCount: missionTasks.filter((t) => t.status === 'COMPLETED').length,
      focusSessionsCount: missionSessions.length,
      totalFocusMinutes,
      daysElapsed,
      milestones: activities,
    };
  }
}

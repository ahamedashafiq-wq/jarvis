import { MissionService } from '../mission';
import { MemoryService } from '../memory';
import { NeuralMemoryService } from '../neuralMemory';
import { getLocalStore } from '../supabase';
import { Task, Memory, Mission } from '../../types';

export interface AgentContextSnapshot {
  missions: { id: string; title: string; status: string; progress: number }[];
  tasks: { id: string; title: string; priority: string; status: string; due_date: string }[];
  memories: { id: string; content: string; category: string }[];
  decisions?: { id: string; decision: string; projectName?: string; status: string }[];
  projectEntity?: { id: string; name: string; type: string };
  summary: {
    missions_used: number;
    tasks_used: number;
    memories_used: number;
    decisions_used?: number;
    details: string[];
  };
}

export class AgentContextRetriever {
  /**
   * Retrieve bounded context for an agent request.
   * Restricts output to at most 3 active missions, 6 pending tasks, 3 relevant memories,
   * and relevant project decisions from Neural Memory.
   */
  public static async getBoundedContext(
    userId: string,
    userQuery: string
  ): Promise<AgentContextSnapshot> {
    const details: string[] = [];

    // 1. Resolve project entity from Neural Memory
    const resolution = NeuralMemoryService.resolveEntityReference(userId, userQuery);
    const projectEntity = resolution.resolvedEntity
      ? { id: resolution.resolvedEntity.id, name: resolution.resolvedEntity.name, type: resolution.resolvedEntity.entity_type }
      : undefined;

    if (projectEntity) {
      details.push(`Project entity identified: ${projectEntity.name}`);
    }

    // 2. Bounded Active Missions
    const allMissions = MissionService.getMissions(userId);
    const activeMissions = allMissions
      .filter((m) => m.status === 'ACTIVE' || m.status === 'PLANNED')
      .slice(0, 3)
      .map((m) => ({
        id: m.id,
        title: m.title,
        status: m.status,
        progress: m.progress,
      }));

    if (activeMissions.length > 0) {
      details.push(`${activeMissions.length} active missions in scope`);
    }

    // 3. Bounded Pending Tasks
    const allTasks = getLocalStore<Task[]>(`tasks_${userId}`, []);
    const pendingTasks = allTasks
      .filter((t) => t.status !== 'COMPLETED')
      .slice(0, 6)
      .map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        status: t.status,
        due_date: t.due_date,
      }));

    if (pendingTasks.length > 0) {
      details.push(`${pendingTasks.length} pending tasks in action queue`);
    }

    // 4. Retrieve Active Project Decisions from Neural Memory
    const activeDecisions = NeuralMemoryService.getDecisions(userId, projectEntity?.name)
      .filter((d) => d.status === 'ACTIVE')
      .slice(0, 3)
      .map((d) => ({
        id: d.id,
        decision: d.decision,
        projectName: d.projectName,
        status: d.status,
      }));

    if (activeDecisions.length > 0) {
      details.push(`${activeDecisions.length} active decisions retrieved from Neural Memory`);
    }

    // 5. Relevant Memories via keyword matching
    const queryTokens = userQuery.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const allMemories = await MemoryService.getMemories(userId);

    const relevantMemories = allMemories
      .filter((m) => {
        if (!queryTokens.length) return m.pinned;
        const text = m.content.toLowerCase();
        return queryTokens.some((tok) => text.includes(tok)) || m.pinned;
      })
      .slice(0, 3)
      .map((m) => ({
        id: m.id,
        content: m.content,
        category: m.category,
      }));

    if (relevantMemories.length > 0) {
      details.push(`${relevantMemories.length} relevant memories retrieved`);
    }

    return {
      missions: activeMissions,
      tasks: pendingTasks,
      memories: relevantMemories,
      decisions: activeDecisions,
      projectEntity,
      summary: {
        missions_used: activeMissions.length,
        tasks_used: pendingTasks.length,
        memories_used: relevantMemories.length,
        decisions_used: activeDecisions.length,
        details,
      },
    };
  }
}


import { MissionService } from '../mission';
import { MemoryService } from '../memory';
import { getLocalStore } from '../supabase';
import { Task, Memory, Mission } from '../../types';

export interface AgentContextSnapshot {
  missions: { id: string; title: string; status: string; progress: number }[];
  tasks: { id: string; title: string; priority: string; status: string; due_date: string }[];
  memories: { id: string; content: string; category: string }[];
  summary: {
    missions_used: number;
    tasks_used: number;
    memories_used: number;
    details: string[];
  };
}

export class AgentContextRetriever {
  /**
   * Retrieve bounded context for an agent request.
   * Restricts output to at most 3 active missions, 6 pending tasks, and 3 relevant memories.
   */
  public static async getBoundedContext(
    userId: string,
    userQuery: string
  ): Promise<AgentContextSnapshot> {
    const details: string[] = [];

    // 1. Bounded Active Missions
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

    // 2. Bounded Pending Tasks
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

    // 3. Relevant Memories via keyword matching
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
      summary: {
        missions_used: activeMissions.length,
        tasks_used: pendingTasks.length,
        memories_used: relevantMemories.length,
        details,
      },
    };
  }
}

import { GlobalSearchResult, RoutePath, Task, Conversation, Message } from '../../types';
import { MissionService } from '../mission';
import { MemoryService } from '../memory';
import { NeuralMemoryService } from '../neuralMemory';
import { VisionService } from '../vision';
import { AutomationService } from '../automation';
import { AgentCore } from '../agent';
import { IntelligenceService } from '../intelligence';
import { getLocalStore } from '../supabase';

export class GlobalSearchService {
  /**
   * Search across all subsystems:
   * missions, objectives, tasks, memories, decisions, conversations, vision analyses, automations, agent executions, insights.
   */
  public static searchAll(userId: string, query: string, limit = 25): GlobalSearchResult[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const terms = q.split(/\s+/).filter(Boolean);
    const results: GlobalSearchResult[] = [];

    // 1. MISSIONS
    try {
      const missions = MissionService.getMissions(userId);
      for (const m of missions) {
        const text = `${m.title} ${m.goal} ${m.description} ${m.category} ${m.status}`.toLowerCase();
        const score = this.calculateRelevance(q, terms, m.title.toLowerCase(), text);
        if (score > 0) {
          results.push({
            id: `msn_${m.id}`,
            type: 'MISSION',
            title: m.title,
            description: `${m.progress}% • ${m.goal || m.description}`,
            relevance: score,
            date: m.updated_at || m.created_at,
            route: '/missions',
            metadata: { missionId: m.id, status: m.status, priority: m.priority },
          });
        }
      }
    } catch (e) {
      console.warn('Search error in missions:', e);
    }

    // 2. OBJECTIVES
    try {
      const objectives = MissionService.getObjectives(userId);
      for (const obj of objectives) {
        const text = `${obj.title} ${obj.description} ${obj.status}`.toLowerCase();
        const score = this.calculateRelevance(q, terms, obj.title.toLowerCase(), text);
        if (score > 0) {
          results.push({
            id: `obj_${obj.id}`,
            type: 'OBJECTIVE',
            title: obj.title,
            description: `Objective [${obj.status}] • Progress: ${obj.progress}%`,
            relevance: score,
            date: obj.updated_at || obj.created_at,
            route: '/missions',
            metadata: { objectiveId: obj.id, missionId: obj.mission_id, status: obj.status },
          });
        }
      }
    } catch (e) {
      console.warn('Search error in objectives:', e);
    }

    // 3. TASKS
    try {
      const tasks = getLocalStore<Task[]>(`tasks_${userId}`, []);
      for (const t of tasks) {
        const text = `${t.title} ${t.description || ''} ${t.priority} ${t.status} ${t.category}`.toLowerCase();
        const score = this.calculateRelevance(q, terms, t.title.toLowerCase(), text);
        if (score > 0) {
          results.push({
            id: `tsk_${t.id}`,
            type: 'TASK',
            title: t.title,
            description: `Priority: ${t.priority} • Status: ${t.status} • Due: ${t.due_date}`,
            relevance: score,
            date: t.created_at,
            route: '/tasks',
            metadata: { taskId: t.id, status: t.status, priority: t.priority },
          });
        }
      }
    } catch (e) {
      console.warn('Search error in tasks:', e);
    }

    // 4. MEMORIES
    try {
      const memories = MemoryService.getMemories(userId);
      for (const mem of memories) {
        const text = `${mem.content} ${mem.category} ${mem.importance}`.toLowerCase();
        const score = this.calculateRelevance(q, terms, mem.content.toLowerCase().slice(0, 40), text);
        if (score > 0) {
          results.push({
            id: `mem_${mem.id}`,
            type: 'MEMORY',
            title: mem.content.length > 55 ? mem.content.slice(0, 55) + '...' : mem.content,
            description: `Category: ${mem.category} • Importance: ${mem.importance}`,
            relevance: score,
            date: mem.created_at,
            route: '/memory',
            metadata: { memoryId: mem.id, category: mem.category },
          });
        }
      }
    } catch (e) {
      console.warn('Search error in memories:', e);
    }

    // 5. DECISIONS
    try {
      const decisions = NeuralMemoryService.getDecisions(userId);
      for (const dec of decisions) {
        const text = `${dec.decision} ${dec.context || ''} ${dec.projectName || ''} ${dec.status}`.toLowerCase();
        const score = this.calculateRelevance(q, terms, dec.decision.toLowerCase(), text);
        if (score > 0) {
          results.push({
            id: `dec_${dec.id}`,
            type: 'DECISION',
            title: dec.decision,
            description: `Project: ${dec.projectName || 'AI Assistant'} • Status: ${dec.status}`,
            relevance: score,
            date: dec.created_at,
            route: '/memory/decisions',
            metadata: { decisionId: dec.id, projectName: dec.projectName },
          });
        }
      }
    } catch (e) {
      console.warn('Search error in decisions:', e);
    }

    // 6. CONVERSATIONS
    try {
      const conversations = getLocalStore<Conversation[]>(`conversations_${userId}`, []);
      for (const conv of conversations) {
        const text = `${conv.title}`.toLowerCase();
        const score = this.calculateRelevance(q, terms, conv.title.toLowerCase(), text);
        if (score > 0) {
          results.push({
            id: `conv_${conv.id}`,
            type: 'CONVERSATION',
            title: conv.title,
            description: `AI Tactical Dialogue`,
            relevance: score,
            date: conv.updated_at || conv.created_at,
            route: '/chat',
            metadata: { conversationId: conv.id },
          });
        }
      }
    } catch (e) {
      console.warn('Search error in conversations:', e);
    }

    // 7. VISION ANALYSES
    try {
      const sessions = VisionService.getSessions(userId);
      for (const vs of sessions) {
        const text = `${vs.result_summary || ''} ${vs.question || ''} ${vs.analysis_type} ${vs.image_meta.filename}`.toLowerCase();
        const score = this.calculateRelevance(q, terms, vs.image_meta.filename.toLowerCase(), text);
        if (score > 0) {
          results.push({
            id: `vis_${vs.id}`,
            type: 'VISION',
            title: vs.image_meta.filename || 'Vision Analysis',
            description: `${vs.analysis_type} • ${vs.result_summary ? vs.result_summary.slice(0, 60) + '...' : 'Analysis record'}`,
            relevance: score,
            date: vs.created_at,
            route: '/vision',
            metadata: { visionId: vs.id, analysisType: vs.analysis_type },
          });
        }
      }
    } catch (e) {
      console.warn('Search error in vision:', e);
    }

    // 8. AUTOMATIONS
    try {
      const automations = AutomationService.getAutomations(userId);
      for (const auto of automations) {
        const text = `${auto.name} ${auto.description} ${auto.status} ${auto.trigger_type}`.toLowerCase();
        const score = this.calculateRelevance(q, terms, auto.name.toLowerCase(), text);
        if (score > 0) {
          results.push({
            id: `auto_${auto.id}`,
            type: 'AUTOMATION',
            title: auto.name,
            description: `${auto.trigger_type} → ${auto.action_config.type} [${auto.status}]`,
            relevance: score,
            date: auto.created_at,
            route: '/automation',
            metadata: { automationId: auto.id, status: auto.status },
          });
        }
      }
    } catch (e) {
      console.warn('Search error in automations:', e);
    }

    // 9. AGENT EXECUTIONS
    try {
      const executions = AgentCore.getExecutions(userId);
      for (const exec of executions) {
        const text = `${exec.objective} ${exec.status} ${exec.plan?.objective || ''}`.toLowerCase();
        const score = this.calculateRelevance(q, terms, exec.objective.toLowerCase(), text);
        if (score > 0) {
          results.push({
            id: `exec_${exec.id}`,
            type: 'AGENT',
            title: exec.objective,
            description: `Agent Status: ${exec.status} • Steps: ${exec.plan?.steps?.length || 0}`,
            relevance: score,
            date: exec.started_at,
            route: '/agents',
            metadata: { executionId: exec.id, status: exec.status },
          });
        }
      }
    } catch (e) {
      console.warn('Search error in agents:', e);
    }

    // 10. INSIGHTS
    try {
      const insights = IntelligenceService.getInsights(userId);
      for (const ins of insights) {
        const text = `${ins.title} ${ins.description} ${ins.severity} ${ins.insight_type}`.toLowerCase();
        const score = this.calculateRelevance(q, terms, ins.title.toLowerCase(), text);
        if (score > 0) {
          results.push({
            id: `ins_${ins.id}`,
            type: 'INSIGHT',
            title: ins.title,
            description: `[${ins.severity}] ${ins.description.slice(0, 65)}...`,
            relevance: score,
            date: ins.created_at,
            route: '/intelligence',
            metadata: { insightId: ins.id, severity: ins.severity },
          });
        }
      }
    } catch (e) {
      console.warn('Search error in insights:', e);
    }

    // Sort by relevance descending, then date descending
    results.sort((a, b) => {
      if (b.relevance !== a.relevance) {
        return b.relevance - a.relevance;
      }
      return b.date - a.date;
    });

    return results.slice(0, limit);
  }

  private static calculateRelevance(
    fullQuery: string,
    terms: string[],
    titleText: string,
    bodyText: string
  ): number {
    let score = 0;

    // Exact full query match in title
    if (titleText.includes(fullQuery)) {
      score += 60;
    } else if (bodyText.includes(fullQuery)) {
      score += 35;
    }

    // Match individual terms
    let matchedTerms = 0;
    for (const term of terms) {
      if (titleText.includes(term)) {
        score += 20;
        matchedTerms++;
      } else if (bodyText.includes(term)) {
        score += 10;
        matchedTerms++;
      }
    }

    if (matchedTerms === 0 && score === 0) return 0;

    // Fraction of terms matched bonus
    const termRatio = matchedTerms / terms.length;
    score = Math.round(score * (0.5 + 0.5 * termRatio));

    return Math.min(Math.max(score, 10), 100);
  }
}

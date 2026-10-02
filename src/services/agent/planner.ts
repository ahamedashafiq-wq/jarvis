import { AgentPlan, AgentRequest, AgentStep } from '../../types';
import { toolRegistry } from './toolRegistry';
import { AgentGuardian } from './guardian';
import { AgentContextSnapshot } from './context';

const PLAN_SCHEMA = {
  type: 'OBJECT',
  properties: {
    objective: { type: 'STRING' },
    requires_approval: { type: 'BOOLEAN' },
    steps: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          tool: { type: 'STRING' },
          reason: { type: 'STRING' },
          parameters: {
            type: 'OBJECT',
            properties: {
              title: { type: 'STRING' },
              description: { type: 'STRING' },
              priority: { type: 'STRING' },
              category: { type: 'STRING' },
              deadline: { type: 'STRING' },
              missionId: { type: 'STRING' },
              mission_id: { type: 'STRING' },
              objective_id: { type: 'STRING' },
              content: { type: 'STRING' },
              query: { type: 'STRING' },
              duration: { type: 'NUMBER' },
              status: { type: 'STRING' },
              id: { type: 'STRING' },
            },
          },
        },
        required: ['tool', 'reason'],
      },
    },
  },
  required: ['objective', 'steps'],
};

export class AgentPlanner {
  /**
   * Generates a safe, allowlisted multi-step AgentPlan
   */
  public static async generatePlan(
    request: AgentRequest,
    context: AgentContextSnapshot
  ): Promise<AgentPlan> {
    const rawMessage = request.message.trim();

    // Check for prompt injection in request
    const injectionCheck = AgentGuardian.scanForPromptInjection(rawMessage);
    if (injectionCheck.isSuspicious) {
      return {
        plan_id: 'plan_' + Date.now(),
        request_id: request.id,
        objective: 'Hostile directive neutralized by Guardian.',
        steps: [],
        requires_approval: false,
        estimated_actions: 0,
        risk_level: 'CRITICAL',
        created_at: Date.now(),
      };
    }

    // 1. Try deterministic heuristic planner for recognized archetypes
    const heuristicPlan = this.detectHeuristicPlan(request, context);
    if (heuristicPlan) {
      return this.finalizePlan(heuristicPlan, request.user_id);
    }

    // 2. Call server-side structured Gemini Planner
    try {
      const availableTools = toolRegistry
        .getAllTools()
        .map((t) => `- ${t.name}: ${t.description} [Risk: ${t.risk}]`)
        .join('\n');

      const contextInfo = JSON.stringify({
        activeMissions: context.missions,
        pendingTasks: context.tasks,
        memories: context.memories,
      });

      const prompt = `You are the PLANNER specialist for ZORO 2.0 OMNIA AI Agent Core.
Break this user request into a safe, sequential execution plan consisting ONLY of allowlisted tools.

ALLOWLISTED TOOLS:
${availableTools}

CURRENT USER CONTEXT:
${contextInfo}

USER REQUEST:
"${rawMessage}"

RULES:
1. ONLY select tools from the allowlist above. Never fabricate tool names.
2. Order steps logically (read context first, then perform actions, then report).
3. Any plan that creates or updates tasks/missions requires user confirmation.
4. Keep the plan focused and concise (1-5 steps).`;

      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: PLAN_SCHEMA,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const parsed = JSON.parse(data.text || '{}');
        if (parsed.objective && Array.isArray(parsed.steps) && parsed.steps.length > 0) {
          const validatedSteps: AgentStep[] = [];
          let stepNumber = 1;

          for (const rawStep of parsed.steps) {
            const tool = toolRegistry.getTool(rawStep.tool);
            if (!tool) continue; // Reject unknown tools

            validatedSteps.push({
              step_number: stepNumber++,
              tool: tool.name,
              reason: rawStep.reason || `Execute ${tool.name}`,
              parameters: rawStep.parameters || {},
              status: 'PENDING',
              risk_level: tool.risk,
            });
          }

          if (validatedSteps.length > 0) {
            const plan: AgentPlan = {
              plan_id: 'plan_' + Date.now(),
              request_id: request.id,
              objective: parsed.objective,
              steps: validatedSteps,
              requires_approval: Boolean(parsed.requires_approval),
              estimated_actions: validatedSteps.length,
              risk_level: 'LOW',
              created_at: Date.now(),
            };
            return this.finalizePlan(plan, request.user_id);
          }
        }
      }
    } catch (e) {
      console.warn('Server Gemini planner fallback to default plan', e);
    }

    // 3. Fallback default analytical plan
    const fallbackPlan: AgentPlan = {
      plan_id: 'plan_' + Date.now(),
      request_id: request.id,
      objective: `Evaluate request: ${rawMessage.slice(0, 50)}`,
      steps: [
        {
          step_number: 1,
          tool: 'mission.list',
          reason: 'Inspect active missions status',
          parameters: {},
          status: 'PENDING',
          risk_level: 'SAFE',
        },
        {
          step_number: 2,
          tool: 'task.list',
          reason: 'Check pending directives queue',
          parameters: {},
          status: 'PENDING',
          risk_level: 'SAFE',
        },
        {
          step_number: 3,
          tool: 'analytics.get',
          reason: 'Calculate operational clearance rate',
          parameters: {},
          status: 'PENDING',
          risk_level: 'SAFE',
        },
      ],
      requires_approval: false,
      estimated_actions: 3,
      risk_level: 'SAFE',
      created_at: Date.now(),
    };

    return this.finalizePlan(fallbackPlan, request.user_id);
  }

  /**
   * Deterministic Archetype Planner
   */
  private static detectHeuristicPlan(
    request: AgentRequest,
    context: AgentContextSnapshot
  ): AgentPlan | null {
    const text = request.message.toLowerCase();

    // Archetype 1: Multi-step mission creation with objectives
    if (
      (text.includes('create a mission') || text.includes('new mission')) &&
      (text.includes('objective') || text.includes('backend') || text.includes('frontend'))
    ) {
      const match = request.message.match(/mission (?:called|for|named)?\s*([a-zA-Z0-9\s]+?)(?:and|with|having|$)/i);
      const title = match ? match[1].trim() : 'AI Assistant Project';

      const objectives: string[] = [];
      if (text.includes('backend')) objectives.push('01 — Backend Architecture & APIs');
      if (text.includes('frontend')) objectives.push('02 — Tactical Frontend Interface');
      if (text.includes('testing')) objectives.push('03 — Automated Testing & Verification');
      if (text.includes('deployment')) objectives.push('04 — Production Cloud Deployment');
      if (objectives.length === 0) {
        objectives.push('01 — Research & Spec', '02 — Core Engine Implementation', '03 — Deployment');
      }

      const steps: AgentStep[] = [
        {
          step_number: 1,
          tool: 'mission.create',
          reason: `Establish strategic mission: "${title}"`,
          parameters: { title, goal: `Complete all operational phases for ${title}` },
          status: 'PENDING',
          risk_level: 'MEDIUM',
        },
      ];

      objectives.forEach((objTitle, idx) => {
        steps.push({
          step_number: idx + 2,
          tool: 'objective.create',
          reason: `Establish objective: "${objTitle}"`,
          parameters: { title: objTitle },
          status: 'PENDING',
          risk_level: 'LOW',
        });
      });

      return {
        plan_id: 'plan_' + Date.now(),
        request_id: request.id,
        objective: `Establish Mission "${title}" with ${objectives.length} phased objectives`,
        steps,
        requires_approval: true,
        estimated_actions: steps.length,
        risk_level: 'MEDIUM',
        created_at: Date.now(),
      };
    }

    // Archetype 2: Prepare / Organize Project
    if (
      text.includes('prepare') ||
      text.includes('organize') ||
      (text.includes('what') && text.includes('next move')) ||
      (text.includes('what') && text.includes('work on next'))
    ) {
      return {
        plan_id: 'plan_' + Date.now(),
        request_id: request.id,
        objective: 'Analyze active project telemetry and formulate tactical next move',
        steps: [
          {
            step_number: 1,
            tool: 'mission.list',
            reason: 'Identify highest priority active mission',
            parameters: {},
            status: 'PENDING',
            risk_level: 'SAFE',
          },
          {
            step_number: 2,
            tool: 'task.list',
            reason: 'Identify pending and blocked tasks',
            parameters: {},
            status: 'PENDING',
            risk_level: 'SAFE',
          },
          {
            step_number: 3,
            tool: 'analytics.get',
            reason: 'Retrieve clearance statistics and completion velocity',
            parameters: {},
            status: 'PENDING',
            risk_level: 'SAFE',
          },
        ],
        requires_approval: false,
        estimated_actions: 3,
        risk_level: 'SAFE',
        created_at: Date.now(),
      };
    }

    // Archetype 3: Continue Project (Phase 11 Requirement 42: End-to-End Test 2)
    // "Continue my AI project" -> 1. Identify AI project 2. Current mission 3. Incomplete objective 4. Recent decision 5. Relevant conversation
    if (
      text.includes('continue my ai project') ||
      text.includes('continue the ai project') ||
      text.includes('continue my project') ||
      text.includes('continue ai project')
    ) {
      const projName = context.projectEntity?.name || 'AI Assistant';
      const recentDec = context.decisions?.[0]?.decision || 'Use FastAPI for the backend';

      return {
        plan_id: 'plan_' + Date.now(),
        request_id: request.id,
        objective: `Synchronize and resume ${projName} execution context`,
        steps: [
          {
            step_number: 1,
            tool: 'mission.list',
            reason: `Identify active mission for ${projName}`,
            parameters: {},
            status: 'PENDING',
            risk_level: 'SAFE',
          },
          {
            step_number: 2,
            tool: 'task.list',
            reason: 'Retrieve incomplete objective directives in Action Queue',
            parameters: {},
            status: 'PENDING',
            risk_level: 'SAFE',
          },
          {
            step_number: 3,
            tool: 'memory.read',
            reason: `Verify latest project decision: "${recentDec}"`,
            parameters: { query: projName },
            status: 'PENDING',
            risk_level: 'SAFE',
          },
        ],
        requires_approval: false,
        estimated_actions: 3,
        risk_level: 'SAFE',
        created_at: Date.now(),
      };
    }

    // Archetype 4: Investigate Bottleneck / Predictive Signal (Phase 12 Section 20)
    if (
      text.includes('investigate') ||
      text.includes('diagnose bottleneck') ||
      text.includes('investigate objective') ||
      text.includes('inspect signal')
    ) {
      return {
        plan_id: 'plan_' + Date.now(),
        request_id: request.id,
        objective: 'Investigate operational bottleneck and diagnose blocked items',
        steps: [
          {
            step_number: 1,
            tool: 'objective.read',
            reason: 'Open and inspect target objective parameters and state',
            parameters: {},
            status: 'PENDING',
            risk_level: 'SAFE',
          },
          {
            step_number: 2,
            tool: 'task.list',
            reason: 'Retrieve all associated tasks and isolate blocked directives',
            parameters: {},
            status: 'PENDING',
            risk_level: 'SAFE',
          },
          {
            step_number: 3,
            tool: 'memory.read',
            reason: 'Query Neural Memory for recorded external dependencies or blockers',
            parameters: {},
            status: 'PENDING',
            risk_level: 'SAFE',
          },
        ],
        requires_approval: false,
        estimated_actions: 3,
        risk_level: 'SAFE',
        created_at: Date.now(),
      };
    }

    return null;
  }

  /**
   * Finalize plan with Guardian check for risk evaluation and approval enforcement
   */
  private static finalizePlan(plan: AgentPlan, userId: string): AgentPlan {
    const assessment = AgentGuardian.assessPlan(plan, userId);
    return {
      ...plan,
      requires_approval: assessment.requiresApproval,
      risk_level: assessment.riskLevel,
    };
  }
}

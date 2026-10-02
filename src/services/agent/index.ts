import {
  AgentExecution,
  AgentPlan,
  AgentRequest,
  AgentStatus,
  AgentTimelineEvent,
} from '../../types';
import { AgentContextRetriever } from './context';
import { AgentPlanner } from './planner';
import { AgentGuardian } from './guardian';
import { AgentExecutor } from './executor';
import { getLocalStore, setLocalStore } from '../supabase';
import { realtimeService } from '../realtime';

export interface AgentAnalyticsData {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  cancelledExecutions: number;
  averageDurationMs: number;
  mostUsedTools: { tool: string; count: number }[];
}

export class AgentCore {
  /**
   * Main Agent Entrypoint:
   * USER REQUEST -> UNDERSTANDING -> CONTEXT -> PLANNER -> GUARDIAN -> APPROVAL CHECK -> EXECUTE -> VERIFY
   */
  public static async startAgent(
    request: AgentRequest,
    onUpdate?: (exec: AgentExecution) => void
  ): Promise<AgentExecution> {
    const userId = request.user_id;
    const execId = 'exec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    // Initial Execution Record
    const initialExecution: AgentExecution = {
      id: execId,
      request_id: request.id,
      user_id: userId,
      objective: 'Analyzing tactical objective...',
      status: 'UNDERSTANDING',
      plan: {
        plan_id: 'plan_' + Date.now(),
        request_id: request.id,
        objective: 'Analyzing request...',
        steps: [],
        requires_approval: false,
        estimated_actions: 0,
        risk_level: 'SAFE',
        created_at: Date.now(),
      },
      current_step_index: 0,
      timeline: [
        {
          id: 'evt_start_' + Date.now(),
          timestamp: Date.now(),
          label: 'REQUEST RECEIVED',
          role: 'PLANNER',
          detail: `Directive vocalized or submitted: "${request.message.slice(0, 60)}"`,
          status: 'INFO',
        },
      ],
      context_summary: {
        missions_used: 0,
        tasks_used: 0,
        memories_used: 0,
        details: [],
      },
      tools_used: [],
      started_at: Date.now(),
      retry_count: 0,
    };

    this.saveExecution(userId, initialExecution);
    if (onUpdate) onUpdate(initialExecution);

    // Stage 1: Context Retrieval (Bounded)
    const context = await AgentContextRetriever.getBoundedContext(userId, request.message);
    initialExecution.context_summary = context.summary;
    initialExecution.status = 'CONTEXT_READY';
    this.addTimelineEvent(
      initialExecution,
      'CONTEXT LOADED',
      'ANALYST',
      `Bounded context synchronized: ${context.summary.details.join(', ') || 'No prior entities in scope'}.`,
      'INFO'
    );
    this.saveExecution(userId, initialExecution);
    if (onUpdate) onUpdate(initialExecution);

    // Stage 2: Plan Generation via Gemini structured planner
    const plan = await AgentPlanner.generatePlan(request, context);
    initialExecution.plan = plan;
    initialExecution.objective = plan.objective;
    initialExecution.status = 'PLAN_READY';

    this.addTimelineEvent(
      initialExecution,
      'PLAN CREATED',
      'PLANNER',
      `Formulated plan "${plan.objective}" with ${plan.steps.length} sequential actions [Risk: ${plan.risk_level}].`,
      'INFO'
    );

    // Stage 3: Guardian Check & Tool Selection
    const guardianAssessment = AgentGuardian.assessPlan(plan, userId);
    initialExecution.status = 'TOOLS_SELECTED';

    this.addTimelineEvent(
      initialExecution,
      'GUARDIAN VERIFIED',
      'GUARDIAN',
      guardianAssessment.allowed
        ? `All ${plan.steps.length} tools allowlisted. Requires Approval: ${guardianAssessment.requiresApproval ? 'YES' : 'NO'}.`
        : `Guardian detected security anomaly: ${guardianAssessment.securityViolations.join(' ')}`,
      guardianAssessment.allowed ? 'SUCCESS' : 'ERROR'
    );

    if (!guardianAssessment.allowed) {
      initialExecution.status = 'FAILED';
      initialExecution.failure_reason = guardianAssessment.securityViolations.join('; ');
      this.saveExecution(userId, initialExecution);
      if (onUpdate) onUpdate(initialExecution);
      return initialExecution;
    }

    // Stage 4: User Approval Gate
    if (guardianAssessment.requiresApproval) {
      initialExecution.status = 'WAITING_FOR_APPROVAL';
      this.addTimelineEvent(
        initialExecution,
        'WAITING FOR APPROVAL',
        'GUARDIAN',
        `Plan involves ${plan.risk_level} operations. Awaiting operator authorization.`,
        'WARNING'
      );
      this.saveExecution(userId, initialExecution);
      if (onUpdate) onUpdate(initialExecution);
      return initialExecution;
    }

    // Stage 5: Autonomous Safe Execution for Read/Safe Operations
    return this.runExecution(initialExecution, userId, onUpdate);
  }

  /**
   * User Approves the Plan (optionally edited)
   */
  public static async approveExecution(
    userId: string,
    executionId: string,
    editedPlan?: AgentPlan,
    onUpdate?: (exec: AgentExecution) => void
  ): Promise<AgentExecution> {
    const execution = this.getExecutionById(userId, executionId);
    if (!execution) {
      throw new Error(`Execution "${executionId}" not found.`);
    }

    if (editedPlan) {
      execution.plan = editedPlan;
      this.addTimelineEvent(
        execution,
        'PLAN MODIFIED BY OPERATOR',
        'GUARDIAN',
        `Operator refined plan to ${editedPlan.steps.length} actions.`,
        'INFO'
      );
    }

    this.addTimelineEvent(
      execution,
      'USER APPROVED',
      'GUARDIAN',
      'Operator granted authorization for plan execution.',
      'SUCCESS'
    );

    execution.status = 'EXECUTING';
    this.saveExecution(userId, execution);
    if (onUpdate) onUpdate(execution);

    return this.runExecution(execution, userId, onUpdate);
  }

  /**
   * Cancel active execution
   */
  public static cancelExecution(userId: string, executionId: string) {
    AgentExecutor.cancel(executionId);
    const execution = this.getExecutionById(userId, executionId);
    if (execution && execution.status !== 'COMPLETE' && execution.status !== 'FAILED') {
      execution.status = 'CANCELLED';
      execution.completed_at = Date.now();
      execution.duration_ms = execution.completed_at - execution.started_at;
      this.addTimelineEvent(
        execution,
        'OPERATOR ABORT',
        'GUARDIAN',
        'Execution cancelled immediately by operator.',
        'WARNING'
      );
      this.saveExecution(userId, execution);
    }
  }

  /**
   * Retry failed or paused step
   */
  public static async retryExecution(
    userId: string,
    executionId: string,
    onUpdate?: (exec: AgentExecution) => void
  ): Promise<AgentExecution> {
    const execution = this.getExecutionById(userId, executionId);
    if (!execution) throw new Error('Execution not found');

    if (execution.retry_count >= 3) {
      execution.status = 'FAILED';
      execution.failure_reason = 'Exceeded maximum permitted retries (3).';
      this.saveExecution(userId, execution);
      if (onUpdate) onUpdate(execution);
      return execution;
    }

    execution.retry_count++;
    execution.status = 'EXECUTING';
    const failedStep = execution.plan.steps[execution.current_step_index];
    if (failedStep) {
      failedStep.status = 'PENDING';
      failedStep.error = undefined;
    }

    this.addTimelineEvent(
      execution,
      `RETRY ATTEMPT ${execution.retry_count}`,
      'GUARDIAN',
      `Re-executing step ${execution.current_step_index + 1}...`,
      'INFO'
    );

    this.saveExecution(userId, execution);
    return this.runExecution(execution, userId, onUpdate);
  }

  /**
   * Skip failed step and continue to next
   */
  public static async skipStepAndContinue(
    userId: string,
    executionId: string,
    onUpdate?: (exec: AgentExecution) => void
  ): Promise<AgentExecution> {
    const execution = this.getExecutionById(userId, executionId);
    if (!execution) throw new Error('Execution not found');

    const currStep = execution.plan.steps[execution.current_step_index];
    if (currStep) {
      currStep.status = 'SKIPPED';
    }

    this.addTimelineEvent(
      execution,
      `STEP ${execution.current_step_index + 1} SKIPPED`,
      'GUARDIAN',
      `Operator bypassed step "${currStep?.tool}". Continuing pipeline.`,
      'WARNING'
    );

    execution.current_step_index++;
    this.saveExecution(userId, execution);
    return this.runExecution(execution, userId, onUpdate);
  }

  private static async runExecution(
    execution: AgentExecution,
    userId: string,
    onUpdate?: (exec: AgentExecution) => void
  ): Promise<AgentExecution> {
    const finished = await AgentExecutor.executePlan(execution, userId, (updated) => {
      this.saveExecution(userId, updated);
      if (onUpdate) onUpdate(updated);
    });

    this.saveExecution(userId, finished);
    if (onUpdate) onUpdate(finished);
    return finished;
  }

  public static getExecutions(userId: string): AgentExecution[] {
    return getLocalStore<AgentExecution[]>(`agent_executions_${userId}`, []);
  }

  public static getExecutionById(userId: string, id: string): AgentExecution | null {
    const all = this.getExecutions(userId);
    return all.find((e) => e.id === id) || null;
  }

  public static saveExecution(userId: string, exec: AgentExecution) {
    const all = this.getExecutions(userId);
    const updated = [exec, ...all.filter((e) => e.id !== exec.id)].slice(0, 50);
    setLocalStore(`agent_executions_${userId}`, updated);
  }

  public static getAgentAnalytics(userId: string): AgentAnalyticsData {
    const executions = this.getExecutions(userId);
    const successful = executions.filter((e) => e.status === 'COMPLETE');
    const failed = executions.filter((e) => e.status === 'FAILED');
    const cancelled = executions.filter((e) => e.status === 'CANCELLED');

    const durations = successful.filter((e) => e.duration_ms).map((e) => e.duration_ms!);
    const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

    const toolUsageMap: Record<string, number> = {};
    for (const e of executions) {
      for (const t of e.tools_used || []) {
        toolUsageMap[t] = (toolUsageMap[t] || 0) + 1;
      }
    }

    const mostUsed = Object.entries(toolUsageMap)
      .map(([tool, count]) => ({ tool, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalExecutions: executions.length,
      successfulExecutions: successful.length,
      failedExecutions: failed.length,
      cancelledExecutions: cancelled.length,
      averageDurationMs: avgDuration,
      mostUsedTools: mostUsed,
    };
  }

  private static addTimelineEvent(
    execution: AgentExecution,
    label: string,
    role: AgentTimelineEvent['role'],
    detail?: string,
    status: AgentTimelineEvent['status'] = 'INFO'
  ) {
    const event: AgentTimelineEvent = {
      id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: Date.now(),
      label,
      role,
      detail,
      status,
    };
    execution.timeline.push(event);
  }
}

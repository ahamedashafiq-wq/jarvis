import {
  AgentExecution,
  AgentPlan,
  AgentStatus,
  AgentStep,
  AgentTimelineEvent,
} from '../../types';
import { toolRegistry } from './toolRegistry';
import { AgentGuardian } from './guardian';
import { AgentVerifier } from './verifier';
import { realtimeService } from '../realtime';

export type ExecutionUpdateCallback = (execution: AgentExecution) => void;

export class AgentExecutor {
  private static activeExecutions: Map<string, { cancelled: boolean }> = new Map();

  /**
   * Execute an approved plan sequentially with verification, loop detection, and failure handling
   */
  public static async executePlan(
    execution: AgentExecution,
    userId: string,
    onUpdate: ExecutionUpdateCallback
  ): Promise<AgentExecution> {
    const execId = execution.id;
    this.activeExecutions.set(execId, { cancelled: false });

    execution.status = 'EXECUTING';
    this.addTimelineEvent(execution, 'EXECUTION INITIALIZED', 'GUARDIAN', 'Starting sequential tool execution pipeline.', 'INFO');
    onUpdate({ ...execution });
    this.broadcastStatus(execution);

    const callHistory: string[] = [];
    const maxSteps = 25;

    for (let i = execution.current_step_index; i < execution.plan.steps.length; i++) {
      // Check for user cancellation
      const flag = this.activeExecutions.get(execId);
      if (flag?.cancelled || (execution.status as AgentStatus) === 'CANCELLED') {
        execution.status = 'CANCELLED';
        execution.completed_at = Date.now();
        execution.duration_ms = execution.completed_at - execution.started_at;
        this.addTimelineEvent(
          execution,
          'AGENT CANCELLED',
          'GUARDIAN',
          `Operation terminated by operator at step ${i + 1}/${execution.plan.steps.length}.`,
          'WARNING'
        );
        onUpdate({ ...execution });
        this.broadcastStatus(execution);
        this.activeExecutions.delete(execId);
        return execution;
      }

      // Check step limit
      if (i >= maxSteps) {
        execution.status = 'FAILED';
        execution.failure_reason = 'Execution halted: Exceeded maximum permitted steps (25).';
        this.addTimelineEvent(execution, 'RATE LIMIT REACHED', 'GUARDIAN', execution.failure_reason, 'ERROR');
        onUpdate({ ...execution });
        this.broadcastStatus(execution);
        this.activeExecutions.delete(execId);
        return execution;
      }

      execution.current_step_index = i;
      const step = execution.plan.steps[i];
      step.status = 'RUNNING';
      onUpdate({ ...execution });

      // Loop Detection Check: Detect if identical tool called repeatedly without changes
      const callSignature = `${step.tool}:${JSON.stringify(step.parameters)}`;
      callHistory.push(callSignature);
      if (callHistory.length >= 4) {
        const lastFour = callHistory.slice(-4);
        if (lastFour.every((s) => s === callSignature)) {
          execution.status = 'PAUSED';
          execution.failure_reason = 'AGENT STOPPED: Repeated operations produced no new information.';
          this.addTimelineEvent(
            execution,
            'LOOP DETECTED',
            'GUARDIAN',
            'Identical tool invoked repeatedly with invariant parameters. Execution halted for safety.',
            'WARNING'
          );
          onUpdate({ ...execution });
          this.broadcastStatus(execution);
          this.activeExecutions.delete(execId);
          return execution;
        }
      }

      // Step 1: Pre-Execution Guardian Check
      const check = AgentGuardian.checkStep(step, userId);
      if (!check.allowed) {
        step.status = 'FAILED';
        step.error = check.reason;
        execution.status = 'FAILED';
        execution.failure_reason = check.reason;
        this.addTimelineEvent(
          execution,
          `STEP ${i + 1} REJECTED`,
          'GUARDIAN',
          check.reason || 'Security check failed.',
          'ERROR'
        );
        onUpdate({ ...execution });
        this.broadcastStatus(execution);
        this.activeExecutions.delete(execId);
        return execution;
      }

      // Step 2: Tool Execution
      const tool = toolRegistry.getTool(step.tool)!;
      const stepStartTime = performance.now();

      try {
        const result = await tool.handler(step.parameters || {}, userId);
        const duration = Math.round(performance.now() - stepStartTime);
        step.duration_ms = duration;

        if (!result.success) {
          step.status = 'FAILED';
          step.error = result.message;
          execution.status = 'PAUSED';
          execution.failure_reason = `Step ${i + 1} failed: ${result.message}`;
          this.addTimelineEvent(
            execution,
            `STEP ${i + 1} PAUSED`,
            'BUILDER',
            `Tool "${step.tool}" returned failure: ${result.message}`,
            'WARNING'
          );
          onUpdate({ ...execution });
          this.broadcastStatus(execution);
          this.activeExecutions.delete(execId);
          return execution;
        }

        // Step 3: Result Verification
        execution.status = 'VERIFYING';
        onUpdate({ ...execution });

        const verification = await AgentVerifier.verifyStepResult(step, result.data, userId);
        step.verified = verification.verified;
        step.verification_detail = verification.detail;
        step.result = result.message;
        step.status = 'SUCCESS';

        if (!execution.tools_used.includes(step.tool)) {
          execution.tools_used.push(step.tool);
        }

        this.addTimelineEvent(
          execution,
          `STEP ${i + 1} SUCCESS`,
          'BUILDER',
          `${step.tool}: ${result.message} [Verified: ${verification.detail}]`,
          'SUCCESS'
        );

        execution.status = 'EXECUTING';
        onUpdate({ ...execution });
        realtimeService.broadcast('AGENT_STEP_EXECUTED', { executionId: execId, stepIndex: i, step });
      } catch (err: any) {
        step.status = 'FAILED';
        step.error = err?.message || 'Tool execution anomaly';
        step.duration_ms = Math.round(performance.now() - stepStartTime);
        execution.status = 'PAUSED';
        execution.failure_reason = `Step ${i + 1} threw an exception: ${step.error}`;
        this.addTimelineEvent(
          execution,
          `STEP ${i + 1} EXCEPTION`,
          'BUILDER',
          step.error,
          'ERROR'
        );
        onUpdate({ ...execution });
        this.broadcastStatus(execution);
        this.activeExecutions.delete(execId);
        return execution;
      }
    }

    // Step 4: Finalize Execution
    execution.status = 'COMPLETE';
    execution.completed_at = Date.now();
    execution.duration_ms = execution.completed_at - execution.started_at;
    execution.result_summary = this.generateResultSummary(execution);

    this.addTimelineEvent(
      execution,
      'AGENT COMPLETE',
      'ANALYST',
      `All ${execution.plan.steps.length} steps executed and verified successfully.`,
      'SUCCESS'
    );

    onUpdate({ ...execution });
    this.broadcastStatus(execution);
    this.activeExecutions.delete(execId);

    return execution;
  }

  public static cancel(execId: string) {
    const flag = this.activeExecutions.get(execId);
    if (flag) {
      flag.cancelled = true;
    }
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

  private static broadcastStatus(execution: AgentExecution) {
    realtimeService.broadcast('AGENT_STATUS_UPDATED', {
      executionId: execution.id,
      status: execution.status,
      currentStep: execution.current_step_index,
      failureReason: execution.failure_reason,
    });
  }

  private static generateResultSummary(execution: AgentExecution): string {
    const total = execution.plan.steps.length;
    const successful = execution.plan.steps.filter((s) => s.status === 'SUCCESS').length;
    const verified = execution.plan.steps.filter((s) => s.verified).length;

    const highlights = execution.plan.steps
      .filter((s) => s.result)
      .map((s) => `• ${s.result}`)
      .join('\n');

    return `Plan execution finished. ${successful}/${total} actions completed with ${verified}/${total} database verifications.\n\n${highlights}`;
  }
}

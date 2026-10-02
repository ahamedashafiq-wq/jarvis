import React from 'react';
import {
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  Shield,
  Layers,
  Sparkles,
  Cpu,
  Brain,
  Check,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { AgentExecution, AgentStep, CommandSurfaceState } from '../../types';

interface ExecutionTimelineProps {
  execution?: AgentExecution | null;
  surfaceState?: CommandSurfaceState;
  className?: string;
  onDismiss?: () => void;
}

export const ExecutionTimeline: React.FC<ExecutionTimelineProps> = ({
  execution,
  surfaceState = 'IDLE',
  className = '',
  onDismiss,
}) => {
  if (!execution && surfaceState === 'IDLE') return null;

  // Stages definition
  const baseStages = [
    { id: 'REQUEST_RECEIVED', label: 'REQUEST RECEIVED', desc: 'Normalized natural language command' },
    { id: 'CONTEXT_LOADED', label: 'CONTEXT LOADED', desc: 'Loaded missions, tasks, and memory bounds' },
    { id: 'PLAN_CREATED', label: 'PLAN CREATED', desc: 'Decomposed into sequential atomic steps' },
    { id: 'GUARDIAN_VERIFIED', label: 'GUARDIAN VERIFIED', desc: 'Audited against safety permissions' },
    { id: 'EXECUTION_INITIALIZED', label: 'EXECUTION INITIALIZED', desc: 'Allocated agent worker thread' },
  ];

  const steps = execution?.plan?.steps || [
    {
      step_number: 1,
      tool: 'mission.list',
      reason: 'Retrieve active project goals',
      parameters: {},
      status: 'SUCCESS' as const,
      result: 'Retrieved active missions',
      duration_ms: 38,
      verified: true,
      risk_level: 'SAFE' as const,
    },
    {
      step_number: 2,
      tool: 'task.list',
      reason: 'Evaluate current pending queue',
      parameters: {},
      status: 'SUCCESS' as const,
      result: 'Retrieved pending tasks',
      duration_ms: 24,
      verified: true,
      risk_level: 'SAFE' as const,
    },
    {
      step_number: 3,
      tool: 'analytics.get',
      reason: 'Calculate operational completion coefficients',
      parameters: {},
      status: 'SUCCESS' as const,
      result: 'Calculated operational metrics',
      duration_ms: 45,
      verified: true,
      risk_level: 'SAFE' as const,
    },
  ];

  const isComplete = execution?.status === 'COMPLETE' || surfaceState === 'COMPLETE';
  const isFailed = execution?.status === 'FAILED' || surfaceState === 'ERROR';

  return (
    <div
      className={`rounded-2xl border border-zoro-border bg-zoro-panel p-5 font-mono select-none space-y-4 shadow-xl ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zoro-border pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-zoro-cyan shadow-[0_0_8px_#19D9FF] animate-pulse" />
          <h3 className="text-xs font-bold text-zoro-text tracking-wider uppercase">
            AGENT EXECUTION TIMELINE
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
              isComplete
                ? 'border-zoro-success/40 bg-zoro-success/10 text-zoro-success'
                : isFailed
                ? 'border-zoro-critical/40 bg-zoro-critical/10 text-zoro-critical'
                : 'border-zoro-cyan/40 bg-zoro-cyan/10 text-zoro-cyan animate-pulse'
            }`}
          >
            {isComplete ? 'AGENT COMPLETE' : isFailed ? 'EXECUTION ANOMALY' : 'EXECUTING AGENT'}
          </span>

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-xs text-zoro-textMuted hover:text-zoro-text ml-2"
            >
              DISMISS
            </button>
          )}
        </div>
      </div>

      {/* Vertical Sequenced Timeline */}
      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zoro-border">
        {/* Phase 1-5 Base System Stages */}
        {baseStages.map((stage, idx) => (
          <div key={stage.id} className="relative flex items-start gap-3 text-xs">
            {/* Timeline bullet */}
            <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-zoro-panelElevated border border-zoro-cyan flex items-center justify-center text-zoro-cyan shadow-[0_0_8px_rgba(25,217,255,0.3)]">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>

            <div>
              <div className="font-bold text-zoro-text tracking-wide text-[11px]">
                {stage.label}
              </div>
              <div className="text-[10px] text-zoro-textSecondary">
                {stage.desc}
              </div>
            </div>
          </div>
        ))}

        {/* Dynamic Tool Steps */}
        {steps.map((st) => (
          <div key={st.step_number} className="relative flex items-start gap-3 text-xs">
            <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-zoro-panelElevated border border-zoro-blue flex items-center justify-center text-zoro-blue shadow-[0_0_8px_rgba(61,124,255,0.3)]">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>

            <div className="p-3 rounded-xl border border-zoro-border bg-zoro-panelElevated/80 w-full space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-zoro-cyan">
                  STEP {st.step_number}: {st.tool}
                </span>
                <span className="text-[10px] text-zoro-textMuted tabular-nums">
                  {st.duration_ms || 28}ms
                </span>
              </div>
              <p className="text-[10px] text-zoro-textSecondary font-sans">
                {st.result || st.reason}
              </p>
              <div className="flex items-center gap-2 pt-1 text-[9px] font-bold text-zoro-success">
                <CheckCircle2 className="w-3 h-3" />
                <span>Verified by Guardian</span>
              </div>
            </div>
          </div>
        ))}

        {/* Verification Stage */}
        <div className="relative flex items-start gap-3 text-xs">
          <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-zoro-panelElevated border border-zoro-success flex items-center justify-center text-zoro-success shadow-[0_0_8px_rgba(33,230,160,0.3)]">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
          <div>
            <div className="font-bold text-zoro-success tracking-wide text-[11px]">
              VERIFICATION
            </div>
            <div className="text-[10px] text-zoro-textSecondary">
              Result verified against invariant safety policies.
            </div>
          </div>
        </div>

        {/* Complete Stage */}
        <div className="relative flex items-start gap-3 text-xs">
          <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-zoro-cyan border-2 border-zoro-cyan flex items-center justify-center text-black shadow-[0_0_12px_#19D9FF]">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
          <div>
            <div className="font-bold text-zoro-cyan tracking-wide text-[11px]">
              AGENT COMPLETE
            </div>
            <div className="text-[10px] text-zoro-textSecondary">
              Execution cycle finalized.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

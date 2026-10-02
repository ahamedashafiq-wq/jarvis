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
} from 'lucide-react';
import { CommandSurfaceState } from '../../types';

export type PipelineStage =
  | 'REQUEST_RECEIVED'
  | 'INTENT_DETECTED'
  | 'CONTEXT_LOADED'
  | 'PLAN_CREATED'
  | 'GUARDIAN_VERIFIED'
  | 'TOOLS_EXECUTED'
  | 'RESULT_VERIFIED'
  | 'RESPONSE_READY';

interface ZoroThinkingPipelineProps {
  surfaceState: CommandSurfaceState;
  currentStage?: PipelineStage;
  errorMessage?: string;
  executionTimeMs?: number;
}

export const ZoroThinkingPipeline: React.FC<ZoroThinkingPipelineProps> = ({
  surfaceState,
  currentStage,
  errorMessage,
  executionTimeMs,
}) => {
  const stages: { id: PipelineStage; label: string; desc: string }[] = [
    { id: 'REQUEST_RECEIVED', label: 'REQUEST RECEIVED', desc: 'Normalized natural language input' },
    { id: 'INTENT_DETECTED', label: 'INTENT DETECTED', desc: 'Identified actionable directive category' },
    { id: 'CONTEXT_LOADED', label: 'CONTEXT LOADED', desc: 'Synced missions, tasks, and memory records' },
    { id: 'PLAN_CREATED', label: 'PLAN CREATED', desc: 'Synthesized atomic operations' },
    { id: 'GUARDIAN_VERIFIED', label: 'GUARDIAN VERIFIED', desc: 'Evaluated safety & authorization limits' },
    { id: 'TOOLS_EXECUTED', label: 'TOOLS EXECUTED', desc: 'Dispatched to specialized agents' },
    { id: 'RESULT_VERIFIED', label: 'RESULT VERIFIED', desc: 'Audit output against success criteria' },
    { id: 'RESPONSE_READY', label: 'RESPONSE READY', desc: 'Synthesized structured briefing' },
  ];

  const getStageStatus = (stageId: PipelineStage, index: number) => {
    if (surfaceState === 'ERROR') {
      if (index === 0) return 'COMPLETED';
      return 'FAILED';
    }

    if (surfaceState === 'SUCCESS') {
      return 'COMPLETED';
    }

    if (surfaceState === 'WAITING_APPROVAL') {
      if (stageId === 'GUARDIAN_VERIFIED') return 'CURRENT';
      if (index < 4) return 'COMPLETED';
      return 'PENDING';
    }

    if (surfaceState === 'THINKING') {
      if (index < 2) return 'COMPLETED';
      if (index === 2) return 'CURRENT';
      return 'PENDING';
    }

    if (surfaceState === 'PLANNING') {
      if (index < 3) return 'COMPLETED';
      if (index === 3) return 'CURRENT';
      return 'PENDING';
    }

    if (surfaceState === 'EXECUTING') {
      if (index < 5) return 'COMPLETED';
      if (index === 5) return 'CURRENT';
      return 'PENDING';
    }

    if (surfaceState === 'VERIFYING') {
      if (index < 6) return 'COMPLETED';
      if (index === 6) return 'CURRENT';
      return 'PENDING';
    }

    return 'PENDING';
  };

  return (
    <div className="rounded-2xl border border-zoro-border bg-zoro-panel p-5 font-mono select-none space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-zoro-border pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-zoro-cyan shadow-[0_0_8px_#19D9FF] animate-pulse" />
          <span className="text-xs font-bold text-zoro-text tracking-wider uppercase">
            AI REASONING & EXECUTION PIPELINE
          </span>
        </div>
        {executionTimeMs !== undefined && (
          <span className="text-[10px] text-zoro-textMuted tabular-nums">
            {executionTimeMs}ms
          </span>
        )}
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-zoro-critical/10 border border-zoro-critical/30 text-xs text-zoro-critical flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Structured Operational Stage Cards (Progress visualization rather than wall of text) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-xs">
        {stages.map((stg, i) => {
          const status = getStageStatus(stg.id, i);
          return (
            <div
              key={stg.id}
              className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all min-h-[72px] ${
                status === 'COMPLETED'
                  ? 'border-zoro-cyan/40 bg-zoro-cyan/10 text-zoro-text'
                  : status === 'CURRENT'
                  ? 'border-zoro-blue bg-zoro-blue/20 text-zoro-cyan ring-1 ring-zoro-cyan animate-pulse shadow-[0_0_12px_rgba(25,217,255,0.2)]'
                  : status === 'FAILED'
                  ? 'border-zoro-critical/40 bg-zoro-critical/10 text-zoro-critical'
                  : 'border-zoro-border/60 bg-zoro-panelElevated/50 text-zoro-textMuted opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-bold tracking-wider text-zoro-textMuted">0{i + 1}</span>
                {status === 'COMPLETED' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-zoro-cyan" />
                ) : status === 'CURRENT' ? (
                  <Loader2 className="w-3.5 h-3.5 text-zoro-cyan animate-spin" />
                ) : status === 'FAILED' ? (
                  <AlertCircle className="w-3.5 h-3.5 text-zoro-critical" />
                ) : (
                  <Circle className="w-3 h-3 text-zoro-textMuted" />
                )}
              </div>
              <div>
                <div className="text-[9px] font-bold tracking-wider leading-tight">{stg.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

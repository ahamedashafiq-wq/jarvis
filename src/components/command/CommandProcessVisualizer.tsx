import React from 'react';
import { Check, Circle, Loader2, AlertCircle } from 'lucide-react';
import { CommandSurfaceState } from '../../types';

export type PipelineStage =
  | 'REQUEST'
  | 'CONTEXT'
  | 'PLAN'
  | 'GUARDIAN'
  | 'EXECUTION'
  | 'VERIFY'
  | 'MEMORY';

interface StageConfig {
  id: PipelineStage;
  label: string;
}

const STAGES: StageConfig[] = [
  { id: 'REQUEST', label: 'REQUEST' },
  { id: 'CONTEXT', label: 'CONTEXT' },
  { id: 'PLAN', label: 'PLAN' },
  { id: 'GUARDIAN', label: 'GUARDIAN' },
  { id: 'EXECUTION', label: 'EXECUTION' },
  { id: 'VERIFY', label: 'VERIFY' },
  { id: 'MEMORY', label: 'MEMORY' },
];

interface CommandProcessVisualizerProps {
  surfaceState: CommandSurfaceState;
  customActiveStage?: PipelineStage;
  errorMessage?: string;
}

export const CommandProcessVisualizer: React.FC<CommandProcessVisualizerProps> = ({
  surfaceState,
  customActiveStage,
  errorMessage,
}) => {
  // Map CommandSurfaceState to active stage index
  const getStageIndex = (): number => {
    if (customActiveStage) {
      return STAGES.findIndex((s) => s.id === customActiveStage);
    }
    switch (surfaceState) {
      case 'IDLE':
        return -1;
      case 'LISTENING':
      case 'THINKING':
        return 0; // REQUEST
      case 'PLANNING':
        return 2; // PLAN
      case 'WAITING_APPROVAL':
        return 3; // GUARDIAN
      case 'EXECUTING':
        return 4; // EXECUTION
      case 'VERIFYING':
        return 5; // VERIFY
      case 'COMPLETE':
        return 6; // MEMORY complete
      case 'ERROR':
      case 'CANCELLED':
        return 4;
      default:
        return 0;
    }
  };

  const activeIndex = getStageIndex();
  if (surfaceState === 'IDLE' && activeIndex === -1) {
    return null;
  }

  const isError = surfaceState === 'ERROR' || surfaceState === 'CANCELLED';
  const isComplete = surfaceState === 'COMPLETE';

  return (
    <div className="w-full rounded-md border border-jarvis-border bg-jarvis-surfaceElevated/90 backdrop-blur-md p-3 font-mono text-xs shadow-lg">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-jarvis-border/60">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-jarvis-textMuted uppercase tracking-wider font-semibold">
            NEURAL PIPELINE:
          </span>
          <span
            className={`text-xs font-bold ${
              isError
                ? 'text-jarvis-danger'
                : isComplete
                ? 'text-jarvis-primary'
                : 'text-jarvis-secondary animate-pulse'
            }`}
          >
            {isError ? 'EXECUTION INTERRUPTED' : isComplete ? 'VERIFIED & COMMITTED' : surfaceState}
          </span>
        </div>

        {errorMessage && (
          <span className="text-[10px] text-jarvis-danger truncate max-w-xs">{errorMessage}</span>
        )}
      </div>

      {/* Pipeline Stages Row */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto py-1">
        {STAGES.map((st, index) => {
          let status: 'COMPLETED' | 'ACTIVE' | 'PENDING' | 'FAILED' = 'PENDING';

          if (isError && index === activeIndex) {
            status = 'FAILED';
          } else if (index < activeIndex || isComplete) {
            status = 'COMPLETED';
          } else if (index === activeIndex) {
            status = 'ACTIVE';
          }

          return (
            <React.Fragment key={st.id}>
              <div className="flex items-center gap-1.5 shrink-0">
                {status === 'COMPLETED' ? (
                  <div className="w-4 h-4 rounded-full bg-jarvis-primary/20 border border-jarvis-primary flex items-center justify-center text-jarvis-primary">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                ) : status === 'ACTIVE' ? (
                  <div className="w-4 h-4 rounded-full bg-jarvis-secondary/20 border border-jarvis-secondary flex items-center justify-center text-jarvis-secondary animate-pulse">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  </div>
                ) : status === 'FAILED' ? (
                  <div className="w-4 h-4 rounded-full bg-jarvis-danger/20 border border-jarvis-danger flex items-center justify-center text-jarvis-danger">
                    <AlertCircle className="w-2.5 h-2.5" />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-jarvis-surface border border-jarvis-border/80 flex items-center justify-center text-jarvis-textMuted">
                    <Circle className="w-1.5 h-1.5 text-jarvis-textMuted" />
                  </div>
                )}

                <span
                  className={`text-[10px] font-medium tracking-tight ${
                    status === 'COMPLETED'
                      ? 'text-jarvis-primary'
                      : status === 'ACTIVE'
                      ? 'text-jarvis-secondary font-bold'
                      : status === 'FAILED'
                      ? 'text-jarvis-danger'
                      : 'text-jarvis-textMuted'
                  }`}
                >
                  {st.label}
                </span>
              </div>

              {index < STAGES.length - 1 && (
                <div
                  className={`flex-1 h-[1px] min-w-3 mx-1 ${
                    index < activeIndex || isComplete
                      ? 'bg-jarvis-primary/60'
                      : 'bg-jarvis-border/40'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

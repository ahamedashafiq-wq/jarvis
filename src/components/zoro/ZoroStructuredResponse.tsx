import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Target,
  CheckSquare,
  Sparkles,
  ShieldCheck,
  X,
  Volume2,
} from 'lucide-react';
import { CommandResultData, RoutePath } from '../../types';
import { soundService } from '../../services/sound';

interface ZoroStructuredResponseProps {
  result: CommandResultData;
  onNavigate: (path: RoutePath) => void;
  onDismiss: () => void;
}

export const ZoroStructuredResponse: React.FC<ZoroStructuredResponseProps> = ({
  result,
  onNavigate,
  onDismiss,
}) => {
  const isSuccess = result.status === 'SUCCESS';

  return (
    <div className="rounded-2xl border border-zoro-border bg-gradient-to-b from-zoro-panelElevated to-zoro-panel p-5 sm:p-6 space-y-4 font-mono select-none shadow-2xl">
      {/* Response Header */}
      <div className="flex items-center justify-between border-b border-zoro-border pb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-1.5 rounded-lg border ${
              isSuccess
                ? 'bg-zoro-cyan/15 border-zoro-cyan/30 text-zoro-cyan'
                : 'bg-zoro-critical/15 border-zoro-critical/30 text-zoro-critical'
            }`}
          >
            {isSuccess ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zoro-cyan font-bold tracking-widest uppercase">
                ZORO INTELLIGENCE DIRECTIVE
              </span>
              <span className="text-[9px] text-zoro-textMuted tabular-nums">
                {result.executionTimeMs}ms
              </span>
            </div>
            <h3 className="text-sm font-bold text-zoro-text">{result.headline}</h3>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="p-1.5 rounded-lg text-zoro-textMuted hover:text-zoro-text hover:bg-zoro-bg transition-colors"
          title="Dismiss Response"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Structured Card Grid (Section 34) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: Objective & Context */}
        <div className="p-3.5 rounded-xl bg-zoro-bg/70 border border-zoro-border/80 space-y-1.5">
          <span className="text-[9px] text-zoro-textMuted uppercase font-bold tracking-wider">
            DIRECTIVE CONTEXT
          </span>
          <p className="text-xs text-zoro-textSecondary leading-relaxed whitespace-pre-wrap font-sans">
            {result.summary}
          </p>
        </div>

        {/* Card 2: Next Action & Steps */}
        <div className="p-3.5 rounded-xl bg-zoro-bg/70 border border-zoro-border/80 space-y-1.5 md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-zoro-cyan uppercase font-bold tracking-wider">
              OPERATIONAL DETAILS & NEXT ACTIONS
            </span>
            <span className="text-[9px] text-zoro-textMuted">VERIFIED</span>
          </div>

          {result.details && result.details.length > 0 ? (
            <div className="space-y-1 text-[11px] text-zoro-textSecondary font-sans">
              {result.details.map((detail, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-zoro-cyan font-bold">›</span>
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zoro-textSecondary font-sans">
              Operational parameters validated. No secondary anomalies detected.
            </p>
          )}
        </div>
      </div>

      {/* Action Footer Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-zoro-border/60">
        <div className="flex items-center gap-2 text-[10px] text-zoro-textMuted">
          <ShieldCheck className="w-3.5 h-3.5 text-zoro-success" />
          <span>GUARDIAN VERIFIED • SAFE EXECUTION</span>
        </div>

        <div className="flex items-center gap-2">
          {result.actionTaken?.linkRoute && (
            <button
              onClick={() => {
                onNavigate(result.actionTaken!.linkRoute!);
                soundService.play('CLICK');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-zoro-cyan/15 hover:bg-zoro-cyan/25 border border-zoro-cyan/40 text-zoro-cyan text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(25,217,255,0.15)]"
            >
              <span>{result.actionTaken.linkLabel || 'OPEN LINK'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => {
              onNavigate('/missions');
              soundService.play('CLICK');
            }}
            className="px-3 py-1.5 rounded-xl border border-zoro-border bg-zoro-bg text-zoro-textSecondary hover:text-zoro-text text-xs transition-colors"
          >
            VIEW MISSIONS
          </button>
          <button
            onClick={() => {
              onNavigate('/tasks');
              soundService.play('CLICK');
            }}
            className="px-3 py-1.5 rounded-xl border border-zoro-border bg-zoro-bg text-zoro-textSecondary hover:text-zoro-text text-xs transition-colors"
          >
            VIEW TASKS
          </button>
        </div>
      </div>
    </div>
  );
};

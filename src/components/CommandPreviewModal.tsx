import React from 'react';
import { ActionPreviewData } from '../types';
import { Shield, AlertTriangle, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

interface CommandPreviewModalProps {
  preview: ActionPreviewData | null;
  isOpen: boolean;
  onApprove: (preview: ActionPreviewData) => void;
  onCancel: () => void;
  isExecuting?: boolean;
}

export const CommandPreviewModal: React.FC<CommandPreviewModalProps> = ({
  preview,
  isOpen,
  onApprove,
  onCancel,
  isExecuting = false,
}) => {
  if (!isOpen || !preview) return null;

  const isDestructive =
    preview.riskLevel === 'HIGH' ||
    preview.riskLevel === 'CRITICAL' ||
    preview.actionType === 'MEMORY_DELETE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050706]/85 backdrop-blur-md animate-fadeIn font-mono">
      <div className="w-full max-w-lg bg-[#0A100D] border border-[#16281F] rounded-2xl shadow-2xl overflow-hidden animate-scaleUp">
        {/* Three Blade Slash Top Accent */}
        <div
          className={`h-1.5 ${
            isDestructive
              ? 'bg-gradient-to-r from-[#FF3B30] via-[#FFB000] to-[#FF3B30]'
              : 'bg-gradient-to-r from-[#00D084] via-[#38E1FF] to-[#00D084]'
          }`}
        />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#16281F] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl border ${
                isDestructive
                  ? 'bg-[#FF3B30]/15 border-[#FF3B30]/40 text-[#FF3B30]'
                  : 'bg-[#00D084]/15 border-[#00D084]/40 text-[#19F59A]'
              }`}
            >
              {isDestructive ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <Shield className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="text-[10px] text-[#8B9992] tracking-wider uppercase">
                ZORO ACTION AUTHORIZATION
              </div>
              <h2 className="text-sm sm:text-base font-black text-[#F5F7F6]">
                {preview.title}
              </h2>
            </div>
          </div>

          <span
            className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
              isDestructive
                ? 'bg-[#FF3B30]/10 border-[#FF3B30]/30 text-[#FF3B30]'
                : 'bg-[#00D084]/10 border-[#00D084]/30 text-[#19F59A]'
            }`}
          >
            {preview.riskLevel} RISK
          </span>
        </div>

        {/* Action Details Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {preview.description && (
            <p className="text-xs text-[#8B9992] leading-relaxed">
              {preview.description}
            </p>
          )}

          {/* Structured Detail Table */}
          <div className="p-3.5 rounded-xl bg-[#050706] border border-[#16281F] space-y-2.5 text-xs">
            {preview.details.map((d, i) => (
              <div
                key={i}
                className="flex items-start justify-between border-b border-[#16281F]/40 pb-1.5 last:border-b-0 last:pb-0"
              >
                <span className="text-[#8B9992] font-semibold tracking-wider text-[11px]">
                  {d.label}:
                </span>
                <span className="text-[#F5F7F6] text-right font-medium max-w-[65%] truncate">
                  {d.value}
                </span>
              </div>
            ))}
          </div>

          {/* Safety Notice */}
          <div className="text-[10px] text-[#8B9992] flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#19F59A] shrink-0" />
            <span>
              Guardian verification active. No state modification occurs until explicit approval.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#050706]/70 border-t border-[#16281F] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isExecuting}
            className="px-4 py-2 rounded-xl border border-[#16281F] bg-[#0A100D] text-xs text-[#8B9992] hover:text-[#F5F7F6] hover:border-[#16281F]/80 transition-colors font-mono"
          >
            CANCEL
          </button>

          <button
            type="button"
            onClick={() => onApprove(preview)}
            disabled={isExecuting}
            className={`px-5 py-2 rounded-xl text-xs font-bold font-mono flex items-center gap-2 transition-all ${
              isDestructive
                ? 'bg-[#FF3B30] text-white hover:bg-[#FF3B30]/90 shadow-[0_0_15px_rgba(255,59,48,0.3)]'
                : 'bg-[#00D084] text-[#050706] hover:bg-[#19F59A] shadow-[0_0_15px_rgba(0,208,132,0.3)]'
            }`}
          >
            {isExecuting ? (
              <span>EXECUTING...</span>
            ) : (
              <>
                <span>APPROVE</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  detail?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  detail,
  confirmLabel = 'CONFIRM',
  cancelLabel = 'CANCEL',
  danger = true,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono text-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-[#0A100D] border border-[#FF3B30]/40 p-6 shadow-[0_0_50px_rgba(255,59,48,0.2)] space-y-4">
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 text-[#8B9992] hover:text-[#F5F7F6] transition-colors p-1"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#FF3B30]/15 text-[#FF3B30] border border-[#FF3B30]/30 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-[#FF3B30] font-bold tracking-widest block">
              CONFIRMATION PROTOCOL
            </span>
            <h3 className="text-base font-black text-[#F5F7F6] tracking-wide">{title}</h3>
          </div>
        </div>

        {/* Message */}
        <p className="text-xs text-[#8B9992] leading-relaxed font-sans">{message}</p>

        {/* Optional Detail Box (e.g. Memory content) */}
        {detail && (
          <div className="p-3 rounded-lg bg-[#050706] border border-[#16281F] text-[#F5F7F6] text-xs font-mono break-words border-l-2 border-l-[#FFB000]">
            {detail}
          </div>
        )}

        {/* Warning label */}
        <div className="text-[10px] text-[#FFB000] flex items-center gap-1.5 pt-1">
          <span>⚠️</span>
          <span>This tactical operation cannot be reversed once confirmed.</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#16281F]">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-[#050706] border border-[#16281F] text-[#8B9992] hover:text-[#F5F7F6] hover:border-[#8B9992]/40 transition-colors font-bold text-xs"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2 rounded-xl font-bold text-xs text-[#F5F7F6] transition-all shadow-lg ${
              danger
                ? 'bg-[#FF3B30] hover:bg-[#FF4D42] shadow-[0_0_15px_rgba(255,59,48,0.3)]'
                : 'bg-[#19F59A] text-[#050706] hover:bg-[#00D084] shadow-[0_0_15px_rgba(25,245,154,0.3)]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

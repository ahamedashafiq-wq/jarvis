import React, { useState } from 'react';
import { AgentExecution, AgentPlan, AgentStep } from '../types';
import {
  Shield,
  Check,
  X,
  AlertTriangle,
  Trash2,
  Edit3,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';

interface AgentPlanApprovalModalProps {
  execution: AgentExecution;
  onApprove: (editedPlan?: AgentPlan) => void;
  onCancel: () => void;
}

export const AgentPlanApprovalModal: React.FC<AgentPlanApprovalModalProps> = ({
  execution,
  onApprove,
  onCancel,
}) => {
  const [steps, setSteps] = useState<AgentStep[]>(() => [...execution.plan.steps]);
  const [isEditing, setIsEditing] = useState(false);

  const handleRemoveStep = (index: number) => {
    const updated = steps.filter((_, i) => i !== index).map((s, i) => ({
      ...s,
      step_number: i + 1,
    }));
    setSteps(updated);
  };

  const handleConfirm = () => {
    if (steps.length === 0) return;
    const modifiedPlan: AgentPlan = {
      ...execution.plan,
      steps,
      estimated_actions: steps.length,
    };
    onApprove(isEditing ? modifiedPlan : undefined);
  };

  const getRiskBadge = () => {
    switch (execution.plan.risk_level) {
      case 'CRITICAL':
        return { label: 'CRITICAL RISK', bg: 'bg-[#FF3B30]/20 border-[#FF3B30] text-[#FF3B30]' };
      case 'HIGH':
        return { label: 'HIGH RISK', bg: 'bg-[#FF3B30]/15 border-[#FF3B30]/50 text-[#FF3B30]' };
      case 'MEDIUM':
        return { label: 'MEDIUM RISK', bg: 'bg-[#FFB000]/15 border-[#FFB000]/50 text-[#FFB000]' };
      case 'LOW':
        return { label: 'LOW RISK', bg: 'bg-[#00D084]/15 border-[#00D084]/50 text-[#19F59A]' };
      case 'SAFE':
      default:
        return { label: 'SAFE', bg: 'bg-[#16281F] border-[#16281F] text-[#8B9992]' };
    }
  };

  const risk = getRiskBadge();

  return (
    <div className="fixed inset-0 z-50 bg-[#050706]/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in font-mono">
      <div className="w-full max-w-2xl bg-[#0A100D] border border-[#00D084]/50 rounded-2xl shadow-[0_0_50px_rgba(0,208,132,0.2)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#16281F] bg-[#050706] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00D084]/15 border border-[#00D084] flex items-center justify-center">
              <Shield className="w-4 h-4 text-[#19F59A]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-[#F5F7F6] tracking-wider">
                  JARVIS ACTION PLAN
                </span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${risk.bg}`}>
                  {risk.label}
                </span>
              </div>
              <p className="text-[10px] text-[#8B9992]">
                GUARDIAN SAFETY GATE • OPERATOR APPROVAL REQUIRED
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
              isEditing
                ? 'bg-[#121C17] border-[#00D084] text-[#19F59A]'
                : 'bg-[#050706] border-[#16281F] text-[#8B9992] hover:text-[#19F59A]'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'DONE EDITING' : 'EDIT PLAN'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Objective Banner */}
          <div className="p-3.5 rounded-xl bg-[#050706] border border-[#16281F] space-y-1">
            <span className="text-[10px] font-bold text-[#8B9992] tracking-wider">
              OPERATIONAL OBJECTIVE:
            </span>
            <p className="text-sm font-sans font-bold text-[#F5F7F6]">
              "{execution.objective}"
            </p>
          </div>

          {/* Context Used */}
          {execution.context_summary.details.length > 0 && (
            <div className="p-3 rounded-xl bg-[#050706]/60 border border-[#16281F] text-[11px] text-[#8B9992] space-y-1">
              <div className="flex items-center gap-1.5 text-[#38E1FF] font-bold text-[10px]">
                <Info className="w-3.5 h-3.5" />
                <span>CONTEXT LOADED BY ANALYST:</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {execution.context_summary.details.map((d, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-[#16281F] text-[#F5F7F6] text-[10px]">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Proposed Actions List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold text-[#8B9992] tracking-wider">
              <span>PROPOSED SEQUENTIAL ACTIONS ({steps.length}):</span>
              {isEditing && <span className="text-[#FFB000]">CLICK TRASH TO REMOVE STEPS</span>}
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#050706] border border-[#16281F] flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md bg-[#16281F] flex items-center justify-center text-[10px] font-bold text-[#19F59A] shrink-0">
                      {String(step.step_number).padStart(2, '0')}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#F5F7F6] text-xs uppercase">
                          {step.tool}
                        </span>
                        <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-[#16281F] text-[#8B9992]">
                          {step.risk_level}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8B9992] font-sans mt-0.5">
                        {step.reason}
                      </p>
                    </div>
                  </div>

                  {isEditing ? (
                    <button
                      onClick={() => handleRemoveStep(idx)}
                      className="p-1.5 rounded-lg text-[#8B9992] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-colors"
                      title="Remove Step"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="text-[10px] text-[#00D084] font-bold shrink-0">
                      PENDING APPROVAL
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#16281F] bg-[#050706] flex items-center justify-between gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-[#FF3B30]/40 bg-[#FF3B30]/10 text-[#FF3B30] hover:bg-[#FF3B30]/20 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <X className="w-4 h-4" />
            <span>CANCEL PLAN</span>
          </button>

          <button
            onClick={handleConfirm}
            disabled={steps.length === 0}
            className="px-6 py-2.5 rounded-xl bg-[#00D084] hover:bg-[#19F59A] text-[#050706] text-xs font-black tracking-wider transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(0,208,132,0.3)] disabled:opacity-40"
          >
            <Check className="w-4 h-4" />
            <span>APPROVE & EXECUTE ({steps.length})</span>
          </button>
        </div>
      </div>
    </div>
  );
};

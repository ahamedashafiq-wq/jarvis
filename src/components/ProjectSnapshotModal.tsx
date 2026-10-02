import React from 'react';
import { ProjectKnowledgeSnapshot } from '../types';
import {
  Layers,
  X,
  Target,
  GitCommit,
  CheckCircle,
  HelpCircle,
  Clock,
  Database,
  Eye,
  Shield,
} from 'lucide-react';

interface ProjectSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshot: ProjectKnowledgeSnapshot;
}

export const ProjectSnapshotModal: React.FC<ProjectSnapshotModalProps> = ({
  isOpen,
  onClose,
  snapshot,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#050706]/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-[#0A100D] border border-[#16281F] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#16281F] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#19F59A]/15 text-[#19F59A] border border-[#19F59A]/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#F5F7F6] tracking-wider uppercase">
                  {snapshot.projectName}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#16281F] text-[#19F59A] font-mono font-bold">
                  KNOWLEDGE SNAPSHOT
                </span>
              </div>
              <p className="text-[10px] text-[#8B9992] font-mono">
                Consolidated Strategic Intelligence • Blade 03 Synthesis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8B9992] hover:text-[#F5F7F6] hover:bg-[#16281F] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 font-mono text-xs">
          {/* Strategic Goal */}
          <div className="p-4 rounded-xl bg-[#050706] border border-[#16281F] space-y-1.5">
            <div className="flex items-center gap-1.5 text-[#19F59A] font-bold text-[10px] uppercase tracking-wider">
              <Target className="w-3.5 h-3.5" />
              <span>STRATEGIC GOAL</span>
            </div>
            <p className="text-sm font-bold text-[#F5F7F6] font-sans">
              {snapshot.goal || 'Complete autonomous AI assistant development.'}
            </p>
          </div>

          {/* Current Mission & Progress */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-[#050706] border border-[#16281F] space-y-1">
              <span className="text-[10px] text-[#38E1FF] font-bold uppercase tracking-wider block">
                CURRENT ACTIVE MISSION
              </span>
              <span className="text-xs font-bold text-[#F5F7F6]">
                {snapshot.currentMission || 'Mission Control OS'}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#050706] border border-[#16281F] space-y-1">
              <span className="text-[10px] text-[#FFB000] font-bold uppercase tracking-wider block">
                ACTION QUEUE STATUS
              </span>
              <span className="text-xs font-bold text-[#F5F7F6]">
                {snapshot.tasksSummary.completed} Cleared • {snapshot.tasksSummary.pending} Pending
              </span>
            </div>
          </div>

          {/* Key Decisions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#A78BFA] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <GitCommit className="w-3.5 h-3.5" />
                <span>KEY ARCHITECTURAL DECISIONS ({snapshot.keyDecisions.length})</span>
              </span>
              <span className="text-[9px] text-[#8B9992]">EXPLICITLY COMMITTED</span>
            </div>

            {snapshot.keyDecisions.length === 0 ? (
              <p className="text-[11px] text-[#8B9992] italic">No active decisions recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {snapshot.keyDecisions.map((dec) => (
                  <div
                    key={dec.id}
                    className="p-3 rounded-xl bg-[#050706] border border-[#A78BFA]/30 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#F5F7F6] text-xs">{dec.decision}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#A78BFA]/20 text-[#A78BFA] font-bold">
                        {dec.status}
                      </span>
                    </div>
                    {dec.context && (
                      <p className="text-[10px] text-[#8B9992] font-sans">{dec.context}</p>
                    )}
                    <div className="text-[9px] text-[#8B9992] pt-1 flex items-center gap-2">
                      <span>Source: {dec.source}</span>
                      <span>•</span>
                      <span>Quality: {dec.quality}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Progress */}
          <div className="space-y-2">
            <span className="text-[10px] text-[#19F59A] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>RECENT PROGRESS MILESTONES</span>
            </span>
            <div className="p-3.5 rounded-xl bg-[#050706] border border-[#16281F] space-y-1.5">
              {snapshot.recentProgress.map((prog, idx) => (
                <div key={idx} className="flex items-start gap-2 text-[11px] text-[#8B9992]">
                  <span className="text-[#19F59A] mt-0.5 font-bold">✓</span>
                  <span>{prog}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Open Questions */}
          <div className="space-y-2">
            <span className="text-[10px] text-[#38E1FF] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>OPEN TACTICAL QUESTIONS</span>
            </span>
            <div className="p-3.5 rounded-xl bg-[#050706] border border-[#16281F] space-y-1.5">
              {snapshot.openQuestions.map((q, idx) => (
                <div key={idx} className="flex items-start gap-2 text-[11px] text-[#8B9992]">
                  <span className="text-[#38E1FF] mt-0.5 font-bold">?</span>
                  <span>{q}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-[#16281F] bg-[#050706] flex items-center justify-between">
          <span className="text-[10px] text-[#8B9992] font-mono">
            BLADE 03 PERSISTENT IDENTITY
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#19F59A] text-[#050706] font-bold text-xs hover:bg-[#00D084] transition-all"
          >
            DISMISS SNAPSHOT
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { AIMissionPlan, MissionPriority, MissionCategory } from '../types';
import { MissionService } from '../services/mission';
import { AIOrb } from './AIOrb';
import { Sparkles, Check, Edit3, X, ArrowRight, Shield, ListOrdered, Calendar, Tag } from 'lucide-react';

interface PlanWithJarvisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanApproved: (plan: AIMissionPlan) => void;
  initialPrompt?: string;
}

export const PlanWithJarvisModal: React.FC<PlanWithJarvisModalProps> = ({
  isOpen,
  onClose,
  onPlanApproved,
  initialPrompt = '',
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isGenerating, setIsGenerating] = useState(false);
  const [plan, setPlan] = useState<AIMissionPlan | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (targetPrompt?: string) => {
    const text = (targetPrompt || prompt).trim();
    if (!text) return;
    setError(null);
    setIsGenerating(true);

    try {
      const generated = await MissionService.generateMissionPlan(text);
      setPlan(generated);
      setIsEditing(false);
    } catch (err: any) {
      setError('ZORO could not generate the plan. Please refine prompt and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = () => {
    if (!plan) return;
    onPlanApproved(plan);
    onClose();
  };

  const presetPrompts = [
    'I want to finish my AI project.',
    'I need to build an AI-powered study assistant.',
    'Build a fullstack SaaS MVP with authentication.',
    'Master advanced algorithms and system design.',
  ];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto font-mono text-xs animate-fade-in">
      <div className="bg-[#0A100D] border border-[#16281F] rounded-2xl max-w-2xl w-full p-5 sm:p-6 space-y-5 shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#16281F] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#00D084]/15 border border-[#00D084] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#19F59A]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#F5F7F6] tracking-wider uppercase">
                PLAN WITH ZORO • OMNIA COGNITIVE SYNTHESIZER
              </h2>
              <p className="text-[10px] text-[#8B9992]">
                State your high-level goal. ZORO synthesizes sequenced objectives.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#16281F] text-[#8B9992] hover:text-[#FF3B30] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Phase (if no plan yet or user wants new input) */}
        {!plan && !isGenerating && (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-[#8B9992] block mb-1 uppercase tracking-wider font-bold">
                COMMAND DIRECTIVE / MISSION GOAL
              </label>
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. 'I want to build an AI-powered study assistant with automated flashcards and spaced repetition...'"
                className="w-full bg-[#050706] border border-[#16281F] rounded-xl p-3 text-xs text-[#F5F7F6] focus:border-[#19F59A] outline-none transition-colors"
              />
            </div>

            {/* Quick Prompt Presets */}
            <div className="space-y-1.5">
              <span className="text-[9px] text-[#8B9992] uppercase tracking-wider">
                STRATEGIC TEMPLATES:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {presetPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPrompt(p);
                      handleGenerate(p);
                    }}
                    className="px-2.5 py-1 rounded bg-[#050706] border border-[#16281F] text-[#8B9992] hover:text-[#19F59A] hover:border-[#19F59A]/40 text-[10px] transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-[#FF3B30]/15 border border-[#FF3B30]/40 text-[#FF3B30] text-[11px]">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#16281F]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs text-[#8B9992] hover:text-[#F5F7F6]"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={!prompt.trim()}
                onClick={() => handleGenerate()}
                className="px-5 py-2 rounded-xl bg-[#19F59A] text-[#050706] font-bold text-xs hover:bg-[#00D084] transition-all disabled:opacity-40 flex items-center gap-1.5 shadow-[0_0_15px_rgba(25,245,154,0.3)]"
              >
                <span>SYNTHESIZE MISSION</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Generating State */}
        {isGenerating && (
          <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
            <AIOrb state="THINKING" size={110} />
            <div className="space-y-1">
              <div className="text-xs font-bold text-[#19F59A] tracking-widest animate-pulse">
                ZORO ANALYZING DIRECTIVE...
              </div>
              <p className="text-[10px] text-[#8B9992]">
                Calibrating sequenced objectives across Blade 01 Intellect and Blade 02 Action
              </p>
            </div>
          </div>
        )}

        {/* Plan Ready Review State (Section 9 & 10) */}
        {plan && !isGenerating && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-[#00D084]/10 border border-[#00D084]/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#19F59A]" />
                <span className="font-bold text-[#19F59A] tracking-wider">
                  MISSION PLAN READY FOR APPROVAL
                </span>
              </div>
              <span className="text-[10px] text-[#8B9992]">
                {plan.objectives.length} OBJECTIVES SEQUENCED
              </span>
            </div>

            {/* Mission Overview Card */}
            <div className="p-4 rounded-xl bg-[#050706] border border-[#16281F] space-y-3">
              {isEditing ? (
                <div className="space-y-2">
                  <div>
                    <label className="text-[9px] text-[#8B9992] block">MISSION TITLE</label>
                    <input
                      type="text"
                      value={plan.title}
                      onChange={(e) => setPlan({ ...plan, title: e.target.value })}
                      className="w-full bg-[#0A100D] border border-[#16281F] rounded px-2.5 py-1.5 text-xs text-[#F5F7F6]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-[#8B9992] block">GOAL</label>
                    <input
                      type="text"
                      value={plan.goal}
                      onChange={(e) => setPlan({ ...plan, goal: e.target.value })}
                      className="w-full bg-[#0A100D] border border-[#16281F] rounded px-2.5 py-1.5 text-xs text-[#F5F7F6]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-[#8B9992] block">PRIORITY</label>
                      <select
                        value={plan.priority}
                        onChange={(e) => setPlan({ ...plan, priority: e.target.value as MissionPriority })}
                        className="w-full bg-[#0A100D] border border-[#16281F] rounded px-2 py-1 text-xs text-[#F5F7F6]"
                      >
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                        <option value="CRITICAL">CRITICAL</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-[#8B9992] block">DEADLINE</label>
                      <input
                        type="text"
                        value={plan.deadline}
                        onChange={(e) => setPlan({ ...plan, deadline: e.target.value })}
                        className="w-full bg-[#0A100D] border border-[#16281F] rounded px-2 py-1 text-xs text-[#F5F7F6]"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-[#F5F7F6] tracking-wider">
                      {plan.title}
                    </h3>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#FFB000]/15 text-[#FFB000] border border-[#FFB000]/30">
                      {plan.priority} PRIORITY
                    </span>
                  </div>
                  <p className="text-xs text-[#8B9992] leading-relaxed font-sans">{plan.goal}</p>
                  <div className="flex items-center gap-3 pt-1 text-[10px] text-[#8B9992]">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3 text-[#38E1FF]" />
                      {plan.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#19F59A]" />
                      {plan.deadline}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Sequenced Objectives List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] text-[#8B9992]">
                <span className="uppercase tracking-wider font-bold">
                  SEQUENCED OBJECTIVES (01 — {String(plan.objectives.length).padStart(2, '0')})
                </span>
                <span className="text-[#19F59A] font-bold">APPROVAL PENDING</span>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {plan.objectives.map((obj, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#050706] border border-[#16281F] space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#F5F7F6] flex items-center gap-2">
                        <span className="text-[#19F59A] font-mono">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span>{obj.title}</span>
                      </span>
                      <span className="text-[9px] text-[#8B9992]">{obj.priority}</span>
                    </div>
                    <p className="text-[11px] text-[#8B9992] font-sans pl-6">{obj.description}</p>
                    {obj.tasks && obj.tasks.length > 0 && (
                      <div className="pl-6 pt-1 flex flex-wrap gap-1.5">
                        {obj.tasks.map((t, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[9px] px-2 py-0.5 rounded bg-[#0A100D] border border-[#16281F] text-[#8B9992]"
                          >
                            • {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions: APPROVE PLAN / EDIT PLAN / CANCEL (Section 9) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-[#16281F]">
              <button
                type="button"
                onClick={() => setPlan(null)}
                className="w-full sm:w-auto px-3 py-1.5 rounded text-xs text-[#8B9992] hover:text-[#F5F7F6] text-center"
              >
                RE-PROMPT
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-3.5 py-2 rounded-xl bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#F5F7F6] text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'FINISH EDIT' : 'EDIT PLAN'}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#FF3B30] text-xs transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  className="px-5 py-2 rounded-xl bg-[#19F59A] text-[#050706] font-bold text-xs hover:bg-[#00D084] transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(25,245,154,0.3)]"
                >
                  <Check className="w-4 h-4" />
                  <span>APPROVE PLAN</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  AgentExecution,
  AgentPlan,
  AgentStatus,
  RoutePath,
} from '../types';
import { AgentCore, AgentAnalyticsData } from '../services/agent';
import { AgentPlanApprovalModal } from '../components/AgentPlanApprovalModal';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Layers,
  Play,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  X,
  Clock,
  Sparkles,
  ArrowRight,
  Send,
  Activity,
  Trash2,
  Users,
  Eye,
  Check,
  FastForward,
} from 'lucide-react';

interface AgentsProps {
  onNavigate: (path: RoutePath) => void;
  selectedExecutionId?: string;
}

export const Agents: React.FC<AgentsProps> = ({ onNavigate, selectedExecutionId }) => {
  const { currentSession, createNotification } = useAuth();
  const userId = currentSession?.userId || 'guest';

  const [executions, setExecutions] = useState<AgentExecution[]>(() =>
    AgentCore.getExecutions(userId)
  );
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'WAITING' | 'COMPLETED' | 'FAILED'>(
    'ALL'
  );
  const [selectedExecution, setSelectedExecution] = useState<AgentExecution | null>(() => {
    if (selectedExecutionId) {
      return AgentCore.getExecutionById(userId, selectedExecutionId);
    }
    return null;
  });

  const [pendingApprovalExec, setPendingApprovalExec] = useState<AgentExecution | null>(null);
  const [promptInput, setPromptInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analytics, setAnalytics] = useState<AgentAnalyticsData>(() =>
    AgentCore.getAgentAnalytics(userId)
  );

  // Sync execution state
  useEffect(() => {
    const interval = setInterval(() => {
      const list = AgentCore.getExecutions(userId);
      setExecutions(list);
      setAnalytics(AgentCore.getAgentAnalytics(userId));

      if (selectedExecution) {
        const updated = list.find((e) => e.id === selectedExecution.id);
        if (updated) setSelectedExecution(updated);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [userId, selectedExecution]);

  // Handle new Agent Dispatch
  const handleDispatchAgent = async (messageText?: string) => {
    const text = (messageText || promptInput).trim();
    if (!text || isSubmitting) return;

    setIsSubmitting(true);
    setPromptInput('');

    try {
      const result = await AgentCore.startAgent(
        {
          id: 'req_' + Date.now(),
          user_id: userId,
          message: text,
          source: 'TEXT',
          created_at: Date.now(),
        },
        (updated) => {
          setSelectedExecution(updated);
          setExecutions(AgentCore.getExecutions(userId));
          if (updated.status === 'WAITING_FOR_APPROVAL') {
            setPendingApprovalExec(updated);
          }
        }
      );

      setSelectedExecution(result);
      if (result.status === 'WAITING_FOR_APPROVAL') {
        setPendingApprovalExec(result);
      }
      setExecutions(AgentCore.getExecutions(userId));
    } catch (err: any) {
      createNotification('AGENT ERROR', err?.message || 'Agent pipeline failure', 'ERROR');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Approval Modal
  const handleApprove = async (editedPlan?: AgentPlan) => {
    if (!pendingApprovalExec) return;
    const targetId = pendingApprovalExec.id;
    setPendingApprovalExec(null);

    await AgentCore.approveExecution(userId, targetId, editedPlan, (updated) => {
      setSelectedExecution(updated);
      setExecutions(AgentCore.getExecutions(userId));
    });
  };

  const handleCancel = (execId: string) => {
    AgentCore.cancelExecution(userId, execId);
    setExecutions(AgentCore.getExecutions(userId));
    if (selectedExecution?.id === execId) {
      setSelectedExecution(AgentCore.getExecutionById(userId, execId));
    }
    setPendingApprovalExec(null);
  };

  const handleRetry = async (execId: string) => {
    await AgentCore.retryExecution(userId, execId, (updated) => {
      setSelectedExecution(updated);
      setExecutions(AgentCore.getExecutions(userId));
    });
  };

  const handleSkip = async (execId: string) => {
    await AgentCore.skipStepAndContinue(userId, execId, (updated) => {
      setSelectedExecution(updated);
      setExecutions(AgentCore.getExecutions(userId));
    });
  };

  // Filtered executions
  const filtered = executions.filter((e) => {
    if (activeTab === 'ACTIVE') return e.status === 'EXECUTING' || e.status === 'UNDERSTANDING' || e.status === 'VERIFYING';
    if (activeTab === 'WAITING') return e.status === 'WAITING_FOR_APPROVAL';
    if (activeTab === 'COMPLETED') return e.status === 'COMPLETE';
    if (activeTab === 'FAILED') return e.status === 'FAILED' || e.status === 'CANCELLED';
    return true;
  });

  const presetQueries = [
    'Prepare my AI project for the next development session',
    'Create a mission for AI Assistant with backend, frontend, testing and deployment objectives',
    'Audit pending tasks and calculate operational clearance rate',
    'Search memories and identify project requirements',
  ];

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 font-mono text-xs select-none">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#16281F] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#19F59A] animate-pulse" />
            <h1 className="text-xl font-black text-[#F5F7F6] tracking-wider">
              AGENTIC BRAIN ORCHESTRATION
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#00D084]/15 border border-[#00D084]/30 text-[#19F59A]">
              PHASE 08
            </span>
          </div>
          <p className="text-[10px] text-[#8B9992] mt-0.5">
            UNDERSTAND • CONTEXT • PLAN • GUARDIAN • ACT • VERIFY
          </p>
        </div>

        {/* Council and Stats Link */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/agents/council')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A100D] border border-[#00D084]/40 text-[#19F59A] hover:bg-[#00D084]/15 transition-all text-xs font-bold"
          >
            <Users className="w-3.5 h-3.5" />
            <span>AGENT COUNCIL</span>
          </button>
        </div>
      </div>

      {/* 2. Top Analytics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-[#0A100D] border border-[#16281F] space-y-1">
          <span className="text-[9px] text-[#8B9992] font-bold">TOTAL RUNS</span>
          <div className="text-lg font-black text-[#F5F7F6]">{analytics.totalExecutions}</div>
        </div>
        <div className="p-3 rounded-xl bg-[#0A100D] border border-[#16281F] space-y-1">
          <span className="text-[9px] text-[#8B9992] font-bold">SUCCESS RATE</span>
          <div className="text-lg font-black text-[#19F59A]">
            {analytics.totalExecutions > 0
              ? Math.round((analytics.successfulExecutions / analytics.totalExecutions) * 100)
              : 100}
            %
          </div>
        </div>
        <div className="p-3 rounded-xl bg-[#0A100D] border border-[#16281F] space-y-1">
          <span className="text-[9px] text-[#8B9992] font-bold">AVG LATENCY</span>
          <div className="text-lg font-black text-[#38E1FF]">
            {analytics.averageDurationMs} ms
          </div>
        </div>
        <div className="p-3 rounded-xl bg-[#0A100D] border border-[#16281F] space-y-1">
          <span className="text-[9px] text-[#8B9992] font-bold">ACTIVE/WAITING</span>
          <div className="text-lg font-black text-[#FFB000]">
            {executions.filter((e) => e.status === 'WAITING_FOR_APPROVAL' || e.status === 'EXECUTING').length}
          </div>
        </div>
      </div>

      {/* 3. New Agent Directive Dispatch Input */}
      <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#16281F] space-y-3 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-bold text-[#F5F7F6]">
          <Sparkles className="w-4 h-4 text-[#19F59A]" />
          <span>DISPATCH MULTI-STEP AGENT DIRECTIVE</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleDispatchAgent();
            }}
            placeholder="Describe a goal (e.g. 'Organize my AI project and tell me what I should work on next')..."
            className="flex-1 p-3 rounded-xl bg-[#050706] border border-[#16281F] text-[#F5F7F6] text-xs outline-none focus:border-[#00D084]"
          />
          <button
            onClick={() => handleDispatchAgent()}
            disabled={!promptInput.trim() || isSubmitting}
            className="px-6 py-3 rounded-xl bg-[#00D084] hover:bg-[#19F59A] text-[#050706] font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40"
          >
            <span>DISPATCH</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Preset chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {presetQueries.map((q, i) => (
            <button
              key={i}
              onClick={() => handleDispatchAgent(q)}
              className="px-2.5 py-1 rounded-lg bg-[#050706] border border-[#16281F] hover:border-[#00D084]/40 text-[#8B9992] hover:text-[#19F59A] text-[10px] transition-colors"
            >
              › {q}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0A100D] border border-[#16281F] w-fit">
        {(['ALL', 'ACTIVE', 'WAITING', 'COMPLETED', 'FAILED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
              activeTab === tab
                ? 'bg-[#121C17] border border-[#00D084] text-[#19F59A]'
                : 'text-[#8B9992] hover:text-[#F5F7F6]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 5. Main Execution View: Grid of Runs & Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Executions List */}
        <div className="lg:col-span-6 space-y-3">
          {filtered.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#0A100D] border border-[#16281F] text-[#8B9992] space-y-2">
              <Layers className="w-6 h-6 mx-auto opacity-50 text-[#19F59A]" />
              <p>No agent executions match current filter.</p>
              <p className="text-[10px]">Dispatch a directive above to initialize the orchestration layer.</p>
            </div>
          ) : (
            filtered.map((item) => {
              const isSelected = selectedExecution?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedExecution(item)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                    isSelected
                      ? 'bg-[#121C17] border-[#00D084] shadow-[0_0_15px_rgba(0,208,132,0.15)]'
                      : 'bg-[#0A100D] border-[#16281F] hover:border-[#16281F]/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[8px] font-bold px-2 py-0.5 rounded border ${
                            item.status === 'COMPLETE'
                              ? 'bg-[#00D084]/15 border-[#00D084]/40 text-[#19F59A]'
                              : item.status === 'WAITING_FOR_APPROVAL'
                              ? 'bg-[#FFB000]/15 border-[#FFB000]/40 text-[#FFB000] animate-pulse'
                              : item.status === 'EXECUTING'
                              ? 'bg-[#38E1FF]/15 border-[#38E1FF]/40 text-[#38E1FF] animate-pulse'
                              : item.status === 'FAILED' || item.status === 'CANCELLED'
                              ? 'bg-[#FF3B30]/15 border-[#FF3B30]/40 text-[#FF3B30]'
                              : 'bg-[#16281F] border-[#16281F] text-[#8B9992]'
                          }`}
                        >
                          {item.status}
                        </span>
                        <span className="text-[9px] text-[#8B9992]">
                          {new Date(item.started_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <h3 className="font-bold text-xs text-[#F5F7F6] font-sans">
                        {item.objective}
                      </h3>
                    </div>

                    <span className="text-[9px] text-[#8B9992] shrink-0">
                      {item.plan.steps.length} STEPS
                    </span>
                  </div>

                  {/* Step status bar */}
                  <div className="flex items-center gap-1">
                    {item.plan.steps.map((st, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full ${
                          st.status === 'SUCCESS'
                            ? 'bg-[#00D084]'
                            : st.status === 'RUNNING'
                            ? 'bg-[#38E1FF] animate-pulse'
                            : st.status === 'FAILED'
                            ? 'bg-[#FF3B30]'
                            : st.status === 'SKIPPED'
                            ? 'bg-[#8B9992]'
                            : 'bg-[#16281F]'
                        }`}
                        title={`Step ${i + 1}: ${st.tool} [${st.status}]`}
                      />
                    ))}
                  </div>

                  {/* Actions preview */}
                  <div className="flex items-center justify-between text-[10px] text-[#8B9992] pt-1 border-t border-[#16281F]/60">
                    <span className="truncate max-w-[200px]">
                      {item.tools_used.join(', ') || 'Evaluating tools...'}
                    </span>

                    {item.status === 'WAITING_FOR_APPROVAL' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingApprovalExec(item);
                        }}
                        className="px-2 py-0.5 rounded bg-[#FFB000] text-[#050706] font-bold text-[9px] hover:bg-[#FFB000]/90 animate-pulse"
                      >
                        REVIEW PLAN
                      </button>
                    ) : item.status === 'EXECUTING' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancel(item.id);
                        }}
                        className="px-2 py-0.5 rounded bg-[#FF3B30]/20 text-[#FF3B30] border border-[#FF3B30]/40 font-bold text-[9px]"
                      >
                        ABORT
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Selected Execution Detail Drawer (Satisfying /agents/[id]) */}
        <div className="lg:col-span-6">
          {selectedExecution ? (
            <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#16281F] space-y-5 sticky top-20 shadow-2xl">
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-[#16281F]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#F5F7F6]">EXECUTION DETAIL</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#16281F] text-[#19F59A]">
                      #{selectedExecution.id.slice(-6)}
                    </span>
                  </div>
                  <h2 className="text-sm font-sans font-bold text-[#F5F7F6] mt-1">
                    {selectedExecution.objective}
                  </h2>
                </div>

                {/* State-driven actions */}
                <div className="flex items-center gap-1.5">
                  {selectedExecution.status === 'WAITING_FOR_APPROVAL' && (
                    <button
                      onClick={() => setPendingApprovalExec(selectedExecution)}
                      className="px-3 py-1.5 rounded-lg bg-[#00D084] hover:bg-[#19F59A] text-[#050706] font-bold text-xs"
                    >
                      APPROVE PLAN
                    </button>
                  )}

                  {selectedExecution.status === 'EXECUTING' && (
                    <button
                      onClick={() => handleCancel(selectedExecution.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#FF3B30] text-[#F5F7F6] font-bold text-xs"
                    >
                      CANCEL
                    </button>
                  )}

                  {selectedExecution.status === 'PAUSED' && (
                    <>
                      <button
                        onClick={() => handleRetry(selectedExecution.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#00D084] text-[#050706] font-bold text-xs flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>RETRY</span>
                      </button>
                      <button
                        onClick={() => handleSkip(selectedExecution.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#16281F] text-[#F5F7F6] font-bold text-xs flex items-center gap-1"
                      >
                        <FastForward className="w-3 h-3" />
                        <span>SKIP</span>
                      </button>
                    </>
                  )}

                  {selectedExecution.status === 'COMPLETE' && (
                    <button
                      onClick={() => handleDispatchAgent(selectedExecution.objective)}
                      className="px-3 py-1.5 rounded-lg border border-[#00D084]/40 bg-[#00D084]/10 text-[#19F59A] hover:bg-[#00D084]/20 font-bold text-xs flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>RUN AGAIN</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Execution Flow Indicators */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#050706] border border-[#16281F] text-[9px]">
                <div className="flex items-center gap-1 text-[#19F59A]">
                  <Check className="w-3 h-3" />
                  <span>UNDERSTANDING</span>
                </div>
                <span className="text-[#16281F]">›</span>
                <div className="flex items-center gap-1 text-[#19F59A]">
                  <Check className="w-3 h-3" />
                  <span>CONTEXT</span>
                </div>
                <span className="text-[#16281F]">›</span>
                <div className="flex items-center gap-1 text-[#19F59A]">
                  <Check className="w-3 h-3" />
                  <span>PLAN</span>
                </div>
                <span className="text-[#16281F]">›</span>
                <div
                  className={`flex items-center gap-1 ${
                    selectedExecution.status === 'COMPLETE'
                      ? 'text-[#19F59A]'
                      : selectedExecution.status === 'EXECUTING'
                      ? 'text-[#38E1FF] animate-pulse'
                      : 'text-[#8B9992]'
                  }`}
                >
                  <Activity className="w-3 h-3" />
                  <span>EXECUTING</span>
                </div>
                <span className="text-[#16281F]">›</span>
                <div
                  className={`flex items-center gap-1 ${
                    selectedExecution.status === 'COMPLETE' ? 'text-[#19F59A]' : 'text-[#8B9992]'
                  }`}
                >
                  <Shield className="w-3 h-3" />
                  <span>VERIFICATION</span>
                </div>
              </div>

              {/* Plan Steps with Verification */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-[#8B9992] tracking-wider">
                  PLAN EXECUTION & VERIFICATION ({selectedExecution.plan.steps.length} STEPS):
                </span>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedExecution.plan.steps.map((st, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-[#050706] border border-[#16281F] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-[#19F59A]">
                            STEP 0{st.step_number}
                          </span>
                          <span className="font-bold text-xs text-[#F5F7F6] uppercase">
                            {st.tool}
                          </span>
                        </div>
                        <span
                          className={`text-[8px] font-bold px-1.5 py-0.2 rounded ${
                            st.status === 'SUCCESS'
                              ? 'bg-[#00D084]/20 text-[#19F59A]'
                              : st.status === 'RUNNING'
                              ? 'bg-[#38E1FF]/20 text-[#38E1FF] animate-pulse'
                              : st.status === 'FAILED'
                              ? 'bg-[#FF3B30]/20 text-[#FF3B30]'
                              : 'bg-[#16281F] text-[#8B9992]'
                          }`}
                        >
                          {st.status}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#8B9992] font-sans">{st.reason}</p>

                      {st.result && (
                        <div className="p-2 rounded bg-[#0A100D] border border-[#16281F] text-[10px] text-[#F5F7F6]">
                          {st.result}
                        </div>
                      )}

                      {st.verified && (
                        <div className="flex items-center gap-1.5 text-[9px] text-[#19F59A]">
                          <CheckCircle className="w-3 h-3 shrink-0" />
                          <span>{st.verification_detail || 'Database verification passed.'}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Result Summary */}
              {selectedExecution.result_summary && (
                <div className="p-3.5 rounded-xl bg-[#121C17] border border-[#00D084]/30 space-y-1">
                  <span className="text-[9px] font-bold text-[#19F59A] tracking-wider">
                    EXECUTION VERIFIED RESULT:
                  </span>
                  <p className="font-sans text-xs text-[#F5F7F6] leading-relaxed whitespace-pre-wrap">
                    {selectedExecution.result_summary}
                  </p>
                </div>
              )}

              {/* Execution Visual Timeline */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-[#8B9992] tracking-wider">
                  TACTICAL EXECUTION TIMELINE:
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedExecution.timeline.map((evt) => (
                    <div
                      key={evt.id}
                      className="flex items-start gap-2.5 p-2 rounded-lg bg-[#050706] border border-[#16281F]/60 text-[10px]"
                    >
                      <span className="text-[#8B9992] font-mono shrink-0">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </span>
                      {evt.role && (
                        <span className="px-1 py-0.2 rounded bg-[#16281F] text-[#19F59A] text-[8px] font-bold shrink-0">
                          {evt.role}
                        </span>
                      )}
                      <div>
                        <div className="font-bold text-[#F5F7F6]">{evt.label}</div>
                        {evt.detail && (
                          <div className="text-[#8B9992] font-sans text-[10px] mt-0.5">
                            {evt.detail}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-[#0A100D] border border-[#16281F] text-[#8B9992] space-y-2">
              <Eye className="w-8 h-8 mx-auto opacity-40 text-[#00D084]" />
              <p className="font-bold">Select an agent execution to view details</p>
              <p className="text-[10px]">
                Inspect request, plan breakdown, tool execution, and verification timeline.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Plan Approval Modal */}
      {pendingApprovalExec && (
        <AgentPlanApprovalModal
          execution={pendingApprovalExec}
          onApprove={handleApprove}
          onCancel={() => handleCancel(pendingApprovalExec.id)}
        />
      )}
    </div>
  );
};

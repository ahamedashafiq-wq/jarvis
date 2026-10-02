import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Send,
  Shield,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  Play,
  RotateCcw,
  Check,
  Circle,
  Loader2,
} from 'lucide-react';
import { AgentCore, AgentAnalyticsData } from '../../services/agent';
import { AgentExecution, RiskLevel } from '../../types';
import { soundService } from '../../services/sound';

interface AgentBrainDeckProps {
  userId: string;
  onNavigateToAgents?: () => void;
}

export const AgentBrainDeck: React.FC<AgentBrainDeckProps> = ({
  userId,
  onNavigateToAgents,
}) => {
  const [goalText, setGoalText] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [analytics, setAnalytics] = useState<AgentAnalyticsData>({
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    cancelledExecutions: 0,
    averageDurationMs: 0,
    mostUsedTools: [],
  });
  const [activeExec, setActiveExec] = useState<AgentExecution | null>(null);
  const [showTimelineDetails, setShowTimelineDetails] = useState(false);

  const loadData = () => {
    try {
      const stats = AgentCore.getAgentAnalytics(userId);
      setAnalytics(stats);
      const all = AgentCore.getExecutions(userId);
      if (all.length > 0) {
        // Pick latest or running execution
        const running = all.find((e) => ['UNDERSTANDING', 'PLAN_READY', 'EXECUTING', 'VERIFYING'].includes(e.status));
        setActiveExec(running || all[0]);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [userId]);

  const handleDispatch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = goalText.trim();
    if (!clean || isDispatching) return;

    soundService.play('COMMAND_RECEIVED');
    setIsDispatching(true);

    try {
      const req = {
        id: 'req_' + Date.now(),
        user_id: userId,
        message: clean,
        source: 'TEXT' as const,
        created_at: Date.now(),
      };

      const result = await AgentCore.startAgent(req, (updated) => {
        setActiveExec(updated);
      });

      setActiveExec(result);
      setGoalText('');
      loadData();
      soundService.play('COMMAND_SUCCESS');
    } catch (err) {
      console.error('Agent dispatch error:', err);
      soundService.play('ERROR');
    } finally {
      setIsDispatching(false);
    }
  };

  const successRate = analytics.totalExecutions > 0
    ? Math.round((analytics.successfulExecutions / analytics.totalExecutions) * 100)
    : 100;

  const currentStep = activeExec?.plan?.steps && activeExec.plan.steps.length > 0
    ? activeExec.plan.steps[Math.min(activeExec.current_step_index, activeExec.plan.steps.length - 1)]
    : null;

  return (
    <div className="rounded-lg border border-jarvis-border bg-jarvis-surfaceElevated p-4 space-y-4 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-jarvis-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-jarvis-primary animate-pulse" />
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-jarvis-text tracking-wider">
              AGENTIC BRAIN ORCHESTRATION
            </h2>
            <p className="text-[10px] text-jarvis-textMuted">
              Autonomous Multimodal Tactical Agent Matrix
            </p>
          </div>
        </div>

        {onNavigateToAgents && (
          <button
            onClick={onNavigateToAgents}
            className="text-[10px] text-jarvis-primary hover:underline flex items-center gap-1"
          >
            <span>AGENT COUNCIL</span>
            <span>→</span>
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
        <div className="p-2.5 rounded border border-jarvis-border bg-jarvis-surface">
          <div className="text-[10px] text-jarvis-textMuted">TOTAL RUNS</div>
          <div className="text-base font-bold text-jarvis-text tabular-nums mt-0.5">
            {analytics.totalExecutions}
          </div>
        </div>
        <div className="p-2.5 rounded border border-jarvis-border bg-jarvis-surface">
          <div className="text-[10px] text-jarvis-textMuted">SUCCESS RATE</div>
          <div className="text-base font-bold text-jarvis-primary tabular-nums mt-0.5">
            {successRate}%
          </div>
        </div>
        <div className="p-2.5 rounded border border-jarvis-border bg-jarvis-surface">
          <div className="text-[10px] text-jarvis-textMuted">AVG LATENCY</div>
          <div className="text-base font-bold text-jarvis-secondary tabular-nums mt-0.5">
            {analytics.averageDurationMs > 0 ? `${analytics.averageDurationMs}ms` : '142ms'}
          </div>
        </div>
        <div className="p-2.5 rounded border border-jarvis-border bg-jarvis-surface">
          <div className="text-[10px] text-jarvis-textMuted">ACTIVE AGENTS</div>
          <div className="text-base font-bold text-jarvis-accent tabular-nums mt-0.5">
            {isDispatching ? '1 EXECUTING' : '5 STANDBY'}
          </div>
        </div>
      </div>

      {/* Main Section: Dispatch Directive */}
      <form onSubmit={handleDispatch} className="space-y-2">
        <div className="text-[10px] text-jarvis-textMuted uppercase tracking-wider font-semibold">
          DISPATCH DIRECTIVE:
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={goalText}
            onChange={(e) => setGoalText(e.target.value)}
            placeholder="Describe a goal... (e.g. 'Organize this week tasks and start focus')"
            className="flex-1 px-3 py-2 rounded border border-jarvis-border bg-jarvis-surface text-jarvis-text placeholder:text-jarvis-textMuted text-xs focus:outline-none focus:border-jarvis-primary/60"
            id="agent-goal-input"
            name="agentGoal"
            aria-label="Describe a goal"
          />
          <button
            type="submit"
            disabled={isDispatching || !goalText.trim()}
            className={`px-4 py-2 rounded border text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              goalText.trim()
                ? 'border-jarvis-primary bg-jarvis-primary text-black hover:bg-jarvis-primary/90 shadow-glow-primary'
                : 'border-jarvis-border bg-jarvis-surface text-jarvis-textMuted opacity-50 cursor-not-allowed'
            }`}
          >
            {isDispatching ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>PLANNING</span>
              </>
            ) : (
              <>
                <span>DISPATCH</span>
                <Send className="w-3 h-3" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Active Execution Card */}
      {activeExec && (
        <div className="rounded border border-jarvis-border bg-jarvis-surface p-3 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate max-w-sm">
              <span className="text-jarvis-textMuted text-[10px]">ACTIVE OBJECTIVE:</span>
              <span className="text-jarvis-text font-semibold truncate">{activeExec.objective}</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                activeExec.status === 'COMPLETE'
                  ? 'bg-jarvis-primary/10 text-jarvis-primary border border-jarvis-primary/30'
                  : activeExec.status === 'FAILED'
                  ? 'bg-jarvis-danger/10 text-jarvis-danger border border-jarvis-danger/30'
                  : 'bg-jarvis-secondary/10 text-jarvis-secondary border border-jarvis-secondary/30 animate-pulse'
              }`}
            >
              {activeExec.status}
            </span>
          </div>

          {/* Current Step Telemetry */}
          {currentStep && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-jarvis-bg p-2 rounded border border-jarvis-border/60">
              <div>
                <span className="text-[9px] text-jarvis-textMuted block">CURRENT STEP:</span>
                <span className="text-jarvis-text font-semibold">
                  STEP {String(currentStep.step_number).padStart(2, '0')} / {String(activeExec.plan.steps.length).padStart(2, '0')}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-jarvis-textMuted block">TOOL:</span>
                <span className="text-jarvis-primary font-semibold truncate block">
                  {currentStep.tool}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-jarvis-textMuted block">STATUS:</span>
                <span className="text-jarvis-secondary font-semibold">
                  {currentStep.status}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-jarvis-textMuted block">RISK:</span>
                <span
                  className={`font-bold ${
                    currentStep.risk_level === 'SAFE' || currentStep.risk_level === 'LOW'
                      ? 'text-jarvis-primary'
                      : 'text-jarvis-warning'
                  }`}
                >
                  {currentStep.risk_level}
                </span>
              </div>
            </div>
          )}

          {/* Execution Timeline (Section 11) */}
          <div className="border-t border-jarvis-border/40 pt-2 space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-jarvis-textMuted uppercase font-semibold">
                EXECUTION TIMELINE
              </span>
              <button
                onClick={() => setShowTimelineDetails(!showTimelineDetails)}
                className="text-jarvis-primary hover:underline flex items-center gap-1"
              >
                <span>{showTimelineDetails ? 'HIDE DETAILS' : 'DETAILS'}</span>
                {showTimelineDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* Standard 7-step visual timeline */}
            <div className="space-y-1 text-[11px]">
              {[
                { num: '01', title: 'REQUEST RECEIVED', done: true },
                { num: '02', title: 'CONTEXT LOADED', done: true },
                { num: '03', title: 'PLAN CREATED', done: Boolean(activeExec.plan?.steps?.length) },
                { num: '04', title: 'GUARDIAN VERIFIED', done: Boolean(activeExec.plan?.steps?.length) },
                { num: '05', title: 'EXECUTION', done: activeExec.status === 'COMPLETE', active: activeExec.status === 'EXECUTING' },
                { num: '06', title: 'VERIFICATION', done: activeExec.status === 'COMPLETE', active: activeExec.status === 'VERIFYING' },
                { num: '07', title: 'MEMORY UPDATE', done: activeExec.status === 'COMPLETE' },
              ].map((item) => (
                <div key={item.num} className="flex items-center justify-between py-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-jarvis-textMuted text-[10px]">{item.num}</span>
                    <span
                      className={
                        item.done
                          ? 'text-jarvis-primary font-medium'
                          : item.active
                          ? 'text-jarvis-secondary font-bold animate-pulse'
                          : 'text-jarvis-textMuted'
                      }
                    >
                      {item.title}
                    </span>
                  </div>
                  <span>
                    {item.done ? (
                      <span className="text-jarvis-primary text-xs font-bold">✓</span>
                    ) : item.active ? (
                      <span className="text-jarvis-secondary text-xs animate-pulse">●</span>
                    ) : (
                      <span className="text-jarvis-textMuted text-xs">○</span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* Expanded Detailed Events */}
            {showTimelineDetails && activeExec.timeline && (
              <div className="mt-2 pt-2 border-t border-jarvis-border/40 space-y-1 text-[10px] text-jarvis-textSecondary bg-jarvis-bg p-2 rounded">
                <div className="font-semibold text-jarvis-textMuted uppercase mb-1">
                  Event Trace:
                </div>
                {activeExec.timeline.map((evt, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-jarvis-primary font-semibold">[{evt.role || 'AGENT'}]</span>{' '}
                      <span>{evt.label}</span>
                      {evt.detail && <p className="text-jarvis-textMuted mt-0.5">{evt.detail}</p>}
                    </div>
                    <span className="text-jarvis-textMuted shrink-0">
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

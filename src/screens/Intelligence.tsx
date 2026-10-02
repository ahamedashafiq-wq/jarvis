import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  RoutePath,
  PredictiveSignal,
  IntelligenceInsight,
  ProjectHealthMetrics,
  TrendMetric,
  InsightSeverity,
  InsightStatus,
  DataSufficiency,
} from '../types';
import { IntelligenceService } from '../services/intelligence';
import { MissionService } from '../services/mission';
import { AgentCore } from '../services/agent';
import { realtimeService } from '../services/realtime';
import { useToast } from '../components/Toast';
import {
  Compass,
  AlertTriangle,
  Clock,
  CheckCircle,
  TrendingUp,
  Activity,
  Layers,
  ArrowRight,
  Shield,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Sliders,
  Calendar,
  X,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Bell,
  Play,
  FileText,
  HelpCircle,
  Zap,
  Flame,
  CheckSquare,
  Sparkles,
} from 'lucide-react';

interface IntelligenceProps {
  onNavigate: (path: RoutePath) => void;
  initialTab?: 'OVERVIEW' | 'ANALYTICS' | 'PATTERNS';
}

export const IntelligenceScreen: React.FC<IntelligenceProps> = ({
  onNavigate,
  initialTab = 'OVERVIEW',
}) => {
  const { currentSession, createNotification } = useAuth();
  const userId = currentSession?.userId || 'guest';
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ANALYTICS' | 'PATTERNS'>(initialTab);
  const [signals, setSignals] = useState<PredictiveSignal[]>([]);
  const [insights, setInsights] = useState<IntelligenceInsight[]>([]);
  const [projectHealth, setProjectHealth] = useState<ProjectHealthMetrics[]>([]);
  const [trendData, setTrendData] = useState<{
    trends: TrendMetric[];
    overallTrend: string;
    dataSufficiency: DataSufficiency;
    daysOfHistory: number;
  }>({
    trends: [],
    overallTrend: 'Analyzing...',
    dataSufficiency: 'INSUFFICIENT_DATA',
    daysOfHistory: 1,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<string>('ALL');
  const [selectedInsightModal, setSelectedInsightModal] = useState<IntelligenceInsight | null>(null);
  const [investigatingId, setInvestigatingId] = useState<string | null>(null);

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const generatedInsights = await IntelligenceService.generateInsights(userId);
      const liveSignals = IntelligenceService.detectLiveSignals(userId);
      const health = IntelligenceService.getProjectHealth(userId);
      const trends = IntelligenceService.getTrendAnalysis(userId);

      setInsights(generatedInsights);
      setSignals(liveSignals);
      setProjectHealth(health);
      setTrendData(trends);
    } catch (e) {
      console.error('Failed to refresh predictive intelligence', e);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();

    // Subscribe to realtime lifecycle events
    const unsub1 = realtimeService.subscribe('INSIGHT_CREATED', refreshData);
    const unsub2 = realtimeService.subscribe('INSIGHT_SEEN', refreshData);
    const unsub3 = realtimeService.subscribe('INSIGHT_DISMISSED', refreshData);
    const unsub4 = realtimeService.subscribe('INSIGHT_RESOLVED', refreshData);
    const unsub5 = realtimeService.subscribe('TASK_CREATED', refreshData);
    const unsub6 = realtimeService.subscribe('TASK_COMPLETED', refreshData);
    const unsub7 = realtimeService.subscribe('MISSION_UPDATED', refreshData);
    const unsub8 = realtimeService.subscribe('AUTOMATION_FAILED', refreshData);

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
      unsub6();
      unsub7();
      unsub8();
    };
  }, [userId]);

  // Handle Insight Dismissal
  const handleDismiss = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    IntelligenceService.dismissInsight(userId, id);
    setInsights((prev) => prev.filter((i) => i.id !== id));
    showToast('INSIGHT DISMISSED', 'Insight cleared from active telemetry view.', 'INFO');
  };

  // Handle Insight Snooze
  const handleSnooze = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    IntelligenceService.snoozeInsight(userId, id, 4);
    setInsights((prev) => prev.filter((i) => i.id !== id));
    showToast('INSIGHT SNOOZED', 'Deferred for 4 hours.', 'INFO');
  };

  // Agentic Brain Investigation (Section 20)
  const handleInvestigate = async (insight: IntelligenceInsight, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setInvestigatingId(insight.id);

    try {
      const prompt = `Investigate bottleneck for ${insight.source_name || insight.title}. Focus on blocked tasks and missing dependencies.`;
      const agentRes = await AgentCore.startAgent({
        id: 'req_pred_' + Date.now(),
        user_id: userId,
        message: prompt,
        source: 'TEXT',
        created_at: Date.now(),
      });

      if (agentRes.status === 'COMPLETE' || agentRes.status === 'WAITING_FOR_APPROVAL') {
        showToast('INVESTIGATION INITIATED', 'Agentic Brain formulated diagnostic plan.', 'SUCCESS');
        createNotification('INVESTIGATION READY', `Agent plan for "${insight.title}" prepared.`, 'AI');
        onNavigate('/agents');
      } else {
        showToast('INVESTIGATION IN PROGRESS', 'Diagnostic routine executed.', 'INFO');
      }
    } catch {
      showToast('ERROR', 'Agent investigation failed to start.', 'ERROR');
    } finally {
      setInvestigatingId(null);
    }
  };

  // Filtered insights
  const filteredInsights = useMemo(() => {
    return insights.filter((ins) => {
      if (ins.status === 'DISMISSED' || ins.status === 'RESOLVED') return false;
      if (selectedSeverityFilter !== 'ALL' && ins.severity !== selectedSeverityFilter) return false;
      return true;
    });
  }, [insights, selectedSeverityFilter]);

  const warningCount = signals.filter((s) => s.severity === 'WARNING').length;
  const noticeCount = signals.filter((s) => s.severity === 'NOTICE').length;
  const criticalProjects = projectHealth.filter((p) => p.healthStatus === 'CRITICAL').length;

  const getSeverityBadge = (severity: InsightSeverity) => {
    switch (severity) {
      case 'WARNING':
        return (
          <span className="px-2 py-0.5 rounded bg-[#FF3B30]/15 border border-[#FF3B30]/40 text-[#FF3B30] text-[9px] font-bold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>WARNING</span>
          </span>
        );
      case 'NOTICE':
        return (
          <span className="px-2 py-0.5 rounded bg-[#FFB000]/15 border border-[#FFB000]/40 text-[#FFB000] text-[9px] font-bold flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>NOTICE</span>
          </span>
        );
      case 'INFO':
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-[#19F59A]/15 border border-[#19F59A]/40 text-[#19F59A] text-[9px] font-bold flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            <span>INFO</span>
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 font-mono text-xs select-none">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#16281F] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#00D084]/15 border border-[#00D084]/40 text-[#19F59A] shadow-[0_0_15px_rgba(0,208,132,0.2)]">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-[#F5F7F6] tracking-wider">
                  JARVIS PREDICTIVE INTELLIGENCE CORE
                </h1>
                <span className="text-[9px] px-2 py-0.5 rounded bg-[#00D084]/20 text-[#19F59A] font-bold border border-[#00D084]/40">
                  PHASE 12
                </span>
              </div>
              <p className="text-[10px] text-[#8B9992] tracking-wider mt-0.5">
                "See what is changing before it becomes a problem." • THREE BLADES. ONE INTELLIGENCE.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('/settings/intelligence')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#19F59A] transition-colors"
            title="Configure Predictive Settings"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>SETTINGS</span>
          </button>

          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#121C17] border border-[#16281F] text-[#38E1FF] hover:border-[#38E1FF]/50 transition-all font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>REFRESH SIGNALS</span>
          </button>
        </div>
      </div>

      {/* Realtime KPI Telemetry Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#0A100D] border border-[#16281F] space-y-1">
          <span className="text-[9px] text-[#8B9992] uppercase font-bold tracking-wider block">
            LIVE SIGNALS
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#F5F7F6]">{signals.length}</span>
            <div className="flex items-center gap-1.5">
              {warningCount > 0 && (
                <span className="text-[10px] text-[#FF3B30] font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {warningCount}
                </span>
              )}
              {noticeCount > 0 && (
                <span className="text-[10px] text-[#FFB000] font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {noticeCount}
                </span>
              )}
            </div>
          </div>
          <span className="text-[9px] text-[#8B9992] block">Empirical sensor detections</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0A100D] border border-[#16281F] space-y-1">
          <span className="text-[9px] text-[#8B9992] uppercase font-bold tracking-wider block">
            PROJECT HEALTH
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#19F59A]">
              {projectHealth.filter((p) => p.healthStatus === 'HEALTHY').length} / {projectHealth.length}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                criticalProjects > 0 ? 'bg-[#FF3B30]/20 text-[#FF3B30]' : 'bg-[#19F59A]/20 text-[#19F59A]'
              }`}
            >
              {criticalProjects > 0 ? `${criticalProjects} ATTENTION` : 'NOMINAL'}
            </span>
          </div>
          <span className="text-[9px] text-[#8B9992] block">Active operation milestones</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0A100D] border border-[#16281F] space-y-1">
          <span className="text-[9px] text-[#8B9992] uppercase font-bold tracking-wider block">
            DATA SUFFICIENCY
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold text-[#38E1FF]">
              {trendData.dataSufficiency.replace('_', ' ')}
            </span>
            <span className="text-[10px] text-[#8B9992]">{trendData.daysOfHistory}d history</span>
          </div>
          <span className="text-[9px] text-[#8B9992] block">
            {trendData.dataSufficiency === 'INSUFFICIENT_DATA'
              ? 'At least 3-7 days required for trends'
              : 'Statistical baseline established'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#0A100D] border border-[#16281F] space-y-1">
          <span className="text-[9px] text-[#8B9992] uppercase font-bold tracking-wider block">
            ACTIVE INSIGHTS
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#A78BFA]">{filteredInsights.length}</span>
            <span className="text-[10px] text-[#8B9992]">{insights.length} total logged</span>
          </div>
          <span className="text-[9px] text-[#8B9992] block">User-driven decisions pending</span>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#16281F] pb-2 overflow-x-auto">
        {[
          { id: 'OVERVIEW', label: 'PREDICTIVE OVERVIEW', icon: <Compass className="w-3.5 h-3.5" /> },
          { id: 'ANALYTICS', label: 'TREND ANALYTICS', icon: <TrendingUp className="w-3.5 h-3.5" /> },
          { id: 'PATTERNS', label: 'PATTERN ENGINE', icon: <Flame className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === tab.id
                ? 'bg-[#19F59A] text-[#050706] shadow-[0_0_15px_rgba(25,245,154,0.3)]'
                : 'bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#F5F7F6]'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* SECTION A: LIVE SIGNALS TICKER (Section 4) */}
          <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#16281F] space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#16281F] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#19F59A] animate-ping" />
                <h2 className="text-xs font-bold text-[#F5F7F6] tracking-wider uppercase">
                  LIVE OPERATIONAL SIGNALS ({signals.length})
                </h2>
              </div>
              <span className="text-[10px] text-[#8B9992]">REALTIME TELEMETRY</span>
            </div>

            {signals.length === 0 ? (
              <div className="py-6 text-center text-[#8B9992]">
                Zero active warning signals. All operational parameters are within safe thresholds.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {signals.map((sig) => (
                  <div
                    key={sig.id}
                    className="p-3 rounded-xl bg-[#050706] border border-[#16281F] hover:border-[#19F59A]/30 transition-all flex flex-col justify-between space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#121C17] text-[#19F59A] font-bold">
                        {sig.source}
                      </span>
                      {getSeverityBadge(sig.severity)}
                    </div>
                    <p className="text-[11px] text-[#F5F7F6] leading-relaxed">
                      {sig.description}
                    </p>
                    <div className="flex items-center justify-between text-[9px] text-[#8B9992] pt-1 border-t border-[#16281F]">
                      <span>{sig.sourceName || 'System'}</span>
                      <span>{new Date(sig.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION B: PROJECT HEALTH SUMMARY (Section 6) */}
          <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#16281F] space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#16281F] pb-2.5">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#19F59A]" />
                <h2 className="text-xs font-bold text-[#F5F7F6] tracking-wider uppercase">
                  PROJECT HEALTH MATRIX
                </h2>
              </div>
              <span className="text-[10px] text-[#8B9992]">EMPIRICAL METRICS (NO FABRICATED SCORES)</span>
            </div>

            {projectHealth.length === 0 ? (
              <div className="py-6 text-center text-[#8B9992]">
                No active projects registered in Blade 02.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {projectHealth.map((proj) => (
                  <div
                    key={proj.projectId}
                    className={`p-4 rounded-xl bg-[#050706] border transition-all space-y-3 ${
                      proj.healthStatus === 'CRITICAL'
                        ? 'border-[#FF3B30]/40'
                        : proj.healthStatus === 'NEEDS_ATTENTION'
                        ? 'border-[#FFB000]/40'
                        : 'border-[#16281F]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#F5F7F6] truncate max-w-[180px]">
                        {proj.projectName}
                      </span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                          proj.healthStatus === 'CRITICAL'
                            ? 'bg-[#FF3B30]/20 text-[#FF3B30]'
                            : proj.healthStatus === 'NEEDS_ATTENTION'
                            ? 'bg-[#FFB000]/20 text-[#FFB000]'
                            : 'bg-[#19F59A]/20 text-[#19F59A]'
                        }`}
                      >
                        {proj.healthStatus}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-[#8B9992]">
                        <span>PROGRESS</span>
                        <span className="text-[#19F59A] font-bold">{proj.progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#121C17] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#00D084] to-[#19F59A] rounded-full"
                          style={{ width: `${proj.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="p-2 rounded bg-[#0A100D] border border-[#16281F]">
                        <span className="text-[#8B9992] block text-[8px] uppercase">ACTIVE TASKS</span>
                        <strong className="text-[#F5F7F6]">{proj.activeTasks} open</strong>
                      </div>
                      <div className="p-2 rounded bg-[#0A100D] border border-[#16281F]">
                        <span className="text-[#8B9992] block text-[8px] uppercase">OVERDUE</span>
                        <strong className={proj.overdueTasks > 0 ? 'text-[#FF3B30]' : 'text-[#8B9992]'}>
                          {proj.overdueTasks} directives
                        </strong>
                      </div>
                      <div className="p-2 rounded bg-[#0A100D] border border-[#16281F]">
                        <span className="text-[#8B9992] block text-[8px] uppercase">DEADLINE</span>
                        <strong className="text-[#38E1FF]">
                          {proj.deadlineDaysRemaining !== null
                            ? proj.deadlineDaysRemaining > 0
                              ? `${proj.deadlineDaysRemaining} days`
                              : 'Due today'
                            : 'None'}
                        </strong>
                      </div>
                      <div className="p-2 rounded bg-[#0A100D] border border-[#16281F]">
                        <span className="text-[#8B9992] block text-[8px] uppercase">INACTIVITY</span>
                        <strong className={proj.inactivityDays >= 5 ? 'text-[#FFB000]' : 'text-[#8B9992]'}>
                          {proj.inactivityDays}d quiet
                        </strong>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#16281F] flex items-center justify-between">
                      <button
                        onClick={() => onNavigate('/missions')}
                        className="text-[10px] text-[#38E1FF] hover:underline flex items-center gap-1"
                      >
                        <span>VIEW MISSION CONTROL</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION C: ACTIONABLE PREDICTIVE INSIGHT CARDS (Section 16, 17, 25, 26) */}
          <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#16281F] space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#16281F] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#19F59A]" />
                <h2 className="text-xs font-bold text-[#F5F7F6] tracking-wider uppercase">
                  PREDICTIVE INSIGHTS & ACTIONABLE FORECASTS ({filteredInsights.length})
                </h2>
              </div>

              {/* Severity Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-[#8B9992]">FILTER:</span>
                {['ALL', 'WARNING', 'NOTICE', 'INFO'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setSelectedSeverityFilter(f)}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${
                      selectedSeverityFilter === f
                        ? 'bg-[#19F59A] text-[#050706]'
                        : 'bg-[#050706] text-[#8B9992] border border-[#16281F]'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {filteredInsights.length === 0 ? (
              <div className="py-8 text-center text-[#8B9992] space-y-2">
                <CheckCircle className="w-8 h-8 text-[#19F59A] mx-auto" />
                <div className="font-bold text-xs text-[#F5F7F6]">ALL SIGNALS ARE BALANCED</div>
                <p className="text-[10px] max-w-md mx-auto">
                  Zero critical bottlenecks or impending deadline hazards detected. System continues monitoring telemetry in the background.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredInsights.map((ins) => (
                  <div
                    key={ins.id}
                    className={`p-4 rounded-xl bg-[#050706] border transition-all space-y-3 ${
                      ins.severity === 'WARNING'
                        ? 'border-[#FF3B30]/30 hover:border-[#FF3B30]/60'
                        : ins.severity === 'NOTICE'
                        ? 'border-[#FFB000]/30 hover:border-[#FFB000]/60'
                        : 'border-[#16281F] hover:border-[#19F59A]/30'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getSeverityBadge(ins.severity)}
                        <h3 className="font-bold text-xs text-[#F5F7F6] tracking-wide">
                          {ins.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px]">
                        <span className="px-2 py-0.5 rounded bg-[#121C17] text-[#8B9992]">
                          SOURCE: {ins.source_type}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#121C17] text-[#38E1FF]">
                          {ins.data_sufficiency.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[#8B9992] leading-relaxed">
                      {ins.description}
                    </p>

                    {/* Evidence & Why this appeared (Section 25) */}
                    <div className="p-3 rounded-lg bg-[#0A100D] border border-[#16281F] space-y-1.5">
                      <div className="text-[10px] text-[#19F59A] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        <span>WHY THIS APPEARED (EMPIRICAL EVIDENCE)</span>
                      </div>
                      <div className="space-y-1">
                        {ins.evidence.map((ev, i) => (
                          <div key={i} className="text-[11px] text-[#F5F7F6] flex items-start gap-1.5">
                            <span className="text-[#19F59A] mt-0.5">•</span>
                            <span>{ev}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Suggestions (Section 2 - User decides) */}
                    {ins.suggestions.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] text-[#38E1FF] font-bold uppercase tracking-wider block">
                          RECOMMENDED ACTIONS (OPERATOR AUTHORIZATION REQUIRED):
                        </span>
                        <div className="space-y-1">
                          {ins.suggestions.map((sug, i) => (
                            <div key={i} className="text-[11px] text-[#8B9992] flex items-start gap-1.5">
                              <span className="text-[#38E1FF] mt-0.5">→</span>
                              <span>{sug}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Interactive Action Controls (Section 17, 20) */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#16281F]">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedInsightModal(ins)}
                          className="px-2.5 py-1 rounded-lg bg-[#121C17] border border-[#16281F] text-[#8B9992] hover:text-[#F5F7F6] text-[10px] flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>INSPECT SOURCES</span>
                        </button>

                        {ins.insight_type === 'OBJECTIVE_BOTTLENECK' && (
                          <button
                            onClick={(e) => handleInvestigate(ins, e)}
                            disabled={investigatingId === ins.id}
                            className="px-3 py-1 rounded-lg bg-[#00D084]/20 border border-[#00D084]/50 text-[#19F59A] hover:bg-[#00D084]/30 text-[10px] font-bold flex items-center gap-1 transition-all"
                          >
                            {investigatingId === ins.id ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span>DIAGNOSING...</span>
                              </>
                            ) : (
                              <>
                                <Zap className="w-3 h-3" />
                                <span>INVESTIGATE VIA AGENT</span>
                              </>
                            )}
                          </button>
                        )}

                        {ins.source_type === 'MISSION' && (
                          <button
                            onClick={() => onNavigate('/missions')}
                            className="px-2.5 py-1 rounded-lg bg-[#121C17] border border-[#38E1FF]/30 text-[#38E1FF] hover:bg-[#38E1FF]/20 text-[10px] flex items-center gap-1"
                          >
                            <span>VIEW MISSION</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        {ins.source_type === 'AUTOMATION' && (
                          <button
                            onClick={() => onNavigate('/automation')}
                            className="px-2.5 py-1 rounded-lg bg-[#121C17] border border-[#FFB000]/30 text-[#FFB000] hover:bg-[#FFB000]/20 text-[10px] flex items-center gap-1"
                          >
                            <span>VIEW AUTOMATION</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleSnooze(ins.id, e)}
                          className="px-2.5 py-1 rounded-lg text-[#8B9992] hover:text-[#F5F7F6] text-[10px]"
                        >
                          Snooze (4h)
                        </button>
                        <button
                          onClick={(e) => handleDismiss(ins.id, e)}
                          className="px-3 py-1 rounded-lg bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#FF3B30] text-[10px]"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ANALYTICS (Section 7, 32) */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#16281F] space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#16281F] pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#19F59A]" />
                <h2 className="text-xs font-bold text-[#F5F7F6] tracking-wider uppercase">
                  HISTORICAL TREND ANALYSIS & DISCIPLINE METRICS
                </h2>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#121C17] text-[#38E1FF]">
                STATUS: {trendData.dataSufficiency.replace('_', ' ')}
              </span>
            </div>

            {/* Overall Trend Banner */}
            <div className="p-4 rounded-xl bg-[#050706] border border-[#16281F] space-y-1">
              <span className="text-[10px] text-[#8B9992] uppercase font-bold">EXECUTIVE TREND SYNTHESIS:</span>
              <p className="text-sm font-bold text-[#F5F7F6]">
                {trendData.overallTrend}
              </p>
              <span className="text-[10px] text-[#8B9992] block">
                Derived from {trendData.daysOfHistory} recorded calendar days of continuous telemetry.
              </span>
            </div>

            {/* Trend Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trendData.trends.map((tr, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[#050706] border border-[#16281F] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#F5F7F6]">{tr.metricName}</span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                        tr.trend === 'INCREASING'
                          ? 'bg-[#19F59A]/20 text-[#19F59A]'
                          : tr.trend === 'DECREASING'
                          ? 'bg-[#FF3B30]/20 text-[#FF3B30]'
                          : tr.trend === 'INSUFFICIENT_DATA'
                          ? 'bg-[#FFB000]/20 text-[#FFB000]'
                          : 'bg-[#38E1FF]/20 text-[#38E1FF]'
                      }`}
                    >
                      {tr.trend.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-black text-[#F5F7F6]">{tr.currentValue}</span>
                    {tr.trend !== 'INSUFFICIENT_DATA' && (
                      <span className="text-xs text-[#8B9992]">
                        vs. {tr.previousValue} in previous window
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-[#8B9992] leading-relaxed">
                    {tr.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PATTERN ENGINE (Section 10, 11) */}
      {activeTab === 'PATTERNS' && (
        <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#16281F] space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#16281F] pb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#19F59A]" />
              <h2 className="text-xs font-bold text-[#F5F7F6] tracking-wider uppercase">
                CONFIGURED DETERMINISTIC PATTERN DETECTORS
              </h2>
            </div>
            <span className="text-[10px] text-[#8B9992]">CONFIGURABLE HEURISTICS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                id: 'deadline_pattern',
                name: 'DEADLINE PROXIMITY WATCH',
                description: 'Triggers when a mission schedule is <= 5 days away and open directives remain.',
                threshold: '<= 5 Days Remaining with > 0 Incomplete Tasks',
                status: 'ACTIVE',
              },
              {
                id: 'backlog_pattern',
                name: 'WORKLOAD CONCENTRATION & BACKLOG',
                description: 'Detects queue buildup when open directives exceed 10 or high priority tasks exceed 5.',
                threshold: '>= 10 Open Directives or >= 5 Critical Tasks',
                status: 'ACTIVE',
              },
              {
                id: 'inactivity_pattern',
                name: 'PROJECT INACTIVITY SENSOR',
                description: 'Flags active missions with zero timeline progress over 5 consecutive days.',
                threshold: '>= 5 Consecutive Inactive Days',
                status: 'ACTIVE',
              },
              {
                id: 'failure_pattern',
                name: 'AUTOMATION REPEATED FAILURE SENSOR',
                description: 'Identifies automation workflows with repeated consecutive execution failures.',
                threshold: '>= 2 Consecutive Automation Failures',
                status: 'ACTIVE',
              },
              {
                id: 'bottleneck_pattern',
                name: 'OBJECTIVE BOTTLENECK DETECTOR',
                description: 'Flags objectives containing 6+ incomplete tasks or marked in BLOCKED state.',
                threshold: '>= 6 Incomplete Tasks in Single Objective',
                status: 'ACTIVE',
              },
              {
                id: 'focus_pattern',
                name: 'DISCIPLINE & FOCUS IRREGULARITY',
                description: 'Monitors deep focus session frequency week-over-week.',
                threshold: 'Minimum 3 Focus Sessions / Week',
                status: 'ACTIVE',
              },
            ].map((pat) => (
              <div
                key={pat.id}
                className="p-4 rounded-xl bg-[#050706] border border-[#16281F] space-y-2 hover:border-[#19F59A]/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#F5F7F6]">{pat.name}</span>
                  <span className="px-2 py-0.5 rounded bg-[#19F59A]/20 text-[#19F59A] text-[9px] font-bold">
                    {pat.status}
                  </span>
                </div>
                <p className="text-[11px] text-[#8B9992] leading-relaxed">
                  {pat.description}
                </p>
                <div className="p-2 rounded bg-[#0A100D] border border-[#16281F] text-[10px] text-[#38E1FF]">
                  <strong>Activation Rule: </strong> {pat.threshold}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DETAIL MODAL: EVIDENCE & SOURCES (Section 25, 26) */}
      {selectedInsightModal && (
        <div className="fixed inset-0 z-50 bg-[#050706]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0A100D] border border-[#16281F] w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 sm:p-5 border-b border-[#16281F] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#19F59A]" />
                <div>
                  <h3 className="font-bold text-xs text-[#F5F7F6] uppercase">
                    {selectedInsightModal.title}
                  </h3>
                  <span className="text-[9px] text-[#8B9992]">
                    FINGERPRINT: <code>{selectedInsightModal.fingerprint}</code>
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedInsightModal(null)}
                className="p-1 rounded text-[#8B9992] hover:text-[#F5F7F6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] text-[#8B9992] uppercase font-bold">Overview</span>
                <p className="text-xs text-[#F5F7F6] leading-relaxed">
                  {selectedInsightModal.description}
                </p>
              </div>

              {/* Empirical Evidence */}
              <div className="space-y-2">
                <span className="text-[10px] text-[#19F59A] uppercase font-bold">
                  Telemetry Evidence (Why This Appeared)
                </span>
                <div className="space-y-1">
                  {selectedInsightModal.evidence.map((ev, i) => (
                    <div
                      key={i}
                      className="p-2 rounded bg-[#050706] border border-[#16281F] text-xs text-[#F5F7F6]"
                    >
                      {ev}
                    </div>
                  ))}
                </div>
              </div>

              {/* Neural Memory Cross-Blade Context */}
              {selectedInsightModal.related_decision_ids && selectedInsightModal.related_decision_ids.length > 0 && (
                <div className="p-3 rounded-xl bg-[#050706] border border-[#A78BFA]/40 space-y-1">
                  <div className="text-[10px] text-[#A78BFA] font-bold uppercase flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    <span>CORRELATED NEURAL MEMORY (BLADE 03)</span>
                  </div>
                  <p className="text-[11px] text-[#8B9992]">
                    An established architectural decision in Neural Memory is correlated with this operational area.
                  </p>
                </div>
              )}

              {/* Uncertainties (Truthfulness guarantee) */}
              {selectedInsightModal.uncertainties && selectedInsightModal.uncertainties.length > 0 && (
                <div className="p-3 rounded-xl bg-[#050706] border border-[#16281F] space-y-1">
                  <div className="text-[10px] text-[#8B9992] font-bold uppercase">
                    Boundary & Uncertainties
                  </div>
                  {selectedInsightModal.uncertainties.map((u, i) => (
                    <div key={i} className="text-[10px] text-[#8B9992]">
                      • {u}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#16281F] flex items-center justify-end gap-2 bg-[#050706]">
              <button
                onClick={() => setSelectedInsightModal(null)}
                className="px-4 py-1.5 rounded-lg bg-[#121C17] border border-[#16281F] text-xs font-bold text-[#F5F7F6]"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

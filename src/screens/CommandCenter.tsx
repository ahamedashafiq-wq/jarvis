import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Command as CommandIcon,
  Mic,
  Paperclip,
  Send,
  Target,
  Database,
  Eye,
  Cpu,
  Zap,
  TrendingUp,
  Sparkles,
  Layers,
  ArrowRight,
  Activity,
  Radio,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Pin,
  Play,
  Star,
  RefreshCw,
  X,
  CheckSquare,
  Timer,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  ActionPreviewData,
  CommandAlias,
  CommandResultData,
  CommandSurfaceState,
  GlobalSearchResult,
  PinnedFavoriteCommand,
  RealtimeEvent,
  RoutePath,
  Task,
} from '../types';
import { CommandBar } from '../components/CommandBar';
import { CommandPreviewModal } from '../components/CommandPreviewModal';
import { CommandRouterService } from '../services/commandCenter/commandRouter';
import { GlobalSearchService } from '../services/commandCenter/search';
import { MissionService } from '../services/mission';
import { MemoryService } from '../services/memory';
import { AutomationService } from '../services/automation';
import { AgentCore } from '../services/agent';
import { VisionService } from '../services/vision';
import { IntelligenceService } from '../services/intelligence';
import { speechService } from '../services/speech';
import { realtimeService } from '../services/realtime';
import { getLocalStore, setLocalStore } from '../services/supabase';

interface CommandCenterProps {
  onNavigate: (path: RoutePath) => void;
  initialCommand?: string;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  onNavigate,
  initialCommand = '',
}) => {
  const { currentSession, profile } = useAuth();
  const userId = currentSession?.userId || 'guest';

  // Command State
  const [surfaceState, setSurfaceState] = useState<CommandSurfaceState>('IDLE');
  const [activeResult, setActiveResult] = useState<CommandResultData | null>(null);
  const [activePreview, setActivePreview] = useState<ActionPreviewData | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Search Mode
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Mission Context
  const [activeMission, setActiveMission] = useState<{ id: string; title: string } | null>(null);
  const [isChangingContext, setIsChangingContext] = useState(false);

  // Real Subsystem Live Telemetry
  const [stats, setStats] = useState({
    activeMissions: 0,
    totalMemories: 0,
    activeTasks: 0,
    activeAutomations: 0,
    agentExecutionsCount: 0,
    visionCount: 0,
    intelligenceSignalsCount: 0,
  });

  // Recent Command History & Favorites
  const [recentCommands, setRecentCommands] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<PinnedFavoriteCommand[]>([]);
  const [aliases, setAliases] = useState<CommandAlias[]>([]);

  // Neural Live Activity Stream
  const [activityStream, setActivityStream] = useState<
    { id: string; time: string; text: string; type: string }[]
  >([]);

  // Load Subsystem Data & Activity
  const refreshTelemetry = () => {
    try {
      const msns = MissionService.getMissions(userId);
      const activeMsns = msns.filter((m) => m.status === 'ACTIVE');
      const mems = MemoryService.getMemories(userId);
      const tasks = getLocalStore<Task[]>(`tasks_${userId}`, []);
      const pendingTasks = tasks.filter((t) => t.status !== 'COMPLETED');
      const autos = AutomationService.getAutomations(userId);
      const activeAutos = autos.filter((a) => a.status === 'ACTIVE');
      const agents = AgentCore.getExecutions(userId);
      const visions = VisionService.getSessions(userId);
      const signals = IntelligenceService.detectLiveSignals(userId);

      setStats({
        activeMissions: activeMsns.length,
        totalMemories: mems.length,
        activeTasks: pendingTasks.length,
        activeAutomations: activeAutos.length,
        agentExecutionsCount: agents.length,
        visionCount: visions.length,
        intelligenceSignalsCount: signals.length,
      });

      // Active Mission Context
      const ctx = CommandRouterService.getActiveMissionContext(userId);
      setActiveMission(ctx);

      // Favorites & Aliases
      setFavorites(CommandRouterService.getFavorites(userId));
      setAliases(CommandRouterService.getAliases(userId));

      // Recent Commands
      const cmds = getLocalStore<any[]>(`cmds_${userId}`, []);
      setRecentCommands(cmds.slice(0, 10));
    } catch (e) {
      console.warn('Telemetry refresh error:', e);
    }
  };

  useEffect(() => {
    refreshTelemetry();
  }, [userId]);

  // Initial Realtime Activity Stream Listener
  useEffect(() => {
    const unsub = realtimeService.on('*', (event: RealtimeEvent) => {
      const nowStr = new Date(event.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      let label = event.type.replace(/_/g, ' ');
      if (label.length > 35) label = label.slice(0, 35) + '...';

      setActivityStream((prev) => [
        {
          id: event.id || String(Date.now() + Math.random()),
          time: nowStr,
          text: label,
          type: event.type.split('_')[0] || 'SYSTEM',
        },
        ...prev.slice(0, 19),
      ]);

      refreshTelemetry();
    });

    return () => {
      unsub();
    };
  }, [userId]);

  // Handle Initial Command if passed in
  useEffect(() => {
    if (initialCommand) {
      handleExecuteCommand(initialCommand);
    }
  }, [initialCommand]);

  // Execute Command
  const handleExecuteCommand = async (command: string, imageFile?: File | null) => {
    if (!command.trim() && !imageFile) return;

    // Check if query is a global search prefix (e.g. "search: ..." or "find ...")
    if (
      command.toLowerCase().startsWith('search:') ||
      command.toLowerCase().startsWith('find ') ||
      command.toLowerCase().startsWith('search for ')
    ) {
      const q = command.replace(/^(search:|find |search for )/i, '').trim();
      setSearchQuery(q);
      setIsSearchActive(true);
      const res = GlobalSearchService.searchAll(userId, q);
      setSearchResults(res);
      return;
    }

    setSurfaceState('THINKING');
    setIsSearchActive(false);

    try {
      const result = await CommandRouterService.executeCommand({
        userId,
        commandText: command,
        imageFile,
        activeMissionId: activeMission?.id,
        onStateChange: (st) => setSurfaceState(st),
        onPreviewRequired: (preview) => {
          setActivePreview(preview);
          setIsPreviewOpen(true);
        },
        onNavigate,
      });

      setActiveResult(result);
      refreshTelemetry();
    } catch (err: any) {
      console.error('Command Execution Failed:', err);
      setSurfaceState('ERROR');
      setActiveResult({
        id: 'cmd_err_' + Date.now(),
        timestamp: Date.now(),
        command,
        status: 'FAILED',
        responseMode: 'ERROR',
        headline: 'DIRECTIVE ANOMALY',
        summary: err?.message || 'The command could not be safely fulfilled.',
      });
    }
  };

  // Handle Approval Modal Execution
  const handleApproveAction = async (preview: ActionPreviewData) => {
    setIsApproving(true);
    setSurfaceState('EXECUTING');

    try {
      const res = await CommandRouterService.executeApprovedAction(
        userId,
        preview,
        onNavigate
      );
      setIsPreviewOpen(false);
      setActivePreview(null);
      setIsApproving(false);
      setSurfaceState('COMPLETE');
      setActiveResult(res);
      refreshTelemetry();
    } catch (e: any) {
      console.error('Approval execution failed:', e);
      setIsApproving(false);
      setSurfaceState('ERROR');
    }
  };

  // Live Search handler
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setIsSearchActive(false);
      setSearchResults([]);
      return;
    }
    setIsSearchActive(true);
    const results = GlobalSearchService.searchAll(userId, val);
    setSearchResults(results);
  };

  // Quick Actions List
  const quickActions = [
    {
      label: 'NEW MISSION',
      icon: <Target className="w-3.5 h-3.5 text-[#38E1FF]" />,
      action: () => handleExecuteCommand('Plan a mission for my AI project'),
    },
    {
      label: 'NEW TASK',
      icon: <CheckSquare className="w-3.5 h-3.5 text-[#19F59A]" />,
      action: () => handleExecuteCommand('Create a high priority task called Finish API integration'),
    },
    {
      label: 'START FOCUS',
      icon: <Timer className="w-3.5 h-3.5 text-[#FF3B30]" />,
      action: () => handleExecuteCommand('Start a 25 minute focus session'),
    },
    {
      label: 'ANALYZE IMAGE',
      icon: <Eye className="w-3.5 h-3.5 text-[#19F59A]" />,
      action: () => onNavigate('/vision'),
    },
    {
      label: 'SEARCH MEMORY',
      icon: <Database className="w-3.5 h-3.5 text-[#FFB000]" />,
      action: () => handleExecuteCommand('What do you remember about my preferences?'),
    },
    {
      label: 'RUN AUTOMATION',
      icon: <Zap className="w-3.5 h-3.5 text-[#FFB000]" />,
      action: () => handleExecuteCommand('Run my daily briefing'),
    },
    {
      label: 'OPEN INTELLIGENCE',
      icon: <TrendingUp className="w-3.5 h-3.5 text-[#38E1FF]" />,
      action: () => onNavigate('/intelligence'),
    },
  ];

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-6 font-mono text-xs select-none">
      {/* ---------------------------------------------------- */}
      {/* 1. THREE BLADE HERO MOTIF & COMMAND SURFACE HEADER   */}
      {/* ---------------------------------------------------- */}
      <div className="relative p-5 sm:p-7 rounded-3xl bg-[#0A100D] border border-[#16281F] overflow-hidden shadow-2xl text-center space-y-4">
        {/* Zoro Three Blade Visual Motif: Three Slanted Slash Accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-[#00D084] to-transparent" />
        <div className="flex items-center justify-center gap-1.5 opacity-80 pt-1">
          <div className="w-1.5 h-5 bg-[#00D084] -skew-x-12 rounded-sm shadow-[0_0_8px_#00D084]" />
          <div className="w-1.5 h-6 bg-[#38E1FF] -skew-x-12 rounded-sm shadow-[0_0_8px_#38E1FF]" />
          <div className="w-1.5 h-5 bg-[#FFB000] -skew-x-12 rounded-sm shadow-[0_0_8px_#FFB000]" />
        </div>

        <div className="space-y-1">
          <div className="text-[10px] tracking-[0.3em] text-[#8B9992] uppercase font-bold">
            SANTORYU SYNAPSE CORE
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-[#F5F7F6] tracking-wider">
            JARVIS NEURAL COMMAND
          </h1>
          <p className="text-xs sm:text-sm text-[#19F59A] font-medium tracking-wide">
            "How can I help you, Commander?"
          </p>
        </div>

        {/* Live System Status Telemetry Pills (Real States - Section 11) */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#050706] border border-[#00D084]/40 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#19F59A] animate-pulse" />
            <span className="text-[#8B9992]">CORE:</span>
            <span className="text-[#19F59A] font-bold">ONLINE</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#050706] border border-[#16281F] text-[10px]">
            <span className="text-[#8B9992]">VOICE:</span>
            <span className="text-[#38E1FF] font-bold">
              {speechService.isRecognitionSupported() ? 'READY' : 'TEXT ONLY'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#050706] border border-[#16281F] text-[10px]">
            <span className="text-[#8B9992]">VISION:</span>
            <span className="text-[#19F59A] font-bold">READY</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#050706] border border-[#16281F] text-[10px]">
            <span className="text-[#8B9992]">AGENT:</span>
            <span className="text-[#38E1FF] font-bold">
              {surfaceState === 'WAITING_APPROVAL' ? 'APPROVAL REQ' : 'READY'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#050706] border border-[#16281F] text-[10px]">
            <span className="text-[#8B9992]">AUTOMATION:</span>
            <span className="text-[#FFB000] font-bold">
              {stats.activeAutomations > 0 ? `${stats.activeAutomations} ACTIVE` : 'IDLE'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#050706] border border-[#16281F] text-[10px]">
            <span className="text-[#8B9992]">MEMORY:</span>
            <span className="text-[#19F59A] font-bold">{stats.totalMemories} SYNCED</span>
          </div>
        </div>

        {/* Global Command Bar (Embedded in Hero Surface) */}
        <div className="max-w-3xl mx-auto pt-2">
          <CommandBar
            onExecute={handleExecuteCommand}
            activeMissionContext={activeMission}
            onChangeContext={() => setIsChangingContext(true)}
            onClearContext={() => {
              CommandRouterService.setActiveMissionContext(userId, null);
              setActiveMission(null);
            }}
            isProcessing={
              surfaceState === 'THINKING' ||
              surfaceState === 'PLANNING' ||
              surfaceState === 'EXECUTING' ||
              surfaceState === 'VERIFYING'
            }
            placeholder="Ask JARVIS anything... (e.g. 'Show active missions', 'Create a task', 'Analyze screenshot')"
            autoFocus
          />
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. CONTEXT SELECTOR MODAL (If changing active mission) */}
      {/* ---------------------------------------------------- */}
      {isChangingContext && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050706]/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0A100D] border border-[#16281F] rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#16281F]">
              <span className="font-bold text-sm text-[#F5F7F6] flex items-center gap-2">
                <Target className="w-4 h-4 text-[#38E1FF]" />
                SELECT ACTIVE MISSION CONTEXT
              </span>
              <button
                onClick={() => setIsChangingContext(false)}
                className="text-[#8B9992] hover:text-[#F5F7F6]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#8B9992]">
              Commands like "Create a task" will automatically associate with this mission.
            </p>

            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {MissionService.getMissions(userId).map((m) => (
                <div
                  key={m.id}
                  onClick={() => {
                    CommandRouterService.setActiveMissionContext(userId, { id: m.id, title: m.title });
                    setActiveMission({ id: m.id, title: m.title });
                    setIsChangingContext(false);
                  }}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-colors flex items-center justify-between ${
                    activeMission?.id === m.id
                      ? 'bg-[#121C17] border-[#00D084] text-[#19F59A]'
                      : 'bg-[#050706] border-[#16281F] text-[#8B9992] hover:text-[#F5F7F6]'
                  }`}
                >
                  <span className="font-bold truncate max-w-[260px]">{m.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#16281F]">{m.progress}%</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                CommandRouterService.setActiveMissionContext(userId, null);
                setActiveMission(null);
                setIsChangingContext(false);
              }}
              className="w-full py-2 rounded-xl bg-[#050706] border border-[#16281F] text-xs text-[#FF3B30] hover:bg-[#FF3B30]/10"
            >
              CLEAR CONTEXT
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. QUICK ACTIONS BAR (Section 18)                     */}
      {/* ---------------------------------------------------- */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <span className="text-[10px] text-[#8B9992] shrink-0 font-bold">
          QUICK ACTIONS:
        </span>
        {quickActions.map((qa, i) => (
          <button
            key={i}
            onClick={qa.action}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0A100D] border border-[#16281F] hover:border-[#00D084]/60 text-[#8B9992] hover:text-[#F5F7F6] text-[11px] font-mono transition-all shrink-0 hover:scale-[1.02]"
          >
            {qa.icon}
            <span>{qa.label}</span>
          </button>
        ))}
      </div>

      {/* ---------------------------------------------------- */}
      {/* 4. DYNAMIC STATE SCANNING / STATUS INDICATOR          */}
      {/* ---------------------------------------------------- */}
      {surfaceState !== 'IDLE' && (
        <div className="p-3 rounded-2xl bg-[#0A100D] border border-[#16281F] flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                surfaceState === 'ERROR'
                  ? 'bg-[#FF3B30] animate-pulse'
                  : surfaceState === 'COMPLETE'
                  ? 'bg-[#19F59A]'
                  : 'bg-[#38E1FF] animate-ping'
              }`}
            />
            <span className="font-bold text-xs text-[#F5F7F6]">
              STATUS: {surfaceState}
            </span>
          </div>

          <div className="text-[10px] text-[#8B9992]">
            {surfaceState === 'THINKING' && 'Analyzing intent & syntax matrix...'}
            {surfaceState === 'PLANNING' && 'Formulating multi-step execution plan...'}
            {surfaceState === 'WAITING_APPROVAL' && 'Awaiting operator authorization in modal...'}
            {surfaceState === 'EXECUTING' && 'Executing safe application action...'}
            {surfaceState === 'VERIFYING' && 'Verifying state write in database...'}
            {surfaceState === 'COMPLETE' && 'Directive cleared.'}
            {surfaceState === 'ERROR' && 'Execution halted.'}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 5. GLOBAL SEARCH RESULTS OVERLAY (When Search active) */}
      {/* ---------------------------------------------------- */}
      {isSearchActive && (
        <div className="p-4 sm:p-5 rounded-3xl bg-[#0A100D] border border-[#00D084]/40 shadow-2xl space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-[#16281F] pb-2">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-[#19F59A]" />
              <span className="font-bold text-sm text-[#F5F7F6]">
                GLOBAL SEARCH: "{searchQuery}"
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#00D084]/15 text-[#19F59A]">
                {searchResults.length} RESULTS
              </span>
            </div>
            <button
              onClick={() => {
                setIsSearchActive(false);
                setSearchQuery('');
              }}
              className="text-xs text-[#8B9992] hover:text-[#F5F7F6]"
            >
              CLOSE SEARCH
            </button>
          </div>

          <div className="divide-y divide-[#16281F]/40 max-h-96 overflow-y-auto space-y-1">
            {searchResults.length === 0 ? (
              <div className="p-8 text-center text-[#8B9992]">
                Zero records found across missions, tasks, memories, decisions, vision, and automations.
              </div>
            ) : (
              searchResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onNavigate(item.route)}
                  className="p-3 rounded-xl hover:bg-[#121C17] cursor-pointer flex items-center justify-between transition-colors group"
                >
                  <div className="space-y-0.5 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#050706] border border-[#16281F] text-[#8B9992]">
                        {item.type}
                      </span>
                      <span className="font-bold text-xs text-[#F5F7F6] truncate group-hover:text-[#19F59A]">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8B9992] truncate">{item.description}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <span className="text-[9px] text-[#8B9992]">
                      {new Date(item.date).toLocaleDateString()}
                    </span>
                    <span className="text-[10px] text-[#19F59A] font-bold px-2 py-0.5 rounded bg-[#00D084]/10 border border-[#00D084]/20">
                      {item.relevance}%
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#8B9992] group-hover:text-[#19F59A] group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 6. COMMAND RESULT PANEL (Section 10)                 */}
      {/* ---------------------------------------------------- */}
      {activeResult && !isSearchActive && (
        <div className="p-4 sm:p-5 rounded-3xl bg-[#0A100D] border border-[#16281F] shadow-2xl space-y-3 animate-scaleUp">
          <div className="flex items-center justify-between border-b border-[#16281F] pb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2
                className={`w-4 h-4 ${
                  activeResult.status === 'SUCCESS' ? 'text-[#19F59A]' : 'text-[#FF3B30]'
                }`}
              />
              <span className="font-bold text-xs text-[#F5F7F6]">
                {activeResult.headline}
              </span>
              <span className="text-[9px] font-mono text-[#8B9992]">
                {activeResult.executionTimeMs}ms
              </span>
            </div>

            <button
              onClick={() => setActiveResult(null)}
              className="text-[#8B9992] hover:text-[#F5F7F6]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#050706] border border-[#16281F] text-xs leading-relaxed whitespace-pre-wrap font-mono text-[#F5F7F6]">
            {activeResult.summary}
          </div>

          {activeResult.details && activeResult.details.length > 0 && (
            <div className="space-y-1 text-[11px] text-[#8B9992] pl-1">
              {activeResult.details.map((d, i) => (
                <div key={i}>{d}</div>
              ))}
            </div>
          )}

          {activeResult.actionTaken?.linkRoute && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => onNavigate(activeResult.actionTaken!.linkRoute!)}
                className="px-4 py-2 rounded-xl bg-[#00D084] text-[#050706] font-bold text-xs hover:bg-[#19F59A] flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,208,132,0.2)]"
              >
                <span>{activeResult.actionTaken.linkLabel || 'OPEN MODULE'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 7. SIX-CELL NEURAL COMMAND SURFACE MATRIX (Section 2)*/}
      {/* ---------------------------------------------------- */}
      <div className="space-y-2">
        <div className="text-[10px] text-[#8B9992] tracking-wider font-bold px-1 flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-[#19F59A]" />
          SUBSYSTEM COMMAND MATRIX
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {/* Cell 1: MISSIONS */}
          <div
            onClick={() => onNavigate('/missions')}
            className="p-4 rounded-2xl bg-[#0A100D] border border-[#16281F] hover:border-[#38E1FF] cursor-pointer transition-all hover:scale-[1.02] space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-[#050706] border border-[#16281F] flex items-center justify-center">
                <Target className="w-4 h-4 text-[#38E1FF]" />
              </div>
              <span className="text-[10px] font-bold text-[#38E1FF]">
                {stats.activeMissions} ACTIVE
              </span>
            </div>
            <div>
              <div className="font-bold text-xs text-[#F5F7F6] group-hover:text-[#38E1FF] transition-colors">
                MISSIONS
              </div>
              <p className="text-[10px] text-[#8B9992] mt-0.5">
                Blade 02 OS Strategic Operations & Next Move Engine
              </p>
            </div>
          </div>

          {/* Cell 2: MEMORY */}
          <div
            onClick={() => onNavigate('/memory')}
            className="p-4 rounded-2xl bg-[#0A100D] border border-[#16281F] hover:border-[#FFB000] cursor-pointer transition-all hover:scale-[1.02] space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-[#050706] border border-[#16281F] flex items-center justify-center">
                <Database className="w-4 h-4 text-[#FFB000]" />
              </div>
              <span className="text-[10px] font-bold text-[#FFB000]">
                {stats.totalMemories} NODES
              </span>
            </div>
            <div>
              <div className="font-bold text-xs text-[#F5F7F6] group-hover:text-[#FFB000] transition-colors">
                MEMORY
              </div>
              <p className="text-[10px] text-[#8B9992] mt-0.5">
                Blade 03 Persistent Neural Knowledge & Graph
              </p>
            </div>
          </div>

          {/* Cell 3: VISION */}
          <div
            onClick={() => onNavigate('/vision')}
            className="p-4 rounded-2xl bg-[#0A100D] border border-[#16281F] hover:border-[#00D084] cursor-pointer transition-all hover:scale-[1.02] space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-[#050706] border border-[#16281F] flex items-center justify-center">
                <Eye className="w-4 h-4 text-[#19F59A]" />
              </div>
              <span className="text-[10px] font-bold text-[#19F59A]">
                {stats.visionCount} INSPECTED
              </span>
            </div>
            <div>
              <div className="font-bold text-xs text-[#F5F7F6] group-hover:text-[#19F59A] transition-colors">
                VISION
              </div>
              <p className="text-[10px] text-[#8B9992] mt-0.5">
                Multimodal Image, Screenshot & UI Inspector
              </p>
            </div>
          </div>

          {/* Cell 4: AGENTS */}
          <div
            onClick={() => onNavigate('/agents')}
            className="p-4 rounded-2xl bg-[#0A100D] border border-[#16281F] hover:border-[#00D084] cursor-pointer transition-all hover:scale-[1.02] space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-[#050706] border border-[#16281F] flex items-center justify-center">
                <Cpu className="w-4 h-4 text-[#19F59A]" />
              </div>
              <span className="text-[10px] font-bold text-[#19F59A]">
                {stats.agentExecutionsCount} RUNS
              </span>
            </div>
            <div>
              <div className="font-bold text-xs text-[#F5F7F6] group-hover:text-[#19F59A] transition-colors">
                AGENTS
              </div>
              <p className="text-[10px] text-[#8B9992] mt-0.5">
                Controlled Orchestration & Guardian Supervision
              </p>
            </div>
          </div>

          {/* Cell 5: AUTO */}
          <div
            onClick={() => onNavigate('/automation')}
            className="p-4 rounded-2xl bg-[#0A100D] border border-[#16281F] hover:border-[#FFB000] cursor-pointer transition-all hover:scale-[1.02] space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-[#050706] border border-[#16281F] flex items-center justify-center">
                <Zap className="w-4 h-4 text-[#FFB000]" />
              </div>
              <span className="text-[10px] font-bold text-[#FFB000]">
                {stats.activeAutomations} WORKFLOWS
              </span>
            </div>
            <div>
              <div className="font-bold text-xs text-[#F5F7F6] group-hover:text-[#FFB000] transition-colors">
                AUTO
              </div>
              <p className="text-[10px] text-[#8B9992] mt-0.5">
                Autonomous Schedules & Event-Triggered Automation Lab
              </p>
            </div>
          </div>

          {/* Cell 6: INSIGHT */}
          <div
            onClick={() => onNavigate('/intelligence')}
            className="p-4 rounded-2xl bg-[#0A100D] border border-[#16281F] hover:border-[#38E1FF] cursor-pointer transition-all hover:scale-[1.02] space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-[#050706] border border-[#16281F] flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#38E1FF]" />
              </div>
              <span className="text-[10px] font-bold text-[#38E1FF]">
                {stats.intelligenceSignalsCount} SIGNALS
              </span>
            </div>
            <div>
              <div className="font-bold text-xs text-[#F5F7F6] group-hover:text-[#38E1FF] transition-colors">
                INSIGHT
              </div>
              <p className="text-[10px] text-[#8B9992] mt-0.5">
                Predictive Intelligence Core & Productivity Telemetry
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 8. TWO-COLUMN SPLIT: RECENT / FAVORITES vs LIVE FEED */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Left Column: Pinned Favorites & Aliases & History */}
        <div className="space-y-4">
          {/* Pinned Favorites */}
          <div className="p-4 rounded-3xl bg-[#0A100D] border border-[#16281F] space-y-3">
            <div className="flex items-center justify-between border-b border-[#16281F] pb-2">
              <span className="font-bold text-xs text-[#19F59A] flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5" />
                PINNED DIRECTIVES & FAVORITES
              </span>
              <span className="text-[10px] text-[#8B9992]">
                {favorites.length} PINNED
              </span>
            </div>

            <div className="space-y-1.5">
              {favorites.map((fav) => (
                <div
                  key={fav.id}
                  onClick={() => handleExecuteCommand(fav.command)}
                  className="p-2.5 rounded-xl bg-[#050706] border border-[#16281F] hover:border-[#00D084]/40 cursor-pointer flex items-center justify-between group transition-colors"
                >
                  <div>
                    <div className="font-bold text-xs text-[#F5F7F6] group-hover:text-[#19F59A] transition-colors">
                      {fav.label}
                    </div>
                    <div className="text-[10px] text-[#8B9992] font-mono mt-0.5">
                      "{fav.command}"
                    </div>
                  </div>
                  <Play className="w-3.5 h-3.5 text-[#8B9992] group-hover:text-[#19F59A] group-hover:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
          </div>

          {/* Predefined Safe Aliases */}
          <div className="p-4 rounded-3xl bg-[#0A100D] border border-[#16281F] space-y-2">
            <div className="flex items-center justify-between border-b border-[#16281F] pb-1.5">
              <span className="font-bold text-xs text-[#38E1FF] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                TACTICAL ALIASES
              </span>
              <span className="text-[10px] text-[#8B9992]">PREDEFINED PIPELINES</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {aliases.map((al) => (
                <div
                  key={al.id}
                  onClick={() => handleExecuteCommand(al.alias)}
                  className="p-2.5 rounded-xl bg-[#050706] border border-[#16281F] hover:border-[#38E1FF]/40 cursor-pointer transition-colors space-y-1"
                >
                  <div className="font-bold text-xs text-[#F5F7F6] uppercase">
                    "{al.alias}"
                  </div>
                  <p className="text-[10px] text-[#8B9992] line-clamp-2">
                    {al.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Commands */}
          <div className="p-4 rounded-3xl bg-[#0A100D] border border-[#16281F] space-y-3">
            <div className="flex items-center justify-between border-b border-[#16281F] pb-2">
              <span className="font-bold text-xs text-[#8B9992] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                RECENT COMMAND AUDIT TRAIL
              </span>
              <button
                onClick={() => onNavigate('/logs')}
                className="text-[10px] text-[#19F59A] hover:underline"
              >
                VIEW FULL LOGS
              </button>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {recentCommands.length === 0 ? (
                <div className="text-[11px] text-[#8B9992] p-3 text-center">
                  Zero recent command logs.
                </div>
              ) : (
                recentCommands.slice(0, 5).map((cmd) => (
                  <div
                    key={cmd.id}
                    onClick={() => handleExecuteCommand(cmd.command)}
                    className="p-2 rounded-xl bg-[#050706] border border-[#16281F] flex items-center justify-between text-xs cursor-pointer hover:border-[#16281F]/90"
                  >
                    <span className="font-mono text-[#F5F7F6] truncate max-w-[240px]">
                      {cmd.command}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        cmd.status === 'SUCCESS'
                          ? 'bg-[#19F59A]/10 text-[#19F59A]'
                          : 'bg-[#FF3B30]/10 text-[#FF3B30]'
                      }`}
                    >
                      {cmd.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Neural Activity Stream (Realtime) */}
        <div className="space-y-4">
          <div className="p-4 sm:p-5 rounded-3xl bg-[#0A100D] border border-[#16281F] space-y-3 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#16281F] pb-2.5">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#19F59A]" />
                  <span className="font-bold text-xs text-[#F5F7F6]">
                    LIVE NEURAL ACTIVITY STREAM
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-[#19F59A] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#19F59A] animate-ping" />
                  <span>REALTIME</span>
                </div>
              </div>

              {/* Stream Feed */}
              <div className="divide-y divide-[#16281F]/40 space-y-2 mt-3 max-h-[460px] overflow-y-auto pr-1">
                {activityStream.length === 0 ? (
                  <div className="p-8 text-center text-[#8B9992] space-y-2">
                    <Radio className="w-6 h-6 mx-auto text-[#16281F]" />
                    <p className="text-xs">Connecting to Neural Event Stream...</p>
                    <p className="text-[10px]">
                      Events from Vision, Agents, Missions, Tasks, Automations, and Memory will populate here live.
                    </p>
                  </div>
                ) : (
                  activityStream.map((act) => (
                    <div
                      key={act.id}
                      className="pt-2 first:pt-0 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-2.5 truncate pr-2">
                        <span className="text-[#8B9992] text-[10px] font-mono shrink-0">
                          {act.time}
                        </span>
                        <span className="text-[#F5F7F6] truncate text-[11px]">
                          {act.text}
                        </span>
                      </div>

                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#050706] border border-[#16281F] text-[#19F59A] shrink-0">
                        {act.type}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom Stream Metric */}
            <div className="pt-3 border-t border-[#16281F] flex items-center justify-between text-[10px] text-[#8B9992]">
              <span>SOCKET: BROADCAST SYNAPSE</span>
              <span className="text-[#19F59A]">DISCIPLINE MATRIX OPTIMAL</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 9. ACTION PREVIEW & APPROVAL MODAL (Section 6)       */}
      {/* ---------------------------------------------------- */}
      <CommandPreviewModal
        isOpen={isPreviewOpen}
        preview={activePreview}
        onApprove={handleApproveAction}
        onCancel={() => {
          setIsPreviewOpen(false);
          setActivePreview(null);
          setSurfaceState('CANCELLED');
        }}
        isExecuting={isApproving}
      />
    </div>
  );
};

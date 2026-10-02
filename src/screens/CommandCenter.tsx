import React, { useState, useEffect } from 'react';
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
  ExternalLink,
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
import { CommandPreviewModal } from '../components/CommandPreviewModal';
import { ZoroHeroAICore } from '../components/zoro/ZoroHeroAICore';
import { ZoroThinkingPipeline } from '../components/zoro/ZoroThinkingPipeline';
import { ZoroStructuredResponse } from '../components/zoro/ZoroStructuredResponse';
import { ZoroAgentDeck } from '../components/zoro/ZoroAgentDeck';
import { ZoroIntelligenceFeed } from '../components/zoro/ZoroIntelligenceFeed';
import { NeuralCommandSurface } from '../components/command/NeuralCommandSurface';
import { CommandProcessVisualizer } from '../components/command/CommandProcessVisualizer';
import { MissionControlWidget } from '../components/mission/MissionControlWidget';
import { AgentBrainDeck } from '../components/agent/AgentBrainDeck';
import { VisionCoreWidget } from '../components/vision/VisionCoreWidget';
import { MemoryCoreWidget } from '../components/memory/MemoryCoreWidget';
import { ActionQueueWidget } from '../components/mission/ActionQueueWidget';
import { AnalyticsCoreWidget } from '../components/analytics/AnalyticsCoreWidget';
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
import { soundService } from '../services/sound';
import { getLocalStore, setLocalStore, isSupabaseConfigured } from '../services/supabase';

interface CommandCenterProps {
  onNavigate: (path: RoutePath) => void;
  initialCommand?: string;
  onOpenVoiceHUD?: () => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  onNavigate,
  initialCommand = '',
  onOpenVoiceHUD,
}) => {
  const { currentSession } = useAuth();
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

  // Recent Command History
  const [recentCommands, setRecentCommands] = useState<any[]>([]);

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

  // Realtime Subsystem Listener
  useEffect(() => {
    const unsub = realtimeService.on('*', () => {
      refreshTelemetry();
    });
    return () => unsub();
  }, [userId]);

  // Handle Initial Command if passed in
  useEffect(() => {
    if (initialCommand) {
      handleExecuteCommand(initialCommand);
    }
  }, [initialCommand]);

  // Execute Command Pipeline
  const handleExecuteCommand = async (command: string, imageFile?: File | null) => {
    if (!command.trim() && !imageFile) return;

    // Check if query is a global search prefix
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

  return (
    <div className="space-y-6 select-none font-mono">
      {/* ---------------------------------------------------- */}
      {/* 1. ZORO HERO AI CORE (Section 7)                     */}
      {/* ---------------------------------------------------- */}
      <ZoroHeroAICore
        onNavigate={onNavigate}
        onExecuteCommand={handleExecuteCommand}
        onOpenVoice={onOpenVoiceHUD || (() => {})}
        systemState={surfaceState}
        activeMissionCount={stats.activeMissions}
        totalTaskCount={stats.activeTasks}
        memoryNodeCount={stats.totalMemories}
      />

      {/* Subsystem Live Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center text-xs font-mono">
        <div className="p-2.5 rounded-xl bg-zoro-panel border border-zoro-border shadow-sm">
          <div className="text-[10px] text-zoro-textMuted uppercase font-bold tracking-wider">SYSTEM HEALTH</div>
          <div className="text-xs font-bold text-zoro-cyan mt-0.5">100% NOMINAL</div>
        </div>
        <div className="p-2.5 rounded-xl bg-zoro-panel border border-zoro-border shadow-sm">
          <div className="text-[10px] text-zoro-textMuted uppercase font-bold tracking-wider">ACTIVE MISSIONS</div>
          <div className="text-sm font-bold text-zoro-text tabular-nums mt-0.5">
            {stats.activeMissions}
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-zoro-panel border border-zoro-border shadow-sm">
          <div className="text-[10px] text-zoro-textMuted uppercase font-bold tracking-wider">AGENT STATUS</div>
          <div className="text-xs font-bold text-zoro-blue mt-0.5">
            {surfaceState === 'WAITING_APPROVAL' ? 'APPROVAL REQ' : 'READY'}
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-zoro-panel border border-zoro-border shadow-sm">
          <div className="text-[10px] text-zoro-textMuted uppercase font-bold tracking-wider">MEMORY BANK</div>
          <div className="text-sm font-bold text-zoro-violet tabular-nums mt-0.5">
            {stats.totalMemories} NODES
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-zoro-panel border border-zoro-border shadow-sm">
          <div className="text-[10px] text-zoro-textMuted uppercase font-bold tracking-wider">AUTOMATIONS</div>
          <div className="text-sm font-bold text-zoro-warning tabular-nums mt-0.5">
            {stats.activeAutomations} ACTIVE
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-zoro-panel border border-zoro-border shadow-sm">
          <div className="text-[10px] text-zoro-textMuted uppercase font-bold tracking-wider">REALTIME</div>
          <div className="text-xs font-bold text-zoro-cyan mt-0.5">
            {realtimeService.isConnected() ? 'CONNECTED' : 'SYNCING'}
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. ZORO NATURAL LANGUAGE COMMAND SURFACE (Section 10) */}
      {/* ---------------------------------------------------- */}
      <NeuralCommandSurface
        onExecute={handleExecuteCommand}
        surfaceState={surfaceState}
        onOpenVoiceHUD={onOpenVoiceHUD || (() => {})}
        isExecuting={
          surfaceState === 'THINKING' ||
          surfaceState === 'PLANNING' ||
          surfaceState === 'EXECUTING' ||
          surfaceState === 'VERIFYING'
        }
      />

      {/* ---------------------------------------------------- */}
      {/* 3. AI THINKING PIPELINE (Section 11 & 35)            */}
      {/* ---------------------------------------------------- */}
      {surfaceState !== 'IDLE' && (
        <ZoroThinkingPipeline
          surfaceState={surfaceState}
          errorMessage={activeResult?.status === 'FAILED' ? activeResult.summary : undefined}
          executionTimeMs={activeResult?.executionTimeMs}
        />
      )}

      {/* ---------------------------------------------------- */}
      {/* 4. STRUCTURED ZORO RESPONSE CARD (Section 34)        */}
      {/* ---------------------------------------------------- */}
      {activeResult && !isSearchActive && (
        <ZoroStructuredResponse
          result={activeResult}
          onNavigate={onNavigate}
          onDismiss={() => setActiveResult(null)}
        />
      )}

      {/* ---------------------------------------------------- */}
      {/* 5. GLOBAL SEARCH RESULTS OVERLAY                     */}
      {/* ---------------------------------------------------- */}
      {isSearchActive && (
        <div className="p-4 sm:p-5 rounded-lg border border-jarvis-primary/40 bg-jarvis-surfaceElevated shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-jarvis-border/60 pb-2">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-jarvis-primary" />
              <span className="font-bold text-xs text-jarvis-text">
                GLOBAL SEARCH: &ldquo;{searchQuery}&rdquo;
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-jarvis-primary/10 text-jarvis-primary font-bold">
                {searchResults.length} RESULTS
              </span>
            </div>
            <button
              onClick={() => {
                setIsSearchActive(false);
                setSearchQuery('');
              }}
              className="text-xs text-jarvis-textMuted hover:text-jarvis-text"
            >
              CLOSE SEARCH
            </button>
          </div>

          <div className="divide-y divide-jarvis-border/40 max-h-96 overflow-y-auto space-y-1">
            {searchResults.length === 0 ? (
              <div className="p-8 text-center text-jarvis-textMuted text-xs">
                Zero records found across missions, tasks, memories, decisions, vision, and automations.
              </div>
            ) : (
              searchResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onNavigate(item.route)}
                  className="p-3 rounded hover:bg-jarvis-surface cursor-pointer flex items-center justify-between transition-colors group"
                >
                  <div className="space-y-0.5 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-jarvis-bg border border-jarvis-border text-jarvis-textMuted">
                        {item.type}
                      </span>
                      <span className="font-bold text-xs text-jarvis-text truncate group-hover:text-jarvis-primary">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-jarvis-textSecondary truncate">{item.description}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <span className="text-[10px] text-jarvis-primary font-bold px-2 py-0.5 rounded bg-jarvis-primary/10 border border-jarvis-primary/20">
                      {item.relevance}%
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-jarvis-textMuted group-hover:text-jarvis-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 6. RESPONSIVE GRID OF SUBSYSTEM WIDGETS (Section 4 & 44) */}
      {/* ---------------------------------------------------- */}
      {/* ROW 1: AGENT COMMAND CENTER & COUNCIL (Section 12 & 13) */}
      <ZoroAgentDeck
        userId={userId}
        onNavigate={onNavigate}
      />

      {/* ROW 2: PROACTIVE INTELLIGENCE FEED & MISSION CONTROL (Section 14 & 21) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ZoroIntelligenceFeed
          userId={userId}
          onNavigate={onNavigate}
        />
        <MissionControlWidget
          userId={userId}
          onNavigate={onNavigate}
          onPlanWithJarvis={() => handleExecuteCommand('Plan with ZORO')}
        />
      </div>

      {/* ROW 3: VISION CORE 2.0 & MEMORY CORE 2.0 (Section 16 & 17) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VisionCoreWidget
          userId={userId}
          onNavigate={onNavigate}
        />
        <MemoryCoreWidget
          userId={userId}
          onNavigate={onNavigate}
        />
      </div>

      {/* ROW 4: ACTION QUEUE 2.0 & ANALYTICS TELEMETRY CORE (Section 15 & 19) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActionQueueWidget
          userId={userId}
          onNavigate={onNavigate}
        />
        <AnalyticsCoreWidget
          userId={userId}
          onNavigate={onNavigate}
        />
      </div>

      {/* ---------------------------------------------------- */}
      {/* 7. CONTEXT SELECTOR MODAL                            */}
      {/* ---------------------------------------------------- */}
      {isChangingContext && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md bg-jarvis-surfaceElevated border border-jarvis-border rounded-lg p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-jarvis-border/60">
              <span className="font-bold text-xs text-jarvis-text flex items-center gap-2">
                <Target className="w-4 h-4 text-jarvis-secondary" />
                SELECT ACTIVE MISSION CONTEXT
              </span>
              <button
                onClick={() => setIsChangingContext(false)}
                className="text-jarvis-textMuted hover:text-jarvis-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-jarvis-textMuted">
              Commands like &ldquo;Create a task&rdquo; will automatically associate with this mission.
            </p>

            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {MissionService.getMissions(userId).map((m) => (
                <div
                  key={m.id}
                  onClick={() => {
                    CommandRouterService.setActiveMissionContext(userId, { id: m.id, title: m.title });
                    setActiveMission({ id: m.id, title: m.title });
                    setIsChangingContext(false);
                    soundService.play('CLICK');
                  }}
                  className={`p-2.5 rounded border cursor-pointer transition-colors flex items-center justify-between text-xs ${
                    activeMission?.id === m.id
                      ? 'bg-jarvis-surface border-jarvis-primary text-jarvis-primary'
                      : 'bg-jarvis-surface/60 border-jarvis-border text-jarvis-textSecondary hover:text-jarvis-text hover:border-jarvis-borderHover'
                  }`}
                >
                  <span className="font-bold truncate max-w-[260px]">{m.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-jarvis-bg border border-jarvis-border">
                    {m.progress}%
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                CommandRouterService.setActiveMissionContext(userId, null);
                setActiveMission(null);
                setIsChangingContext(false);
                soundService.play('CLICK');
              }}
              className="w-full py-2 rounded bg-jarvis-surface border border-jarvis-border text-xs text-jarvis-danger hover:bg-jarvis-danger/10"
            >
              CLEAR CONTEXT
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 8. COMMAND ACTION PREVIEW MODAL (GUARDIAN APPROVAL)  */}
      {/* ---------------------------------------------------- */}
      {activePreview && (
        <CommandPreviewModal
          isOpen={isPreviewOpen}
          preview={activePreview}
          onApprove={handleApproveAction}
          onCancel={() => {
            setIsPreviewOpen(false);
            setActivePreview(null);
            setSurfaceState('CANCELLED');
            soundService.play('CLICK');
          }}
          isExecuting={isApproving}
        />
      )}
    </div>
  );
};

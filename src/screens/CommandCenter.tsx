import React, { useState, useEffect } from 'react';
import {
  Search,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  ActionPreviewData,
  CommandResultData,
  CommandSurfaceState,
  GlobalSearchResult,
  RoutePath,
  Task,
} from '../types';
import { CommandPreviewModal } from '../components/CommandPreviewModal';
import { ZoroCore } from '../components/zoro/ZoroCore';
import { CommandBar } from '../components/zoro/CommandBar';
import { ZoroThinkingPipeline } from '../components/zoro/ZoroThinkingPipeline';
import { ZoroStructuredResponse } from '../components/zoro/ZoroStructuredResponse';
import { ExecutionTimeline } from '../components/zoro/ExecutionTimeline';
import { AgentCouncil } from '../components/zoro/AgentCouncil';
import { ProjectCommandCenter } from '../components/zoro/ProjectCommandCenter';
import { PriorityPanel } from '../components/zoro/PriorityPanel';
import { IntelligenceFeed } from '../components/zoro/IntelligenceFeed';
import { QuickActions } from '../components/zoro/QuickActions';
import { MissionPanel } from '../components/zoro/MissionPanel';
import { TelemetryPanel } from '../components/zoro/TelemetryPanel';
import { MemoryMap } from '../components/zoro/MemoryMap';
import { VoiceAssistant } from '../components/zoro/VoiceAssistant';
import { DeveloperConsoleModal } from '../components/layout/DeveloperConsoleModal';

import { CommandRouterService } from '../services/commandCenter/commandRouter';
import { GlobalSearchService } from '../services/commandCenter/search';
import { MissionService } from '../services/mission';
import { MemoryService } from '../services/memory';
import { AutomationService } from '../services/automation';
import { AgentCore } from '../services/agent';
import { realtimeService } from '../services/realtime';
import { soundService } from '../services/sound';
import { getLocalStore } from '../services/supabase';

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

  // Command & Surface State
  const [surfaceState, setSurfaceState] = useState<CommandSurfaceState>('IDLE');
  const [activeResult, setActiveResult] = useState<CommandResultData | null>(null);
  const [activePreview, setActivePreview] = useState<ActionPreviewData | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isDevConsoleOpen, setIsDevConsoleOpen] = useState(false);

  // Global Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Context & Metrics
  const [activeMission, setActiveMission] = useState<{ id: string; title: string } | null>(null);
  const [stats, setStats] = useState({
    activeMissions: 0,
    totalMemories: 0,
    activeTasks: 0,
    activeAutomations: 0,
    agentActive: false,
  });

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
      const isRunning = agents.some((a) =>
        ['UNDERSTANDING', 'PLAN_READY', 'EXECUTING', 'VERIFYING'].includes(a.status)
      );

      setStats({
        activeMissions: activeMsns.length,
        totalMemories: mems.length,
        activeTasks: pendingTasks.length,
        activeAutomations: activeAutos.length,
        agentActive: isRunning,
      });

      const ctx = CommandRouterService.getActiveMissionContext(userId);
      setActiveMission(ctx);
    } catch (e) {
      console.warn('Telemetry refresh error:', e);
    }
  };

  useEffect(() => {
    refreshTelemetry();
  }, [userId]);

  useEffect(() => {
    const unsub = realtimeService.on('*', () => {
      refreshTelemetry();
    });
    return () => unsub();
  }, [userId]);

  useEffect(() => {
    if (initialCommand) {
      handleExecuteCommand(initialCommand);
    }
  }, [initialCommand]);

  // Execute Command Pipeline
  const handleExecuteCommand = async (command: string, imageFile?: File | null) => {
    if (!command.trim() && !imageFile) return;

    // Search query prefix interception
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
      console.error('Command Execution Anomaly:', err);
      setSurfaceState('ERROR');
      setActiveResult({
        id: 'cmd_err_' + Date.now(),
        timestamp: Date.now(),
        command,
        status: 'FAILED',
        responseMode: 'ERROR',
        headline: 'DIRECTIVE ANOMALY',
        summary: err?.message || 'The directive could not be safely fulfilled.',
      });
    }
  };

  // Handle Approvals
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
      {/* 1. UNIVERSAL INTELLIGENT COMMAND BAR                 */}
      {/* ---------------------------------------------------- */}
      <CommandBar
        onExecute={handleExecuteCommand}
        isExecuting={
          surfaceState === 'THINKING' ||
          surfaceState === 'PLANNING' ||
          surfaceState === 'EXECUTING' ||
          surfaceState === 'VERIFYING'
        }
        onOpenVoiceHUD={onOpenVoiceHUD}
      />

      {/* ---------------------------------------------------- */}
      {/* 2. REASONING PIPELINE VISUALIZER (When active)       */}
      {/* ---------------------------------------------------- */}
      {surfaceState !== 'IDLE' && (
        <ZoroThinkingPipeline
          surfaceState={surfaceState}
          errorMessage={activeResult?.status === 'FAILED' ? activeResult.summary : undefined}
          executionTimeMs={activeResult?.executionTimeMs}
        />
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. STRUCTURED ZORO RESPONSE BRIEFING                 */}
      {/* ---------------------------------------------------- */}
      {activeResult && !isSearchActive && (
        <ZoroStructuredResponse
          result={activeResult}
          onNavigate={onNavigate}
          onDismiss={() => setActiveResult(null)}
        />
      )}

      {/* ---------------------------------------------------- */}
      {/* 4. GLOBAL SEARCH RESULTS OVERLAY (When triggered)    */}
      {/* ---------------------------------------------------- */}
      {isSearchActive && (
        <div className="p-4 sm:p-5 rounded-2xl border border-zoro-cyan/40 bg-zoro-panelElevated shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-zoro-border pb-2">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-zoro-cyan" />
              <span className="font-bold text-xs text-zoro-text">
                GLOBAL SEARCH: &ldquo;{searchQuery}&rdquo;
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zoro-cyan/15 text-zoro-cyan font-bold">
                {searchResults.length} RECORDS
              </span>
            </div>
            <button
              onClick={() => {
                setIsSearchActive(false);
                setSearchQuery('');
              }}
              className="text-xs text-zoro-textMuted hover:text-zoro-text"
            >
              CLOSE
            </button>
          </div>

          <div className="divide-y divide-zoro-border/40 max-h-80 overflow-y-auto space-y-1">
            {searchResults.length === 0 ? (
              <div className="p-8 text-center text-zoro-textMuted text-xs">
                Zero matching items found across missions, tasks, memories, or actions.
              </div>
            ) : (
              searchResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onNavigate(item.route)}
                  className="p-3 rounded-lg hover:bg-zoro-panel cursor-pointer flex items-center justify-between transition-colors group"
                >
                  <div className="space-y-0.5 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zoro-bg border border-zoro-border text-zoro-textMuted">
                        {item.type}
                      </span>
                      <span className="font-bold text-xs text-zoro-text truncate group-hover:text-zoro-cyan">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-zoro-textSecondary truncate">{item.description}</p>
                  </div>

                  <div className="flex items-center gap-2 text-right shrink-0">
                    <span className="text-[10px] text-zoro-cyan font-bold tabular-nums">
                      {item.relevance}%
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-zoro-textMuted group-hover:text-zoro-cyan group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 5. CENTRAL HERO AI CORE (Section 4)                  */}
      {/* ---------------------------------------------------- */}
      <ZoroCore
        onNavigate={onNavigate}
        onOpenVoice={onOpenVoiceHUD || (() => {})}
        systemState={surfaceState}
        activeMissionCount={stats.activeMissions}
        totalTaskCount={stats.activeTasks}
        memoryNodeCount={stats.totalMemories}
        agentActive={stats.agentActive}
      />

      {/* ---------------------------------------------------- */}
      {/* 6. MAIN MULTI-COLUMN COMMAND MATRIX                  */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: 7 COLS (Agents, Projects, Priorities) */}
        <div className="xl:col-span-7 space-y-6">
          {/* Active Agent Council (Section 9) */}
          <AgentCouncil
            userId={userId}
            onNavigate={onNavigate}
          />

          {/* Active Projects Command Center (Section 14) */}
          <ProjectCommandCenter
            userId={userId}
            onNavigate={onNavigate}
          />

          {/* Today's Priority Ranking (Section 11) */}
          <PriorityPanel
            userId={userId}
            onNavigate={onNavigate}
          />
        </div>

        {/* RIGHT COLUMN: 5 COLS (Intelligence Feed, Quick Actions, Mission Control) */}
        <div className="xl:col-span-5 space-y-6">
          {/* Live Intelligence Feed (Section 8) */}
          <IntelligenceFeed
            userId={userId}
            onNavigate={onNavigate}
          />

          {/* Quick Actions (Section 15) */}
          <QuickActions
            onNavigate={onNavigate}
            onOpenDevMode={() => setIsDevConsoleOpen(true)}
            onOpenVoice={onOpenVoiceHUD || (() => {})}
            onExecuteCommand={handleExecuteCommand}
          />

          {/* Mission Control System (Section 10) */}
          <MissionPanel
            userId={userId}
            onNavigate={onNavigate}
            onPlanWithZoro={() => handleExecuteCommand('Plan with ZORO')}
          />
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 7. TELEMETRY & NEURAL MEMORY (Section 12 & 13)       */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* System Telemetry (Browser-Safe Diagnostics) */}
        <div className="lg:col-span-6">
          <TelemetryPanel />
        </div>

        {/* Neural Memory Map */}
        <div className="lg:col-span-6">
          <MemoryMap
            userId={userId}
            onNavigate={onNavigate}
          />
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 8. TALK TO ZORO (First-Class Bottom Voice Assistant) */}
      {/* ---------------------------------------------------- */}
      <VoiceAssistant
        onExecuteCommand={handleExecuteCommand}
        activeContextTitle={activeMission?.title}
      />

      {/* ---------------------------------------------------- */}
      {/* 9. MODALS: SAFETY APPROVAL & DEV CONSOLE             */}
      {/* ---------------------------------------------------- */}
      {isPreviewOpen && activePreview && (
        <CommandPreviewModal
          preview={activePreview}
          isOpen={isPreviewOpen}
          isExecuting={isApproving}
          onApprove={() => handleApproveAction(activePreview)}
          onCancel={() => {
            setIsPreviewOpen(false);
            setActivePreview(null);
            setSurfaceState('CANCELLED');
          }}
        />
      )}

      {isDevConsoleOpen && (
        <DeveloperConsoleModal
          isOpen={isDevConsoleOpen}
          onClose={() => setIsDevConsoleOpen(false)}
          userId={userId}
        />
      )}
    </div>
  );
};

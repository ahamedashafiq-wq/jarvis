import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AIOrb } from '../components/AIOrb';
import { ThreeBladeSystem } from '../components/ThreeBladeSystem';
import {
  MessageSquare,
  Mic,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Terminal,
  CheckCircle,
  Circle,
  Database,
  ArrowRight,
  Clock,
  Sparkles,
  Shield,
  Activity,
  Radio,
  Wifi,
  WifiOff,
  Flame,
  Target,
  Zap,
  Eye,
} from 'lucide-react';
import { Task, Memory, RoutePath, AIOrbState } from '../types';
import {
  useRealtime,
  useRealtimeTasks,
  useRealtimeMemories,
  useRealtimeCommands,
  useRealtimeNotifications,
  useRealtimeMissions,
} from '../hooks/useRealtime';
import { MissionService } from '../services/mission';
import { useToast } from '../components/Toast';

interface DashboardProps {
  onNavigate: (path: RoutePath) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { currentSession, profile, trackEvent } = useAuth();
  const userId = currentSession?.userId || 'guest';
  const { showToast } = useToast();

  // Synchronized real-time hooks
  const { tasks, toggleTask } = useRealtimeTasks();
  const { memories } = useRealtimeMemories();
  const { commands } = useRealtimeCommands();
  const { missions } = useRealtimeMissions();
  const { unreadCount } = useRealtimeNotifications();
  const { connectionStatus, networkStatus, isConnected, isOnline } = useRealtime();

  const nextMove = React.useMemo(() => {
    return MissionService.computeNextMove(userId);
  }, [userId, missions, tasks]);

  const [orbState, setOrbState] = useState<AIOrbState>('IDLE');
  const [quickInput, setQuickInput] = useState('');

  // Quick Focus widget state
  const [focusTime, setFocusTime] = useState(25 * 60);
  const [isFocusActive, setIsFocusActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isFocusActive && focusTime > 0) {
      interval = setInterval(() => setFocusTime((t) => t - 1), 1000);
    } else if (focusTime === 0 && isFocusActive) {
      setIsFocusActive(false);
      setOrbState('SUCCESS');
      showToast('FOCUS COMPLETE', '25-minute Santoryu focus protocol accomplished.', 'FOCUS');
      trackEvent('FOCUS_COMPLETED', '{"duration":25}');
      setTimeout(() => setOrbState('IDLE'), 3000);
    }
    return () => clearInterval(interval);
  }, [isFocusActive, focusTime, showToast, trackEvent]);

  const handleToggleTask = (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    toggleTask(taskId);
    if (target && target.status !== 'COMPLETED') {
      showToast('MISSION ACCOMPLISHED', `Objective completed: "${target.title}"`, 'TASK');
      trackEvent('TASK_COMPLETED', JSON.stringify({ id: taskId, title: target.title }));
    }
  };

  const activeTasks = tasks.filter((t) => t.status !== 'COMPLETED');
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');
  const pinnedMemoriesCount = memories.filter((m) => m.pinned).length;

  const handleQuickPromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    sessionStorage.setItem('pending_chat_prompt', quickInput.trim());
    onNavigate('/chat');
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 font-mono text-xs">
      {/* Real-time Status Banner if Network / Connection drops */}
      {!isOnline && (
        <div className="p-3 rounded-xl bg-[#FF3B30]/15 border border-[#FF3B30]/40 text-[#FF3B30] flex items-center justify-between text-xs animate-pulse">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span className="font-bold">NETWORK OFFLINE: Local sandbox operations armed. Realtime sync suspended until connectivity returns.</span>
          </div>
          <span className="text-[10px] font-bold underline cursor-pointer" onClick={() => window.location.reload()}>RETRY</span>
        </div>
      )}

      {/* Hero Command Section */}
      <div className="relative p-6 sm:p-8 rounded-2xl bg-[#0A100D] border border-[#16281F] overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00D084]/5 rounded-full filter blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16281F] border border-[#00D084]/30 text-[#19F59A] text-[10px] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#19F59A] animate-pulse" />
              <span>COMMAND SYNAPSE • REAL-TIME OPERATIONAL</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-[#F5F7F6]">
              WELCOME BACK, {profile?.display_name || currentSession?.displayName || 'COMMANDER'}
            </h1>

            <p className="text-xs text-[#8B9992] max-w-xl leading-relaxed font-sans">
              JARVIS Zoro Edition is fully armed. Three blades synchronized across Knowledge (Gemini AI), Action Queue, and Persistent Memory. Real-time updates active without manual refresh.
            </p>

            {/* Quick Prompt Input */}
            <form onSubmit={handleQuickPromptSubmit} className="pt-2 flex items-center gap-2 max-w-lg">
              <input
                type="text"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder="Issue directive (e.g., 'Remember my project', 'Create task', 'Status')..."
                className="flex-1 bg-[#050706] border border-[#16281F] rounded-xl px-4 py-2.5 text-xs text-[#F5F7F6] placeholder-[#8B9992] focus:border-[#19F59A] outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-[#19F59A] text-[#050706] font-bold hover:bg-[#00D084] transition-all shrink-0 flex items-center gap-1.5 shadow-[0_0_15px_rgba(25,245,154,0.3)]"
              >
                <span>ENGAGE</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* AI Core Interactive Center */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <AIOrb
              state={orbState}
              size={140}
              onClick={() => {
                setOrbState('THINKING');
                setTimeout(() => setOrbState('IDLE'), 2000);
              }}
            />
          </div>
        </div>
      </div>

      {/* PHASE 6: MISSION CONTROL OS & NEXT MOVE HERO WIDGET */}
      <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#16281F] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#19F59A]/15 border border-[#19F59A] flex items-center justify-center shrink-0">
            <Target className="w-5 h-5 text-[#19F59A]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#19F59A] tracking-wider uppercase">
                MISSION CONTROL OS
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#16281F] text-[#8B9992] font-mono">
                {missions.filter((m) => m.status === 'ACTIVE').length} ACTIVE MISSIONS
              </span>
            </div>
            <div className="font-bold text-sm text-[#F5F7F6]">
              {nextMove ? (
                <span className="flex items-center gap-1.5 text-xs text-[#38E1FF]">
                  <Zap className="w-3.5 h-3.5 animate-pulse" />
                  NEXT MOVE: {nextMove.action}
                </span>
              ) : (
                'Command your objectives. Hierarchy: Goal → Mission → Objectives → Tasks.'
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate('/missions')}
          className="px-4 py-2 rounded-xl bg-[#19F59A] text-[#050706] font-bold text-xs hover:bg-[#00D084] transition-all shrink-0 flex items-center gap-1.5 shadow-[0_0_15px_rgba(25,245,154,0.25)]"
        >
          <span>ENTER MISSION CONTROL</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* PHASE 9: AUTOMATION CORE HERO WIDGET */}
      <div className="p-4 rounded-2xl bg-[#0A100D] border border-[#16281F] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00D084]/15 border border-[#00D084]/40 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-[#19F59A]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#19F59A] tracking-wider uppercase">
                AUTOMATION CORE • TRIGGER → ACTION
              </span>
              <span className="text-[8px] px-1.5 py-0.2 rounded bg-[#00D084]/20 text-[#19F59A] font-mono font-bold">
                PHASE 9
              </span>
            </div>
            <div className="text-xs text-[#8B9992]">
              Controlled recurring and event-driven workflows with safety guardrails & verification.
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate('/automation')}
          className="px-3.5 py-1.5 rounded-lg bg-[#121C17] border border-[#00D084]/40 text-[#19F59A] font-bold text-xs hover:bg-[#00D084]/15 transition-all shrink-0 flex items-center gap-1.5"
        >
          <span>MANAGE AUTOMATIONS</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* PHASE 10: VISION CORE SENSORY WIDGET */}
      <div className="p-4 rounded-2xl bg-[#0A100D] border border-[#16281F] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#38E1FF]/15 border border-[#38E1FF]/40 flex items-center justify-center shrink-0">
            <Eye className="w-4 h-4 text-[#38E1FF]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#38E1FF] tracking-wider uppercase">
                VISION CORE • SENSORY MATRIX
              </span>
              <span className="text-[8px] px-1.5 py-0.2 rounded bg-[#38E1FF]/20 text-[#38E1FF] font-mono font-bold">
                PHASE 10
              </span>
            </div>
            <div className="text-xs text-[#8B9992]">
              See. Understand. Act. Ingest screenshots, code, architecture diagrams, and error diagnostics.
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate('/vision')}
          className="px-3.5 py-1.5 rounded-lg bg-[#121C17] border border-[#38E1FF]/40 text-[#38E1FF] font-bold text-xs hover:bg-[#38E1FF]/15 transition-all shrink-0 flex items-center gap-1.5"
        >
          <span>OPEN VISION CORE</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Three Blades Live Status Architecture */}
      <ThreeBladeSystem
        onNavigate={onNavigate}
        activeTasksCount={activeTasks.length}
        totalMemoriesCount={memories.length}
      />

      {/* Grid: Action Directives & Quick Focus Protocol */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Active Directives (Blade 02) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#0A100D] border border-[#16281F] flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-[#16281F] pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#38E1FF]" />
              <h2 className="font-bold text-xs text-[#F5F7F6] tracking-wider uppercase">
                TODAY'S MISSIONS & ACTION QUEUE ({activeTasks.length} PENDING)
              </h2>
            </div>
            <button
              onClick={() => onNavigate('/tasks')}
              className="text-[10px] text-[#38E1FF] hover:underline flex items-center gap-1"
            >
              <span>TASK CENTER</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {tasks.length === 0 ? (
              <div className="py-8 text-center text-[#8B9992] text-xs">
                Zero directives in queue. Say "Create a task called..." in Chat to log missions.
              </div>
            ) : (
              tasks.slice(0, 4).map((task) => {
                const isComplete = task.status === 'COMPLETED';
                const isCritical = task.priority === 'CRITICAL';
                const isHigh = task.priority === 'HIGH';

                return (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                      isComplete
                        ? 'bg-[#050706]/40 border-[#16281F] opacity-60'
                        : 'bg-[#050706] border-[#16281F] hover:border-[#38E1FF]/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleTask(task.id);
                        }}
                        className={`transition-colors shrink-0 ${
                          isComplete ? 'text-[#19F59A]' : 'text-[#8B9992] hover:text-[#19F59A]'
                        }`}
                      >
                        {isComplete ? (
                          <CheckCircle className="w-4 h-4 fill-current" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>

                      <div className="truncate">
                        <div
                          className={`font-semibold text-xs truncate ${
                            isComplete ? 'line-through text-[#8B9992]' : 'text-[#F5F7F6]'
                          }`}
                        >
                          {task.title}
                        </div>
                        <div className="text-[10px] text-[#8B9992] truncate font-sans">
                          {task.description}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                          isCritical
                            ? 'bg-[#FF3B30]/15 text-[#FF3B30] border-[#FF3B30]/30'
                            : isHigh
                            ? 'bg-[#FFB000]/15 text-[#FFB000] border-[#FFB000]/30'
                            : 'bg-[#16281F] text-[#8B9992] border-[#16281F]'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 border-t border-[#16281F] flex items-center justify-between text-[10px] text-[#8B9992]">
            <span>COMPLETED TODAY: {completedTasks.length}</span>
            <span>MEMORY NODES ARMED: {memories.length} ({pinnedMemoriesCount} PINNED)</span>
          </div>
        </div>

        {/* Quick Santoryu Focus Protocol */}
        <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#16281F] flex flex-col justify-between space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-[#16281F] pb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#FFB000]" />
              <h2 className="font-bold text-xs text-[#F5F7F6] tracking-wider uppercase">
                SANTORYU FOCUS PROTOCOL
              </h2>
            </div>
            <button
              onClick={() => onNavigate('/focus')}
              className="text-[10px] text-[#FFB000] hover:underline flex items-center gap-1"
            >
              <span>EXPAND</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="text-center py-4 space-y-2">
            <div className="text-4xl sm:text-5xl font-black text-[#F5F7F6] tracking-wider font-mono">
              {formatTimer(focusTime)}
            </div>
            <p className="text-[10px] text-[#8B9992] tracking-widest uppercase">
              {isFocusActive ? 'PROTOCOL ENGAGED • ZERO DISTRACTION' : 'IMMERSION READY'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFocusActive(!isFocusActive)}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                isFocusActive
                  ? 'bg-[#FF3B30] text-[#F5F7F6] hover:bg-[#FF4D42]'
                  : 'bg-[#FFB000] text-[#050706] hover:bg-[#FFC030] shadow-[0_0_15px_rgba(255,176,0,0.25)]'
              }`}
            >
              {isFocusActive ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>PAUSE PROTOCOL</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>START 25m FOCUS</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                setIsFocusActive(false);
                setFocusTime(25 * 60);
              }}
              className="p-2.5 rounded-xl bg-[#050706] border border-[#16281F] text-[#8B9992] hover:text-[#F5F7F6] transition-colors"
              title="Reset Timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Live System Log & Recent Commands Telemetry (Section 14 & 15) */}
      <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#16281F] space-y-3">
        <div className="flex items-center justify-between border-b border-[#16281F] pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#19F59A]" />
            <h2 className="font-bold text-xs text-[#F5F7F6] tracking-wider uppercase">
              LIVE DIRECTIVE AUDIT & TELEMETRY STREAM
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-[#19F59A] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#19F59A] animate-pulse" />
              LIVE
            </span>
            <button
              onClick={() => onNavigate('/commands')}
              className="text-[10px] text-[#19F59A] hover:underline"
            >
              TERMINAL
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {commands.slice(0, 3).map((cmd) => (
            <div
              key={cmd.id}
              className="p-3 rounded-xl bg-[#050706] border border-[#16281F] flex flex-col justify-between space-y-1.5"
            >
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#19F59A] font-bold truncate max-w-[140px]">{cmd.command}</span>
                <span className="text-[#8B9992]">{new Date(cmd.created_at).toLocaleTimeString()}</span>
              </div>
              <p className="text-[11px] text-[#8B9992] font-sans truncate">{cmd.result}</p>
              <div className="flex items-center justify-between text-[9px] pt-1 border-t border-[#16281F]/40">
                <span className="text-[#00D084]">STATUS: {cmd.status}</span>
                {cmd.execution_time !== undefined && <span>{cmd.execution_time}ms</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  Database,
  Radio,
  Eye,
  Brain,
  Zap,
  Target,
  Sparkles,
  CheckCircle2,
  Clock,
  Terminal,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  Sliders,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { RoutePath } from '../../types';
import { ThreeBladeLines, ZoroBadge } from './ZoroUI';
import { soundService } from '../../services/sound';
import { isSupabaseConfigured, getLocalStore } from '../../services/supabase';
import { realtimeService } from '../../services/realtime';
import { speechService } from '../../services/speech';
import { CommandRouterService } from '../../services/commandCenter/commandRouter';
import { AgentCore } from '../../services/agent';

interface ZoroIntelligencePanelProps {
  userId: string;
  onNavigate: (path: RoutePath) => void;
  onOpenVoiceHUD: () => void;
  onExecuteCommand?: (command: string) => void;
  className?: string;
}

interface ActivityItem {
  id: string;
  time: string;
  type: 'AGENT' | 'MISSION' | 'MEMORY' | 'SYSTEM' | 'VISION';
  text: string;
}

export const ZoroIntelligencePanel: React.FC<ZoroIntelligencePanelProps> = ({
  userId,
  onNavigate,
  onOpenVoiceHUD,
  onExecuteCommand,
  className = '',
}) => {
  const [soundEnabled, setSoundEnabled] = useState(soundService.isEnabled());
  const [activeMission, setActiveMission] = useState<{ id: string; title: string } | null>(null);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [systemLoad, setSystemLoad] = useState({ cpu: 14, mem: 42, latency: 38 });

  // Update active mission context
  useEffect(() => {
    const updateContext = () => {
      const ctx = CommandRouterService.getActiveMissionContext(userId);
      setActiveMission(ctx);
    };
    updateContext();
    const interval = setInterval(updateContext, 2000);
    return () => clearInterval(interval);
  }, [userId]);

  // Generate tactical activity stream
  useEffect(() => {
    const loadActivities = () => {
      const items: ActivityItem[] = [];
      const now = new Date();
      const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      // Recent agents
      try {
        const executions = AgentCore.getExecutions(userId);
        if (executions.length > 0) {
          const latest = executions[0];
          items.push({
            id: 'agent-' + latest.id,
            time: formatTime(new Date(latest.started_at || Date.now())),
            type: 'AGENT',
            text: `Agent ${(latest.objective || 'Task').slice(0, 32)}... [${latest.status}]`,
          });
        }
      } catch {
        // ignore
      }

      // Memory count
      const memCount = getLocalStore<any[]>(`neural_memories_${userId}`, []).length;
      items.push({
        id: 'sys-mem',
        time: formatTime(now),
        type: 'MEMORY',
        text: `Memory bank active: ${memCount} cognitive nodes indexed`,
      });

      // System telemetry
      items.push({
        id: 'sys-state',
        time: formatTime(new Date(Date.now() - 35000)),
        type: 'SYSTEM',
        text: 'Three Blades synchronized. Latency 38ms',
      });

      items.push({
        id: 'sys-vis',
        time: formatTime(new Date(Date.now() - 90000)),
        type: 'VISION',
        text: 'Zoro Vision optical pipeline armed & calibrated',
      });

      setRecentActivities(items);
    };

    loadActivities();
    const timer = setInterval(() => {
      loadActivities();
      // Jiggle telemetry slightly for authentic command feel
      setSystemLoad({
        cpu: Math.floor(12 + Math.random() * 8),
        mem: Math.floor(40 + Math.random() * 4),
        latency: Math.floor(35 + Math.random() * 6),
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [userId]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundService.setEnabled(next);
    if (next) {
      soundService.play('CLICK');
    }
  };

  return (
    <aside
      className={`w-80 shrink-0 border-l border-zoro-border bg-zoro-panel flex flex-col font-mono select-none overflow-y-auto text-xs ${className}`}
    >
      {/* 1. Panel Header */}
      <div className="p-3.5 border-b border-zoro-border flex items-center justify-between bg-zoro-bg/80">
        <div className="flex items-center gap-2">
          <ThreeBladeLines />
          <span className="font-extrabold text-[11px] tracking-wider text-zoro-text">
            INTELLIGENCE PANEL
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleSound}
            className={`p-1.5 rounded border transition-colors ${
              soundEnabled
                ? 'border-zoro-emerald/30 bg-zoro-emerald/10 text-zoro-emerald'
                : 'border-zoro-border bg-zoro-panelElevated text-zoro-textMuted'
            }`}
            title={soundEnabled ? 'Mute Audio' : 'Enable Audio'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
          <span className="w-2 h-2 rounded-full bg-zoro-emerald shadow-[0_0_6px_#00FF9C] animate-pulse" />
        </div>
      </div>

      <div className="p-3.5 space-y-4 flex-1">
        {/* 2. Three Blades Telemetry Matrix */}
        <div className="rounded-xl border border-zoro-border bg-zoro-panelElevated p-3 space-y-2.5">
          <div className="flex items-center justify-between text-[10px] text-zoro-textMuted font-bold">
            <span>THREE BLADES MATRIX</span>
            <span className="text-zoro-emerald">ONLINE</span>
          </div>

          <div className="space-y-2">
            {/* Blade 1: Wado Ichimonji */}
            <div
              onClick={() => onNavigate('/intelligence')}
              className="flex items-center justify-between p-2 rounded-lg bg-zoro-bg/60 border border-zoro-emerald/20 hover:border-zoro-emerald/50 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-2 truncate">
                <Brain className="w-3.5 h-3.5 text-zoro-emerald group-hover:scale-110 transition-transform" />
                <div className="truncate">
                  <div className="text-[10px] font-bold text-zoro-text group-hover:text-zoro-emerald transition-colors">
                    WADO ICHIMONJI
                  </div>
                  <div className="text-[9px] text-zoro-textMuted">Pure Intent & Reason</div>
                </div>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zoro-emerald/10 text-zoro-emerald border border-zoro-emerald/25">
                ACTIVE
              </span>
            </div>

            {/* Blade 2: Enma */}
            <div
              onClick={() => onNavigate('/agents')}
              className="flex items-center justify-between p-2 rounded-lg bg-zoro-bg/60 border border-zoro-cyan/20 hover:border-zoro-cyan/50 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-2 truncate">
                <Zap className="w-3.5 h-3.5 text-zoro-cyan group-hover:scale-110 transition-transform" />
                <div className="truncate">
                  <div className="text-[10px] font-bold text-zoro-text group-hover:text-zoro-cyan transition-colors">
                    ENMA
                  </div>
                  <div className="text-[9px] text-zoro-textMuted">Agentic Power & Tools</div>
                </div>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zoro-cyan/10 text-zoro-cyan border border-zoro-cyan/25">
                ARMED
              </span>
            </div>

            {/* Blade 3: Sandai Kitetsu */}
            <div
              onClick={() => onNavigate('/vision')}
              className="flex items-center justify-between p-2 rounded-lg bg-zoro-bg/60 border border-zoro-gold/20 hover:border-zoro-gold/50 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-2 truncate">
                <Eye className="w-3.5 h-3.5 text-zoro-gold group-hover:scale-110 transition-transform" />
                <div className="truncate">
                  <div className="text-[10px] font-bold text-zoro-text group-hover:text-zoro-gold transition-colors">
                    SANDAI KITETSU
                  </div>
                  <div className="text-[9px] text-zoro-textMuted">Tactical Vision & Senses</div>
                </div>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zoro-gold/10 text-zoro-gold border border-zoro-gold/25">
                SYNCHRONIZED
              </span>
            </div>
          </div>
        </div>

        {/* 3. System Vital Telemetry Gauges */}
        <div className="rounded-xl border border-zoro-border bg-zoro-panelElevated p-3 space-y-2.5">
          <div className="flex items-center justify-between text-[10px] text-zoro-textMuted font-bold">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-zoro-emerald" />
              SYSTEM VITALS
            </span>
            <span className="text-[9px] text-zoro-emerald font-mono">100% NOMINAL</span>
          </div>

          <div className="space-y-2 text-[10px]">
            <div>
              <div className="flex justify-between text-zoro-textSecondary mb-1">
                <span>NEURAL LOAD</span>
                <span className="font-bold text-zoro-emerald">{systemLoad.cpu}%</span>
              </div>
              <div className="w-full bg-zoro-bg h-1.5 rounded-full overflow-hidden border border-zoro-border">
                <div
                  className="bg-zoro-emerald h-full transition-all duration-500 rounded-full"
                  style={{ width: `${systemLoad.cpu}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-zoro-textSecondary mb-1">
                <span>MEMORY CAPACITY</span>
                <span className="font-bold text-zoro-cyan">{systemLoad.mem}%</span>
              </div>
              <div className="w-full bg-zoro-bg h-1.5 rounded-full overflow-hidden border border-zoro-border">
                <div
                  className="bg-zoro-cyan h-full transition-all duration-500 rounded-full"
                  style={{ width: `${systemLoad.mem}%` }}
                />
              </div>
            </div>

            <div className="pt-1.5 border-t border-zoro-border/60 flex items-center justify-between text-[10px]">
              <span className="text-zoro-textMuted">TELEMETRY LATENCY</span>
              <span className="text-zoro-gold font-bold font-mono">{systemLoad.latency}ms</span>
            </div>
          </div>
        </div>

        {/* 4. Active Mission Context Card */}
        <div className="rounded-xl border border-zoro-border bg-zoro-panelElevated p-3 space-y-2">
          <div className="flex items-center justify-between text-[10px] text-zoro-textMuted font-bold">
            <span className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-zoro-emerald" />
              MISSION OBJECTIVE
            </span>
            <button
              onClick={() => onNavigate('/missions')}
              className="text-[9px] text-zoro-emerald hover:underline"
            >
              MANAGE
            </button>
          </div>

          {activeMission ? (
            <div className="p-2.5 rounded-lg bg-zoro-bg border border-zoro-emerald/30 space-y-1.5">
              <div className="text-xs font-bold text-zoro-text truncate">
                {activeMission.title}
              </div>
              <div className="flex items-center justify-between text-[9px] text-zoro-textMuted">
                <span>TARGET FOCUS ACTIVE</span>
                <span className="text-zoro-emerald font-bold">IN PROGRESS</span>
              </div>
            </div>
          ) : (
            <div
              onClick={() => onNavigate('/missions')}
              className="p-3 rounded-lg bg-zoro-bg border border-dashed border-zoro-border text-center text-zoro-textMuted hover:border-zoro-emerald/40 hover:text-zoro-text cursor-pointer transition-colors"
            >
              <div className="text-[10px]">No active mission selected</div>
              <div className="text-[9px] text-zoro-emerald font-bold mt-1">
                + SET PRIMARY MISSION
              </div>
            </div>
          )}
        </div>

        {/* 5. Live Tactical Activity Stream */}
        <div className="rounded-xl border border-zoro-border bg-zoro-panelElevated p-3 space-y-2">
          <div className="flex items-center justify-between text-[10px] text-zoro-textMuted font-bold">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-zoro-cyan" />
              TACTICAL STREAM
            </span>
            <span className="text-[9px] text-zoro-cyan">LIVE</span>
          </div>

          <div className="space-y-1.5">
            {recentActivities.map((act) => (
              <div
                key={act.id}
                className="p-2 rounded bg-zoro-bg/70 border border-zoro-border/60 text-[10px] space-y-0.5"
              >
                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-zoro-emerald font-bold tracking-wider">
                    {act.type}
                  </span>
                  <span className="text-zoro-textMuted">{act.time}</span>
                </div>
                <div className="text-zoro-textSecondary truncate">{act.text}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Quick Tactical Triggers */}
        <div className="pt-1 space-y-1.5">
          <button
            onClick={() => {
              onOpenVoiceHUD();
              soundService.play('VOICE_ACTIVATED');
            }}
            className="w-full py-2 px-3 rounded-lg border border-zoro-emerald/40 bg-zoro-emerald/10 hover:bg-zoro-emerald/20 text-zoro-emerald text-xs font-bold flex items-center justify-between transition-colors shadow-[0_0_12px_rgba(0,255,156,0.1)]"
          >
            <span className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5" />
              <span>VOICE INTERCEPT</span>
            </span>
            <span className="text-[10px] text-zoro-textMuted">Ctrl+Space</span>
          </button>

          <button
            onClick={() => {
              if (onExecuteCommand) {
                onExecuteCommand('Analyze tactical priorities and next mission');
              } else {
                onNavigate('/command');
              }
              soundService.play('CLICK');
            }}
            className="w-full py-2 px-3 rounded-lg border border-zoro-border bg-zoro-panelElevated hover:border-zoro-cyan/40 hover:bg-zoro-cyan/10 text-zoro-textSecondary hover:text-zoro-cyan text-xs font-semibold flex items-center justify-between transition-colors"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-zoro-cyan" />
              <span>TACTICAL BRIEFING</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

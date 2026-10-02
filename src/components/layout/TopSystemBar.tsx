import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  Database,
  Radio,
  Eye,
  Mic,
  Volume2,
  VolumeX,
  Terminal,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { isSupabaseConfigured } from '../../services/supabase';
import { realtimeService } from '../../services/realtime';
import { speechService } from '../../services/speech';
import { soundService } from '../../services/sound';
import { modelRouter, PersonalityMode } from '../../services/aiProvider';
import { RoutePath } from '../../types';

interface TopSystemBarProps {
  currentPath: RoutePath;
  onNavigate: (path: RoutePath) => void;
  onOpenSystemHealth: () => void;
  onOpenDevConsole: () => void;
  activeMissionTitle?: string;
  coreState?: string;
}

export const TopSystemBar: React.FC<TopSystemBarProps> = ({
  currentPath,
  onNavigate,
  onOpenSystemHealth,
  onOpenDevConsole,
  activeMissionTitle,
  coreState = 'READY',
}) => {
  const [isSoundOn, setIsSoundOn] = useState(soundService.isEnabled());
  const [realtimeConnected, setRealtimeConnected] = useState(realtimeService.isConnected());
  const [activePersonality, setActivePersonality] = useState<PersonalityMode>(modelRouter.getPersonality());
  const [isPersonalityMenuOpen, setIsPersonalityMenuOpen] = useState(false);

  useEffect(() => {
    const unsub = realtimeService.onStatusChange((status) => {
      setRealtimeConnected(status === 'CONNECTED');
    });
    return () => unsub();
  }, []);

  const toggleSound = () => {
    const newVal = soundService.toggle();
    setIsSoundOn(newVal);
    if (newVal) soundService.play('CLICK');
  };

  const selectPersonality = (mode: PersonalityMode) => {
    modelRouter.setPersonality(mode);
    setActivePersonality(mode);
    setIsPersonalityMenuOpen(false);
    soundService.play('CLICK');
  };

  return (
    <header className="h-14 border-b border-jarvis-border bg-jarvis-bg/95 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none shrink-0 font-mono">
      {/* LEFT: Branding, Project & Workspace */}
      <div className="flex items-center gap-3 md:gap-5 min-w-0">
        <button
          onClick={() => onNavigate('/os')}
          className="flex items-center gap-2 group text-left transition-colors"
          aria-label="ZORO OS Home"
        >
          <div className="w-8 h-8 rounded border border-jarvis-primary/30 bg-jarvis-surface flex items-center justify-center relative overflow-hidden group-hover:border-jarvis-primary/60 transition-all">
            <span className="text-jarvis-primary text-xs font-bold tracking-tighter">Z2</span>
            <div className="absolute inset-0 bg-jarvis-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-bold text-xs tracking-wider text-jarvis-text group-hover:text-jarvis-primary transition-colors">
                ZORO OS
              </span>
              <span className="text-[10px] text-jarvis-primary font-semibold">2.0</span>
            </div>
            <div className="text-[9px] text-jarvis-textMuted tracking-wider truncate">
              OMNIA COMMAND PLATFORM
            </div>
          </div>
        </button>

        <div className="hidden lg:flex items-center gap-3 pl-3 border-l border-jarvis-border/60 text-[10px] text-jarvis-textSecondary">
          <div className="flex items-center gap-1.5">
            <span className="text-jarvis-textMuted">PROJECT:</span>
            <span className="text-jarvis-text font-medium truncate max-w-[140px]">
              {activeMissionTitle || 'AI Assistant'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-jarvis-textMuted">WORKSPACE:</span>
            <span className="text-jarvis-secondary font-medium">DEVELOPMENT</span>
          </div>
        </div>
      </div>

      {/* CENTER: Neural Core Status Capsule */}
      <div className="hidden sm:flex items-center justify-center">
        <div className="px-3 py-1 rounded border border-jarvis-border bg-jarvis-surface flex items-center gap-2 text-[11px]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-jarvis-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-jarvis-primary"></span>
          </span>
          <span className="text-jarvis-textMuted">NEURAL CORE</span>
          <span className="text-jarvis-primary font-semibold tracking-wider">{coreState}</span>
        </div>
      </div>

      {/* RIGHT: Compact Status Capsules & Controls */}
      <div className="flex items-center gap-2">
        {/* Personality Selector */}
        <div className="relative">
          <button
            onClick={() => setIsPersonalityMenuOpen(!isPersonalityMenuOpen)}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] border border-jarvis-border bg-jarvis-surface text-jarvis-textSecondary hover:text-jarvis-text hover:border-jarvis-borderHover transition-all"
            title="AI Personality Mode"
            aria-label="AI Personality Mode"
          >
            <span className="text-jarvis-textMuted">MODE:</span>
            <span className="text-jarvis-accent font-semibold">{activePersonality}</span>
            <ChevronDown className="w-3 h-3 text-jarvis-textMuted" />
          </button>

          {isPersonalityMenuOpen && (
            <div className="absolute right-0 mt-1 w-44 rounded-md border border-jarvis-border bg-jarvis-surfaceElevated shadow-xl p-1 z-50 text-[11px]">
              <div className="px-2 py-1 text-[9px] text-jarvis-textMuted font-bold uppercase tracking-wider border-b border-jarvis-border/40 mb-1">
                Personality Mode
              </div>
              {(['COMMANDER', 'ENGINEER', 'RESEARCHER', 'TUTOR', 'ANALYST', 'CREATIVE'] as PersonalityMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => selectPersonality(mode)}
                  className={`w-full text-left px-2 py-1.5 rounded transition-colors flex items-center justify-between ${
                    activePersonality === mode
                      ? 'bg-jarvis-accent/20 text-jarvis-accent font-semibold'
                      : 'text-jarvis-textSecondary hover:bg-jarvis-surface hover:text-jarvis-text'
                  }`}
                >
                  <span>{mode}</span>
                  {activePersonality === mode && <span className="text-xs">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Database Status Capsule */}
        <div
          onClick={onOpenSystemHealth}
          className="cursor-pointer hidden xl:flex items-center gap-1.5 px-2 py-1 rounded text-[10px] border border-jarvis-border bg-jarvis-surface hover:border-jarvis-primary/40 transition-colors"
          title="Database Telemetry"
        >
          <Database className={`w-3 h-3 ${isSupabaseConfigured ? 'text-jarvis-primary' : 'text-jarvis-secondary'}`} />
          <span className="text-jarvis-textMuted">DB:</span>
          <span className={isSupabaseConfigured ? 'text-jarvis-primary' : 'text-jarvis-secondary font-medium'}>
            {isSupabaseConfigured ? 'CONNECTED' : 'LOCAL'}
          </span>
        </div>

        {/* Realtime Status Capsule */}
        <div
          onClick={onOpenSystemHealth}
          className="cursor-pointer hidden lg:flex items-center gap-1.5 px-2 py-1 rounded text-[10px] border border-jarvis-border bg-jarvis-surface hover:border-jarvis-primary/40 transition-colors"
          title="WebSocket Realtime Telemetry"
        >
          <Radio className={`w-3 h-3 ${realtimeConnected ? 'text-jarvis-primary animate-pulse' : 'text-jarvis-warning'}`} />
          <span className="text-jarvis-textMuted">RT:</span>
          <span className={realtimeConnected ? 'text-jarvis-primary' : 'text-jarvis-warning'}>
            {realtimeConnected ? 'CONNECTED' : 'SYNCING'}
          </span>
        </div>

        {/* Sound Toggle */}
        <button
          onClick={toggleSound}
          className={`p-1.5 rounded border border-jarvis-border bg-jarvis-surface hover:border-jarvis-primary/50 transition-colors text-jarvis-textSecondary ${
            isSoundOn ? 'hover:text-jarvis-primary' : 'text-jarvis-textMuted opacity-60'
          }`}
          title={isSoundOn ? 'Sound Cues Enabled (Click to mute)' : 'Sound Cues Muted (Click to enable)'}
          aria-label="Toggle Sound Cues"
        >
          {isSoundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>

        {/* Developer Console Button */}
        <button
          onClick={onOpenDevConsole}
          className="p-1.5 rounded border border-jarvis-border bg-jarvis-surface hover:border-jarvis-primary/50 transition-colors text-jarvis-textSecondary hover:text-jarvis-primary"
          title="Open Developer Console (Diagnostics & Raw Logs)"
          aria-label="Open Developer Console"
        >
          <Terminal className="w-3.5 h-3.5" />
        </button>

        {/* System Health Button */}
        <button
          onClick={onOpenSystemHealth}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] border border-jarvis-border bg-jarvis-surface hover:border-jarvis-primary/50 transition-colors text-jarvis-primary"
          title="System Health & Subsystem Telemetry"
          aria-label="System Health"
        >
          <Activity className="w-3 h-3" />
          <span className="hidden sm:inline font-semibold">HEALTH</span>
        </button>
      </div>
    </header>
  );
};

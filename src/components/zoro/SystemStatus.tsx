import React, { useState, useEffect } from 'react';
import {
  Bell,
  Settings as SettingsIcon,
  User,
  Clock,
  Activity,
  Menu,
  Radio,
  Eye,
  Database,
  Bot,
  CloudSun,
  Shield,
  Volume2,
  VolumeX,
  Terminal,
} from 'lucide-react';
import { RoutePath } from '../../types';
import { soundService } from '../../services/sound';
import { isSupabaseConfigured } from '../../services/supabase';
import { realtimeService } from '../../services/realtime';
import { speechService } from '../../services/speech';

interface SystemStatusProps {
  currentPath: RoutePath;
  onNavigate: (path: RoutePath) => void;
  onOpenSearch: () => void;
  onOpenSystemHealth: () => void;
  onOpenDevConsole: () => void;
  unreadNotificationsCount?: number;
  onToggleMobileNav?: () => void;
  operatorName?: string;
  systemId?: string;
  agentActive?: boolean;
}

export const SystemStatus: React.FC<SystemStatusProps> = ({
  currentPath,
  onNavigate,
  onOpenSearch,
  onOpenSystemHealth,
  onOpenDevConsole,
  unreadNotificationsCount = 0,
  onToggleMobileNav,
  operatorName = 'COMMANDER',
  systemId = 'OMNIA-OS-01',
  agentActive = false,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [isSoundOn, setIsSoundOn] = useState(soundService.isEnabled());
  const [realtimeConnected, setRealtimeConnected] = useState(realtimeService.isConnected());

  useEffect(() => {
    const unsub = realtimeService.onStatusChange((status) => {
      setRealtimeConnected(status === 'CONNECTED');
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setDateStr(
        now.toLocaleDateString([], {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }).toUpperCase()
      );
    };

    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleSound = () => {
    const newVal = soundService.toggle();
    setIsSoundOn(newVal);
    if (newVal) soundService.play('CLICK');
  };

  return (
    <header className="h-14 border-b border-zoro-border bg-[#03070D]/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between shrink-0 font-mono z-30 select-none">
      {/* ---------------------------------------------------- */}
      {/* LEFT: ZORO 2.0 / OMNIA / SYSTEM ID                    */}
      {/* ---------------------------------------------------- */}
      <div className="flex items-center gap-3">
        {onToggleMobileNav && (
          <button
            onClick={() => {
              onToggleMobileNav();
              soundService.play('CLICK');
            }}
            className="md:hidden p-1.5 rounded-lg border border-zoro-border bg-zoro-panel text-zoro-textSecondary hover:text-zoro-cyan focus:outline-none focus:ring-1 focus:ring-zoro-cyan"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Brand identity lockup */}
        <button
          onClick={() => {
            onNavigate('/command');
            soundService.play('CLICK');
          }}
          className="flex items-center gap-2 group text-left focus:outline-none focus:ring-1 focus:ring-zoro-cyan rounded p-0.5"
          aria-label="Navigate to Command Center"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zoro-cyan/20 to-zoro-blue/20 border border-zoro-cyan/40 flex items-center justify-center shadow-[0_0_12px_rgba(25,217,255,0.2)] group-hover:border-zoro-cyan transition-colors">
            <span className="text-zoro-cyan font-black text-xs">Z</span>
          </div>

          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm tracking-wider text-zoro-text group-hover:text-zoro-cyan transition-colors">
                ZORO
              </span>
              <span className="text-[10px] text-zoro-cyan font-bold px-1.5 py-0.2 rounded bg-zoro-cyan/15 border border-zoro-cyan/30">
                2.0
              </span>
            </div>
            <div className="flex items-center gap-1 text-[9px] text-zoro-textMuted tracking-wider font-semibold">
              <span className="text-zoro-textSecondary font-bold">OMNIA</span>
              <span>·</span>
              <span>{systemId}</span>
            </div>
          </div>
        </button>
      </div>

      {/* ---------------------------------------------------- */}
      {/* CENTER: CORE ONLINE, VOICE READY, VISION READY, etc. */}
      {/* ---------------------------------------------------- */}
      <div className="hidden xl:flex items-center gap-2 text-[10px]">
        {/* CORE ONLINE */}
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zoro-panel border border-zoro-border text-zoro-cyan font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-zoro-cyan animate-pulse shadow-[0_0_6px_#19D9FF]" />
          CORE ONLINE
        </span>

        {/* VOICE READY */}
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zoro-panel border border-zoro-border text-zoro-blue font-semibold">
          <Radio className="w-3 h-3 text-zoro-blue" />
          VOICE READY
        </span>

        {/* VISION READY */}
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zoro-panel border border-zoro-border text-zoro-cyan font-semibold">
          <Eye className="w-3 h-3 text-zoro-cyan" />
          VISION READY
        </span>

        {/* MEMORY SYNCED */}
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zoro-panel border border-zoro-border text-zoro-violet font-semibold">
          <Database className="w-3 h-3 text-zoro-violet" />
          MEMORY SYNCED
        </span>

        {/* AGENTS ACTIVE */}
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zoro-panel border border-zoro-border font-semibold ${
          agentActive ? 'text-zoro-cyan' : 'text-zoro-textSecondary'
        }`}>
          <Bot className="w-3 h-3 text-zoro-cyan" />
          {agentActive ? 'AGENTS ACTIVE' : 'AGENTS READY'}
        </span>

        {/* DATABASE CONNECTED */}
        <div
          onClick={onOpenSystemHealth}
          className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zoro-panel border border-zoro-border hover:border-zoro-cyan/40 transition-colors font-semibold"
          title="Database Telemetry"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isSupabaseConfigured ? 'bg-zoro-success shadow-[0_0_6px_#21E6A0]' : 'bg-zoro-warning'
            }`}
          />
          <span className={isSupabaseConfigured ? 'text-zoro-success' : 'text-zoro-warning'}>
            {isSupabaseConfigured ? 'DATABASE CONNECTED' : 'LOCAL SANDBOX'}
          </span>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* RIGHT: TIME, DATE, WEATHER, NOTIFICATIONS, PROFILE   */}
      {/* ---------------------------------------------------- */}
      <div className="flex items-center gap-2">
        {/* Date & Time */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg border border-zoro-border bg-zoro-panel text-xs text-zoro-textSecondary">
          <Clock className="w-3.5 h-3.5 text-zoro-cyan" />
          <span className="text-zoro-textMuted text-[11px]">{dateStr}</span>
          <span className="text-zoro-text font-bold tabular-nums text-[11px]">{timeStr}</span>
        </div>

        {/* Weather / Atmosphere indicator */}
        <div
          className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-zoro-border bg-zoro-panel text-[11px] text-zoro-textSecondary"
          title="Environmental Sensor Feed"
        >
          <CloudSun className="w-3.5 h-3.5 text-zoro-warning" />
          <span className="text-zoro-textMuted">SYS 21°C</span>
          <span className="text-zoro-cyan font-bold">OPTIMAL</span>
        </div>

        {/* Sound Toggle */}
        <button
          onClick={toggleSound}
          className={`p-2 rounded-lg border border-zoro-border bg-zoro-panel hover:border-zoro-cyan/50 transition-colors text-zoro-textSecondary ${
            isSoundOn ? 'hover:text-zoro-cyan' : 'text-zoro-textMuted opacity-60'
          }`}
          title={isSoundOn ? 'Sound Cues Enabled' : 'Sound Cues Muted'}
          aria-label="Toggle Sound"
        >
          {isSoundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>

        {/* Developer Console Button */}
        <button
          onClick={onOpenDevConsole}
          className="p-2 rounded-lg border border-zoro-border bg-zoro-panel hover:border-zoro-cyan/50 transition-colors text-zoro-textSecondary hover:text-zoro-cyan"
          title="Developer Diagnostics Console"
          aria-label="Open Developer Diagnostics"
        >
          <Terminal className="w-3.5 h-3.5" />
        </button>

        {/* System Health Button */}
        <button
          onClick={onOpenSystemHealth}
          className="p-2 rounded-lg border border-zoro-border bg-zoro-panel hover:border-zoro-cyan/50 transition-colors text-zoro-textSecondary hover:text-zoro-cyan"
          title="System Health Telemetry"
          aria-label="System Health"
        >
          <Activity className="w-3.5 h-3.5" />
        </button>

        {/* Notifications */}
        <button
          onClick={() => {
            onNavigate('/notifications');
            soundService.play('CLICK');
          }}
          className="relative p-2 rounded-lg border border-zoro-border bg-zoro-panel text-zoro-textSecondary hover:text-zoro-text hover:border-zoro-cyan/40 transition-colors"
          title="Notifications"
          aria-label="View Notifications"
        >
          <Bell className="w-3.5 h-3.5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-zoro-cyan text-black text-[9px] font-bold flex items-center justify-center">
              {unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* Settings */}
        <button
          onClick={() => {
            onNavigate('/settings');
            soundService.play('CLICK');
          }}
          className="p-2 rounded-lg border border-zoro-border bg-zoro-panel text-zoro-textSecondary hover:text-zoro-text hover:border-zoro-cyan/40 transition-colors"
          title="Settings"
          aria-label="Open Settings"
        >
          <SettingsIcon className="w-3.5 h-3.5" />
        </button>

        {/* Commander Profile */}
        <button
          onClick={() => {
            onNavigate('/profile');
            soundService.play('CLICK');
          }}
          className="flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-lg border border-zoro-border bg-zoro-panel hover:border-zoro-cyan/40 transition-colors text-xs"
          title="Commander Profile"
          aria-label="Commander Profile"
        >
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-zoro-cyan/30 to-zoro-blue/30 border border-zoro-cyan/50 flex items-center justify-center text-zoro-cyan text-[10px] font-bold">
            C
          </div>
          <span className="hidden sm:inline font-bold text-[11px] text-zoro-text tracking-wider truncate max-w-[90px]">
            {operatorName}
          </span>
        </button>
      </div>
    </header>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Search,
  Bell,
  Settings as SettingsIcon,
  User,
  Clock,
  Activity,
  Menu,
  PanelRight,
  ShieldCheck,
  Target,
  Sparkles,
  Cpu,
  Radio,
  Eye,
  Database,
  Bot,
} from 'lucide-react';
import { RoutePath } from '../../types';
import { soundService } from '../../services/sound';
import { isSupabaseConfigured } from '../../services/supabase';

interface ZoroHeaderProps {
  currentPath: RoutePath;
  onNavigate: (path: RoutePath) => void;
  onOpenSearch: () => void;
  unreadNotificationsCount?: number;
  operatorName?: string;
  onToggleMobileNav?: () => void;
  onToggleSidebarCollapsed?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleIntelligencePanel?: () => void;
  isIntelligencePanelOpen?: boolean;
  onOpenSystemHealth?: () => void;
  onOpenDevConsole?: () => void;
  activeMissionTitle?: string;
}

export const ZoroHeader: React.FC<ZoroHeaderProps> = ({
  currentPath,
  onNavigate,
  onOpenSearch,
  unreadNotificationsCount = 0,
  operatorName = 'COMMANDER',
  onToggleMobileNav,
  onToggleSidebarCollapsed,
  isSidebarCollapsed = false,
  onToggleIntelligencePanel,
  isIntelligencePanelOpen = true,
  onOpenSystemHealth,
  onOpenDevConsole,
  activeMissionTitle,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const isSupabase = isSupabaseConfigured;

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

  return (
    <header className="h-14 border-b border-zoro-border bg-[#050A12]/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between shrink-0 font-mono z-30 select-none">
      {/* LEFT: Branding + System Status Pills (Section 6) */}
      <div className="flex items-center gap-3">
        {onToggleMobileNav && (
          <button
            onClick={() => {
              onToggleMobileNav();
              soundService.play('CLICK');
            }}
            className="md:hidden p-1.5 rounded-lg border border-zoro-border bg-zoro-panel text-zoro-textSecondary hover:text-zoro-cyan"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* ZORO 2.0 Identity */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-zoro-cyan/25 to-zoro-blue/20 border border-zoro-cyan/40 flex items-center justify-center shadow-[0_0_10px_rgba(25,217,255,0.2)]">
            <span className="text-zoro-cyan font-black text-xs">Z</span>
          </div>
          <button
            onClick={() => {
              onNavigate('/command');
              soundService.play('CLICK');
            }}
            className="flex items-center gap-1.5 text-left group"
          >
            <span className="font-black text-sm tracking-wider text-zoro-text group-hover:text-zoro-cyan transition-colors">
              ZORO
            </span>
            <span className="text-[10px] text-zoro-cyan font-bold tracking-wider px-1.5 py-0.2 rounded bg-zoro-cyan/15 border border-zoro-cyan/30">
              2.0
            </span>
          </button>
        </div>

        {/* System Status Pills (Section 6) */}
        <div className="hidden 2xl:flex items-center gap-1.5 pl-3 border-l border-zoro-border/60 text-[10px]">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-zoro-panel border border-zoro-border text-zoro-cyan font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-zoro-cyan animate-pulse" />
            CORE ONLINE
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-zoro-panel border border-zoro-border text-zoro-blue font-semibold">
            <Radio className="w-3 h-3 text-zoro-blue" />
            VOICE READY
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-zoro-panel border border-zoro-border text-zoro-cyan font-semibold">
            <Eye className="w-3 h-3 text-zoro-cyan" />
            VISION READY
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-zoro-panel border border-zoro-border text-zoro-violet font-semibold">
            <Database className="w-3 h-3 text-zoro-violet" />
            MEMORY CONNECTED
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-zoro-panel border border-zoro-border text-zoro-success font-semibold">
            <Bot className="w-3 h-3 text-zoro-success" />
            AGENTS READY
          </span>
        </div>

        {/* Mobile/Tablet Compact Status */}
        <div className="flex 2xl:hidden items-center gap-1 text-[10px] pl-2 border-l border-zoro-border/60">
          <span className="w-1.5 h-1.5 rounded-full bg-zoro-cyan animate-pulse" />
          <span className="text-zoro-cyan font-semibold hidden sm:inline">CORE ONLINE</span>
        </div>

        {/* Active mission context chip */}
        {activeMissionTitle && (
          <div
            onClick={() => onNavigate('/missions')}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-zoro-panelElevated border border-zoro-cyan/30 text-[10px] text-zoro-textSecondary hover:border-zoro-cyan cursor-pointer transition-colors"
          >
            <Target className="w-3 h-3 text-zoro-cyan" />
            <span className="text-zoro-textMuted">TARGET:</span>
            <span className="text-zoro-text font-bold truncate max-w-[140px]">
              {activeMissionTitle}
            </span>
          </div>
        )}
      </div>

      {/* CENTER: Date / Time */}
      <div className="hidden lg:flex items-center gap-3 text-xs text-zoro-textSecondary">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-zoro-cyan" />
          <span className="text-zoro-textMuted">{dateStr}</span>
          <span className="text-zoro-text font-bold tabular-nums tracking-wide">{timeStr}</span>
        </div>
      </div>

      {/* RIGHT: Search, Notifications, Diagnostics, Settings, Connection & Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Global Search trigger (Ctrl + K) */}
        <button
          onClick={() => {
            onOpenSearch();
            soundService.play('CLICK');
          }}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-zoro-border bg-zoro-panel text-zoro-textSecondary hover:text-zoro-text hover:border-zoro-cyan/40 transition-colors text-xs"
          title="Global Command Palette (Ctrl + K)"
          aria-label="Global Search"
        >
          <Search className="w-3.5 h-3.5 text-zoro-cyan" />
          <span className="hidden xl:inline text-[11px] text-zoro-textMuted">Command Zoro...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-zoro-bg border border-zoro-border text-[9px] text-zoro-textMuted">
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <button
          onClick={() => {
            onNavigate('/notifications');
            soundService.play('CLICK');
          }}
          className="relative p-2 rounded-xl border border-zoro-border bg-zoro-panel text-zoro-textSecondary hover:text-zoro-text hover:border-zoro-cyan/40 transition-colors"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
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
          className="p-2 rounded-xl border border-zoro-border bg-zoro-panel text-zoro-textSecondary hover:text-zoro-text hover:border-zoro-cyan/40 transition-colors"
          title="System Settings"
          aria-label="Settings"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>

        {/* Intelligence Panel Toggle (Desktop) */}
        {onToggleIntelligencePanel && (
          <button
            onClick={() => {
              onToggleIntelligencePanel();
              soundService.play('CLICK');
            }}
            className={`hidden xl:flex p-2 rounded-xl border transition-colors ${
              isIntelligencePanelOpen
                ? 'border-zoro-cyan/40 bg-zoro-cyan/10 text-zoro-cyan shadow-[0_0_10px_rgba(25,217,255,0.15)]'
                : 'border-zoro-border bg-zoro-panel text-zoro-textMuted hover:text-zoro-text'
            }`}
            title={isIntelligencePanelOpen ? 'Hide Intelligence Panel' : 'Show Intelligence Panel'}
            aria-label="Toggle Intelligence Panel"
          >
            <PanelRight className="w-4 h-4" />
          </button>
        )}

        {/* Connection status badge (Section 6 & 30) */}
        <div
          onClick={onOpenSystemHealth}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zoro-panel border border-zoro-border hover:border-zoro-cyan/40 cursor-pointer transition-colors text-[10px]"
          title="System Synapse Status"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isSupabase ? 'bg-zoro-cyan shadow-[0_0_6px_#19D9FF]' : 'bg-zoro-warning'
            }`}
          />
          <span className="text-zoro-textSecondary font-semibold">
            {isSupabase ? 'SUPABASE' : 'SANDBOX'}
          </span>
        </div>

        {/* Operator Profile */}
        <button
          onClick={() => {
            onNavigate('/profile');
            soundService.play('CLICK');
          }}
          className="flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-xl border border-zoro-border bg-zoro-panel hover:border-zoro-cyan/40 transition-colors text-xs"
          title="Operator Profile"
          aria-label="Operator Profile"
        >
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-zoro-cyan/30 to-zoro-blue/30 border border-zoro-cyan/50 flex items-center justify-center text-zoro-cyan text-[10px] font-bold">
            Z
          </div>
          <span className="hidden md:inline font-bold text-[11px] text-zoro-text tracking-wider truncate max-w-[90px]">
            {operatorName}
          </span>
        </button>
      </div>
    </header>
  );
};

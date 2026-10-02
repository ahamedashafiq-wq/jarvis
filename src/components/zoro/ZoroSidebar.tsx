import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Cpu,
  Bot,
  Target,
  CheckSquare,
  Database,
  Eye,
  Radio,
  Share2,
  BookOpen,
  Workflow,
  TrendingUp,
  Sliders,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  Shield,
  Activity,
  Mic,
  Plug,
  FolderGit2,
  Crosshair,
} from 'lucide-react';
import { RoutePath } from '../../types';
import { soundService } from '../../services/sound';
import { isSupabaseConfigured } from '../../services/supabase';
import { realtimeService } from '../../services/realtime';
import { speechService } from '../../services/speech';

interface ZoroSidebarProps {
  currentPath: RoutePath;
  onNavigate: (path: RoutePath) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapsed?: () => void;
  badges?: {
    missionsCount?: number;
    tasksCount?: number;
    agentActive?: boolean;
    memoriesCount?: number;
    automationsCount?: number;
  };
}

interface NavItem {
  id: string;
  label: string;
  path: RoutePath;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
}

export const ZoroSidebar: React.FC<ZoroSidebarProps> = ({
  currentPath,
  onNavigate,
  isMobileOpen = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapsed,
  badges = {},
}) => {
  const navItems: NavItem[] = [
    {
      id: 'cmd_center',
      label: 'COMMAND CENTER',
      path: '/command',
      icon: Terminal,
    },
    {
      id: 'zoro_core',
      label: 'ZORO CORE',
      path: '/intelligence',
      icon: Cpu,
    },
    {
      id: 'missions',
      label: 'MISSIONS',
      path: '/missions',
      icon: Target,
      badge: badges.missionsCount,
    },
    {
      id: 'tasks',
      label: 'TASKS',
      path: '/tasks',
      icon: CheckSquare,
      badge: badges.tasksCount,
    },
    {
      id: 'projects',
      label: 'PROJECTS',
      path: '/missions',
      icon: FolderGit2,
    },
    {
      id: 'agents',
      label: 'AGENTS',
      path: '/agents',
      icon: Bot,
      badge: badges.agentActive ? 'LIVE' : undefined,
    },
    {
      id: 'memory',
      label: 'MEMORY',
      path: '/memory',
      icon: Database,
      badge: badges.memoriesCount,
    },
    {
      id: 'vision',
      label: 'VISION',
      path: '/vision',
      icon: Eye,
    },
    {
      id: 'knowledge',
      label: 'KNOWLEDGE',
      path: '/knowledge',
      icon: BookOpen,
    },
    {
      id: 'workflows',
      label: 'WORKFLOWS',
      path: '/automation',
      icon: Workflow,
      badge: badges.automationsCount,
    },
    {
      id: 'focus',
      label: 'FOCUS',
      path: '/focus',
      icon: Crosshair,
    },
    {
      id: 'analytics',
      label: 'ANALYTICS',
      path: '/analytics',
      icon: TrendingUp,
    },
    {
      id: 'integrations',
      label: 'INTEGRATIONS',
      path: '/settings',
      icon: Plug,
    },
    {
      id: 'settings',
      label: 'SETTINGS',
      path: '/settings',
      icon: SettingsIcon,
    },
  ];

  const handleNavClick = (path: RoutePath) => {
    soundService.play('CLICK');
    onNavigate(path);
    if (onCloseMobile) onCloseMobile();
  };

  const isItemActive = (path: RoutePath) => {
    if (path === '/command' && (currentPath === '/command' || currentPath === '/commands' || currentPath === '/os' || currentPath === '/')) {
      return true;
    }
    return currentPath === path;
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 border-r border-zoro-border bg-[#08121F] flex flex-col transition-all duration-300 md:translate-x-0 md:static md:z-20 font-mono select-none ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      } ${isCollapsed ? 'w-20' : 'w-60'}`}
    >
      {/* Top Header Branding */}
      <div className="h-14 border-b border-zoro-border px-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-zoro-cyan/20 to-zoro-blue/20 border border-zoro-cyan/40 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(25,217,255,0.2)]">
            <span className="text-zoro-cyan font-black text-sm tracking-tighter">Z</span>
          </div>

          {!isCollapsed && (
            <div className="truncate leading-none">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs tracking-wider text-zoro-text">ZORO</span>
                <span className="text-[10px] text-zoro-cyan font-bold px-1 py-0.2 rounded bg-zoro-cyan/15 border border-zoro-cyan/30">
                  2.0
                </span>
              </div>
              <div className="text-[9px] text-zoro-textMuted tracking-wider mt-1 uppercase truncate">
                AI COMMAND OS
              </div>
            </div>
          )}
        </div>

        {/* Collapse Toggle Button */}
        {onToggleCollapsed && (
          <button
            onClick={() => {
              onToggleCollapsed();
              soundService.play('CLICK');
            }}
            className="hidden md:flex p-1 rounded-lg text-zoro-textMuted hover:text-zoro-cyan hover:bg-zoro-panelElevated transition-colors"
            title={isCollapsed ? 'Expand Sidebar (Ctrl + B)' : 'Collapse Sidebar (Ctrl + B)'}
            aria-label="Toggle Sidebar width"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden text-zoro-textSecondary hover:text-zoro-text text-sm p-1"
          >
            ✕
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5 text-xs scrollbar-none">
        {navItems.map((item) => {
          const active = isItemActive(item.path);
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.path)}
              className={`w-full group relative flex items-center ${
                isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
              } rounded-xl transition-all text-left ${
                active
                  ? 'bg-gradient-to-r from-zoro-cyan/15 to-zoro-blue/10 text-zoro-cyan font-bold border border-zoro-cyan/30 shadow-[0_0_15px_rgba(25,217,255,0.08)]'
                  : 'text-zoro-textSecondary hover:text-zoro-text hover:bg-zoro-panelElevated'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              {/* Cyan indicator on active */}
              {active && !isCollapsed && (
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-zoro-cyan shadow-[0_0_8px_#19D9FF]" />
              )}

              <div className="flex items-center gap-2.5 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    active ? 'text-zoro-cyan' : 'text-zoro-textMuted group-hover:text-zoro-text'
                  }`}
                />
                {!isCollapsed && (
                  <span className="truncate tracking-wide text-xs">{item.label}</span>
                )}
              </div>

              {!isCollapsed && item.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                    active
                      ? 'bg-zoro-cyan text-black'
                      : 'bg-zoro-panelElevated text-zoro-textSecondary border border-zoro-border'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Telemetry Status Box */}
      {!isCollapsed ? (
        <div className="p-3 border-t border-zoro-border bg-[#050A12]/80 text-[10px] space-y-1.5">
          <div className="flex items-center justify-between text-zoro-textMuted font-bold">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-zoro-cyan" />
              SYSTEM VITALS
            </span>
            <span className="flex items-center gap-1 text-zoro-success font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-zoro-success animate-pulse" />
              ONLINE
            </span>
          </div>

          <div className="space-y-1 text-zoro-textMuted">
            <div className="flex items-center justify-between">
              <span>SYNAPSE</span>
              <span className="text-zoro-text font-semibold">
                {isSupabaseConfigured ? 'SUPABASE' : 'SANDBOX'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>VOICE ENGINE</span>
              <span className="text-zoro-cyan font-semibold">
                {speechService.isRecognitionSupported() ? 'READY' : 'TEXT ONLY'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-2 border-t border-zoro-border flex justify-center text-zoro-cyan">
          <Activity className="w-4 h-4 animate-pulse" />
        </div>
      )}
    </aside>
  );
};

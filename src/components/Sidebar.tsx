import React from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Mic,
  CheckSquare,
  Database,
  Terminal,
  BarChart3,
  User,
  Settings as SettingsIcon,
  Timer,
  Activity,
  Target,
  Cpu,
  Users,
  Zap,
  Eye,
  Compass,
  TrendingUp,
  Command,
  Bell,
  Radio,
  BookOpen,
  Monitor,
} from 'lucide-react';
import { RoutePath } from '../types';

interface SidebarProps {
  currentPath: RoutePath;
  onNavigate: (path: RoutePath) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate }) => {
  return (
    <aside className="w-64 border-r border-[#16281F] bg-[#0A100D] flex flex-col justify-between py-3 select-none shrink-0 hidden md:flex font-mono text-xs overflow-y-auto">
      <div className="space-y-4 px-3">
        {/* Primary Control Surface: Command Center & OS Workspace */}
        <div className="space-y-1">
          <button
            onClick={() => onNavigate('/command')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
              currentPath === '/command' || currentPath === '/commands'
                ? 'bg-[#121C17] border border-[#00D084] text-[#19F59A] shadow-[0_0_15px_rgba(0,208,132,0.2)] font-bold'
                : 'text-[#F5F7F6] hover:bg-[#121C17]/60 border border-[#16281F]/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Command className="w-4 h-4 text-[#19F59A]" />
              <span className="tracking-wide">NEURAL COMMAND</span>
            </div>
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#00D084]/20 text-[#19F59A]">
              PRIMARY
            </span>
          </button>

          <button
            onClick={() => onNavigate('/os')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
              currentPath === '/os' || currentPath === '/workspace'
                ? 'bg-[#121C17] border border-[#38E1FF] text-[#38E1FF] shadow-[0_0_15px_rgba(56,225,255,0.2)] font-bold'
                : 'text-[#8B9992] hover:text-[#38E1FF] hover:bg-[#121C17]/60 border border-[#16281F]/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Monitor className="w-3.5 h-3.5 text-[#38E1FF]" />
              <span className="tracking-wide">ZORO OS 2.0</span>
            </div>
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#38E1FF]/20 text-[#38E1FF]">
              WORKSPACE
            </span>
          </button>

          <button
            onClick={() => onNavigate('/dashboard')}
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] transition-colors ${
              currentPath === '/dashboard'
                ? 'bg-[#121C17] text-[#19F59A] font-bold'
                : 'text-[#8B9992] hover:text-[#F5F7F6]'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>COMMAND DECK</span>
          </button>
        </div>

        {/* ---------------------------------------------------- */}
        {/* BLADE 01: KNOWLEDGE                                  */}
        {/* ---------------------------------------------------- */}
        <div className="space-y-1">
          <div className="px-3 text-[9px] font-bold text-[#19F59A] flex items-center justify-between tracking-wider uppercase">
            <span className="flex items-center gap-1">
              <span className="w-1 h-3 bg-[#00D084] -skew-x-12 inline-block rounded-xs" />
              BLADE 01: KNOWLEDGE
            </span>
            <span className="text-[8px] text-[#8B9992]">ENMA</span>
          </div>

          {[
            { label: 'VISION CORE', path: '/vision' as RoutePath, icon: <Eye className="w-3.5 h-3.5 text-[#19F59A]" />, badge: 'MULTIMODAL' },
            { label: 'INTELLIGENCE', path: '/intelligence' as RoutePath, icon: <TrendingUp className="w-3.5 h-3.5 text-[#38E1FF]" />, badge: 'PREDICTIVE' },
            { label: 'ANALYTICS', path: '/analytics' as RoutePath, icon: <BarChart3 className="w-3.5 h-3.5" /> },
            { label: 'AI CHAT', path: '/chat' as RoutePath, icon: <MessageSquare className="w-3.5 h-3.5" /> },
          ].map((item) => {
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] transition-colors ${
                  isActive
                    ? 'bg-[#121C17] border border-[#00D084]/40 text-[#19F59A] font-bold'
                    : 'text-[#8B9992] hover:text-[#F5F7F6] hover:bg-[#121C17]/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[7px] font-bold px-1 rounded bg-[#00D084]/15 text-[#19F59A]">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ---------------------------------------------------- */}
        {/* BLADE 02: ACTION                                     */}
        {/* ---------------------------------------------------- */}
        <div className="space-y-1">
          <div className="px-3 text-[9px] font-bold text-[#38E1FF] flex items-center justify-between tracking-wider uppercase">
            <span className="flex items-center gap-1">
              <span className="w-1 h-3 bg-[#38E1FF] -skew-x-12 inline-block rounded-xs" />
              BLADE 02: ACTION
            </span>
            <span className="text-[8px] text-[#8B9992]">WADO</span>
          </div>

          {[
            { label: 'MISSIONS', path: '/missions' as RoutePath, icon: <Target className="w-3.5 h-3.5 text-[#38E1FF]" />, badge: 'OS CORE' },
            { label: 'ACTION QUEUE', path: '/tasks' as RoutePath, icon: <CheckSquare className="w-3.5 h-3.5 text-[#38E1FF]" /> },
            { label: 'AGENT BRAIN', path: '/agents' as RoutePath, icon: <Cpu className="w-3.5 h-3.5 text-[#19F59A]" />, badge: 'ORCHESTRATE' },
            { label: 'AGENT COUNCIL', path: '/agents/council' as RoutePath, icon: <Users className="w-3.5 h-3.5" /> },
            { label: 'AUTOMATIONS', path: '/automation' as RoutePath, icon: <Zap className="w-3.5 h-3.5 text-[#FFB000]" />, badge: 'AUTONOMOUS' },
          ].map((item) => {
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] transition-colors ${
                  isActive
                    ? 'bg-[#121C17] border border-[#38E1FF]/40 text-[#38E1FF] font-bold'
                    : 'text-[#8B9992] hover:text-[#F5F7F6] hover:bg-[#121C17]/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[7px] font-bold px-1 rounded bg-[#38E1FF]/15 text-[#38E1FF]">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ---------------------------------------------------- */}
        {/* BLADE 03: MEMORY                                     */}
        {/* ---------------------------------------------------- */}
        <div className="space-y-1">
          <div className="px-3 text-[9px] font-bold text-[#FFB000] flex items-center justify-between tracking-wider uppercase">
            <span className="flex items-center gap-1">
              <span className="w-1 h-3 bg-[#FFB000] -skew-x-12 inline-block rounded-xs" />
              BLADE 03: MEMORY
            </span>
            <span className="text-[8px] text-[#8B9992]">KITETSU</span>
          </div>

          {[
            { label: 'NEURAL MEMORY', path: '/memory' as RoutePath, icon: <Database className="w-3.5 h-3.5 text-[#FFB000]" /> },
            { label: 'KNOWLEDGE GRAPH', path: '/memory/graph' as RoutePath, icon: <Compass className="w-3.5 h-3.5 text-[#FFB000]" />, badge: '2D MAP' },
            { label: 'DECISIONS & TIME', path: '/memory/decisions' as RoutePath, icon: <BookOpen className="w-3.5 h-3.5 text-[#FFB000]" /> },
          ].map((item) => {
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] transition-colors ${
                  isActive
                    ? 'bg-[#121C17] border border-[#FFB000]/40 text-[#FFB000] font-bold'
                    : 'text-[#8B9992] hover:text-[#F5F7F6] hover:bg-[#121C17]/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[7px] font-bold px-1 rounded bg-[#FFB000]/15 text-[#FFB000]">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ---------------------------------------------------- */}
        {/* OPERATIONAL SUBSYSTEMS                               */}
        {/* ---------------------------------------------------- */}
        <div className="space-y-1 pt-1 border-t border-[#16281F]/40">
          {[
            { label: 'NOTIFICATIONS', path: '/notifications' as RoutePath, icon: <Bell className="w-3.5 h-3.5 text-[#19F59A]" /> },
            { label: 'FOCUS PROTOCOL', path: '/focus' as RoutePath, icon: <Timer className="w-3.5 h-3.5 text-[#FF3B30]" /> },
            { label: 'VOICE HUD', path: '/voice' as RoutePath, icon: <Mic className="w-3.5 h-3.5 text-[#38E1FF]" /> },
            { label: 'TERMINAL', path: '/commands' as RoutePath, icon: <Terminal className="w-3.5 h-3.5" /> },
            { label: 'SYSTEM LOGS', path: '/logs' as RoutePath, icon: <Activity className="w-3.5 h-3.5" /> },
            { label: 'OPERATOR', path: '/profile' as RoutePath, icon: <User className="w-3.5 h-3.5" /> },
            { label: 'SETTINGS', path: '/settings' as RoutePath, icon: <SettingsIcon className="w-3.5 h-3.5" /> },
          ].map((item) => {
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] transition-colors ${
                  isActive
                    ? 'bg-[#121C17] text-[#F5F7F6] font-bold'
                    : 'text-[#8B9992] hover:text-[#F5F7F6] hover:bg-[#121C17]/40'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Status Card */}
      <div className="px-4 pt-3 border-t border-[#16281F] mx-3 mt-3">
        <div className="p-2.5 rounded-xl bg-[#050706] border border-[#16281F] text-[10px] space-y-1">
          <div className="flex items-center justify-between text-[#8B9992]">
            <span>COMMAND MATRIX:</span>
            <span className="text-[#19F59A] font-bold">SYNCHRONIZED</span>
          </div>
          <div className="flex items-center justify-between text-[#8B9992]">
            <span>PALETTE SHORTCUT:</span>
            <span className="text-[#38E1FF]">Ctrl+K</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

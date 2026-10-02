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
} from 'lucide-react';
import { RoutePath } from '../types';

interface SidebarProps {
  currentPath: RoutePath;
  onNavigate: (path: RoutePath) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate }) => {
  const navItems: { label: string; path: RoutePath; icon: React.ReactNode; badge?: string }[] = [
    { label: 'DASHBOARD', path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'AI CHAT', path: '/chat', icon: <MessageSquare className="w-4 h-4" />, badge: 'BLADE 01' },
    { label: 'AGENT BRAIN', path: '/agents', icon: <Cpu className="w-4 h-4" />, badge: 'ORCHESTRATOR' },
    { label: 'AGENT COUNCIL', path: '/agents/council', icon: <Users className="w-4 h-4" /> },
    { label: 'MISSIONS', path: '/missions', icon: <Target className="w-4 h-4" />, badge: 'OS CORE' },
    { label: 'ACTION QUEUE', path: '/tasks', icon: <CheckSquare className="w-4 h-4" />, badge: 'BLADE 02' },
    { label: 'MEMORY BANK', path: '/memory', icon: <Database className="w-4 h-4" />, badge: 'BLADE 03' },
    { label: 'FOCUS PROTOCOL', path: '/focus', icon: <Timer className="w-4 h-4" /> },
    { label: 'VOICE HUD', path: '/voice', icon: <Mic className="w-4 h-4" />, badge: 'AUDIO AI' },
    { label: 'TERMINAL', path: '/commands', icon: <Terminal className="w-4 h-4" /> },
    { label: 'ANALYTICS', path: '/analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { label: 'SYSTEM LOGS', path: '/logs', icon: <Activity className="w-4 h-4" /> },
    { label: 'OPERATOR', path: '/profile', icon: <User className="w-4 h-4" /> },
    { label: 'SETTINGS', path: '/settings', icon: <SettingsIcon className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-60 border-r border-[#16281F] bg-[#0A100D] flex flex-col justify-between py-4 select-none shrink-0 hidden md:flex">
      <div className="space-y-1 px-3">
        <div className="px-3 py-1.5 text-[9px] font-mono text-[#8B9992] tracking-wider font-semibold">
          SUBSYSTEM ROUTING
        </div>

        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-mono transition-all ${
                isActive
                  ? 'bg-[#121C17] border border-[#00D084] text-[#19F59A] shadow-[0_0_10px_rgba(0,208,132,0.15)] font-bold'
                  : 'text-[#8B9992] hover:text-[#F5F7F6] hover:bg-[#121C17]/50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-[#19F59A]' : 'text-[#8B9992]'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#00D084]/20 text-[#19F59A]">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Status Card */}
      <div className="px-4 pt-3 border-t border-[#16281F] mx-3">
        <div className="p-2.5 rounded bg-[#050706] border border-[#16281F] text-[10px] font-mono space-y-1">
          <div className="flex items-center justify-between text-[#8B9992]">
            <span>WARRIOR STANCE:</span>
            <span className="text-[#19F59A] font-bold">READY</span>
          </div>
          <div className="flex items-center justify-between text-[#8B9992]">
            <span>DISCIPLINE:</span>
            <span className="text-[#F5F7F6]">100%</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

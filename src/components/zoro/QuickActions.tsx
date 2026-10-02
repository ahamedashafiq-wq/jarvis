import React from 'react';
import {
  PlusCircle,
  Target,
  MessageSquare,
  Clock,
  Camera,
  Search,
  Bot,
  Terminal,
  Zap,
} from 'lucide-react';
import { RoutePath } from '../../types';
import { soundService } from '../../services/sound';

interface QuickActionsProps {
  onNavigate: (path: RoutePath) => void;
  onOpenDevMode: () => void;
  onOpenVoice: () => void;
  onExecuteCommand: (cmd: string) => void;
  className?: string;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onNavigate,
  onOpenDevMode,
  onOpenVoice,
  onExecuteCommand,
  className = '',
}) => {
  const actions = [
    {
      id: 'new_task',
      label: 'NEW TASK',
      desc: 'Add to queue',
      icon: PlusCircle,
      action: () => onNavigate('/tasks'),
      accent: 'hover:border-zoro-cyan/50 hover:bg-zoro-cyan/10 text-zoro-cyan',
    },
    {
      id: 'new_mission',
      label: 'NEW MISSION',
      desc: 'Initialize goal',
      icon: Target,
      action: () => onNavigate('/missions'),
      accent: 'hover:border-zoro-blue/50 hover:bg-zoro-blue/10 text-zoro-blue',
    },
    {
      id: 'ask_zoro',
      label: 'ASK ZORO',
      desc: 'Voice or text',
      icon: MessageSquare,
      action: () => onOpenVoice(),
      accent: 'hover:border-zoro-cyan/50 hover:bg-zoro-cyan/10 text-zoro-cyan',
    },
    {
      id: 'start_focus',
      label: 'START FOCUS',
      desc: 'Pomodoro timer',
      icon: Clock,
      action: () => onNavigate('/focus'),
      accent: 'hover:border-zoro-warning/50 hover:bg-zoro-warning/10 text-zoro-warning',
    },
    {
      id: 'analyze_image',
      label: 'ANALYZE IMAGE',
      desc: 'Multimodal vision',
      icon: Camera,
      action: () => onNavigate('/vision'),
      accent: 'hover:border-zoro-cyan/50 hover:bg-zoro-cyan/10 text-zoro-cyan',
    },
    {
      id: 'search_memory',
      label: 'SEARCH MEMORY',
      desc: 'Neural graph nodes',
      icon: Search,
      action: () => onNavigate('/memory'),
      accent: 'hover:border-zoro-violet/50 hover:bg-zoro-violet/10 text-zoro-violet',
    },
    {
      id: 'open_agents',
      label: 'OPEN AGENTS',
      desc: 'Multi-agent council',
      icon: Bot,
      action: () => onNavigate('/agents'),
      accent: 'hover:border-zoro-success/50 hover:bg-zoro-success/10 text-zoro-success',
    },
    {
      id: 'dev_mode',
      label: 'DEV MODE',
      desc: 'Diagnostics & logs',
      icon: Terminal,
      action: () => onOpenDevMode(),
      accent: 'hover:border-zoro-cyan/50 hover:bg-zoro-cyan/10 text-zoro-cyan',
    },
  ];

  return (
    <div
      className={`rounded-2xl border border-zoro-border bg-zoro-panel p-5 font-mono select-none space-y-4 shadow-xl ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zoro-border pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-zoro-cyan shadow-[0_0_8px_#19D9FF] animate-pulse" />
          <h2 className="text-xs font-bold text-zoro-text tracking-wider uppercase">
            QUICK ACTIONS
          </h2>
        </div>
        <span className="text-[10px] text-zoro-textMuted uppercase font-semibold">
          DIRECT LAUNCH
        </span>
      </div>

      {/* Grid of 8 Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              onClick={() => {
                soundService.play('CLICK');
                act.action();
              }}
              className={`p-3 rounded-xl border border-zoro-border bg-zoro-panelElevated text-left transition-all group flex flex-col justify-between h-24 ${act.accent} focus:outline-none focus:ring-1 focus:ring-zoro-cyan`}
            >
              <div className="flex items-center justify-between w-full">
                <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span className="text-[10px] text-zoro-muted group-hover:text-zoro-cyan transition-colors">
                  ›
                </span>
              </div>

              <div>
                <div className="text-[11px] font-bold text-zoro-text tracking-wider group-hover:text-zoro-text transition-colors">
                  {act.label}
                </div>
                <div className="text-[9px] text-zoro-textMuted truncate">
                  {act.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

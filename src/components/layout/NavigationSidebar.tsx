import React from 'react';
import {
  Terminal,
  Target,
  CheckSquare,
  Cpu,
  MessageSquare,
  TrendingUp,
  Eye,
  Camera,
  Layers,
  Database,
  Share2,
  GitBranch,
  Zap,
  Clock,
  Workflow,
  Activity,
  Settings as SettingsIcon,
  Code2,
  ChevronRight,
} from 'lucide-react';
import { RoutePath } from '../../types';
import { soundService } from '../../services/sound';

interface NavigationSidebarProps {
  currentPath: RoutePath;
  onNavigate: (path: RoutePath) => void;
  onOpenSystemHealth: () => void;
  onOpenDevConsole: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
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
  icon: React.ComponentType<{ className?: string }>;
  path?: RoutePath;
  action?: 'HEALTH' | 'DEV_CONSOLE';
  badge?: string | number;
  status?: 'ONLINE' | 'ACTIVE' | 'READY';
}

interface NavGroup {
  groupNumber: string;
  groupName: string;
  items: NavItem[];
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  currentPath,
  onNavigate,
  onOpenSystemHealth,
  onOpenDevConsole,
  isMobileOpen = false,
  onCloseMobile,
  badges = {},
}) => {
  const groups: NavGroup[] = [
    {
      groupNumber: '01',
      groupName: 'COMMAND',
      items: [
        {
          id: 'command_center',
          label: 'Command Center',
          icon: Terminal,
          path: '/command',
        },
        {
          id: 'mission_control',
          label: 'Mission Control',
          icon: Target,
          path: '/missions',
          badge: badges.missionsCount ? String(badges.missionsCount) : undefined,
        },
        {
          id: 'action_queue',
          label: 'Action Queue',
          icon: CheckSquare,
          path: '/tasks',
          badge: badges.tasksCount ? String(badges.tasksCount) : undefined,
        },
      ],
    },
    {
      groupNumber: '02',
      groupName: 'INTELLIGENCE',
      items: [
        {
          id: 'agent_brain',
          label: 'Agent Brain',
          icon: Cpu,
          path: '/agents',
          status: badges.agentActive ? 'ACTIVE' : 'READY',
        },
        {
          id: 'ai_chat',
          label: 'AI Chat',
          icon: MessageSquare,
          path: '/chat',
        },
        {
          id: 'analytics',
          label: 'Analytics',
          icon: TrendingUp,
          path: '/analytics',
        },
      ],
    },
    {
      groupNumber: '03',
      groupName: 'VISION',
      items: [
        {
          id: 'vision_core',
          label: 'Vision Core',
          icon: Eye,
          path: '/vision',
        },
        {
          id: 'image_analysis',
          label: 'Image Analysis',
          icon: Camera,
          path: '/vision',
        },
        {
          id: 'multimodal_chat',
          label: 'Multimodal Chat',
          icon: Layers,
          path: '/chat',
        },
      ],
    },
    {
      groupNumber: '04',
      groupName: 'MEMORY',
      items: [
        {
          id: 'memory_bank',
          label: 'Memory Bank',
          icon: Database,
          path: '/memory',
          badge: badges.memoriesCount ? String(badges.memoriesCount) : undefined,
        },
        {
          id: 'knowledge_graph',
          label: 'Knowledge Graph',
          icon: Share2,
          path: '/memory/graph',
        },
        {
          id: 'decision_log',
          label: 'Decision Log',
          icon: GitBranch,
          path: '/memory/decisions',
        },
      ],
    },
    {
      groupNumber: '05',
      groupName: 'AUTOMATION',
      items: [
        {
          id: 'automation_lab',
          label: 'Automation Lab',
          icon: Zap,
          path: '/automation',
          badge: badges.automationsCount ? String(badges.automationsCount) : undefined,
        },
        {
          id: 'schedules',
          label: 'Schedules',
          icon: Clock,
          path: '/automation',
        },
        {
          id: 'workflows',
          label: 'Workflows',
          icon: Workflow,
          path: '/automation',
        },
      ],
    },
    {
      groupNumber: '06',
      groupName: 'SYSTEM',
      items: [
        {
          id: 'system_health',
          label: 'System Health',
          icon: Activity,
          action: 'HEALTH',
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: SettingsIcon,
          path: '/settings',
        },
        {
          id: 'dev_console',
          label: 'Developer Console',
          icon: Code2,
          action: 'DEV_CONSOLE',
        },
      ],
    },
  ];

  const handleItemClick = (item: NavItem) => {
    soundService.play('CLICK');
    if (item.action === 'HEALTH') {
      onOpenSystemHealth();
    } else if (item.action === 'DEV_CONSOLE') {
      onOpenDevConsole();
    } else if (item.path) {
      onNavigate(item.path);
    }
    if (onCloseMobile) onCloseMobile();
  };

  const isItemActive = (item: NavItem) => {
    if (item.path === '/command' && (currentPath === '/command' || currentPath === '/commands' || currentPath === '/os' || currentPath === '/')) {
      return true;
    }
    if (item.path && item.path !== '/' && currentPath === item.path) {
      return true;
    }
    return false;
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-jarvis-border bg-jarvis-surface flex flex-col transition-transform duration-300 md:translate-x-0 md:static md:z-20 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Sidebar Header on Mobile */}
      <div className="flex md:hidden items-center justify-between p-4 border-b border-jarvis-border">
        <div className="flex items-center gap-2 font-mono">
          <span className="text-jarvis-primary text-xs font-bold">JARVIS OS</span>
          <span className="text-[10px] text-jarvis-textMuted">2.0 NAVIGATION</span>
        </div>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="text-jarvis-textSecondary hover:text-jarvis-text text-sm font-mono px-2 py-1"
          >
            ✕
          </button>
        )}
      </div>

      {/* Navigation Groups List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 font-mono text-xs">
        {groups.map((group) => (
          <div key={group.groupNumber} className="space-y-1">
            <div className="px-2.5 py-1 text-[10px] font-semibold text-jarvis-textMuted tracking-wider flex items-center justify-between">
              <span>
                {group.groupNumber} — {group.groupName}
              </span>
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isItemActive(item);
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`w-full group relative flex items-center justify-between px-2.5 py-2 rounded transition-all text-left ${
                      active
                        ? 'bg-jarvis-primary/10 text-jarvis-primary font-medium shadow-[inset_0_0_12px_rgba(0,245,160,0.06)]'
                        : 'text-jarvis-textSecondary hover:text-jarvis-text hover:bg-jarvis-surfaceElevated'
                    }`}
                  >
                    {/* Left neon indicator for active state */}
                    {active && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-jarvis-primary shadow-[0_0_8px_#00F5A0]" />
                    )}

                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          active
                            ? 'text-jarvis-primary'
                            : 'text-jarvis-textMuted group-hover:text-jarvis-text'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {item.badge && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-jarvis-surfaceElevated border border-jarvis-border text-jarvis-textSecondary font-mono">
                          {item.badge}
                        </span>
                      )}
                      {item.status && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.status === 'ACTIVE'
                              ? 'bg-jarvis-primary animate-pulse'
                              : 'bg-jarvis-secondary'
                          }`}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar Footer with Three Blades Status */}
      <div className="p-3 border-t border-jarvis-border/60 bg-jarvis-bg/50 font-mono text-[10px] space-y-1.5">
        <div className="text-jarvis-textMuted tracking-wider font-semibold">THREE BLADES MATRIX</div>
        <div className="grid grid-cols-3 gap-1.5 text-center">
          <div className="p-1 rounded bg-jarvis-surface border border-jarvis-border/60 text-jarvis-primary">
            <div className="text-[8px] text-jarvis-textMuted">01 ENMA</div>
            <div className="font-bold">INTELLECT</div>
          </div>
          <div className="p-1 rounded bg-jarvis-surface border border-jarvis-border/60 text-jarvis-secondary">
            <div className="text-[8px] text-jarvis-textMuted">02 WADO</div>
            <div className="font-bold">ACTION</div>
          </div>
          <div className="p-1 rounded bg-jarvis-surface border border-jarvis-border/60 text-jarvis-accent">
            <div className="text-[8px] text-jarvis-textMuted">03 KITETSU</div>
            <div className="font-bold">MEMORY</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

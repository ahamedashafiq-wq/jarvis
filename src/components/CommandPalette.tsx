import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Search,
  PlusCircle,
  BarChart3,
  Play,
  Database,
  Target,
  Cpu,
  Zap,
  Eye,
  TrendingUp,
  X,
  ArrowRight,
  Sparkles,
  Command,
  LayoutDashboard,
  CheckSquare,
  Timer,
  Bell,
  Sliders,
  User,
  Monitor,
} from 'lucide-react';
import { RoutePath } from '../types';

export interface CommandPaletteAction {
  id: string;
  section:
    | 'NAVIGATE'
    | 'CREATE'
    | 'SEARCH'
    | 'ANALYZE'
    | 'RUN'
    | 'MEMORY'
    | 'MISSIONS'
    | 'AGENTS'
    | 'AUTOMATIONS'
    | 'VISION'
    | 'INTELLIGENCE';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  route?: RoutePath;
  onExecute?: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: RoutePath) => void;
  onRunCommand?: (command: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onRunCommand,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const actions: CommandPaletteAction[] = [
    // 1. NAVIGATE
    {
      id: 'nav_command',
      section: 'NAVIGATE',
      title: 'Neural Command Surface',
      subtitle: 'Primary JARVIS operational deck',
      icon: <Command className="w-4 h-4 text-[#19F59A]" />,
      route: '/command',
      keywords: ['command', 'home', 'control', 'terminal'],
    },
    {
      id: 'nav_os',
      section: 'NAVIGATE',
      title: 'JARVIS OS 1.0 Workspace',
      subtitle: 'Multi-window AI operating environment',
      icon: <Monitor className="w-4 h-4 text-[#38E1FF]" />,
      route: '/os',
      keywords: ['os', 'workspace', 'desktop', 'windows', 'multi', 'environment'],
    },
    {
      id: 'nav_dashboard',
      section: 'NAVIGATE',
      title: 'Command Deck (Dashboard)',
      subtitle: 'Overview of all three blades',
      icon: <LayoutDashboard className="w-4 h-4 text-[#19F59A]" />,
      route: '/dashboard',
      keywords: ['dashboard', 'deck', 'home'],
    },
    {
      id: 'nav_missions',
      section: 'NAVIGATE',
      title: 'Mission Control OS',
      subtitle: 'Blade 02 Strategic Operations',
      icon: <Target className="w-4 h-4 text-[#38E1FF]" />,
      route: '/missions',
      keywords: ['missions', 'projects', 'goals'],
    },
    {
      id: 'nav_tasks',
      section: 'NAVIGATE',
      title: 'Action Queue (Tasks)',
      subtitle: 'Discipline directives and todos',
      icon: <CheckSquare className="w-4 h-4 text-[#38E1FF]" />,
      route: '/tasks',
      keywords: ['tasks', 'todo', 'queue'],
    },
    {
      id: 'nav_memory',
      section: 'NAVIGATE',
      title: 'Neural Memory Bank',
      subtitle: 'Blade 03 Persistent Knowledge',
      icon: <Database className="w-4 h-4 text-[#FFB000]" />,
      route: '/memory',
      keywords: ['memory', 'nodes', 'store'],
    },
    {
      id: 'nav_graph',
      section: 'NAVIGATE',
      title: 'Knowledge Graph 2D',
      subtitle: 'Neural entity relationships & graph',
      icon: <Compass className="w-4 h-4 text-[#FFB000]" />,
      route: '/memory/graph',
      keywords: ['graph', 'entities', 'network'],
    },
    {
      id: 'nav_vision',
      section: 'NAVIGATE',
      title: 'Vision Core Inspector',
      subtitle: 'Multimodal screenshot & diagram analysis',
      icon: <Eye className="w-4 h-4 text-[#19F59A]" />,
      route: '/vision',
      keywords: ['vision', 'image', 'screenshot', 'inspect'],
    },
    {
      id: 'nav_intelligence',
      section: 'NAVIGATE',
      title: 'Predictive Intelligence Core',
      subtitle: 'Deadlines, bottlenecks, and signal analysis',
      icon: <TrendingUp className="w-4 h-4 text-[#38E1FF]" />,
      route: '/intelligence',
      keywords: ['intelligence', 'predictive', 'trends', 'health'],
    },
    {
      id: 'nav_agents',
      section: 'NAVIGATE',
      title: 'Agent Orchestration Deck',
      subtitle: 'Autonomous agents and execution runs',
      icon: <Cpu className="w-4 h-4 text-[#19F59A]" />,
      route: '/agents',
      keywords: ['agent', 'brain', 'orchestrator'],
    },
    {
      id: 'nav_council',
      section: 'NAVIGATE',
      title: 'Agent Council',
      subtitle: 'Collaborative multi-agent consensus',
      icon: <Cpu className="w-4 h-4 text-[#38E1FF]" />,
      route: '/agents/council',
      keywords: ['council', 'deliberation', 'consensus'],
    },
    {
      id: 'nav_automation',
      section: 'NAVIGATE',
      title: 'Automation Lab',
      subtitle: 'Autonomous workflows & scheduled triggers',
      icon: <Zap className="w-4 h-4 text-[#FFB000]" />,
      route: '/automation',
      keywords: ['automation', 'triggers', 'schedules', 'lab'],
    },
    {
      id: 'nav_notifications',
      section: 'NAVIGATE',
      title: 'Notification Center',
      subtitle: 'Aggregated alerts and operational events',
      icon: <Bell className="w-4 h-4 text-[#19F59A]" />,
      route: '/notifications',
      keywords: ['notifications', 'alerts', 'inbox'],
    },
    {
      id: 'nav_focus',
      section: 'NAVIGATE',
      title: 'Santoryu Focus Protocol',
      subtitle: 'Combat concentration timer',
      icon: <Timer className="w-4 h-4 text-[#FF3B30]" />,
      route: '/focus',
      keywords: ['focus', 'timer', 'pomodoro'],
    },

    // 2. CREATE
    {
      id: 'create_mission',
      section: 'CREATE',
      title: 'New Mission',
      subtitle: 'Synthesize structured tactical mission',
      icon: <PlusCircle className="w-4 h-4 text-[#38E1FF]" />,
      onExecute: () => {
        onRunCommand?.('Plan a mission for my project');
        onNavigate('/command');
      },
      keywords: ['new mission', 'create mission', 'add mission'],
    },
    {
      id: 'create_task',
      section: 'CREATE',
      title: 'New Directive Task',
      subtitle: 'Add tactical directive to Action Queue',
      icon: <PlusCircle className="w-4 h-4 text-[#19F59A]" />,
      onExecute: () => {
        onRunCommand?.('Create a task called ');
        onNavigate('/command');
      },
      keywords: ['new task', 'add task', 'create todo'],
    },
    {
      id: 'create_automation',
      section: 'CREATE',
      title: 'New Automation Workflow',
      subtitle: 'Deploy scheduled trigger or event rule',
      icon: <PlusCircle className="w-4 h-4 text-[#FFB000]" />,
      onExecute: () => {
        onRunCommand?.('Every morning at 8, give me a briefing');
        onNavigate('/command');
      },
      keywords: ['new automation', 'schedule', 'workflow'],
    },

    // 3. SEARCH
    {
      id: 'search_memories',
      section: 'SEARCH',
      title: 'Search Persistent Memories',
      subtitle: 'Query factual nodes in Blade 03',
      icon: <Search className="w-4 h-4 text-[#FFB000]" />,
      onExecute: () => {
        onRunCommand?.('What do you remember about my preferences?');
        onNavigate('/command');
      },
      keywords: ['search memory', 'find memory', 'recall'],
    },
    {
      id: 'search_knowledge',
      section: 'SEARCH',
      title: 'Search Knowledge Graph',
      subtitle: 'Lookup entities, decisions, and connections',
      icon: <Search className="w-4 h-4 text-[#38E1FF]" />,
      route: '/memory/graph',
      keywords: ['search graph', 'entities', 'graph query'],
    },

    // 4. ANALYZE
    {
      id: 'analyze_image',
      section: 'ANALYZE',
      title: 'Analyze Screenshot / Image',
      subtitle: 'Inspect UI, debug errors, or extract code',
      icon: <Eye className="w-4 h-4 text-[#19F59A]" />,
      route: '/vision',
      keywords: ['analyze image', 'screenshot', 'debug ui'],
    },
    {
      id: 'analyze_trend',
      section: 'ANALYZE',
      title: 'Productivity Trend Telemetry',
      subtitle: 'Evaluate 7-day empirical trend sufficiency',
      icon: <TrendingUp className="w-4 h-4 text-[#38E1FF]" />,
      onExecute: () => {
        onRunCommand?.("What's my weekly productivity trend?");
        onNavigate('/command');
      },
      keywords: ['trend', 'productivity', 'metrics', 'sufficiency'],
    },
    {
      id: 'analyze_attention',
      section: 'ANALYZE',
      title: 'Attention & Bottleneck Scan',
      subtitle: 'Scan for approaching deadlines & inactive ops',
      icon: <TrendingUp className="w-4 h-4 text-[#FFB000]" />,
      onExecute: () => {
        onRunCommand?.('What needs my attention today?');
        onNavigate('/command');
      },
      keywords: ['attention', 'bottleneck', 'deadlines', 'inactive'],
    },

    // 5. RUN
    {
      id: 'run_briefing',
      section: 'RUN',
      title: 'Run Daily Briefing',
      subtitle: 'Aggregate active missions, tasks, and deadlines',
      icon: <Play className="w-4 h-4 text-[#19F59A]" />,
      onExecute: () => {
        onRunCommand?.('Run my daily briefing');
        onNavigate('/command');
      },
      keywords: ['run briefing', 'daily briefing', 'morning report'],
    },
    {
      id: 'run_focus',
      section: 'RUN',
      title: 'Start 25-Minute Focus Session',
      subtitle: 'Engage Santoryu combat immersion',
      icon: <Play className="w-4 h-4 text-[#FF3B30]" />,
      route: '/focus',
      keywords: ['start focus', 'focus 25', 'combat session'],
    },

    // 6. MISSIONS
    {
      id: 'msn_next_move',
      section: 'MISSIONS',
      title: "Query Next Move Engine",
      subtitle: 'Calculate optimal next strategic action',
      icon: <Target className="w-4 h-4 text-[#19F59A]" />,
      onExecute: () => {
        onRunCommand?.("What's my next move?");
        onNavigate('/command');
      },
      keywords: ['next move', 'what to do next', 'recommendation'],
    },
    {
      id: 'msn_status',
      section: 'MISSIONS',
      title: 'Active Missions Telemetry',
      subtitle: 'Audit progress percentage and blockers',
      icon: <Target className="w-4 h-4 text-[#38E1FF]" />,
      onExecute: () => {
        onRunCommand?.('Show my active missions');
        onNavigate('/command');
      },
      keywords: ['mission status', 'list missions', 'active missions'],
    },

    // 7. AGENTS
    {
      id: 'agent_runs',
      section: 'AGENTS',
      title: 'Inspect Agent Execution Runs',
      subtitle: 'Audit step-by-step guardian logs and verified actions',
      icon: <Cpu className="w-4 h-4 text-[#19F59A]" />,
      route: '/agents',
      keywords: ['agent runs', 'executions', 'guardian audit'],
    },

    // 8. AUTOMATIONS
    {
      id: 'auto_workflows',
      section: 'AUTOMATIONS',
      title: 'View Active Workflows',
      subtitle: 'Monitor triggers, actions, and run history',
      icon: <Zap className="w-4 h-4 text-[#FFB000]" />,
      route: '/automation',
      keywords: ['active automations', 'workflows', 'triggers'],
    },

    // 9. MEMORY
    {
      id: 'mem_decisions',
      section: 'MEMORY',
      title: 'Project Decisions Registry',
      subtitle: 'Audit architectural & design decisions',
      icon: <Database className="w-4 h-4 text-[#FFB000]" />,
      route: '/memory/decisions',
      keywords: ['decisions', 'architecture', 'project choices'],
    },
  ];

  // Filter actions based on query
  const filtered = query.trim()
    ? actions.filter((act) => {
        const q = query.toLowerCase();
        return (
          act.title.toLowerCase().includes(q) ||
          act.section.toLowerCase().includes(q) ||
          act.subtitle?.toLowerCase().includes(q) ||
          act.keywords?.some((k) => k.toLowerCase().includes(q))
        );
      })
    : actions;

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1 < filtered.length ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filtered.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          executeAction(filtered[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex]);

  // Reset index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Autofocus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const executeAction = (action: CommandPaletteAction) => {
    onClose();
    if (action.onExecute) {
      action.onExecute();
    } else if (action.route) {
      onNavigate(action.route);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-[#050706]/85 backdrop-blur-md animate-fadeIn">
      {/* Backdrop click */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="w-full max-w-2xl bg-[#0A100D] border border-[#16281F] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh] font-mono animate-scaleUp">
        {/* Three Blade Top Accent */}
        <div className="h-1 bg-gradient-to-r from-[#00D084] via-[#38E1FF] to-[#00D084]" />

        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-[#16281F] flex items-center gap-3 bg-[#050706]/60">
          <Search className="w-4 h-4 text-[#19F59A] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, destination, or query (e.g. Open Mission Control, New Task)..."
            className="flex-1 bg-transparent text-sm text-[#F5F7F6] outline-none placeholder-[#8B9992]/60 font-mono"
            aria-label="Command Palette Input"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-[#8B9992] hover:text-[#F5F7F6]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline text-[9px] px-1.5 py-0.5 rounded bg-[#121C17] border border-[#16281F] text-[#8B9992]">
            ESC
          </kbd>
        </div>

        {/* Action List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-[#16281F]/30">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-[#8B9992] space-y-2">
              <Command className="w-6 h-6 mx-auto text-[#8B9992]/60" />
              <p className="text-xs">No direct tactical action found for "{query}".</p>
              <p className="text-[10px] text-[#8B9992]/80">
                Press Enter to submit to JARVIS Neural Command Bar.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onRunCommand?.(query);
                  onNavigate('/command');
                }}
                className="mt-2 px-3 py-1.5 rounded-lg bg-[#00D084] text-[#050706] text-xs font-bold"
              >
                Execute as Command: "{query}"
              </button>
            </div>
          ) : (
            filtered.map((action, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={action.id}
                  onClick={() => executeAction(action)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-[#121C17] border border-[#00D084]/40 text-[#19F59A]'
                      : 'hover:bg-[#121C17]/40 text-[#8B9992] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg border ${
                        isSelected
                          ? 'bg-[#00D084]/15 border-[#00D084]'
                          : 'bg-[#050706] border-[#16281F]'
                      }`}
                    >
                      {action.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold truncate ${
                            isSelected ? 'text-[#F5F7F6]' : 'text-[#F5F7F6]/90'
                          }`}
                        >
                          {action.title}
                        </span>
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#050706] border border-[#16281F] text-[#8B9992]">
                          {action.section}
                        </span>
                      </div>
                      {action.subtitle && (
                        <p className="text-[10px] text-[#8B9992] truncate mt-0.5">
                          {action.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isSelected && (
                      <span className="text-[10px] text-[#19F59A] flex items-center gap-1 font-bold">
                        <span>SELECT</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-[#16281F] bg-[#050706]/70 flex items-center justify-between text-[10px] text-[#8B9992]">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <span className="text-[#19F59A]">THREE BLADES • ONE COMMAND</span>
        </div>
      </div>
    </div>
  );
};

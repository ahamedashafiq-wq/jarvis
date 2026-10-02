import React from 'react';
import {
  Brain,
  Code2,
  Search,
  Database,
  Eye,
  CheckSquare,
  Cpu,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { RoutePath } from '../../types';
import { soundService } from '../../services/sound';

interface AgentCardData {
  id: string;
  name: string;
  role: string;
  status: 'ACTIVE' | 'READY' | 'SYNCING' | 'WAITING';
  currentActivity: string;
  latency: string;
  lastAction: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

interface AgentCouncilProps {
  userId: string;
  onNavigate: (path: RoutePath) => void;
  className?: string;
}

export const AgentCouncil: React.FC<AgentCouncilProps> = ({
  userId,
  onNavigate,
  className = '',
}) => {
  const agents: AgentCardData[] = [
    {
      id: 'planner',
      name: 'PLANNER AGENT',
      role: 'Strategy & Goal Decomposition',
      status: 'READY',
      currentActivity: 'Continuous objective DAG evaluation',
      latency: '142ms',
      lastAction: 'Synthesized mission milestones',
      icon: Brain,
      accentColor: 'text-zoro-cyan border-zoro-cyan/40 bg-zoro-cyan/10',
    },
    {
      id: 'coding',
      name: 'CODING AGENT',
      role: 'Full-Stack Execution & Sandbox',
      status: 'ACTIVE',
      currentActivity: 'Running architectural AST validation',
      latency: '210ms',
      lastAction: 'Refactored ZORO 2.0 command pipelines',
      icon: Code2,
      accentColor: 'text-zoro-blue border-zoro-blue/40 bg-zoro-blue/10',
    },
    {
      id: 'research',
      name: 'RESEARCH AGENT',
      role: 'Deep Information Synthesis',
      status: 'READY',
      currentActivity: 'Indexing technical docs & vectors',
      latency: '185ms',
      lastAction: 'Retrieved API schemas & model contracts',
      icon: Search,
      accentColor: 'text-zoro-violet border-zoro-violet/40 bg-zoro-violet/10',
    },
    {
      id: 'memory',
      name: 'MEMORY AGENT',
      role: 'Neural Graph & Context Store',
      status: 'SYNCING',
      currentActivity: 'Compacting episodic decision clusters',
      latency: '45ms',
      lastAction: 'Cross-linked tasks with mission context',
      icon: Database,
      accentColor: 'text-zoro-success border-zoro-success/40 bg-zoro-success/10',
    },
    {
      id: 'vision',
      name: 'VISION AGENT',
      role: 'Multimodal Spatial Telemetry',
      status: 'READY',
      currentActivity: 'Awaiting canvas or viewport frame upload',
      latency: '310ms',
      lastAction: 'Structured visual inspection complete',
      icon: Eye,
      accentColor: 'text-zoro-cyan border-zoro-cyan/40 bg-zoro-cyan/10',
    },
    {
      id: 'task',
      name: 'TASK AGENT',
      role: 'Atomic Action Automation',
      status: 'READY',
      currentActivity: 'Prioritizing queue execution schedule',
      latency: '38ms',
      lastAction: 'Sorted daily priorities by impact',
      icon: CheckSquare,
      accentColor: 'text-zoro-warning border-zoro-warning/40 bg-zoro-warning/10',
    },
    {
      id: 'system',
      name: 'SYSTEM AGENT',
      role: 'Guardian, Safety & Telemetry',
      status: 'ACTIVE',
      currentActivity: 'Enforcing sandbox tool limits & invariants',
      latency: '12ms',
      lastAction: 'Verified Zero-Hallucination bounds',
      icon: Cpu,
      accentColor: 'text-zoro-cyan border-zoro-cyan/40 bg-zoro-cyan/10',
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
            ACTIVE AGENT COUNCIL
          </h2>
          <span className="text-[10px] text-zoro-textMuted font-bold">
            (7 AGENTS SYNCHRONIZED)
          </span>
        </div>

        <button
          onClick={() => {
            onNavigate('/agents');
            soundService.play('CLICK');
          }}
          className="text-[10px] text-zoro-cyan hover:underline flex items-center gap-1 transition-colors font-bold"
        >
          <span>OPEN AGENT DECK</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* 7 Agent Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 text-xs">
        {agents.map((ag) => {
          const Icon = ag.icon;
          const isActive = ag.status === 'ACTIVE';
          const isSyncing = ag.status === 'SYNCING';

          return (
            <div
              key={ag.id}
              onClick={() => {
                onNavigate('/agents');
                soundService.play('CLICK');
              }}
              className="p-3.5 rounded-xl border border-zoro-border bg-zoro-panelElevated hover:border-zoro-cyan/40 hover:bg-zoro-panelHighlight transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                {/* Agent Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg border ${ag.accentColor} group-hover:scale-105 transition-transform`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-zoro-text tracking-wider">
                        {ag.name}
                      </div>
                      <div className="text-[9px] text-zoro-textMuted truncate max-w-[130px]">
                        {ag.role}
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-1 text-[9px] font-bold">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActive
                          ? 'bg-zoro-cyan animate-pulse shadow-[0_0_6px_#19D9FF]'
                          : isSyncing
                          ? 'bg-zoro-violet animate-pulse'
                          : 'bg-zoro-success'
                      }`}
                    />
                    <span
                      className={
                        isActive
                          ? 'text-zoro-cyan'
                          : isSyncing
                          ? 'text-zoro-violet'
                          : 'text-zoro-success'
                      }
                    >
                      {ag.status}
                    </span>
                  </div>
                </div>

                {/* Current Activity */}
                <div className="mt-2 text-[10px] text-zoro-textSecondary leading-snug line-clamp-2">
                  {ag.currentActivity}
                </div>
              </div>

              {/* Bottom Meta */}
              <div className="mt-3 pt-2 border-t border-zoro-border/40 flex items-center justify-between text-[9px] text-zoro-textMuted">
                <div className="truncate max-w-[120px]">
                  <span>LAST: </span>
                  <span className="text-zoro-textSecondary">{ag.lastAction}</span>
                </div>
                <div className="tabular-nums text-zoro-cyan font-bold shrink-0">
                  {ag.latency}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

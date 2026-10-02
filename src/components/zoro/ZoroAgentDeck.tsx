import React, { useState, useEffect } from 'react';
import {
  Code,
  Search,
  Database,
  Eye,
  CheckSquare,
  Cpu,
  Layers,
  BookOpen,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AgentCore } from '../../services/agent';
import { soundService } from '../../services/sound';
import { RoutePath } from '../../types';

export type AgentStatusType = 'ACTIVE' | 'STANDBY' | 'THINKING' | 'EXECUTING' | 'FAILED';

export interface ZoroAgentSpec {
  id: string;
  name: string;
  role: string;
  icon: React.ComponentType<{ className?: string }>;
  status: AgentStatusType;
  currentJob: string;
  lastAction: string;
  successRate: number; // e.g. 98.4
  latencyMs: number; // e.g. 42
  taskCount: number;
  color: string;
}

interface ZoroAgentDeckProps {
  userId: string;
  onNavigate: (path: RoutePath) => void;
  onRunCouncilSimulation?: (prompt: string) => void;
}

export const ZoroAgentDeck: React.FC<ZoroAgentDeckProps> = ({
  userId,
  onNavigate,
  onRunCouncilSimulation,
}) => {
  const [agents, setAgents] = useState<ZoroAgentSpec[]>([
    {
      id: 'agent_coding',
      name: 'CODING AGENT',
      role: 'Syntax verification, tool bindings & software architecture',
      icon: Code,
      status: 'STANDBY',
      currentJob: 'Monitoring AST & execution safety',
      lastAction: 'Lint pass passed with 0 warnings',
      successRate: 99.2,
      latencyMs: 38,
      taskCount: 42,
      color: 'text-zoro-cyan',
    },
    {
      id: 'agent_research',
      name: 'RESEARCH AGENT',
      role: 'Contextual retrieval, web grounding & synthesis',
      icon: Search,
      status: 'STANDBY',
      currentJob: 'Indexed technical literature and Gemini SDK patterns',
      lastAction: 'Retrieved SDK model references',
      successRate: 97.8,
      latencyMs: 64,
      taskCount: 29,
      color: 'text-zoro-blue',
    },
    {
      id: 'agent_memory',
      name: 'MEMORY AGENT',
      role: 'Persistent knowledge graph & decision retrieval',
      icon: Database,
      status: 'ACTIVE',
      currentJob: 'Synchronized cross-session recall index',
      lastAction: 'Synced 14 cognitive memory nodes',
      successRate: 100,
      latencyMs: 18,
      taskCount: 88,
      color: 'text-zoro-violet',
    },
    {
      id: 'agent_vision',
      name: 'VISION AGENT',
      role: 'Optical telemetry, OCR extraction & UI inspection',
      icon: Eye,
      status: 'STANDBY',
      currentJob: 'Multimodal vision pipeline standing by',
      lastAction: 'Calibrated optical analysis filter',
      successRate: 98.6,
      latencyMs: 52,
      taskCount: 16,
      color: 'text-zoro-cyan',
    },
    {
      id: 'agent_task',
      name: 'TASK AGENT',
      role: 'Discipline queue scheduling, priority auditing & states',
      icon: CheckSquare,
      status: 'ACTIVE',
      currentJob: 'Auditing pending objective deadlines',
      lastAction: 'Scheduled high-priority milestone',
      successRate: 99.5,
      latencyMs: 22,
      taskCount: 104,
      color: 'text-zoro-success',
    },
    {
      id: 'agent_system',
      name: 'SYSTEM AGENT',
      role: 'Telemetry telemetry, Supabase health & event bus',
      icon: Cpu,
      status: 'ACTIVE',
      currentJob: 'Monitoring client-side event bus channels',
      lastAction: 'Telemetry heartbeat verified nominal',
      successRate: 100,
      latencyMs: 14,
      taskCount: 312,
      color: 'text-zoro-cyan',
    },
    {
      id: 'agent_planning',
      name: 'PLANNING AGENT',
      role: 'Autonomous multi-step pipeline synthesis & verification',
      icon: Layers,
      status: 'STANDBY',
      currentJob: 'Awaiting complex natural language directive',
      lastAction: 'Formulated 4-step mission roadmap',
      successRate: 98.9,
      latencyMs: 45,
      taskCount: 57,
      color: 'text-zoro-blue',
    },
    {
      id: 'agent_knowledge',
      name: 'KNOWLEDGE AGENT',
      role: 'Document indexing, tagging & architectural synthesis',
      icon: BookOpen,
      status: 'STANDBY',
      currentJob: 'Cataloging system specifications',
      lastAction: 'Indexed architecture knowledge doc',
      successRate: 99.0,
      latencyMs: 31,
      taskCount: 23,
      color: 'text-zoro-violet',
    },
  ]);

  // Council simulation state
  const [councilSimActive, setCouncilSimActive] = useState(false);
  const [simStep, setSimStep] = useState(0);

  const startCouncilSimulation = () => {
    setCouncilSimActive(true);
    setSimStep(1);
    soundService.play('COMMAND_RECEIVED');

    // Step 1: Planner
    setTimeout(() => {
      setSimStep(2);
      // Step 2: Memory
      setTimeout(() => {
        setSimStep(3);
        // Step 3: Task & Research
        setTimeout(() => {
          setSimStep(4);
          // Step 4: Coding
          setTimeout(() => {
            setSimStep(5);
            // Step 5: Synthesis
            soundService.play('COMMAND_SUCCESS');
          }, 800);
        }, 800);
      }, 800);
    }, 800);
  };

  const resetCouncil = () => {
    setCouncilSimActive(false);
    setSimStep(0);
  };

  const getStatusBadge = (status: AgentStatusType) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded bg-zoro-success/10 text-zoro-success border border-zoro-success/25">
            <span className="w-1.5 h-1.5 rounded-full bg-zoro-success animate-pulse" />
            ACTIVE
          </span>
        );
      case 'EXECUTING':
      case 'THINKING':
        return (
          <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded bg-zoro-cyan/10 text-zoro-cyan border border-zoro-cyan/25 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-zoro-cyan" />
            {status}
          </span>
        );
      case 'STANDBY':
      default:
        return (
          <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded bg-zoro-panelElevated text-zoro-textMuted border border-zoro-border">
            <span className="w-1.5 h-1.5 rounded-full bg-zoro-textMuted" />
            STANDBY
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-zoro-border bg-zoro-panel p-5 sm:p-6 space-y-5 font-mono select-none shadow-xl">
      {/* Deck Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zoro-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-zoro-cyan" />
            <h2 className="text-sm sm:text-base font-black text-zoro-text tracking-wider uppercase">
              AGENT COMMAND CENTER & COUNCIL
            </h2>
            <span className="text-[9px] px-2 py-0.5 rounded bg-zoro-cyan/15 text-zoro-cyan font-bold border border-zoro-cyan/30">
              8 SPECIALIZED AGENTS
            </span>
          </div>
          <p className="text-xs text-zoro-textSecondary mt-0.5 font-sans">
            Autonomous multi-agent orchestration coordinating reasoning, planning, memory, and tool verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/agents')}
            className="px-3 py-1.5 rounded-xl border border-zoro-border bg-zoro-panelElevated hover:border-zoro-cyan/40 text-zoro-textSecondary hover:text-zoro-text text-xs transition-colors"
          >
            VIEW DETAILS
          </button>
          <button
            onClick={councilSimActive ? resetCouncil : startCouncilSimulation}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-zoro-cyan to-zoro-blue text-black font-bold text-xs flex items-center gap-1.5 hover:opacity-95 transition-all shadow-[0_0_15px_rgba(25,217,255,0.2)]"
          >
            {councilSimActive ? (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RESET COUNCIL</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>ACTIVATE COUNCIL</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Agent Council Visual Orchestration Bar when active (Section 13) */}
      {councilSimActive && (
        <div className="p-4 rounded-xl border border-zoro-cyan/40 bg-zoro-panelElevated space-y-3 shadow-[0_0_20px_rgba(25,217,255,0.1)]">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-zoro-cyan flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-zoro-cyan animate-spin" />
              COUNCIL DIRECTIVE: &ldquo;Prepare AI project for development session&rdquo;
            </span>
            <span className="text-[10px] text-zoro-textMuted">STAGE {simStep} / 5</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
            <div
              className={`p-2.5 rounded-lg border transition-all ${
                simStep >= 1 ? 'border-zoro-cyan bg-zoro-cyan/10 text-zoro-cyan' : 'border-zoro-border bg-zoro-bg text-zoro-textMuted'
              }`}
            >
              <div className="text-[10px] font-bold">1. PLANNER</div>
              <div className="text-[9px] mt-0.5 leading-tight">Decompose project state</div>
            </div>

            <div
              className={`p-2.5 rounded-lg border transition-all ${
                simStep >= 2 ? 'border-zoro-violet bg-zoro-violet/10 text-zoro-violet' : 'border-zoro-border bg-zoro-bg text-zoro-textMuted'
              }`}
            >
              <div className="text-[10px] font-bold">2. MEMORY</div>
              <div className="text-[9px] mt-0.5 leading-tight">Retrieve past decisions</div>
            </div>

            <div
              className={`p-2.5 rounded-lg border transition-all ${
                simStep >= 3 ? 'border-zoro-blue bg-zoro-blue/10 text-zoro-blue' : 'border-zoro-border bg-zoro-bg text-zoro-textMuted'
              }`}
            >
              <div className="text-[10px] font-bold">3. TASK & RESEARCH</div>
              <div className="text-[9px] mt-0.5 leading-tight">Audit incomplete backlog</div>
            </div>

            <div
              className={`p-2.5 rounded-lg border transition-all ${
                simStep >= 4 ? 'border-zoro-cyan bg-zoro-cyan/10 text-zoro-cyan' : 'border-zoro-border bg-zoro-bg text-zoro-textMuted'
              }`}
            >
              <div className="text-[10px] font-bold">4. CODING</div>
              <div className="text-[9px] mt-0.5 leading-tight">Verify AST & routes</div>
            </div>

            <div
              className={`p-2.5 rounded-lg border transition-all ${
                simStep >= 5 ? 'border-zoro-success bg-zoro-success/15 text-zoro-success font-bold' : 'border-zoro-border bg-zoro-bg text-zoro-textMuted'
              }`}
            >
              <div className="text-[10px] font-bold">5. ZORO CORE</div>
              <div className="text-[9px] mt-0.5 leading-tight">Synthesize action plan</div>
            </div>
          </div>
        </div>
      )}

      {/* 8-Agent Grid (Section 12) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {agents.map((agent) => {
          const Icon = agent.icon;
          return (
            <div
              key={agent.id}
              className="p-3.5 rounded-xl border border-zoro-border bg-zoro-panelElevated/60 hover:border-zoro-borderHover hover:bg-zoro-panelElevated transition-all space-y-2.5 shadow-sm group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg bg-zoro-bg border border-zoro-border ${agent.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-xs text-zoro-text truncate max-w-[130px]">
                    {agent.name}
                  </span>
                </div>
                {getStatusBadge(agent.status)}
              </div>

              <div className="text-[11px] text-zoro-textSecondary line-clamp-1 leading-snug">
                {agent.role}
              </div>

              <div className="p-2 rounded-lg bg-zoro-bg/80 border border-zoro-border/60 text-[10px] space-y-1">
                <div className="text-zoro-textMuted flex items-center justify-between">
                  <span>CURRENT JOB:</span>
                  <span className="text-zoro-cyan font-semibold">{agent.latencyMs}ms</span>
                </div>
                <div className="text-zoro-text line-clamp-1 font-sans">{agent.currentJob}</div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-zoro-textMuted pt-1 border-t border-zoro-border/40">
                <span>TASKS: <strong className="text-zoro-text">{agent.taskCount}</strong></span>
                <span>SUCCESS: <strong className="text-zoro-success">{agent.successRate}%</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

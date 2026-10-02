import React, { useState } from 'react';
import { RoutePath } from '../types';
import { AIOrb } from '../components/AIOrb';
import {
  Shield,
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Play,
  RotateCcw,
  Activity,
  Cpu,
  Lock,
  Compass,
  Database,
  Terminal,
} from 'lucide-react';

interface AgentCouncilProps {
  onNavigate: (path: RoutePath) => void;
}

export const AgentCouncil: React.FC<AgentCouncilProps> = ({ onNavigate }) => {
  const [selectedRole, setSelectedRole] = useState<'PLANNER' | 'ANALYST' | 'BUILDER' | 'GUARDIAN'>(
    'PLANNER'
  );
  const [simulationState, setSimulationState] = useState<'IDLE' | 'PLANNER' | 'ANALYST' | 'BUILDER' | 'GUARDIAN' | 'RESULT'>('IDLE');

  const runSimulation = () => {
    setSimulationState('PLANNER');
    setTimeout(() => {
      setSimulationState('ANALYST');
      setTimeout(() => {
        setSimulationState('BUILDER');
        setTimeout(() => {
          setSimulationState('GUARDIAN');
          setTimeout(() => {
            setSimulationState('RESULT');
            setTimeout(() => setSimulationState('IDLE'), 4000);
          }, 1200);
        }, 1200);
      }, 1200);
    }, 1200);
  };

  const roles = {
    PLANNER: {
      title: 'TACTICAL PLANNER',
      blade: 'BLADE 01 • KNOWLEDGE (ENMA)',
      icon: <Compass className="w-5 h-5 text-[#19F59A]" />,
      color: '#19F59A',
      responsibilities: [
        'Deconstructs complex user requests into structured, allowlisted steps',
        'Selects appropriate application tools without raw database exposure',
        'Validates task and mission sequencing',
        'Prepares action risk classifications',
      ],
      metrics: { confidence: '99.4%', averagePlanSteps: '3.4', safetyScore: '100%' },
    },
    ANALYST: {
      title: 'CONTEXT & DATA ANALYST',
      blade: 'BLADE 03 • MEMORY (SANDAI KITETSU)',
      icon: <Database className="w-5 h-5 text-[#38E1FF]" />,
      color: '#38E1FF',
      responsibilities: [
        'Retrieves bounded user context (active missions, pending tasks, relevant memories)',
        'Filters out noise and avoids context window bloat',
        'Calculates mission clearance velocity and productivity trends',
        'Summarizes execution outputs for operator transparency',
      ],
      metrics: { contextPrecision: '98.8%', boundedTokens: '< 1,200', speed: '42ms' },
    },
    BUILDER: {
      title: 'OPERATIONAL BUILDER',
      blade: 'BLADE 02 • ACTION (WADO ICHIMONJI)',
      icon: <Terminal className="w-5 h-5 text-[#FFB000]" />,
      color: '#FFB000',
      responsibilities: [
        'Executes sequential allowlisted tool calls via Application Services',
        'Maintains deterministic order: Step 1 -> Result -> Step 2',
        'Triggers real-time broadcasts for UI state synchronization',
        'Handles retry loops and handles execution exceptions safely',
      ],
      metrics: { toolIntegrity: '100%', executionSuccess: '97.2%', maxRetries: '3' },
    },
    GUARDIAN: {
      title: 'SAFETY & PERMISSION GUARDIAN',
      blade: 'THREE-BLADE CONVERGENCE • GUARDIAN GATE',
      icon: <Lock className="w-5 h-5 text-[#00D084]" />,
      color: '#00D084',
      responsibilities: [
        'Enforces application allowlists; blocks unknown or fabricated tools',
        'Neutralizes adversarial prompt injection in user text and memories',
        'Flags bulk modifications (3+ write operations) for explicit user approval',
        'Verifies database state independently after every single write action',
      ],
      metrics: { promptInjectionBlocked: '100%', unauthorizedAccess: '0%', verifiedWrites: '100%' },
    },
  };

  const active = roles[selectedRole];

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 font-mono text-xs select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#16281F] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#19F59A] animate-pulse" />
            <h1 className="text-xl font-black text-[#F5F7F6] tracking-wider">
              AGENT COUNCIL ARCHITECTURE
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#00D084]/15 border border-[#00D084]/30 text-[#19F59A]">
              SECTION 23
            </span>
          </div>
          <p className="text-[10px] text-[#8B9992] mt-0.5">
            THREE BLADES LOGICAL ROLES • TACTICAL ORCHESTRATION PIPELINE
          </p>
        </div>

        <button
          onClick={runSimulation}
          disabled={simulationState !== 'IDLE'}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00D084] hover:bg-[#19F59A] text-[#050706] font-bold text-xs transition-all shadow-[0_0_15px_rgba(0,208,132,0.25)] disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5" />
          <span>{simulationState === 'IDLE' ? 'RUN COUNCIL SIMULATION' : 'SIMULATING PIPELINE...'}</span>
        </button>
      </div>

      {/* Interactive Council Visual Tree */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#0A100D] border border-[#16281F] flex flex-col items-center justify-center relative overflow-hidden space-y-6 shadow-2xl">
        {/* Level 1: JARVIS Core */}
        <div className="flex flex-col items-center space-y-2 z-10">
          <AIOrb state={simulationState !== 'IDLE' ? 'THINKING' : 'IDLE'} size={90} />
          <div className="px-3 py-1 rounded-lg bg-[#050706] border border-[#16281F] text-center">
            <span className="text-xs font-bold text-[#F5F7F6]">ZORO TACTICAL CORE</span>
            <div className="text-[9px] text-[#8B9992]">CENTRAL INTELLIGENCE COMMAND</div>
          </div>
        </div>

        {/* Tree Connectors */}
        <div className="w-full max-w-md h-6 flex items-center justify-center relative">
          <div className="w-[1px] h-full bg-[#16281F]" />
          <div className="absolute inset-x-8 top-1/2 h-[1px] bg-[#16281F]" />
        </div>

        {/* Level 2: Three Blade Specialists */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 w-full max-w-2xl z-10">
          {/* Planner */}
          <button
            onClick={() => setSelectedRole('PLANNER')}
            className={`p-3.5 sm:p-4 rounded-xl border text-center space-y-2 transition-all ${
              selectedRole === 'PLANNER'
                ? 'bg-[#121C17] border-[#19F59A] shadow-[0_0_15px_rgba(25,245,154,0.2)]'
                : 'bg-[#050706] border-[#16281F] hover:border-[#16281F]/80'
            } ${simulationState === 'PLANNER' ? 'ring-2 ring-[#19F59A] animate-pulse' : ''}`}
          >
            <div className="w-8 h-8 rounded-lg bg-[#19F59A]/15 border border-[#19F59A]/40 flex items-center justify-center mx-auto text-[#19F59A]">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-[#F5F7F6]">PLANNER</div>
              <div className="text-[8px] text-[#8B9992] truncate">KNOWLEDGE BLADE</div>
            </div>
          </button>

          {/* Analyst */}
          <button
            onClick={() => setSelectedRole('ANALYST')}
            className={`p-3.5 sm:p-4 rounded-xl border text-center space-y-2 transition-all ${
              selectedRole === 'ANALYST'
                ? 'bg-[#121C17] border-[#38E1FF] shadow-[0_0_15px_rgba(56,225,255,0.2)]'
                : 'bg-[#050706] border-[#16281F] hover:border-[#16281F]/80'
            } ${simulationState === 'ANALYST' ? 'ring-2 ring-[#38E1FF] animate-pulse' : ''}`}
          >
            <div className="w-8 h-8 rounded-lg bg-[#38E1FF]/15 border border-[#38E1FF]/40 flex items-center justify-center mx-auto text-[#38E1FF]">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-[#F5F7F6]">ANALYST</div>
              <div className="text-[8px] text-[#8B9992] truncate">MEMORY BLADE</div>
            </div>
          </button>

          {/* Builder */}
          <button
            onClick={() => setSelectedRole('BUILDER')}
            className={`p-3.5 sm:p-4 rounded-xl border text-center space-y-2 transition-all ${
              selectedRole === 'BUILDER'
                ? 'bg-[#121C17] border-[#FFB000] shadow-[0_0_15px_rgba(255,176,0,0.2)]'
                : 'bg-[#050706] border-[#16281F] hover:border-[#16281F]/80'
            } ${simulationState === 'BUILDER' ? 'ring-2 ring-[#FFB000] animate-pulse' : ''}`}
          >
            <div className="w-8 h-8 rounded-lg bg-[#FFB000]/15 border border-[#FFB000]/40 flex items-center justify-center mx-auto text-[#FFB000]">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-[#F5F7F6]">BUILDER</div>
              <div className="text-[8px] text-[#8B9992] truncate">ACTION BLADE</div>
            </div>
          </button>
        </div>

        {/* Tree Connector to Guardian */}
        <div className="w-[1px] h-6 bg-[#16281F]" />

        {/* Level 3: Guardian */}
        <button
          onClick={() => setSelectedRole('GUARDIAN')}
          className={`p-4 rounded-xl border text-center space-y-1.5 w-full max-w-sm transition-all z-10 ${
            selectedRole === 'GUARDIAN'
              ? 'bg-[#121C17] border-[#00D084] shadow-[0_0_15px_rgba(0,208,132,0.2)]'
              : 'bg-[#050706] border-[#16281F] hover:border-[#16281F]/80'
          } ${simulationState === 'GUARDIAN' ? 'ring-2 ring-[#00D084] animate-pulse' : ''}`}
        >
          <div className="flex items-center justify-center gap-2">
            <Lock className="w-4 h-4 text-[#00D084]" />
            <span className="font-bold text-xs text-[#F5F7F6]">GUARDIAN GATE</span>
          </div>
          <div className="text-[9px] text-[#8B9992]">
            SECURITY CHECK • RISK CLASSIFICATION • APPROVAL ENFORCEMENT
          </div>
        </button>

        {/* Level 4: Result */}
        <div className="flex items-center gap-2 text-[10px] text-[#8B9992]">
          <ArrowRight className="w-3.5 h-3.5 text-[#19F59A]" />
          <span>VERIFIED APPLICATION RESULT REPORTED TO OPERATOR</span>
        </div>
      </div>

      {/* Detailed Role Inspection Card */}
      <div className="p-6 rounded-2xl bg-[#0A100D] border border-[#16281F] space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#16281F]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#050706] border border-[#16281F] flex items-center justify-center">
              {active.icon}
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#F5F7F6]">{active.title}</h2>
              <span className="text-[9px] font-bold text-[#19F59A]">{active.blade}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-[#8B9992] tracking-wider">
              CORE RESPONSIBILITIES:
            </span>
            <ul className="space-y-1.5">
              {active.responsibilities.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] font-sans text-[#F5F7F6]">
                  <CheckCircle className="w-3.5 h-3.5 text-[#00D084] shrink-0 mt-0.5" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold text-[#8B9992] tracking-wider">
              SECURITY & TELEMETRY METRICS:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(active.metrics).map(([k, v], i) => (
                <div key={i} className="p-2.5 rounded-xl bg-[#050706] border border-[#16281F] space-y-1">
                  <div className="text-[8px] text-[#8B9992] uppercase">{k}</div>
                  <div className="text-xs font-bold text-[#F5F7F6]">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

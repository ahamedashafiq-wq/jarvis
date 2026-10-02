import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  Zap,
  Eye,
  Radio,
  Target,
  ArrowRight,
  Shield,
  Activity,
  Cpu,
  Layers,
  Terminal,
} from 'lucide-react';
import { RoutePath } from '../../types';
import { soundService } from '../../services/sound';
import { VoiceEngine, VoiceEngineState } from '../../services/voiceEngine';

interface ZoroHeroAICoreProps {
  onNavigate: (path: RoutePath) => void;
  onExecuteCommand: (command: string) => void;
  onOpenVoice: () => void;
  systemState?: 'IDLE' | 'LISTENING' | 'THINKING' | 'PLANNING' | 'EXECUTING' | 'VERIFYING' | 'COMPLETED' | 'ERROR';
  activeMissionCount?: number;
  totalTaskCount?: number;
  memoryNodeCount?: number;
}

export const ZoroHeroAICore: React.FC<ZoroHeroAICoreProps> = ({
  onNavigate,
  onExecuteCommand,
  onOpenVoice,
  systemState = 'IDLE',
  activeMissionCount = 0,
  totalTaskCount = 0,
  memoryNodeCount = 0,
}) => {
  const [pulseAngle, setPulseAngle] = useState(0);
  const [voiceState, setVoiceState] = useState<VoiceEngineState>('IDLE');

  useEffect(() => {
    const unsub = VoiceEngine.subscribe((state) => {
      setVoiceState(state);
    });
    return () => unsub();
  }, []);

  // Smooth rotational angle loop for cybernetic orbital rings
  useEffect(() => {
    let animId: number;
    const animate = () => {
      setPulseAngle((prev) => (prev + 0.5) % 360);
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  const displayState = voiceState === 'LISTENING'
    ? 'LISTENING'
    : voiceState === 'PROCESSING'
    ? 'THINKING'
    : systemState;

  const getStateMeta = () => {
    switch (displayState) {
      case 'LISTENING':
        return {
          label: 'LISTENING...',
          sublabel: 'VOICE RECOGNITION ACTIVE',
          color: 'text-zoro-cyan',
          glow: 'rgba(25, 217, 255, 0.4)',
          border: 'border-zoro-cyan',
          ringSpeed: 'animate-[spin_4s_linear_infinite]',
        };
      case 'THINKING':
      case 'PLANNING':
        return {
          label: displayState === 'PLANNING' ? 'PLANNING DIRECTIVE' : 'SYNTHESIZING CONTEXT',
          sublabel: 'NEURAL REASONING MATRIX',
          color: 'text-zoro-blue',
          glow: 'rgba(61, 124, 255, 0.4)',
          border: 'border-zoro-blue',
          ringSpeed: 'animate-[spin_3s_linear_infinite]',
        };
      case 'EXECUTING':
      case 'VERIFYING':
        return {
          label: displayState === 'VERIFYING' ? 'VERIFYING ACTION' : 'EXECUTING TOOLS',
          sublabel: 'AGENTIC PIPELINE ENGAGED',
          color: 'text-zoro-violet',
          glow: 'rgba(139, 92, 255, 0.4)',
          border: 'border-zoro-violet',
          ringSpeed: 'animate-[spin_2s_linear_infinite]',
        };
      case 'ERROR':
        return {
          label: 'ATTENTION REQUIRED',
          sublabel: 'SECURITY BOUNDARY ACTIVE',
          color: 'text-zoro-critical',
          glow: 'rgba(255, 77, 103, 0.4)',
          border: 'border-zoro-critical',
          ringSpeed: 'animate-[spin_10s_linear_infinite]',
        };
      case 'COMPLETED':
        return {
          label: 'ACTION VERIFIED',
          sublabel: 'PIPELINE COMPLETE',
          color: 'text-zoro-success',
          glow: 'rgba(33, 230, 160, 0.4)',
          border: 'border-zoro-success',
          ringSpeed: 'animate-[spin_8s_linear_infinite]',
        };
      case 'IDLE':
      default:
        return {
          label: 'READY TO ASSIST',
          sublabel: 'THREE BLADES SYNCHRONIZED',
          color: 'text-zoro-cyan',
          glow: 'rgba(25, 217, 255, 0.25)',
          border: 'border-zoro-cyan/40',
          ringSpeed: 'animate-[spin_14s_linear_infinite]',
        };
    }
  };

  const stateMeta = getStateMeta();

  return (
    <div className="relative rounded-2xl border border-zoro-border bg-gradient-to-b from-zoro-panelElevated to-zoro-panel p-6 sm:p-8 overflow-hidden shadow-2xl">
      {/* Background Holographic Ambient Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-zoro-cyan/10 via-zoro-blue/5 to-zoro-violet/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#19D9FF_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />

      {/* Main Grid: AI Core Visualization + Operational Meta */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* LEFT / CENTER: Holographic Neural AI Core Orb (Section 7) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-56 h-56 flex items-center justify-center select-none">
            {/* Outer Orbital Ring 1 */}
            <div
              className={`absolute inset-0 rounded-full border border-dashed ${stateMeta.border} opacity-40 ${stateMeta.ringSpeed}`}
              style={{ boxShadow: `0 0 25px ${stateMeta.glow}` }}
            />

            {/* Orbital Ring 2 (Counter-rotating) */}
            <div
              className="absolute inset-3 rounded-full border border-zoro-blue/30 opacity-60 animate-[spin_18s_linear_infinite_reverse]"
              style={{
                transform: `rotate(${-pulseAngle}deg)`,
              }}
            />

            {/* Orbital Ring 3 (Tilted Gyroscope) */}
            <div
              className="absolute inset-7 rounded-full border-2 border-t-zoro-cyan border-r-transparent border-b-zoro-violet border-l-transparent opacity-70 animate-[spin_10s_linear_infinite]"
            />

            {/* Glowing Center Core */}
            <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-[#0B182B] via-[#07111D] to-[#040810] border border-zoro-border flex flex-col items-center justify-center shadow-[inset_0_0_20px_rgba(25,217,255,0.2)] group cursor-pointer"
              onClick={() => {
                onOpenVoice();
                soundService.play('VOICE_ACTIVATED');
              }}
            >
              {/* Vertical Z O R O Identity */}
              <div className="flex flex-col items-center leading-tight">
                <span className="text-[10px] font-black tracking-widest text-zoro-cyan drop-shadow-[0_0_8px_#19D9FF]">Z</span>
                <span className="text-[10px] font-black tracking-widest text-zoro-text">O</span>
                <span className="text-[10px] font-black tracking-widest text-zoro-blue">R</span>
                <span className="text-[10px] font-black tracking-widest text-zoro-text">O</span>
              </div>
              <span className="text-[8px] font-mono tracking-[0.25em] text-zoro-textMuted uppercase mt-1 font-bold">
                AI CORE
              </span>

              {/* Pulsing Core Center Point */}
              <div className="w-2 h-2 rounded-full bg-zoro-cyan shadow-[0_0_12px_#19D9FF] animate-ping mt-1" />
            </div>

            {/* Satellite Telemetry Anchors */}
            <div className="absolute top-2 left-6 text-[9px] font-mono text-zoro-textMuted flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-zoro-cyan animate-pulse" />
              <span>N-2.5</span>
            </div>
            <div className="absolute bottom-2 right-6 text-[9px] font-mono text-zoro-textMuted flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-zoro-blue" />
              <span>ST-38ms</span>
            </div>
          </div>

          {/* Sub Core Dynamic State Text */}
          <div className="text-center mt-3 space-y-0.5 font-mono">
            <div className={`text-xs font-black tracking-widest uppercase ${stateMeta.color}`}>
              {stateMeta.label}
            </div>
            <div className="text-[10px] text-zoro-textMuted tracking-wider uppercase">
              {stateMeta.sublabel}
            </div>
          </div>
        </div>

        {/* RIGHT: Operational Command Overview & Quick Directives */}
        <div className="lg:col-span-7 space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-zoro-cyan font-bold uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-zoro-cyan shadow-[0_0_6px_#19D9FF] animate-pulse" />
              <span>ZORO 2.0 • PERSONAL AI COMMAND OPERATING SYSTEM</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-zoro-text tracking-wide font-mono">
              TACTICAL COMMAND CENTER
            </h1>
            <p className="text-xs text-zoro-textSecondary leading-relaxed max-w-xl font-sans">
              Autonomous cognitive operating environment unifying multi-agent orchestration, persistent memory, multimodal vision telemetry, and natural voice interaction.
            </p>
          </div>

          {/* Core System Telemetry Cards */}
          <div className="grid grid-cols-3 gap-3 font-mono">
            <div
              onClick={() => onNavigate('/missions')}
              className="p-3 rounded-xl bg-zoro-panel border border-zoro-border hover:border-zoro-cyan/40 cursor-pointer transition-all hover:bg-zoro-panelHighlight group"
            >
              <div className="flex items-center justify-between text-[10px] text-zoro-textMuted">
                <span>ACTIVE MISSIONS</span>
                <Target className="w-3.5 h-3.5 text-zoro-cyan group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-lg font-black text-zoro-text mt-1 tabular-nums">
                {activeMissionCount}
              </div>
              <div className="text-[9px] text-zoro-cyan font-semibold mt-0.5">TARGETS ENGAGED</div>
            </div>

            <div
              onClick={() => onNavigate('/tasks')}
              className="p-3 rounded-xl bg-zoro-panel border border-zoro-border hover:border-zoro-blue/40 cursor-pointer transition-all hover:bg-zoro-panelHighlight group"
            >
              <div className="flex items-center justify-between text-[10px] text-zoro-textMuted">
                <span>PENDING TASKS</span>
                <Zap className="w-3.5 h-3.5 text-zoro-blue group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-lg font-black text-zoro-text mt-1 tabular-nums">
                {totalTaskCount}
              </div>
              <div className="text-[9px] text-zoro-blue font-semibold mt-0.5">DISCIPLINE QUEUE</div>
            </div>

            <div
              onClick={() => onNavigate('/memory')}
              className="p-3 rounded-xl bg-zoro-panel border border-zoro-border hover:border-zoro-violet/40 cursor-pointer transition-all hover:bg-zoro-panelHighlight group"
            >
              <div className="flex items-center justify-between text-[10px] text-zoro-textMuted">
                <span>MEMORY NODES</span>
                <Brain className="w-3.5 h-3.5 text-zoro-violet group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-lg font-black text-zoro-text mt-1 tabular-nums">
                {memoryNodeCount}
              </div>
              <div className="text-[9px] text-zoro-violet font-semibold mt-0.5">NEURAL BANK</div>
            </div>
          </div>

          {/* Quick Directives Bar */}
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="text-[10px] text-zoro-textMuted uppercase font-bold tracking-wider mr-1">
              DIRECTIVES:
            </span>
            {[
              'Show active missions',
              'Prepare my work plan',
              'Analyze tactical priorities',
              'What needs my attention?',
            ].map((directive) => (
              <button
                key={directive}
                onClick={() => {
                  onExecuteCommand(directive);
                  soundService.play('CLICK');
                }}
                className="px-3 py-1.5 rounded-lg border border-zoro-border bg-zoro-panel hover:border-zoro-cyan/40 hover:bg-zoro-panelHighlight text-zoro-textSecondary hover:text-zoro-text transition-colors flex items-center gap-1.5"
              >
                <span className="text-zoro-cyan text-[10px]">›</span>
                <span>{directive}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

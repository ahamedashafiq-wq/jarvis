import React, { useState, useEffect } from 'react';
import {
  Brain,
  Eye,
  Radio,
  Target,
  Sparkles,
  Bot,
  Database,
  Cpu,
  Layers,
  Shield,
  Zap,
} from 'lucide-react';
import { RoutePath, CommandSurfaceState } from '../../types';
import { soundService } from '../../services/sound';
import { VoiceEngine, VoiceEngineState } from '../../services/voiceEngine';

interface ZoroCoreProps {
  onNavigate: (path: RoutePath) => void;
  onOpenVoice: () => void;
  systemState?: CommandSurfaceState | 'COMPLETED';
  activeMissionCount?: number;
  totalTaskCount?: number;
  memoryNodeCount?: number;
  agentActive?: boolean;
}

export const ZoroCore: React.FC<ZoroCoreProps> = ({
  onNavigate,
  onOpenVoice,
  systemState = 'IDLE',
  activeMissionCount = 0,
  totalTaskCount = 0,
  memoryNodeCount = 0,
  agentActive = false,
}) => {
  const [pulseAngle, setPulseAngle] = useState(0);
  const [voiceState, setVoiceState] = useState<VoiceEngineState>('IDLE');

  useEffect(() => {
    const unsub = VoiceEngine.subscribe((state) => {
      setVoiceState(state);
    });
    return () => unsub();
  }, []);

  // Smooth rotational loop for cybernetic orbital rings
  useEffect(() => {
    let animId: number;
    const animate = () => {
      setPulseAngle((prev) => (prev + 0.4) % 360);
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  const displayState =
    voiceState === 'LISTENING'
      ? 'LISTENING'
      : voiceState === 'PROCESSING'
      ? 'THINKING'
      : systemState;

  const getStateMeta = () => {
    switch (displayState) {
      case 'LISTENING':
        return {
          label: 'LISTENING...',
          sublabel: 'Acoustic Voice Matrix Active',
          color: 'text-zoro-cyan',
          glow: 'rgba(25, 217, 255, 0.45)',
          border: 'border-zoro-cyan',
          ringSpeed: 'animate-[spin_4s_linear_infinite]',
        };
      case 'THINKING':
      case 'PLANNING':
        return {
          label: displayState === 'PLANNING' ? 'PLANNING DIRECTIVE' : 'SYNTHESIZING CONTEXT',
          sublabel: 'Cognitive Reasoning Loop',
          color: 'text-zoro-blue',
          glow: 'rgba(61, 124, 255, 0.45)',
          border: 'border-zoro-blue',
          ringSpeed: 'animate-[spin_3s_linear_infinite]',
        };
      case 'EXECUTING':
      case 'VERIFYING':
        return {
          label: displayState === 'VERIFYING' ? 'VERIFYING INVARIANTS' : 'EXECUTING AGENT TOOLS',
          sublabel: 'Agentic Tool Orchestration',
          color: 'text-zoro-violet',
          glow: 'rgba(139, 92, 255, 0.45)',
          border: 'border-zoro-violet',
          ringSpeed: 'animate-[spin_2s_linear_infinite]',
        };
      case 'ERROR':
        return {
          label: 'ATTENTION REQUIRED',
          sublabel: 'Security Boundary Intercepted',
          color: 'text-zoro-critical',
          glow: 'rgba(255, 77, 103, 0.45)',
          border: 'border-zoro-critical',
          ringSpeed: 'animate-[spin_8s_linear_infinite]',
        };
      case 'COMPLETE':
      case 'COMPLETED':
        return {
          label: 'ACTION VERIFIED',
          sublabel: 'Directive Cycle Complete',
          color: 'text-zoro-success',
          glow: 'rgba(33, 230, 160, 0.45)',
          border: 'border-zoro-success',
          ringSpeed: 'animate-[spin_7s_linear_infinite]',
        };
      case 'IDLE':
      default:
        return {
          label: 'CORE ONLINE',
          sublabel: 'Three Blades Synchronized',
          color: 'text-zoro-cyan',
          glow: 'rgba(25, 217, 255, 0.25)',
          border: 'border-zoro-cyan/40',
          ringSpeed: 'animate-[spin_16s_linear_infinite]',
        };
    }
  };

  const stateMeta = getStateMeta();

  return (
    <div className="relative rounded-2xl border border-zoro-border bg-gradient-to-b from-[#08121F] to-[#050A12] p-6 lg:p-8 overflow-hidden shadow-2xl">
      {/* Holographic Ambient Gradients & Particle Grid */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-gradient-to-br from-zoro-cyan/10 via-zoro-blue/8 to-zoro-violet/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#19D9FF_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.04] pointer-events-none" />

      {/* Scanning holographic line arc */}
      <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-zoro-cyan/40 to-transparent top-0 animate-[pulse_3s_ease-in-out_infinite]" />

      <div className="relative z-10 flex flex-col items-center">
        {/* Top Operational Pill */}
        <div className="mb-6 flex items-center gap-2 px-3 py-1 rounded-full border border-zoro-border bg-zoro-panel/80 text-[11px] font-mono text-zoro-textSecondary">
          <span className="w-2 h-2 rounded-full bg-zoro-cyan shadow-[0_0_8px_#19D9FF] animate-pulse" />
          <span className="font-bold text-zoro-text tracking-wider">ZORO OMNIA CORE</span>
          <span className="text-zoro-muted">·</span>
          <span className="text-zoro-cyan font-bold tracking-wider">v2.0</span>
          <span className="text-zoro-muted">·</span>
          <span className="text-zoro-success font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-zoro-success" />
            ONLINE
          </span>
        </div>

        {/* Central Core Hologram & Surrounding 4 Intelligent Modules */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* LEFT 2 MODULES: INTELLIGENCE & VISION */}
          <div className="flex flex-col gap-4 order-2 md:order-1">
            {/* MODULE 1: INTELLIGENCE */}
            <div
              onClick={() => {
                onNavigate('/intelligence');
                soundService.play('CLICK');
              }}
              className="p-4 rounded-xl border border-zoro-border bg-zoro-panelElevated/70 hover:border-zoro-cyan/50 hover:bg-zoro-panelHighlight transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-zoro-cyan/10 border border-zoro-cyan/30 flex items-center justify-center text-zoro-cyan group-hover:scale-105 transition-transform">
                    <Brain className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold tracking-wider text-zoro-text uppercase font-mono">
                    INTELLIGENCE
                  </span>
                </div>
                <span className="text-[10px] font-mono text-zoro-cyan font-bold">READY</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-zoro-textSecondary font-mono">
                <span>Understand</span>
                <span className="text-zoro-muted">·</span>
                <span>Plan</span>
                <span className="text-zoro-muted">·</span>
                <span>Reason</span>
              </div>
            </div>

            {/* MODULE 2: VISION */}
            <div
              onClick={() => {
                onNavigate('/vision');
                soundService.play('CLICK');
              }}
              className="p-4 rounded-xl border border-zoro-border bg-zoro-panelElevated/70 hover:border-zoro-blue/50 hover:bg-zoro-panelHighlight transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-zoro-blue/10 border border-zoro-blue/30 flex items-center justify-center text-zoro-blue group-hover:scale-105 transition-transform">
                    <Eye className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold tracking-wider text-zoro-text uppercase font-mono">
                    VISION
                  </span>
                </div>
                <span className="text-[10px] font-mono text-zoro-blue font-bold">ACTIVE</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-zoro-textSecondary font-mono">
                <span>See</span>
                <span className="text-zoro-muted">·</span>
                <span>Analyze</span>
                <span className="text-zoro-muted">·</span>
                <span>Multimodal</span>
              </div>
            </div>
          </div>

          {/* CENTER: HOLOGRAPHIC ZORO CORE */}
          <div className="flex flex-col items-center justify-center order-1 md:order-2 my-2">
            <div className="relative w-64 h-64 flex items-center justify-center select-none">
              {/* Outer Orbital Ring 1 with Scanning Dash */}
              <div
                className={`absolute inset-0 rounded-full border border-dashed ${stateMeta.border} opacity-50 ${stateMeta.ringSpeed}`}
                style={{ boxShadow: `0 0 35px ${stateMeta.glow}` }}
              />

              {/* Orbital Ring 2 (Counter-Rotating Blue Ring) */}
              <div
                className="absolute inset-3 rounded-full border border-zoro-blue/40 opacity-70 animate-[spin_18s_linear_infinite_reverse]"
                style={{
                  transform: `rotate(${-pulseAngle}deg)`,
                }}
              />

              {/* Orbital Ring 3 (Multi-Axis Gyroscope Ring) */}
              <div
                className="absolute inset-7 rounded-full border-2 border-t-zoro-cyan border-r-transparent border-b-zoro-violet border-l-transparent opacity-80 animate-[spin_11s_linear_infinite]"
              />

              {/* Energy Ring 4 (Inner Pulsing Border) */}
              <div className="absolute inset-11 rounded-full border border-zoro-cyan/20 animate-pulse" />

              {/* Center Core Button */}
              <button
                onClick={() => {
                  onOpenVoice();
                  soundService.play('VOICE_ACTIVATED');
                }}
                className="relative w-36 h-36 rounded-full bg-gradient-to-br from-[#0B182B] via-[#07111D] to-[#03070D] border-2 border-zoro-cyan/40 hover:border-zoro-cyan flex flex-col items-center justify-center shadow-[inset_0_0_30px_rgba(25,217,255,0.25)] transition-all group focus:outline-none focus:ring-2 focus:ring-zoro-cyan"
                aria-label="Activate Zoro Voice and Neural Core"
              >
                {/* Center Core Identification */}
                <div className="text-center font-mono">
                  <div className="text-base font-black tracking-widest text-zoro-cyan drop-shadow-[0_0_12px_#19D9FF]">
                    ZORO
                  </div>
                  <div className="text-[9px] font-bold tracking-[0.2em] text-zoro-text uppercase">
                    OMNIA CORE
                  </div>
                  <div className="text-[8px] font-medium text-zoro-textSecondary">
                    v2.0
                  </div>
                </div>

                {/* Animated Core Energy Center */}
                <div className="relative mt-1.5 flex items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-zoro-cyan opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-zoro-cyan shadow-[0_0_10px_#19D9FF]" />
                </div>
              </button>

              {/* Orbital Telemetry Anchors */}
              <div className="absolute top-2 left-6 text-[9px] font-mono text-zoro-textMuted flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-zoro-cyan animate-pulse" />
                <span>N-2.5</span>
              </div>
              <div className="absolute bottom-2 right-6 text-[9px] font-mono text-zoro-textMuted flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-zoro-blue" />
                <span>38ms</span>
              </div>
            </div>

            {/* Dynamic Status Display Below Core */}
            <div className="text-center mt-3 font-mono space-y-0.5">
              <div className={`text-xs font-black tracking-widest uppercase ${stateMeta.color}`}>
                {stateMeta.label}
              </div>
              <div className="text-[10px] text-zoro-textMuted tracking-wider">
                {stateMeta.sublabel}
              </div>
            </div>
          </div>

          {/* RIGHT 2 MODULES: AGENTS & MEMORY */}
          <div className="flex flex-col gap-4 order-3">
            {/* MODULE 3: AGENTS */}
            <div
              onClick={() => {
                onNavigate('/agents');
                soundService.play('CLICK');
              }}
              className="p-4 rounded-xl border border-zoro-border bg-zoro-panelElevated/70 hover:border-zoro-violet/50 hover:bg-zoro-panelHighlight transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-zoro-violet/10 border border-zoro-violet/30 flex items-center justify-center text-zoro-violet group-hover:scale-105 transition-transform">
                    <Bot className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold tracking-wider text-zoro-text uppercase font-mono">
                    AGENTS
                  </span>
                </div>
                <span className={`text-[10px] font-mono font-bold ${agentActive ? 'text-zoro-cyan animate-pulse' : 'text-zoro-violet'}`}>
                  {agentActive ? 'ACTIVE' : 'COUNCIL READY'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-zoro-textSecondary font-mono">
                <span>Coordinate</span>
                <span className="text-zoro-muted">·</span>
                <span>Execute</span>
                <span className="text-zoro-muted">·</span>
                <span>Verify</span>
              </div>
            </div>

            {/* MODULE 4: MEMORY */}
            <div
              onClick={() => {
                onNavigate('/memory');
                soundService.play('CLICK');
              }}
              className="p-4 rounded-xl border border-zoro-border bg-zoro-panelElevated/70 hover:border-zoro-success/50 hover:bg-zoro-panelHighlight transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-zoro-success/10 border border-zoro-success/30 flex items-center justify-center text-zoro-success group-hover:scale-105 transition-transform">
                    <Database className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold tracking-wider text-zoro-text uppercase font-mono">
                    MEMORY
                  </span>
                </div>
                <span className="text-[10px] font-mono text-zoro-success font-bold">
                  {memoryNodeCount} NODES
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-zoro-textSecondary font-mono">
                <span>Remember</span>
                <span className="text-zoro-muted">·</span>
                <span>Evolve</span>
                <span className="text-zoro-muted">·</span>
                <span>Context</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

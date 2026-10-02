import React from 'react';
import {
  Brain,
  Eye,
  Zap,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  Cpu,
} from 'lucide-react';
import { ThreeBladeLines, ZoroBadge } from './ZoroUI';
import { RoutePath } from '../../types';
import { soundService } from '../../services/sound';
import heroImg from '../../assets/images/zoro_command_hero_1790946088687.jpg';

interface ZoroHeroProps {
  onNavigate: (path: RoutePath) => void;
  activeMissionCount?: number;
  storedMemoryCount?: number;
}

export const ZoroHero: React.FC<ZoroHeroProps> = ({
  onNavigate,
  activeMissionCount = 0,
  storedMemoryCount = 0,
}) => {
  return (
    <div className="space-y-4">
      {/* ---------------------------------------------------- */}
      {/* 1. HERO / ZORO CORE CENTERPIECE (Section 6)          */}
      {/* ---------------------------------------------------- */}
      <div className="relative rounded-2xl border border-zoro-border bg-zoro-panel overflow-hidden shadow-2xl">
        {/* Subtle background glow & gradient scrim */}
        <div className="absolute inset-0 bg-gradient-to-r from-zoro-bg via-zoro-panel/90 to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-2/3 h-full overflow-hidden opacity-30 sm:opacity-40 pointer-events-none">
          <img
            src={heroImg}
            alt="Zoro 2.0 AI Core Visual"
            className="w-full h-full object-cover object-center filter saturate-120"
            onError={(e) => {
              // Graceful fallback to dark gradient container if path changes
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zoro-panel via-transparent to-zoro-panel" />
          <div className="absolute inset-0 bg-gradient-to-r from-zoro-panel via-transparent to-zoro-panel" />
        </div>

        {/* Content Box */}
        <div className="relative z-20 p-5 sm:p-7 max-w-2xl space-y-3.5">
          <div className="flex items-center gap-2">
            <ThreeBladeLines />
            <span className="text-[10px] font-mono tracking-[0.25em] text-zoro-emerald font-bold uppercase">
              TACTICAL AI OPERATING ENVIRONMENT
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-4xl font-black tracking-wider text-zoro-text uppercase font-mono">
              ZORO <span className="text-zoro-emerald">AI CORE</span> 2.0
            </h1>
            <p className="text-xs sm:text-sm font-semibold tracking-wide text-zoro-emerald font-mono">
              THREE BLADES. ONE INTELLIGENCE.
            </p>
            <p className="text-[11px] text-zoro-textSecondary tracking-wide">
              &ldquo;Three blades. One mind. Zero distraction.&rdquo;
            </p>
          </div>

          <p className="text-xs text-zoro-textSecondary leading-relaxed max-w-xl">
            Autonomous tactical command center orchestrating predictive reasoning, multimodal visual telemetry, and controlled multi-agent task execution.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={() => {
                onNavigate('/missions');
                soundService.play('CLICK');
              }}
              className="px-4 py-2 rounded-lg bg-zoro-emerald text-black font-mono font-bold text-xs hover:bg-zoro-emeraldDark transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,255,156,0.25)]"
            >
              <span>COMMAND OBJECTIVES</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                onNavigate('/vision');
                soundService.play('CLICK');
              }}
              className="px-4 py-2 rounded-lg border border-zoro-cyan/40 bg-zoro-cyan/10 text-zoro-cyan font-mono font-bold text-xs hover:bg-zoro-cyan/20 transition-all flex items-center gap-2"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>ZORO VISION</span>
            </button>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. THREE BLADE CAPABILITY ARCHITECTURE (Section 7)   */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 font-mono">
        {/* BLADE 01: INTELLIGENCE */}
        <div
          onClick={() => {
            onNavigate('/memory');
            soundService.play('CLICK');
          }}
          className="rounded-xl border border-zoro-border hover:border-zoro-emerald/50 bg-zoro-panel p-4 transition-all duration-200 cursor-pointer group hover:bg-zoro-panelElevated shadow-sm hover:shadow-[0_0_15px_rgba(0,255,156,0.08)] space-y-2.5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-zoro-emerald/10 border border-zoro-emerald/30 text-zoro-emerald group-hover:scale-105 transition-transform">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-zoro-textMuted uppercase font-bold tracking-wider">
                  BLADE 01
                </div>
                <div className="font-extrabold text-xs text-zoro-text group-hover:text-zoro-emerald transition-colors">
                  INTELLIGENCE
                </div>
              </div>
            </div>
            <span className="text-[10px] text-zoro-emerald font-bold">ONLINE</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[10px] text-zoro-textSecondary pt-1 border-t border-zoro-border/40">
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-zoro-emerald" />
              <span>Memory Matrix</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-zoro-emerald" />
              <span>Reasoning Core</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-zoro-emerald" />
              <span>Context Engine</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-zoro-emerald" />
              <span>Planning System</span>
            </div>
          </div>
        </div>

        {/* BLADE 02: VISION */}
        <div
          onClick={() => {
            onNavigate('/vision');
            soundService.play('CLICK');
          }}
          className="rounded-xl border border-zoro-border hover:border-zoro-cyan/50 bg-zoro-panel p-4 transition-all duration-200 cursor-pointer group hover:bg-zoro-panelElevated shadow-sm hover:shadow-[0_0_15px_rgba(0,217,255,0.08)] space-y-2.5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-zoro-cyan/10 border border-zoro-cyan/30 text-zoro-cyan group-hover:scale-105 transition-transform">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-zoro-textMuted uppercase font-bold tracking-wider">
                  BLADE 02
                </div>
                <div className="font-extrabold text-xs text-zoro-text group-hover:text-zoro-cyan transition-colors">
                  VISION
                </div>
              </div>
            </div>
            <span className="text-[10px] text-zoro-cyan font-bold">READY</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[10px] text-zoro-textSecondary pt-1 border-t border-zoro-border/40">
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-zoro-cyan" />
              <span>Image Analysis</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-zoro-cyan" />
              <span>OCR Extraction</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-zoro-cyan" />
              <span>Visual UI Audit</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-zoro-cyan" />
              <span>Screen Intel</span>
            </div>
          </div>
        </div>

        {/* BLADE 03: ACTION */}
        <div
          onClick={() => {
            onNavigate('/agents');
            soundService.play('CLICK');
          }}
          className="rounded-xl border border-zoro-border hover:border-zoro-gold/50 bg-zoro-panel p-4 transition-all duration-200 cursor-pointer group hover:bg-zoro-panelElevated shadow-sm hover:shadow-[0_0_15px_rgba(255,176,0,0.08)] space-y-2.5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-zoro-gold/10 border border-zoro-gold/30 text-zoro-gold group-hover:scale-105 transition-transform">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-zoro-textMuted uppercase font-bold tracking-wider">
                  BLADE 03
                </div>
                <div className="font-extrabold text-xs text-zoro-text group-hover:text-zoro-gold transition-colors">
                  ACTION
                </div>
              </div>
            </div>
            <span className="text-[10px] text-zoro-gold font-bold">ARMED</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[10px] text-zoro-textSecondary pt-1 border-t border-zoro-border/40">
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-zoro-gold" />
              <span>Autonomous Agents</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-zoro-gold" />
              <span>Automations</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-zoro-gold" />
              <span>Action Queue</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-zoro-gold" />
              <span>Workflows</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

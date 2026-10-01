import React from 'react';
import { AIOrbState } from '../types';

interface AIOrbProps {
  state: AIOrbState;
  size?: number;
  className?: string;
}

export const AIOrb: React.FC<AIOrbProps> = ({ state, size = 180, className = '' }) => {
  const getColor = () => {
    switch (state) {
      case 'LISTENING':
        return '#19F59A';
      case 'THINKING':
        return '#00D084';
      case 'SPEAKING':
        return '#38E1FF';
      case 'EXECUTING':
        return '#FFB000';
      case 'ERROR':
        return '#FF3B30';
      case 'SUCCESS':
        return '#00D084';
      default:
        return '#087F55';
    }
  };

  const currentColor = getColor();

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      title={`AI CORE STATE: ${state}`}
    >
      {/* Outer Pulse Ring */}
      <div
        className="absolute inset-0 rounded-full border border-dashed transition-all duration-700 animate-spin-slow opacity-40"
        style={{ borderColor: currentColor }}
      />

      {/* Counter rotating secondary ring */}
      <div
        className="absolute inset-2 rounded-full border border-dotted transition-all duration-700 animate-spin-reverse opacity-60"
        style={{ borderColor: currentColor }}
      />

      {/* Glow Backdrop */}
      <div
        className="absolute inset-4 rounded-full filter blur-xl opacity-30 animate-pulse-glow transition-all duration-500"
        style={{ backgroundColor: currentColor }}
      />

      {/* Three-Blade Tactical Geometry */}
      <svg
        viewBox="0 0 100 100"
        className="w-3/4 h-3/4 z-10 drop-shadow-[0_0_12px_rgba(0,208,132,0.4)]"
      >
        {/* Core Center Ring */}
        <circle cx="50" cy="50" r="16" fill="#0A100D" stroke={currentColor} strokeWidth="1.5" />
        <circle cx="50" cy="50" r="8" fill={currentColor} opacity={state === 'THINKING' ? '0.9' : '0.4'} />

        {/* Blade 01: Top (Knowledge) */}
        <path
          d="M 50 10 L 53 40 L 47 40 Z"
          fill={currentColor}
          opacity="0.85"
          className="transition-all duration-300"
        />
        <line x1="50" y1="6" x2="50" y2="40" stroke="#F5F7F6" strokeWidth="0.8" />

        {/* Blade 02: Bottom Right (Action) */}
        <g transform="rotate(120 50 50)">
          <path d="M 50 10 L 53 40 L 47 40 Z" fill={currentColor} opacity="0.85" />
          <line x1="50" y1="6" x2="50" y2="40" stroke="#F5F7F6" strokeWidth="0.8" />
        </g>

        {/* Blade 03: Bottom Left (Memory) */}
        <g transform="rotate(240 50 50)">
          <path d="M 50 10 L 53 40 L 47 40 Z" fill={currentColor} opacity="0.85" />
          <line x1="50" y1="6" x2="50" y2="40" stroke="#F5F7F6" strokeWidth="0.8" />
        </g>

        {/* Tactical Crosshair Tick Marks */}
        <circle cx="50" cy="50" r="38" fill="none" stroke={currentColor} strokeWidth="0.5" strokeDasharray="3 4" opacity="0.5" />
      </svg>

      {/* State Badge */}
      <div className="absolute -bottom-3 px-2 py-0.5 rounded bg-[#0A100D] border border-[#16281F] text-[9px] font-mono tracking-wider font-bold z-20 text-[#19F59A]">
        {state}
      </div>
    </div>
  );
};

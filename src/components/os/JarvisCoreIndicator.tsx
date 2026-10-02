import React from 'react';
import { JARVISCoreIndicatorState } from '../../types';

interface JarvisCoreIndicatorProps {
  state: JARVISCoreIndicatorState;
  onClick?: () => void;
}

export const JarvisCoreIndicator: React.FC<JarvisCoreIndicatorProps> = ({
  state,
  onClick,
}) => {
  const getColor = () => {
    switch (state) {
      case 'ERROR':
        return 'text-[#FF3B30] border-[#FF3B30] shadow-[0_0_12px_#FF3B30]';
      case 'EXECUTING':
      case 'VERIFYING':
        return 'text-[#19F59A] border-[#19F59A] shadow-[0_0_12px_#19F59A] animate-pulse';
      case 'PLANNING':
      case 'PROCESSING':
        return 'text-[#38E1FF] border-[#38E1FF] shadow-[0_0_12px_#38E1FF] animate-pulse';
      case 'LISTENING':
        return 'text-[#FFB000] border-[#FFB000] shadow-[0_0_12px_#FFB000] animate-bounce';
      case 'READY':
      default:
        return 'text-[#19F59A] border-[#00D084]/40 hover:border-[#19F59A]';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#050706] border cursor-pointer select-none transition-all font-mono text-[10px] ${getColor()}`}
      title={`JARVIS Core State: ${state}`}
    >
      <span className="text-xs">◈</span>
      <div className="flex flex-col text-left leading-tight">
        <span className="text-[8px] text-[#8B9992] tracking-widest font-bold">JARVIS CORE</span>
        <span className="font-bold">{state}</span>
      </div>
    </div>
  );
};

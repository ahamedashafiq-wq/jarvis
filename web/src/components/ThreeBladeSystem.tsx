import React from 'react';
import { BookOpen, Zap, Database } from 'lucide-react';

interface ThreeBladeSystemProps {
  knowledgeCount?: number;
  actionCount?: number;
  memoryCount?: number;
  activeBlade?: 1 | 2 | 3 | null;
  onBladeClick?: (blade: 1 | 2 | 3) => void;
}

export const ThreeBladeSystem: React.FC<ThreeBladeSystemProps> = ({
  knowledgeCount = 1,
  actionCount = 0,
  memoryCount = 0,
  activeBlade = null,
  onBladeClick,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
      {/* Blade 01: Knowledge */}
      <div
        onClick={() => onBladeClick?.(1)}
        className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
          activeBlade === 1
            ? 'bg-[#121C17] border-[#00D084] shadow-[0_0_15px_rgba(0,208,132,0.2)]'
            : 'bg-[#0A100D] border-[#16281F] hover:border-[#00D084]/40'
        }`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#38E1FF]" />
            <span className="text-[11px] font-mono font-bold tracking-wider text-[#F5F7F6]">
              BLADE 01: KNOWLEDGE
            </span>
          </div>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#38E1FF]/10 text-[#38E1FF]">
            SYNAPSE
          </span>
        </div>
        <p className="text-[10px] text-[#8B9992] mb-2">
          Gemini AI intellect, system prompts, context buffers.
        </p>
        <div className="flex items-center justify-between pt-1 border-t border-[#16281F] text-[10px] font-mono">
          <span className="text-[#8B9992]">INTELLIGENCE:</span>
          <span className="text-[#19F59A] font-bold">ONLINE</span>
        </div>
      </div>

      {/* Blade 02: Action */}
      <div
        onClick={() => onBladeClick?.(2)}
        className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
          activeBlade === 2
            ? 'bg-[#121C17] border-[#00D084] shadow-[0_0_15px_rgba(0,208,132,0.2)]'
            : 'bg-[#0A100D] border-[#16281F] hover:border-[#00D084]/40'
        }`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#00D084]" />
            <span className="text-[11px] font-mono font-bold tracking-wider text-[#F5F7F6]">
              BLADE 02: ACTION
            </span>
          </div>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#00D084]/10 text-[#00D084]">
            DIRECTIVES
          </span>
        </div>
        <p className="text-[10px] text-[#8B9992] mb-2">
          Task execution, combat focus sessions, tactical commands.
        </p>
        <div className="flex items-center justify-between pt-1 border-t border-[#16281F] text-[10px] font-mono">
          <span className="text-[#8B9992]">ACTIVE TASKS:</span>
          <span className="text-[#00D084] font-bold">{actionCount} QUEUED</span>
        </div>
      </div>

      {/* Blade 03: Memory */}
      <div
        onClick={() => onBladeClick?.(3)}
        className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
          activeBlade === 3
            ? 'bg-[#121C17] border-[#00D084] shadow-[0_0_15px_rgba(0,208,132,0.2)]'
            : 'bg-[#0A100D] border-[#16281F] hover:border-[#00D084]/40'
        }`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#FFB000]" />
            <span className="text-[11px] font-mono font-bold tracking-wider text-[#F5F7F6]">
              BLADE 03: MEMORY
            </span>
          </div>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#FFB000]/10 text-[#FFB000]">
            PERSISTENCE
          </span>
        </div>
        <p className="text-[10px] text-[#8B9992] mb-2">
          Operator recall bank, preference nodes, secure RLS storage.
        </p>
        <div className="flex items-center justify-between pt-1 border-t border-[#16281F] text-[10px] font-mono">
          <span className="text-[#8B9992]">INDEXED NODES:</span>
          <span className="text-[#FFB000] font-bold">{memoryCount} STORED</span>
        </div>
      </div>
    </div>
  );
};

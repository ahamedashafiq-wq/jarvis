import React from 'react';
import { RoutePath } from '../types';
import { Brain, CheckSquare, Database, ArrowRight, Activity } from 'lucide-react';

interface ThreeBladeSystemProps {
  onNavigate: (path: RoutePath) => void;
  activeTasksCount: number;
  totalMemoriesCount: number;
}

export const ThreeBladeSystem: React.FC<ThreeBladeSystemProps> = ({
  onNavigate,
  activeTasksCount,
  totalMemoriesCount,
}) => {
  const blades = [
    {
      id: 'blade_01',
      name: 'BLADE 01: ENMA',
      role: 'KNOWLEDGE & INTELLIGENCE',
      desc: 'Google Gemini Neural Core with Real-Time Intent Matrix',
      status: 'SYNCHRONIZED',
      stat: 'AI STREAM ONLINE',
      statLabel: 'LATENCY ~45ms',
      color: 'border-[#00D084]',
      badgeColor: 'bg-[#00D084]/15 text-[#19F59A]',
      icon: <Brain className="w-5 h-5 text-[#19F59A]" />,
      route: '/chat' as RoutePath,
    },
    {
      id: 'blade_02',
      name: 'BLADE 02: WADO ICHIMONJI',
      role: 'ACTION & EXECUTION',
      desc: 'High-discipline task queue with priority scheduling',
      status: activeTasksCount > 0 ? `${activeTasksCount} ACTIVE` : 'CLEARED',
      stat: `${activeTasksCount} PENDING`,
      statLabel: 'DISCIPLINE QUEUE',
      color: 'border-[#38E1FF]',
      badgeColor: 'bg-[#38E1FF]/15 text-[#38E1FF]',
      icon: <CheckSquare className="w-5 h-5 text-[#38E1FF]" />,
      route: '/tasks' as RoutePath,
    },
    {
      id: 'blade_03',
      name: 'BLADE 03: SANDAI KITETSU',
      role: 'MEMORY & PERSISTENCE',
      desc: 'Immutable context envelopes injected into AI cognition',
      status: `${totalMemoriesCount} NODES`,
      stat: `${totalMemoriesCount} STORED`,
      statLabel: 'PERSISTENT BANK',
      color: 'border-[#FFB000]',
      badgeColor: 'bg-[#FFB000]/15 text-[#FFB000]',
      icon: <Database className="w-5 h-5 text-[#FFB000]" />,
      route: '/memory' as RoutePath,
    },
  ];

  return (
    <div className="space-y-3 font-mono">
      <div className="flex items-center justify-between text-xs text-[#8B9992] px-1">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#19F59A]" />
          <span className="font-bold tracking-wider text-[#F5F7F6]">SANTORYU THREE BLADES ARCHITECTURE</span>
        </div>
        <span className="text-[10px] text-[#19F59A] bg-[#00D084]/10 border border-[#00D084]/30 px-2 py-0.5 rounded">
          ALIGNMENT 100%
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {blades.map((blade) => (
          <div
            key={blade.id}
            onClick={() => onNavigate(blade.route)}
            className={`p-4 rounded-xl bg-[#0A100D] border ${blade.color} transition-all duration-200 hover:bg-[#121C17] hover:scale-[1.01] cursor-pointer relative overflow-hidden group`}
          >
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 rounded-lg bg-[#050706] border border-[#16281F] flex items-center justify-center">
                {blade.icon}
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${blade.badgeColor}`}>
                {blade.status}
              </span>
            </div>

            <div className="mt-3">
              <h3 className="text-xs font-bold text-[#F5F7F6] tracking-wide">{blade.name}</h3>
              <p className="text-[10px] text-[#8B9992] tracking-wider mt-0.5">{blade.role}</p>
              <p className="text-[11px] text-[#8B9992]/80 mt-2 font-sans line-clamp-2 leading-relaxed">
                {blade.desc}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#16281F] flex items-center justify-between text-xs">
              <div>
                <span className="text-xs font-bold text-[#F5F7F6]">{blade.stat}</span>
                <span className="text-[9px] text-[#8B9992] ml-1.5">{blade.statLabel}</span>
              </div>
              <div className="flex items-center text-[#19F59A] text-[11px] font-bold gap-1 group-hover:translate-x-1 transition-transform">
                <span>ENGAGE</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

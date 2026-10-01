import React, { useState } from 'react';
import { BarChart3, CheckCircle, Clock, Zap, Database, TrendingUp } from 'lucide-react';
import { RoutePath } from '../types';

interface AnalyticsProps {
  onNavigate: (path: RoutePath) => void;
}

export const Analytics: React.FC<AnalyticsProps> = () => {
  const [timeframe, setTimeframe] = useState<'24H' | '7D' | '30D' | 'ALL'>('7D');

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#16281F] pb-4">
        <div>
          <h1 className="text-xl font-black text-[#F5F7F6] tracking-wider">
            PRODUCTIVITY & COMBAT ANALYTICS
          </h1>
          <p className="text-xs text-[#8B9992] mt-0.5">
            DISCIPLINE TELEMETRY • MISSION ACCOMPLISHMENT METRICS
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[#0A100D] border border-[#16281F] rounded p-1 text-xs">
          {(['24H', '7D', '30D', 'ALL'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1 rounded transition-all ${
                timeframe === t
                  ? 'bg-[#00D084] text-[#050706] font-bold'
                  : 'text-[#8B9992] hover:text-[#F5F7F6]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0A100D] border border-[#16281F]">
          <div className="flex items-center justify-between mb-2 text-[#8B9992] text-xs">
            <span>TASKS CLEARED</span>
            <CheckCircle className="w-4 h-4 text-[#00D084]" />
          </div>
          <div className="text-2xl font-black text-[#F5F7F6]">14 / 16</div>
          <div className="text-[10px] text-[#19F59A] mt-1 font-bold">87.5% RATE</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0A100D] border border-[#16281F]">
          <div className="flex items-center justify-between mb-2 text-[#8B9992] text-xs">
            <span>FOCUS HOURS</span>
            <Clock className="w-4 h-4 text-[#FFB000]" />
          </div>
          <div className="text-2xl font-black text-[#F5F7F6]">18.4 h</div>
          <div className="text-[10px] text-[#FFB000] mt-1 font-bold">+2.5h TODAY</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0A100D] border border-[#16281F]">
          <div className="flex items-center justify-between mb-2 text-[#8B9992] text-xs">
            <span>CLI DIRECTIVES</span>
            <Zap className="w-4 h-4 text-[#38E1FF]" />
          </div>
          <div className="text-2xl font-black text-[#F5F7F6]">142</div>
          <div className="text-[10px] text-[#38E1FF] mt-1 font-bold">ZERO ERRORS</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0A100D] border border-[#16281F]">
          <div className="flex items-center justify-between mb-2 text-[#8B9992] text-xs">
            <span>MEMORY NODES</span>
            <Database className="w-4 h-4 text-[#00D084]" />
          </div>
          <div className="text-2xl font-black text-[#F5F7F6]">28</div>
          <div className="text-[10px] text-[#19F59A] mt-1 font-bold">100% PERSISTENT</div>
        </div>
      </div>

      {/* Activity Timeline Breakdown */}
      <div className="p-5 rounded-xl bg-[#0A100D] border border-[#16281F] space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#F5F7F6]">
            WEEKLY FOCUS & DISCIPLINE CURVE
          </span>
          <span className="text-[10px] text-[#19F59A] flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> OPTIMAL EFFICIENCY
          </span>
        </div>

        {/* Tactical Bar Chart */}
        <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-[#16281F]">
          {[
            { day: 'MON', val: 75 },
            { day: 'TUE', val: 90 },
            { day: 'WED', val: 60 },
            { day: 'THU', val: 95 },
            { day: 'FRI', val: 80 },
            { day: 'SAT', val: 100 },
            { day: 'SUN', val: 85 },
          ].map((bar) => (
            <div key={bar.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div
                className="w-full max-w-[36px] rounded-t bg-gradient-to-t from-[#00D084]/40 to-[#00D084] hover:to-[#19F59A] transition-all"
                style={{ height: `${bar.val}%` }}
              />
              <span className="text-[9px] text-[#8B9992]">{bar.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

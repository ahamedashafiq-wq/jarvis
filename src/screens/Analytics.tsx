import React, { useState } from 'react';
import { BarChart3, CheckCircle, Clock, Zap, Database, TrendingUp, ArrowLeft, Shield } from 'lucide-react';
import { RoutePath, Task, Memory, FocusSession } from '../types';
import { useAuth } from '../context/AuthContext';
import { getLocalStore } from '../services/supabase';

interface AnalyticsProps {
  onNavigate: (path: RoutePath) => void;
}

export const Analytics: React.FC<AnalyticsProps> = ({ onNavigate }) => {
  const { currentSession } = useAuth();
  const userId = currentSession?.userId || 'guest';

  const [timeframe, setTimeframe] = useState<'24H' | '7D' | '30D' | 'ALL'>('7D');

  const tasks = getLocalStore<Task[]>(`tasks_${userId}`, []);
  const memories = getLocalStore<Memory[]>(`memories_${userId}`, []);
  const focusSessions = getLocalStore<FocusSession[]>(`focus_sessions_${userId}`, []);

  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
  const taskRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 100;
  const totalFocusMinutes = focusSessions.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#16281F] pb-4">
        <div>
          <h1 className="text-xl font-black text-[#F5F7F6] tracking-wider flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#19F59A]" />
            PRODUCTIVITY & COMBAT ANALYTICS
          </h1>
          <p className="text-[10px] text-[#8B9992] mt-0.5">
            DISCIPLINE TELEMETRY • MISSION ACCOMPLISHMENT METRICS
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#19F59A] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>COMMAND DECK</span>
          </button>
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
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0A100D] border border-[#16281F]">
          <div className="flex items-center justify-between mb-2 text-[#8B9992] text-xs">
            <span>TASKS CLEARED</span>
            <CheckCircle className="w-4 h-4 text-[#00D084]" />
          </div>
          <div className="text-2xl font-black text-[#F5F7F6]">{completedTasks} / {tasks.length}</div>
          <div className="text-[10px] text-[#19F59A] mt-1 font-bold">{taskRate}% RATE</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0A100D] border border-[#16281F]">
          <div className="flex items-center justify-between mb-2 text-[#8B9992] text-xs">
            <span>FOCUS PROTOCOL</span>
            <Clock className="w-4 h-4 text-[#FFB000]" />
          </div>
          <div className="text-2xl font-black text-[#F5F7F6]">{totalFocusMinutes} min</div>
          <div className="text-[10px] text-[#FFB000] mt-1 font-bold">{focusSessions.length} SESSIONS</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0A100D] border border-[#16281F]">
          <div className="flex items-center justify-between mb-2 text-[#8B9992] text-xs">
            <span>MEMORY NODES</span>
            <Database className="w-4 h-4 text-[#38E1FF]" />
          </div>
          <div className="text-2xl font-black text-[#F5F7F6]">{memories.length}</div>
          <div className="text-[10px] text-[#38E1FF] mt-1 font-bold">100% PERSISTENT</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0A100D] border border-[#16281F]">
          <div className="flex items-center justify-between mb-2 text-[#8B9992] text-xs">
            <span>WARRIOR DISCIPLINE</span>
            <TrendingUp className="w-4 h-4 text-[#19F59A]" />
          </div>
          <div className="text-2xl font-black text-[#F5F7F6]">98.2%</div>
          <div className="text-[10px] text-[#19F59A] mt-1 font-bold">RANK: ASURA MASTER</div>
        </div>
      </div>

      {/* Focus & Execution Trajectory */}
      <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#16281F] space-y-4">
        <div className="flex items-center justify-between border-b border-[#16281F] pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#19F59A]" />
            <h3 className="font-bold text-xs text-[#F5F7F6] tracking-wider">
              WEEKLY EXECUTION DISTRIBUTION
            </h3>
          </div>
          <span className="text-[10px] text-[#8B9992]">HOURS DEDICATED</span>
        </div>

        <div className="flex items-end justify-between h-44 pt-4 px-2">
          {[
            { day: 'MON', val: 75, label: '3.5h' },
            { day: 'TUE', val: 90, label: '4.2h' },
            { day: 'WED', val: 60, label: '2.8h' },
            { day: 'THU', val: 85, label: '3.9h' },
            { day: 'FRI', val: 95, label: '4.8h' },
            { day: 'SAT', val: 50, label: '2.1h' },
            { day: 'SUN', val: 80, label: '3.7h' },
          ].map((bar) => (
            <div key={bar.day} className="flex flex-col items-center gap-2 flex-1">
              <span className="text-[9px] text-[#8B9992]">{bar.label}</span>
              <div className="w-8 sm:w-12 bg-[#050706] rounded-t-lg h-32 flex items-end justify-center p-1 border border-[#16281F]">
                <div
                  className="w-full bg-[#00D084] rounded-t transition-all duration-700 hover:bg-[#19F59A]"
                  style={{ height: `${bar.val}%` }}
                />
              </div>
              <span className="text-[10px] text-[#8B9992] font-bold">{bar.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

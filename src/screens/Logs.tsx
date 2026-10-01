import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { RoutePath } from '../types';
import {
  Activity,
  Shield,
  Bell,
  Terminal,
  Trash2,
  ArrowLeft,
  CheckCircle,
  Radio,
  Wifi,
  WifiOff,
  Database,
} from 'lucide-react';
import {
  useRealtime,
  useRealtimeNotifications,
  useRealtimeSystemEvents,
  useRealtimeCommands,
} from '../hooks/useRealtime';

interface LogsProps {
  onNavigate: (path: RoutePath) => void;
}

export const LogsScreen: React.FC<LogsProps> = ({ onNavigate }) => {
  const { isSupabase } = useAuth();
  const { connectionStatus, networkStatus, isOnline } = useRealtime();
  const { notifications, clearAll: clearNotifications } = useRealtimeNotifications();
  const { systemEvents } = useRealtimeSystemEvents();
  const { commands } = useRealtimeCommands();

  const [filter, setFilter] = useState<'ALL' | 'SYSTEM' | 'COMMANDS' | 'NOTIFICATIONS'>('ALL');

  const combinedLogs = [
    ...notifications.map((n) => ({
      id: n.id,
      category: 'NOTIFICATION' as const,
      title: n.title,
      details: n.message,
      type: n.type,
      time: n.created_at,
    })),
    ...systemEvents.map((e) => ({
      id: e.id,
      category: 'SYSTEM' as const,
      title: e.event_type,
      details: e.payload,
      type: 'INFO',
      time: e.created_at,
    })),
    ...commands.map((c) => ({
      id: c.id,
      category: 'COMMAND' as const,
      title: `${c.command} [${c.status}]`,
      details: c.result,
      type: c.status === 'SUCCESS' ? 'SUCCESS' : 'ALERT',
      time: c.created_at,
    })),
  ].sort((a, b) => b.time - a.time);

  const filtered = combinedLogs.filter((l) => {
    if (filter === 'ALL') return true;
    if (filter === 'NOTIFICATIONS') return l.category === 'NOTIFICATION';
    if (filter === 'SYSTEM') return l.category === 'SYSTEM';
    if (filter === 'COMMANDS') return l.category === 'COMMAND';
    return true;
  });

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#16281F] pb-4">
        <div>
          <h1 className="text-xl font-black text-[#F5F7F6] tracking-wider flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#19F59A]" />
            SYSTEM TELEMETRY & LIVE AUDIT LOG
          </h1>
          <p className="text-[10px] text-[#8B9992] mt-0.5">
            KERNEL TRACES • REAL-TIME HARDWARE ENVELOPE • CROSS-TAB AUDIT
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#19F59A] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>COMMAND DECK</span>
          </button>
        </div>
      </div>

      {/* Hardware / Engine Telemetry Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#0A100D] border border-[#16281F]">
          <div className="text-[10px] text-[#8B9992]">KERNEL CORE</div>
          <div className="text-sm font-bold text-[#19F59A] mt-0.5">JARVIS ZORO 2.0</div>
          <div className="text-[9px] text-[#00D084] mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#19F59A] animate-pulse" />
            LIVE TELEMETRY
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0A100D] border border-[#16281F]">
          <div className="text-[10px] text-[#8B9992]">REALTIME STATUS</div>
          <div
            className={`text-sm font-bold mt-0.5 ${
              connectionStatus === 'CONNECTED'
                ? 'text-[#19F59A]'
                : connectionStatus === 'RECONNECTING'
                ? 'text-[#FFB000]'
                : 'text-[#FF3B30]'
            }`}
          >
            {connectionStatus}
          </div>
          <div className="text-[9px] text-[#8B9992] mt-1">
            NETWORK: {networkStatus}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0A100D] border border-[#16281F]">
          <div className="text-[10px] text-[#8B9992]">PERSISTENCE MATRIX</div>
          <div className="text-sm font-bold text-[#FFB000] mt-0.5">
            {isSupabase ? 'SUPABASE PG' : 'LOCAL SANDBOX'}
          </div>
          <div className="text-[9px] text-[#FFB000] mt-1">INTEGRITY: 100%</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0A100D] border border-[#16281F]">
          <div className="text-[10px] text-[#8B9992]">EVENT BUFFER</div>
          <div className="text-sm font-bold text-[#F5F7F6] mt-0.5">{filtered.length} EVENTS</div>
          <div className="text-[9px] text-[#8B9992] mt-1">SYNCHRONIZED</div>
        </div>
      </div>

      {/* Filter Tabs & Clear */}
      <div className="flex items-center justify-between gap-2 border-b border-[#16281F] pb-2">
        <div className="flex items-center gap-1.5">
          {(['ALL', 'SYSTEM', 'COMMANDS', 'NOTIFICATIONS'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === tab
                  ? 'bg-[#00D084] text-[#050706]'
                  : 'bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#F5F7F6]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {notifications.length > 0 && (
          <button
            onClick={clearNotifications}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0A100D] border border-[#FF3B30]/30 text-[#FF3B30] hover:bg-[#FF3B30] hover:text-[#F5F7F6] text-[10px] transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>PURGE NOTIFICATIONS</span>
          </button>
        )}
      </div>

      {/* Events List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-[#8B9992] bg-[#0A100D] border border-[#16281F] rounded-2xl">
            No telemetry records match the current filter parameters.
          </div>
        ) : (
          filtered.map((log) => (
            <div
              key={log.id}
              className="p-3.5 rounded-xl bg-[#0A100D] border border-[#16281F] hover:border-[#00D084]/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      log.category === 'NOTIFICATION'
                        ? 'bg-[#38E1FF]/15 text-[#38E1FF]'
                        : log.category === 'COMMAND'
                        ? 'bg-[#FFB000]/15 text-[#FFB000]'
                        : 'bg-[#00D084]/15 text-[#19F59A]'
                    }`}
                  >
                    {log.category}
                  </span>
                  <span className="font-bold text-[#F5F7F6] text-xs truncate">{log.title}</span>
                </div>
                <div className="text-[11px] text-[#8B9992] break-words font-mono font-sans pr-2">
                  {log.details}
                </div>
              </div>

              <div className="text-right text-[10px] text-[#8B9992] shrink-0 font-mono">
                {new Date(log.time).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

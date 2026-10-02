import React, { useState, useEffect } from 'react';
import {
  Activity,
  Mic,
  CheckSquare,
  Database,
  Bot,
  Eye,
  Target,
  AlertTriangle,
  Info,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { RoutePath } from '../../types';
import { soundService } from '../../services/sound';
import { realtimeService } from '../../services/realtime';
import { getLocalStore, isSupabaseConfigured } from '../../services/supabase';
import { MissionService } from '../../services/mission';
import { MemoryService } from '../../services/memory';
import { AgentCore } from '../../services/agent';

export type EventSeverity = 'INFO' | 'TIP' | 'WARN' | 'SUCCESS' | 'CRITICAL';

export interface IntelligenceEvent {
  id: string;
  timestamp: number;
  eventType:
    | 'VOICE COMMAND RECEIVED'
    | 'TASK CREATED'
    | 'MEMORY SYNCHRONIZED'
    | 'AGENT COMPLETED'
    | 'VISION ANALYSIS COMPLETED'
    | 'MISSION UPDATED'
    | 'SYSTEM SYNAPSE READY';
  description: string;
  status: string;
  severity: EventSeverity;
  route?: RoutePath;
}

interface IntelligenceFeedProps {
  userId: string;
  onNavigate: (path: RoutePath) => void;
  className?: string;
  maxEvents?: number;
}

export const IntelligenceFeed: React.FC<IntelligenceFeedProps> = ({
  userId,
  onNavigate,
  className = '',
  maxEvents = 8,
}) => {
  const [events, setEvents] = useState<IntelligenceEvent[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'AGENTS' | 'MISSIONS' | 'SYSTEM'>('ALL');

  const assembleRealEvents = () => {
    try {
      const list: IntelligenceEvent[] = [];

      // 1. Mission updates
      const missions = MissionService.getMissions(userId);
      missions.slice(0, 3).forEach((m) => {
        const objs = MissionService.getObjectives(userId, m.id);
        list.push({
          id: `msn_${m.id}`,
          timestamp: m.updated_at || m.created_at || Date.now(),
          eventType: 'MISSION UPDATED',
          description: `Target "${m.title}" active with ${objs.length} objectives engaged (${m.progress}%).`,
          status: m.status,
          severity: m.status === 'PAUSED' || m.status === 'CANCELLED' ? 'WARN' : m.progress === 100 ? 'SUCCESS' : 'INFO',
          route: '/missions',
        });
      });

      // 2. Tasks
      const tasks = getLocalStore<any[]>(`tasks_${userId}`, []);
      tasks.slice(0, 3).forEach((t) => {
        list.push({
          id: `task_${t.id}`,
          timestamp: t.created_at ? new Date(t.created_at).getTime() : Date.now(),
          eventType: 'TASK CREATED',
          description: `Discipline queue: "${t.title}" flagged ${t.priority || 'MEDIUM'} priority.`,
          status: t.status,
          severity: t.status === 'COMPLETED' ? 'SUCCESS' : t.priority === 'HIGH' ? 'WARN' : 'INFO',
          route: '/tasks',
        });
      });

      // 3. Memory synchronization
      const memories = MemoryService.getMemories(userId);
      if (memories.length > 0) {
        const latest = memories[0];
        list.push({
          id: `mem_${latest.id}`,
          timestamp: latest.created_at || Date.now(),
          eventType: 'MEMORY SYNCHRONIZED',
          description: `Committed "${latest.category || 'CONTEXT'}" node: ${latest.content.slice(0, 60)}...`,
          status: 'COMMITTED',
          severity: 'TIP',
          route: '/memory',
        });
      }

      // 4. Agent executions
      const agentExecutions = AgentCore.getExecutions(userId);
      agentExecutions.slice(0, 3).forEach((ex) => {
        list.push({
          id: `agt_${ex.id}`,
          timestamp: ex.started_at || Date.now(),
          eventType: 'AGENT COMPLETED',
          description: `Agent dispatched for directive "${ex.objective?.slice(0, 45) || 'system task'}".`,
          status: ex.status,
          severity: ex.status === 'COMPLETE' ? 'SUCCESS' : ex.status === 'FAILED' ? 'CRITICAL' : 'INFO',
          route: '/agents',
        });
      });

      // 5. System synapse ready
      list.push({
        id: 'feed_synapse',
        timestamp: Date.now() - 120000,
        eventType: 'SYSTEM SYNAPSE READY',
        description: isSupabaseConfigured
          ? 'Cloud PostgreSQL synapse synchronized with realtime message broker.'
          : 'Zero-latency local fallback active with cryptographically verified store.',
        status: isSupabaseConfigured ? 'CONNECTED' : 'LOCAL',
        severity: isSupabaseConfigured ? 'SUCCESS' : 'INFO',
        route: '/settings',
      });

      // Sort by timestamp desc
      list.sort((a, b) => b.timestamp - a.timestamp);
      setEvents(list.slice(0, maxEvents));
    } catch (e) {
      console.warn('Error compiling intelligence feed:', e);
    }
  };

  useEffect(() => {
    assembleRealEvents();
  }, [userId]);

  useEffect(() => {
    const unsub = realtimeService.on('*', () => {
      assembleRealEvents();
    });
    return () => unsub();
  }, [userId]);

  const getSeverityBadge = (severity: EventSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'text-zoro-critical border-zoro-critical/40 bg-zoro-critical/10';
      case 'WARN':
        return 'text-zoro-warning border-zoro-warning/40 bg-zoro-warning/10';
      case 'SUCCESS':
        return 'text-zoro-success border-zoro-success/40 bg-zoro-success/10';
      case 'TIP':
        return 'text-zoro-cyan border-zoro-cyan/40 bg-zoro-cyan/10';
      case 'INFO':
      default:
        return 'text-zoro-blue border-zoro-blue/40 bg-zoro-blue/10';
    }
  };

  const getEventIcon = (eventType: IntelligenceEvent['eventType']) => {
    switch (eventType) {
      case 'VOICE COMMAND RECEIVED':
        return <Mic className="w-3.5 h-3.5 text-zoro-cyan" />;
      case 'TASK CREATED':
        return <CheckSquare className="w-3.5 h-3.5 text-zoro-blue" />;
      case 'MEMORY SYNCHRONIZED':
        return <Database className="w-3.5 h-3.5 text-zoro-violet" />;
      case 'AGENT COMPLETED':
        return <Bot className="w-3.5 h-3.5 text-zoro-success" />;
      case 'VISION ANALYSIS COMPLETED':
        return <Eye className="w-3.5 h-3.5 text-zoro-cyan" />;
      case 'MISSION UPDATED':
        return <Target className="w-3.5 h-3.5 text-zoro-warning" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-zoro-cyan" />;
    }
  };

  return (
    <div
      className={`rounded-2xl border border-zoro-border bg-zoro-panel p-5 font-mono select-none space-y-4 shadow-xl flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zoro-border pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-zoro-cyan shadow-[0_0_8px_#19D9FF] animate-pulse" />
          <h2 className="text-xs font-bold text-zoro-text tracking-wider uppercase">
            LIVE INTELLIGENCE
          </h2>
        </div>

        <button
          onClick={() => {
            assembleRealEvents();
            soundService.play('CLICK');
          }}
          className="text-[10px] text-zoro-textMuted hover:text-zoro-cyan flex items-center gap-1 transition-colors"
          title="Refresh Feed"
          aria-label="Refresh Intelligence Feed"
        >
          <RefreshCw className="w-3 h-3" />
          <span>SYNC</span>
        </button>
      </div>

      {/* Events List */}
      <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[380px] pr-1">
        {events.length === 0 ? (
          <div className="p-8 text-center text-zoro-textMuted text-xs">
            Awaiting active telemetry streams. Dispatched commands and actions will stream here.
          </div>
        ) : (
          events.map((ev) => {
            const timeStr = new Date(ev.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <div
                key={ev.id}
                onClick={() => {
                  if (ev.route) {
                    onNavigate(ev.route);
                    soundService.play('CLICK');
                  }
                }}
                className={`p-3 rounded-xl border border-zoro-border bg-zoro-panelElevated/80 hover:border-zoro-cyan/40 hover:bg-zoro-panelHighlight transition-all ${
                  ev.route ? 'cursor-pointer' : ''
                } group`}
              >
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <div className="flex items-center gap-1.5 font-bold tracking-wider">
                    {getEventIcon(ev.eventType)}
                    <span className="text-zoro-text">{ev.eventType}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.2 rounded border text-[9px] font-bold ${getSeverityBadge(ev.severity)}`}>
                      {ev.severity}
                    </span>
                    <span className="text-zoro-textMuted tabular-nums text-[9px]">
                      {timeStr}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-zoro-textSecondary leading-relaxed font-sans line-clamp-2">
                  {ev.description}
                </p>

                <div className="mt-2 pt-1.5 border-t border-zoro-border/40 flex items-center justify-between text-[9px] text-zoro-textMuted font-mono">
                  <div className="flex items-center gap-1">
                    <span>STATUS:</span>
                    <span className="text-zoro-cyan font-bold">{ev.status}</span>
                  </div>
                  {ev.route && (
                    <span className="text-zoro-cyan group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      VIEW <ArrowRight className="w-2.5 h-2.5 inline" />
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

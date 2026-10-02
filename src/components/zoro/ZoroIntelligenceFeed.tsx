import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Target,
  CheckSquare,
  Brain,
  ShieldCheck,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { MissionService } from '../../services/mission';
import { MemoryService } from '../../services/memory';
import { isSupabaseConfigured, getLocalStore } from '../../services/supabase';
import { Task, RoutePath } from '../../types';
import { soundService } from '../../services/sound';

export interface ProactiveItem {
  id: string;
  category: 'PROJECT' | 'TASK' | 'MEMORY' | 'FOCUS' | 'SYSTEM';
  title: string;
  description: string;
  actionRoute: RoutePath;
  actionLabel: string;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface ZoroIntelligenceFeedProps {
  userId: string;
  onNavigate: (path: RoutePath) => void;
}

export const ZoroIntelligenceFeed: React.FC<ZoroIntelligenceFeedProps> = ({
  userId,
  onNavigate,
}) => {
  const [feedItems, setFeedItems] = useState<ProactiveItem[]>([]);

  useEffect(() => {
    const generateFeed = () => {
      const items: ProactiveItem[] = [];

      // 1. Mission data check
      try {
        const missions = MissionService.getMissions(userId);
        const activeMissions = missions.filter((m) => m.status === 'ACTIVE');
        if (activeMissions.length > 0) {
          const primary = activeMissions[0];
          items.push({
            id: 'feed_msn_' + primary.id,
            category: 'PROJECT',
            title: `Active Mission: ${primary.title}`,
            description: `Progress currently at ${primary.progress}%. Priority target engaged.`,
            actionRoute: '/missions',
            actionLabel: 'OPEN MISSION',
            urgency: 'MEDIUM',
          });
        }
      } catch {}

      // 2. Task backlog check
      try {
        const tasks = getLocalStore<Task[]>(`tasks_${userId}`, []);
        const pendingTasks = tasks.filter((t) => t.status !== 'COMPLETED');
        const criticalTasks = pendingTasks.filter((t) => t.priority === 'CRITICAL' || t.priority === 'HIGH');

        if (criticalTasks.length > 0) {
          items.push({
            id: 'feed_task_crit',
            category: 'TASK',
            title: `${criticalTasks.length} High-Priority Task${criticalTasks.length > 1 ? 's' : ''} Pending`,
            description: `Top item: "${criticalTasks[0].title}". Immediate tactical execution recommended.`,
            actionRoute: '/tasks',
            actionLabel: 'AUDIT TASKS',
            urgency: 'HIGH',
          });
        } else if (pendingTasks.length > 0) {
          items.push({
            id: 'feed_task_backlog',
            category: 'TASK',
            title: `${pendingTasks.length} Action Directives in Queue`,
            description: 'Task discipline queue ready for sequential execution.',
            actionRoute: '/tasks',
            actionLabel: 'VIEW QUEUE',
            urgency: 'LOW',
          });
        }
      } catch {}

      // 3. Memory bank check
      try {
        const mems = MemoryService.getMemories(userId);
        if (mems.length > 0) {
          const latestMem = mems[0];
          items.push({
            id: 'feed_mem_context',
            category: 'MEMORY',
            title: 'Neural Memory Synchronized',
            description: `Cached context: "${latestMem.content.slice(0, 50)}..." actively informs AI reasoning.`,
            actionRoute: '/memory',
            actionLabel: 'INSPECT MEMORY',
            urgency: 'LOW',
          });
        }
      } catch {}

      // 4. System connectivity state
      items.push({
        id: 'feed_sys_state',
        category: 'SYSTEM',
        title: isSupabaseConfigured() ? 'Supabase Synapse Connected' : 'Local Offline Sandbox Active',
        description: isSupabaseConfigured()
          ? 'Cloud replication and multi-client event broadcasting operational.'
          : 'Zero network dependency fallback securely caching all mutations locally.',
        actionRoute: '/settings',
        actionLabel: 'SYSTEM HEALTH',
        urgency: 'LOW',
      });

      setFeedItems(items);
    };

    generateFeed();
  }, [userId]);

  return (
    <div className="rounded-2xl border border-zoro-border bg-zoro-panel p-5 font-mono select-none space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-zoro-border pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-zoro-cyan animate-pulse" />
          <h2 className="text-xs font-black text-zoro-text tracking-wider uppercase">
            PROACTIVE INTELLIGENCE FEED
          </h2>
        </div>
        <span className="text-[10px] text-zoro-cyan font-bold px-2 py-0.5 rounded bg-zoro-cyan/15 border border-zoro-cyan/30">
          {feedItems.length} INSIGHTS
        </span>
      </div>

      <div className="space-y-2.5">
        {feedItems.map((item) => (
          <div
            key={item.id}
            className="p-3 rounded-xl border border-zoro-border/80 bg-zoro-panelElevated hover:border-zoro-cyan/40 hover:bg-zoro-panelHighlight transition-all space-y-1.5 group cursor-pointer"
            onClick={() => {
              onNavigate(item.actionRoute);
              soundService.play('CLICK');
            }}
          >
            <div className="flex items-center justify-between text-[9px]">
              <span className="font-bold text-zoro-cyan uppercase tracking-wider">
                {item.category}
              </span>
              <span
                className={`font-bold px-1.5 py-0.2 rounded ${
                  item.urgency === 'HIGH'
                    ? 'bg-zoro-critical/15 text-zoro-critical border border-zoro-critical/30'
                    : 'bg-zoro-bg text-zoro-textMuted border border-zoro-border'
                }`}
              >
                {item.urgency}
              </span>
            </div>

            <div className="text-xs font-bold text-zoro-text group-hover:text-zoro-cyan transition-colors">
              {item.title}
            </div>

            <p className="text-[11px] text-zoro-textSecondary font-sans leading-relaxed line-clamp-2">
              {item.description}
            </p>

            <div className="flex items-center justify-end text-[10px] text-zoro-cyan font-semibold pt-1 gap-1 group-hover:translate-x-0.5 transition-transform">
              <span>{item.actionLabel}</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

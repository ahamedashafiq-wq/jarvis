import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  CheckCircle2,
  Clock,
  ExternalLink,
  Users,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Task, RoutePath } from '../../types';
import { soundService } from '../../services/sound';
import { getLocalStore, setLocalStore } from '../../services/supabase';

interface PriorityPanelProps {
  userId: string;
  onNavigate: (path: RoutePath) => void;
  className?: string;
}

export const PriorityPanel: React.FC<PriorityPanelProps> = ({
  userId,
  onNavigate,
  className = '',
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);

  const loadTasks = () => {
    try {
      const raw = getLocalStore<Task[]>(`tasks_${userId}`, []);
      // Filter out completed tasks and sort by priority order (HIGH > MEDIUM > LOW)
      const priorityOrder: Record<string, number> = { HIGH: 1, CRITICAL: 1, MEDIUM: 2, LOW: 3 };
      const pending = raw
        .filter((t) => t.status !== 'COMPLETED')
        .sort((a, b) => {
          const pA = priorityOrder[a.priority?.toUpperCase() || 'MEDIUM'] || 2;
          const pB = priorityOrder[b.priority?.toUpperCase() || 'MEDIUM'] || 2;
          return pA - pB;
        });

      setTasks(pending);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadTasks();
  }, [userId]);

  const handleCompleteTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const all = getLocalStore<Task[]>(`tasks_${userId}`, []);
      const updated = all.map((t) =>
        t.id === taskId ? { ...t, status: 'COMPLETED' as const, updated_at: new Date().toISOString() } : t
      );
      setLocalStore(`tasks_${userId}`, updated);
      soundService.play('TASK_COMPLETED');
      loadTasks();
    } catch {
      // ignore
    }
  };

  const handlePostponeTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const all = getLocalStore<Task[]>(`tasks_${userId}`, []);
      const updated = all.map((t) => {
        if (t.id === taskId) {
          const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
          return { ...t, due_date: tomorrow, updated_at: new Date().toISOString() };
        }
        return t;
      });
      setLocalStore(`tasks_${userId}`, updated);
      soundService.play('CLICK');
      loadTasks();
    } catch {
      // ignore
    }
  };

  const handleDelegateTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundService.play('CLICK');
    // Navigate to agents to delegate this task to an agent
    onNavigate('/agents');
  };

  const getPriorityBadge = (priority: string = 'MEDIUM') => {
    switch (priority.toUpperCase()) {
      case 'CRITICAL':
      case 'HIGH':
        return 'text-zoro-critical border-zoro-critical/40 bg-zoro-critical/10';
      case 'LOW':
        return 'text-zoro-success border-zoro-success/40 bg-zoro-success/10';
      case 'MEDIUM':
      default:
        return 'text-zoro-warning border-zoro-warning/40 bg-zoro-warning/10';
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
            TODAY&apos;S PRIORITY
          </h2>
          <span className="text-[10px] text-zoro-cyan font-bold tabular-nums">
            ({tasks.length} PENDING)
          </span>
        </div>

        <button
          onClick={() => {
            onNavigate('/tasks');
            soundService.play('CLICK');
          }}
          className="text-[10px] text-zoro-cyan hover:underline flex items-center gap-1 transition-colors font-bold"
        >
          <span>ALL TASKS</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Ranked Tasks List */}
      <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[380px] pr-1">
        {tasks.length === 0 ? (
          <div className="p-8 text-center text-zoro-textMuted text-xs space-y-2">
            <p>0 pending tasks in operational queue.</p>
            <button
              onClick={() => onNavigate('/tasks')}
              className="px-3 py-1.5 rounded-lg border border-zoro-border bg-zoro-panelElevated text-zoro-cyan hover:border-zoro-cyan/40 transition-colors inline-flex items-center gap-1.5 font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>CREATE FIRST TASK</span>
            </button>
          </div>
        ) : (
          tasks.slice(0, 5).map((task, idx) => (
            <div
              key={task.id}
              onClick={() => {
                onNavigate('/tasks');
                soundService.play('CLICK');
              }}
              className="p-3.5 rounded-xl border border-zoro-border bg-zoro-panelElevated/90 hover:border-zoro-cyan/40 hover:bg-zoro-panelHighlight transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-3">
                {/* Ranking Index + Title */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-zoro-panel border border-zoro-border flex items-center justify-center font-bold text-xs text-zoro-cyan shrink-0 mt-0.5 shadow-sm">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-zoro-text truncate group-hover:text-zoro-cyan transition-colors">
                      {task.title}
                    </div>
                    {task.description && (
                      <p className="text-[11px] text-zoro-textSecondary truncate max-w-sm font-sans mt-0.5">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Priority Badge */}
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold border shrink-0 ${getPriorityBadge(task.priority)}`}>
                  {task.priority || 'MEDIUM'}
                </span>
              </div>

              {/* Actions: Complete, Postpone, Open, Delegate */}
              <div className="mt-3 pt-2 border-t border-zoro-border/40 flex items-center justify-between text-[10px] text-zoro-textMuted font-mono">
                <div className="flex items-center gap-1.5">
                  {/* Complete Button */}
                  <button
                    onClick={(e) => handleCompleteTask(task.id, e)}
                    className="px-2 py-0.8 rounded border border-zoro-success/40 bg-zoro-success/10 text-zoro-success hover:bg-zoro-success/20 transition-colors flex items-center gap-1 font-bold"
                    title="Mark Task Complete"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>COMPLETE</span>
                  </button>

                  {/* Postpone Button */}
                  <button
                    onClick={(e) => handlePostponeTask(task.id, e)}
                    className="px-2 py-0.8 rounded border border-zoro-border bg-zoro-panel hover:border-zoro-cyan/40 text-zoro-textSecondary hover:text-zoro-text transition-colors flex items-center gap-1"
                    title="Postpone 24h"
                  >
                    <Clock className="w-3 h-3" />
                    <span>POSTPONE</span>
                  </button>

                  {/* Delegate Button */}
                  <button
                    onClick={(e) => handleDelegateTask(task.id, e)}
                    className="px-2 py-0.8 rounded border border-zoro-border bg-zoro-panel hover:border-zoro-violet/40 text-zoro-textSecondary hover:text-zoro-violet transition-colors flex items-center gap-1"
                    title="Delegate to AI Agent"
                  >
                    <Users className="w-3 h-3" />
                    <span className="hidden sm:inline">DELEGATE</span>
                  </button>
                </div>

                {/* Open details */}
                <button
                  onClick={() => onNavigate('/tasks')}
                  className="text-zoro-cyan hover:underline flex items-center gap-0.5 font-bold"
                >
                  <span>OPEN</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

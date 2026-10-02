import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Task, RoutePath } from '../../types';
import { getLocalStore, setLocalStore } from '../../services/supabase';
import { MissionService } from '../../services/mission';
import { soundService } from '../../services/sound';

interface ActionQueueWidgetProps {
  userId: string;
  onNavigate: (path: RoutePath) => void;
}

export const ActionQueueWidget: React.FC<ActionQueueWidgetProps> = ({
  userId,
  onNavigate,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  const loadTasks = () => {
    try {
      const stored = getLocalStore<Task[]>(`tasks_${userId}`, []);
      setTasks(stored);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadTasks();
  }, [userId]);

  const saveTasks = (updated: Task[]) => {
    setTasks(updated);
    setLocalStore(`tasks_${userId}`, updated);
  };

  const handleToggleComplete = (taskId: string) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const nextStatus = t.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
        return {
          ...t,
          status: nextStatus as any,
          completed_at: nextStatus === 'COMPLETED' ? Date.now() : undefined,
        };
      }
      return t;
    });
    saveTasks(updated);
    soundService.play('COMMAND_SUCCESS');
  };

  const handleStatusChange = (taskId: string, newStatus: Task['status']) => {
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t));
    saveTasks(updated);
    soundService.play('CLICK');
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    saveTasks(updated);
    soundService.play('CLICK');
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: 'task_' + Date.now(),
      user_id: userId,
      title: newTaskTitle.trim(),
      description: 'Logged via Action Queue 2.0',
      priority: 'HIGH',
      status: 'TODO',
      category: 'TACTICAL',
      due_date: 'Today',
      created_at: Date.now(),
    };

    saveTasks([newTask, ...tasks]);
    setNewTaskTitle('');
    setIsAddingTask(false);
    soundService.play('COMMAND_SUCCESS');
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'PENDING') return t.status === 'TODO';
    if (filter === 'IN_PROGRESS') return t.status === 'IN_PROGRESS';
    if (filter === 'COMPLETED') return t.status === 'COMPLETED';
    return true;
  });

  return (
    <div className="rounded-lg border border-jarvis-border bg-jarvis-surfaceElevated p-4 space-y-4 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-jarvis-border/60 pb-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-jarvis-secondary" />
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-jarvis-text tracking-wider">
              ACTION QUEUE 2.0 (BLADE 02)
            </h2>
            <p className="text-[10px] text-jarvis-textMuted">WADO ICHIMONJI EXECUTION MATRIX</p>
          </div>
        </div>

        <button
          onClick={() => setIsAddingTask(true)}
          className="px-2.5 py-1 rounded text-xs border border-jarvis-secondary bg-jarvis-secondary/10 hover:bg-jarvis-secondary/20 text-jarvis-secondary flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>NEW TASK</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-0.5 rounded bg-jarvis-surface border border-jarvis-border text-xs">
        {(['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setFilter(tab);
              soundService.play('CLICK');
            }}
            className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
              filter === tab
                ? 'bg-jarvis-surfaceElevated text-jarvis-secondary font-bold shadow-sm'
                : 'text-jarvis-textMuted hover:text-jarvis-text'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Quick Add Form */}
      {isAddingTask && (
        <form onSubmit={handleCreateTask} className="p-2.5 rounded border border-jarvis-secondary/40 bg-jarvis-surface flex gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Directive title... (e.g. Test Gemini stream latency)"
            className="flex-1 px-3 py-1.5 rounded border border-jarvis-border bg-jarvis-bg text-jarvis-text text-xs focus:outline-none focus:border-jarvis-secondary"
            autoFocus
            id="quick-task-title"
            name="taskTitle"
            aria-label="Directive title"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded border border-jarvis-secondary bg-jarvis-secondary text-black font-semibold text-xs"
          >
            ADD
          </button>
          <button
            type="button"
            onClick={() => setIsAddingTask(false)}
            className="px-2 py-1.5 rounded text-xs text-jarvis-textMuted hover:text-jarvis-text"
          >
            CANCEL
          </button>
        </form>
      )}

      {/* Tasks List */}
      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 text-xs">
        {filteredTasks.length === 0 ? (
          <div className="p-6 text-center text-jarvis-textMuted border border-dashed border-jarvis-border rounded">
            No action items matching filter.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className="p-2.5 rounded border border-jarvis-border bg-jarvis-surface flex items-center justify-between gap-2 hover:border-jarvis-borderHover transition-colors"
            >
              <div className="flex items-center gap-2.5 truncate">
                <button
                  onClick={() => handleToggleComplete(task.id)}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    task.status === 'COMPLETED'
                      ? 'bg-jarvis-primary border-jarvis-primary text-black font-bold'
                      : 'border-jarvis-border hover:border-jarvis-primary'
                  }`}
                  aria-label="Toggle task completion"
                >
                  {task.status === 'COMPLETED' && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>

                <div className="truncate">
                  <span
                    className={`font-medium ${
                      task.status === 'COMPLETED'
                        ? 'line-through text-jarvis-textMuted'
                        : 'text-jarvis-text'
                    }`}
                  >
                    {task.title}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-jarvis-textMuted">
                    <span>{task.category || 'TACTICAL'}</span>
                    <span>•</span>
                    <span
                      className={
                        task.priority === 'CRITICAL'
                          ? 'text-jarvis-danger'
                          : task.priority === 'HIGH'
                          ? 'text-jarvis-warning'
                          : 'text-jarvis-secondary'
                      }
                    >
                      {task.priority}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-1 shrink-0">
                {task.status === 'TODO' && (
                  <button
                    onClick={() => handleStatusChange(task.id, 'IN_PROGRESS')}
                    className="p-1 rounded text-jarvis-textSecondary hover:text-jarvis-primary"
                    title="Mark in progress"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>
                )}
                {task.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => handleStatusChange(task.id, 'TODO')}
                    className="p-1 rounded text-jarvis-textSecondary hover:text-jarvis-warning"
                    title="Pause task"
                  >
                    <Pause className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-1 rounded text-jarvis-textMuted hover:text-jarvis-danger"
                  title="Delete task"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pt-2 border-t border-jarvis-border/40 flex justify-between items-center text-[10px] text-jarvis-textMuted">
        <span>PENDING: {tasks.filter((t) => t.status !== 'COMPLETED').length}</span>
        <button
          onClick={() => onNavigate('/tasks')}
          className="text-jarvis-secondary hover:underline flex items-center gap-1"
        >
          <span>VIEW FULL QUEUE</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
};

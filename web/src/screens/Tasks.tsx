import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Task, RoutePath } from '../types';
import { getLocalStore, setLocalStore } from '../services/supabase';
import { CheckCircle, Circle, Plus, Trash2, Tag, Calendar, AlertTriangle } from 'lucide-react';

interface TasksProps {
  onNavigate: (path: RoutePath) => void;
}

export const Tasks: React.FC<TasksProps> = () => {
  const { currentSession } = useAuth();
  const userId = currentSession?.userId || 'guest';

  const [tasks, setTasks] = useState<Task[]>(() =>
    getLocalStore<Task[]>(`tasks_${userId}`, [
      {
        id: '1',
        user_id: userId,
        title: 'Calibrate Three Blades Matrix',
        description: 'Verify synchronization between Knowledge, Action, and Memory',
        priority: 'CRITICAL',
        status: 'IN_PROGRESS',
        category: 'SYSTEM',
        due_date: 'Today',
        created_at: Date.now(),
      },
      {
        id: '2',
        user_id: userId,
        title: 'Review Gemini AI Stream pipeline',
        description: 'Test token streaming and error latency response',
        priority: 'HIGH',
        status: 'TODO',
        category: 'INTELLIGENCE',
        due_date: 'Tomorrow',
        created_at: Date.now(),
      },
    ])
  );

  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'CRITICAL' | 'COMPLETED'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<Task['priority']>('MEDIUM');
  const [newDue, setNewDue] = useState('Today');

  const saveTasks = (updated: Task[]) => {
    setTasks(updated);
    setLocalStore(`tasks_${userId}`, updated);
  };

  const handleToggle = (id: string) => {
    const updated = tasks.map((t) =>
      t.id === id
        ? {
            ...t,
            status: (t.status === 'COMPLETED' ? 'TODO' : 'COMPLETED') as Task['status'],
            completed_at: t.status === 'COMPLETED' ? undefined : Date.now(),
          }
        : t
    );
    saveTasks(updated);
  };

  const handleDelete = (id: string) => {
    saveTasks(tasks.filter((t) => t.id !== id));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: Task = {
      id: 'task_' + Date.now(),
      user_id: userId,
      title: newTitle.trim(),
      description: newDesc.trim(),
      priority: newPriority,
      status: 'TODO',
      category: 'GENERAL',
      due_date: newDue,
      created_at: Date.now(),
    };

    saveTasks([newTask, ...tasks]);
    setNewTitle('');
    setNewDesc('');
    setShowAddModal(false);
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'ACTIVE') return t.status !== 'COMPLETED';
    if (filter === 'CRITICAL') return t.priority === 'CRITICAL' && t.status !== 'COMPLETED';
    if (filter === 'COMPLETED') return t.status === 'COMPLETED';
    return true;
  });

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#16281F] pb-4">
        <div>
          <h1 className="text-xl font-black font-mono text-[#F5F7F6] tracking-wider">
            BLADE 02: ACTION QUEUE
          </h1>
          <p className="text-xs font-mono text-[#8B9992] mt-0.5">
            DISCIPLINED TASK EXECUTION & OBJECTIVE TRACKING
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#00D084] hover:bg-[#19F59A] text-[#050706] rounded font-mono font-bold text-xs tracking-wider transition-all shadow-[0_0_15px_rgba(0,208,132,0.2)]"
        >
          <Plus className="w-4 h-4" />
          NEW DIRECTIVE
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 font-mono text-xs">
        {(['ALL', 'ACTIVE', 'CRITICAL', 'COMPLETED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded transition-all ${
              filter === tab
                ? 'bg-[#121C17] border border-[#00D084] text-[#19F59A] font-bold'
                : 'bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#F5F7F6]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-8 rounded-xl bg-[#0A100D] border border-[#16281F] text-center font-mono text-xs text-[#8B9992]">
            NO ACTIVE DIRECTIVES RECORDED IN THIS SECTOR.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isDone = task.status === 'COMPLETED';
            return (
              <div
                key={task.id}
                className={`p-4 rounded-lg border transition-all flex items-start justify-between gap-3 ${
                  isDone
                    ? 'bg-[#050706] border-[#16281F] opacity-50'
                    : 'bg-[#0A100D] border-[#16281F] hover:border-[#00D084]/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggle(task.id)}
                    className="mt-0.5 text-[#00D084] hover:scale-110 transition-transform"
                  >
                    {isDone ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5 text-[#8B9992]" />}
                  </button>

                  <div>
                    <h3
                      className={`text-sm font-mono font-bold ${
                        isDone ? 'line-through text-[#8B9992]' : 'text-[#F5F7F6]'
                      }`}
                    >
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-xs text-[#8B9992] mt-1 font-mono">{task.description}</p>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-[10px] font-mono">
                      <span
                        className={`px-1.5 py-0.5 rounded font-bold ${
                          task.priority === 'CRITICAL'
                            ? 'bg-[#FF3B30]/15 text-[#FF3B30] border border-[#FF3B30]/30'
                            : task.priority === 'HIGH'
                            ? 'bg-[#FFB000]/15 text-[#FFB000] border border-[#FFB000]/30'
                            : 'bg-[#00D084]/15 text-[#19F59A]'
                        }`}
                      >
                        {task.priority}
                      </span>
                      <span className="text-[#8B9992] flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {task.due_date}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(task.id)}
                  className="p-1 text-[#8B9992] hover:text-[#FF3B30] transition-colors"
                  title="Purge task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-[#0A100D] border border-[#00D084] rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-mono font-bold text-[#19F59A] tracking-wider">
              CREATE TACTICAL DIRECTIVE
            </h2>

            <form onSubmit={handleCreate} className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-[#8B9992] block mb-1">DIRECTIVE TITLE</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Master Three Swords Style"
                  className="w-full p-2 bg-[#050706] border border-[#16281F] rounded text-[#F5F7F6] focus:border-[#00D084] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[#8B9992] block mb-1">DESCRIPTION</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  placeholder="Optional mission details..."
                  className="w-full p-2 bg-[#050706] border border-[#16281F] rounded text-[#F5F7F6] focus:border-[#00D084] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#8B9992] block mb-1">PRIORITY</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full p-2 bg-[#050706] border border-[#16281F] rounded text-[#F5F7F6] focus:border-[#00D084] focus:outline-none"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div>
                  <label className="text-[#8B9992] block mb-1">DUE TIMEFRAME</label>
                  <input
                    type="text"
                    value={newDue}
                    onChange={(e) => setNewDue(e.target.value)}
                    placeholder="Today, Tomorrow, 18:00"
                    className="w-full p-2 bg-[#050706] border border-[#16281F] rounded text-[#F5F7F6] focus:border-[#00D084] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#16281F]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded bg-[#050706] text-[#8B9992] hover:text-[#F5F7F6]"
                >
                  ABORT
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#00D084] text-[#050706] font-bold hover:bg-[#19F59A]"
                >
                  COMMIT DIRECTIVE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

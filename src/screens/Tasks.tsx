import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Task, RoutePath } from '../types';
import { useRealtimeTasks } from '../hooks/useRealtime';
import { useToast } from '../components/Toast';
import { CheckCircle, Circle, Plus, Trash2, Tag, Calendar, AlertTriangle, ArrowLeft, Target } from 'lucide-react';

interface TasksProps {
  onNavigate: (path: RoutePath) => void;
}

export const Tasks: React.FC<TasksProps> = ({ onNavigate }) => {
  const { currentSession, trackEvent, createNotification } = useAuth();
  const userId = currentSession?.userId || 'guest';
  const { showToast } = useToast();

  const { tasks, addTask, toggleTask, deleteTask } = useRealtimeTasks();

  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'CRITICAL' | 'COMPLETED'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<Task['priority']>('MEDIUM');
  const [newCategory, setNewCategory] = useState('DIRECTIVE');
  const [newDue, setNewDue] = useState('Today');

  const handleToggle = (id: string) => {
    const target = tasks.find((t) => t.id === id);
    toggleTask(id);
    if (target && target.status !== 'COMPLETED') {
      createNotification('TASK ACCOMPLISHED', `Objective achieved: ${target.title}`, 'TASK');
      showToast('MISSION ACCOMPLISHED', `Objective completed: "${target.title}"`, 'TASK');
      trackEvent('TASK_COMPLETED', JSON.stringify({ id, title: target.title }));
    } else {
      trackEvent('TASK_RESTORED', JSON.stringify({ id }));
    }
  };

  const handleDelete = (id: string) => {
    deleteTask(id);
    trackEvent('TASK_DELETED', JSON.stringify({ id }));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created = addTask({
      title: newTitle.trim(),
      description: newDesc.trim() || 'Standard operational directive',
      priority: newPriority,
      status: 'TODO',
      category: newCategory.trim().toUpperCase() || 'GENERAL',
      due_date: newDue.trim() || 'Today',
    });

    setNewTitle('');
    setNewDesc('');
    setShowAddModal(false);
    createNotification('DIRECTIVE ADDED', `Registered: ${created.title}`, 'TASK');
    showToast('MISSION CREATED', `Directive logged: "${created.title}"`, 'TASK');
    trackEvent('TASK_CREATED', JSON.stringify({ title: created.title }));
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'ACTIVE') return t.status !== 'COMPLETED';
    if (filter === 'COMPLETED') return t.status === 'COMPLETED';
    if (filter === 'CRITICAL') return t.priority === 'CRITICAL';
    return true;
  });

  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#16281F] pb-4">
        <div>
          <h1 className="text-xl font-black text-[#F5F7F6] tracking-wider flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#38E1FF]" />
            BLADE 02: ACTION QUEUE
          </h1>
          <p className="text-[10px] text-[#8B9992] mt-0.5">
            WADO ICHIMONJI • TACTICAL OBJECTIVE MATRIX & DISCIPLINE
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/missions')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#0A100D] border border-[#16281F] text-[#19F59A] hover:border-[#19F59A]/40 transition-colors"
          >
            <Target className="w-3.5 h-3.5" />
            <span>MISSION CONTROL</span>
          </button>
          <button
            onClick={() => onNavigate('/dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#19F59A] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>COMMAND DECK</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#38E1FF] text-[#050706] font-bold hover:bg-[#38E1FF]/90 transition-all shadow-[0_0_15px_rgba(56,225,255,0.2)]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>NEW DIRECTIVE</span>
          </button>
        </div>
      </div>

      {/* Progress & Metric Header Card */}
      <div className="p-4 rounded-xl bg-[#0A100D] border border-[#16281F] space-y-3">
        <div className="flex items-center justify-between text-xs text-[#8B9992]">
          <span>DISCIPLINE CLEARANCE RATE</span>
          <span className="font-bold text-[#38E1FF]">{progressPercent}% CLEARED</span>
        </div>
        <div className="w-full h-2 rounded-full bg-[#050706] border border-[#16281F] overflow-hidden">
          <div
            className="h-full bg-[#38E1FF] transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-[#8B9992]">
          <span>{completedCount} COMPLETED</span>
          <span>{tasks.length - completedCount} PENDING EXECUTION</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#16281F] pb-2 overflow-x-auto">
        {(['ALL', 'ACTIVE', 'CRITICAL', 'COMPLETED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all shrink-0 ${
              filter === tab
                ? 'bg-[#38E1FF] text-[#050706]'
                : 'bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#F5F7F6]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Task Cards List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-[#8B9992] bg-[#0A100D] border border-[#16281F] rounded-xl">
            No directives match the selected filter.
          </div>
        ) : (
          filteredTasks.map((t) => (
            <div
              key={t.id}
              className={`p-4 rounded-xl border transition-all flex items-start gap-3.5 group ${
                t.status === 'COMPLETED'
                  ? 'bg-[#050706] border-[#16281F] opacity-50'
                  : 'bg-[#0A100D] border-[#16281F] hover:border-[#38E1FF]/40'
              }`}
            >
              <button
                onClick={() => handleToggle(t.id)}
                className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                  t.status === 'COMPLETED'
                    ? 'bg-[#38E1FF] border-[#38E1FF] text-[#050706]'
                    : 'border-[#8B9992] hover:border-[#38E1FF]'
                }`}
              >
                {t.status === 'COMPLETED' && <CheckCircle className="w-3.5 h-3.5 fill-current" />}
              </button>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`font-bold text-sm truncate ${
                      t.status === 'COMPLETED' ? 'line-through text-[#8B9992]' : 'text-[#F5F7F6]'
                    }`}
                  >
                    {t.title}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        t.priority === 'CRITICAL'
                          ? 'bg-[#FF3B30]/20 text-[#FF3B30]'
                          : t.priority === 'HIGH'
                          ? 'bg-[#FFB000]/20 text-[#FFB000]'
                          : 'bg-[#38E1FF]/20 text-[#38E1FF]'
                      }`}
                    >
                      {t.priority}
                    </span>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="opacity-0 group-hover:opacity-100 hover:text-[#FF3B30] p-1 text-[#8B9992] transition-opacity"
                      title="Delete Directive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs font-sans text-[#8B9992] leading-relaxed">
                  {t.description}
                </p>

                <div className="flex items-center gap-3 pt-1 text-[10px] text-[#8B9992]">
                  {t.mission_id && (
                    <span className="flex items-center gap-1 text-[#19F59A]">
                      <Target className="w-3 h-3" />
                      <span>MISSION DIRECTIVE</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3 text-[#38E1FF]" />
                    {t.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#FFB000]" />
                    {t.due_date}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0A100D] border border-[#38E1FF]/40 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-sm text-[#F5F7F6] tracking-wider">NEW OPERATIONAL DIRECTIVE</h3>
            <form onSubmit={handleAddTask} className="space-y-3">
              <div>
                <label className="text-[10px] text-[#8B9992] block mb-1">DIRECTIVE TITLE</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Asura Nine Blades Focus"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#050706] border border-[#16281F] rounded-lg px-3 py-2 text-xs text-[#F5F7F6] focus:border-[#38E1FF] outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#8B9992] block mb-1">DESCRIPTION</label>
                <textarea
                  rows={3}
                  placeholder="Tactical details and parameters..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-[#050706] border border-[#16281F] rounded-lg px-3 py-2 text-xs text-[#F5F7F6] focus:border-[#38E1FF] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#8B9992] block mb-1">PRIORITY</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full bg-[#050706] border border-[#16281F] rounded-lg px-3 py-2 text-xs text-[#F5F7F6] focus:border-[#38E1FF] outline-none"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-[#8B9992] block mb-1">DUE SCHEDULE</label>
                  <input
                    type="text"
                    placeholder="e.g. Today, 1800 hrs"
                    value={newDue}
                    onChange={(e) => setNewDue(e.target.value)}
                    className="w-full bg-[#050706] border border-[#16281F] rounded-lg px-3 py-2 text-xs text-[#F5F7F6] focus:border-[#38E1FF] outline-none"
                  >
                  </input>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#16281F]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded text-xs text-[#8B9992] hover:text-[#F5F7F6]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#38E1FF] text-[#050706] font-bold text-xs hover:bg-[#38E1FF]/90 shadow-[0_0_15px_rgba(56,225,255,0.3)]"
                >
                  ENGAGE DIRECTIVE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

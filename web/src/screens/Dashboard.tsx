import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AIOrb } from '../components/AIOrb';
import { ThreeBladeSystem } from '../components/ThreeBladeSystem';
import {
  MessageSquare,
  Mic,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Terminal,
  CheckCircle,
  Database,
  ArrowRight,
} from 'lucide-react';
import { Task, Memory, RoutePath } from '../types';
import { getLocalStore, setLocalStore } from '../services/supabase';

interface DashboardProps {
  onNavigate: (path: RoutePath) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { currentSession, profile } = useAuth();
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

  const [memories] = useState<Memory[]>(() =>
    getLocalStore<Memory[]>(`memories_${userId}`, [
      {
        id: '1',
        user_id: userId,
        content: 'Operator prefers concise tactical directives with zero conversational filler.',
        category: 'PREFERENCE',
        importance: 'HIGH',
        pinned: true,
        created_at: Date.now(),
      },
    ])
  );

  // Focus Timer state
  const [focusTime, setFocusTime] = useState(25 * 60);
  const [isFocusActive, setIsFocusActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isFocusActive && focusTime > 0) {
      interval = setInterval(() => setFocusTime((t) => t - 1), 1000);
    } else if (focusTime === 0) {
      setIsFocusActive(false);
    }
    return () => clearInterval(interval);
  }, [isFocusActive, focusTime]);

  const toggleTask = (taskId: string) => {
    const updated = tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            status: (t.status === 'COMPLETED' ? 'TODO' : 'COMPLETED') as Task['status'],
            completed_at: t.status === 'COMPLETED' ? undefined : Date.now(),
          }
        : t
    );
    setTasks(updated);
    setLocalStore(`tasks_${userId}`, updated);
  };

  const displayName = profile?.display_name || currentSession?.displayName || 'COMMANDER';
  const activeTasks = tasks.filter((t) => t.status !== 'COMPLETED');
  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* 1. Tactical Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#16281F] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#F5F7F6] tracking-wide">
              WELCOME BACK, {displayName}
            </h1>
            <span className="px-2 py-0.5 rounded bg-[#00D084]/15 border border-[#00D084]/30 text-[10px] font-mono font-bold text-[#19F59A]">
              AUTHORIZED
            </span>
          </div>
          <p className="text-xs font-mono text-[#8B9992] tracking-wider mt-0.5">
            DEFENSIVE GRID STABLE • 3 BLADES SYNCHRONIZED
          </p>
        </div>

        {/* Quick action badges */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/chat')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#00D084] hover:bg-[#19F59A] text-[#050706] font-mono font-bold text-xs tracking-wider transition-all shadow-[0_0_15px_rgba(0,208,132,0.2)]"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            DIRECTIVE CHAT
          </button>
          <button
            onClick={() => onNavigate('/voice')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#0A100D] border border-[#16281F] hover:border-[#00D084]/40 text-[#19F59A] font-mono font-bold text-xs tracking-wider transition-all"
          >
            <Mic className="w-3.5 h-3.5" />
            VOICE HUD
          </button>
        </div>
      </div>

      {/* 2. Three Blade Architecture Widget */}
      <ThreeBladeSystem
        knowledgeCount={1}
        actionCount={activeTasks.length}
        memoryCount={memories.length}
        onBladeClick={(b) => {
          if (b === 1) onNavigate('/chat');
          if (b === 2) onNavigate('/tasks');
          if (b === 3) onNavigate('/memory');
        }}
      />

      {/* 3. AI Core Central Command & Focus Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Center Orb Visualizer */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-[#0A100D] border border-[#16281F] relative overflow-hidden flex flex-col items-center justify-center min-h-[280px]">
          <div className="absolute top-3 left-4 text-[10px] font-mono text-[#8B9992] tracking-widest">
            AI SYNAPSE MATRIX • GEMINI CORE
          </div>
          <div className="my-4">
            <AIOrb state={isFocusActive ? 'EXECUTING' : 'IDLE'} size={150} />
          </div>
          <div className="text-center space-y-1">
            <div className="text-sm font-mono font-bold text-[#F5F7F6]">
              {isFocusActive ? 'COMBAT FOCUS ENGAGED' : 'SYSTEMS READY'}
            </div>
            <p className="text-xs text-[#8B9992] max-w-md font-mono">
              {isFocusActive
                ? 'All distractions suppressed. Blade 02 enforcing absolute operator discipline.'
                : 'Awaiting operator directive via natural voice or keyboard command pipeline.'}
            </p>
          </div>
        </div>

        {/* Focus Protocol Timer Widget */}
        <div className="p-6 rounded-xl bg-[#0A100D] border border-[#16281F] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono font-bold text-[#19F59A] tracking-wider">
                FOCUS PROTOCOL
              </span>
              <span className="text-[10px] font-mono text-[#8B9992]">DISCIPLINE TIMER</span>
            </div>

            <div className="text-center py-4">
              <div className="text-4xl font-black font-mono tracking-wider text-[#F5F7F6]">
                {formatTimer(focusTime)}
              </div>
              <div className="text-[10px] font-mono text-[#8B9992] mt-1">
                {isFocusActive ? 'PROTOCOL RUNNING' : 'STANDBY MODE'}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFocusActive(!isFocusActive)}
                className={`flex-1 py-2 px-3 rounded font-mono font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                  isFocusActive
                    ? 'bg-[#FFB000] text-[#050706]'
                    : 'bg-[#00D084] text-[#050706] hover:bg-[#19F59A]'
                }`}
              >
                {isFocusActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isFocusActive ? 'PAUSE' : 'ENGAGE FOCUS'}
              </button>
              <button
                onClick={() => {
                  setIsFocusActive(false);
                  setFocusTime(25 * 60);
                }}
                className="p-2 rounded bg-[#050706] border border-[#16281F] text-[#8B9992] hover:text-[#F5F7F6]"
                title="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Quick preset buttons */}
            <div className="grid grid-cols-3 gap-1 pt-2">
              {[15, 25, 45].map((mins) => (
                <button
                  key={mins}
                  onClick={() => {
                    setIsFocusActive(false);
                    setFocusTime(mins * 60);
                  }}
                  className="py-1 rounded bg-[#050706] border border-[#16281F] text-[10px] font-mono text-[#8B9992] hover:text-[#19F59A] hover:border-[#00D084]/40"
                >
                  {mins}M
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Action Queue & Memory Bank Peek */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Tasks Preview */}
        <div className="p-5 rounded-xl bg-[#0A100D] border border-[#16281F]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#F5F7F6] tracking-wider">
                ACTION QUEUE (BLADE 02)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00D084]/15 text-[#19F59A] font-bold">
                {activeTasks.length} PENDING
              </span>
            </div>
            <button
              onClick={() => onNavigate('/tasks')}
              className="text-[10px] font-mono text-[#00D084] hover:underline flex items-center gap-1"
            >
              VIEW ALL <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {tasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                  task.status === 'COMPLETED'
                    ? 'bg-[#050706] border-[#16281F] opacity-50'
                    : 'bg-[#121C17] border-[#16281F] hover:border-[#00D084]/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle
                    className={`w-4 h-4 ${
                      task.status === 'COMPLETED' ? 'text-[#00D084]' : 'text-[#8B9992]'
                    }`}
                  />
                  <div>
                    <div
                      className={`text-xs font-mono font-medium ${
                        task.status === 'COMPLETED'
                          ? 'line-through text-[#8B9992]'
                          : 'text-[#F5F7F6]'
                      }`}
                    >
                      {task.title}
                    </div>
                    <div className="text-[9px] font-mono text-[#8B9992] flex items-center gap-2 mt-0.5">
                      <span className="text-[#FFB000]">{task.priority}</span>
                      <span>•</span>
                      <span>{task.due_date}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Memory Bank Peek */}
        <div className="p-5 rounded-xl bg-[#0A100D] border border-[#16281F]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#F5F7F6] tracking-wider">
                PERSISTENT MEMORIES (BLADE 03)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FFB000]/15 text-[#FFB000] font-bold">
                {memories.length} NODES
              </span>
            </div>
            <button
              onClick={() => onNavigate('/memory')}
              className="text-[10px] font-mono text-[#00D084] hover:underline flex items-center gap-1"
            >
              EXPLORE BANK <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {memories.slice(0, 3).map((mem) => (
              <div
                key={mem.id}
                className="p-3 rounded-lg bg-[#050706] border border-[#16281F] text-xs font-mono"
              >
                <div className="flex items-center justify-between text-[9px] text-[#8B9992] mb-1">
                  <span className="text-[#38E1FF]">[{mem.category}]</span>
                  <span className="text-[#19F59A] font-bold">PINNED</span>
                </div>
                <p className="text-[#F5F7F6] text-[11px]">{mem.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

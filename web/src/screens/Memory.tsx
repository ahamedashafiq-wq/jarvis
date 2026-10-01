import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Memory, RoutePath } from '../types';
import { getLocalStore, setLocalStore } from '../services/supabase';
import { Database, Plus, Search, Pin, Trash2, Shield } from 'lucide-react';

interface MemoryProps {
  onNavigate: (path: RoutePath) => void;
}

export const MemoryScreen: React.FC<MemoryProps> = () => {
  const { currentSession } = useAuth();
  const userId = currentSession?.userId || 'guest';

  const [memories, setMemories] = useState<Memory[]>(() =>
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
      {
        id: '2',
        user_id: userId,
        content: 'Primary combat mission: Master AI-driven personal autonomy using Google Gemini.',
        category: 'PROJECT',
        importance: 'CRITICAL',
        pinned: true,
        created_at: Date.now(),
      },
      {
        id: '3',
        user_id: userId,
        content: 'Daily training routine begins at 0600 hours with kata meditation.',
        category: 'GENERAL',
        importance: 'MEDIUM',
        pinned: false,
        created_at: Date.now(),
      },
    ])
  );

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<Memory['category']>('GENERAL');
  const [newImportance, setNewImportance] = useState<Memory['importance']>('MEDIUM');

  const saveMemories = (updated: Memory[]) => {
    setMemories(updated);
    setLocalStore(`memories_${userId}`, updated);
  };

  const handleTogglePin = (id: string) => {
    saveMemories(
      memories.map((m) => (m.id === id ? { ...m, pinned: !m.pinned } : m))
    );
  };

  const handleDelete = (id: string) => {
    saveMemories(memories.filter((m) => m.id !== id));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    const newMem: Memory = {
      id: 'mem_' + Date.now(),
      user_id: userId,
      content: newContent.trim(),
      category: newCategory,
      importance: newImportance,
      pinned: false,
      created_at: Date.now(),
    };

    saveMemories([newMem, ...memories]);
    setNewContent('');
    setShowAddModal(false);
  };

  const filteredMemories = memories.filter((m) => {
    const matchesCategory = selectedCategory === 'ALL' || m.category === selectedCategory;
    const matchesSearch = m.content.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#16281F] pb-4">
        <div>
          <h1 className="text-xl font-black font-mono text-[#F5F7F6] tracking-wider">
            BLADE 03: PERSISTENT MEMORY BANK
          </h1>
          <p className="text-xs font-mono text-[#8B9992] mt-0.5">
            ZERO-LOSS SECURE RECALL NODES FOR OPERATOR DATA
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#00D084] hover:bg-[#19F59A] text-[#050706] rounded font-mono font-bold text-xs tracking-wider transition-all shadow-[0_0_15px_rgba(0,208,132,0.2)]"
        >
          <Plus className="w-4 h-4" />
          INDEX MEMORY NODE
        </button>
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8B9992] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search memory recall nodes..."
            className="w-full pl-9 pr-3 py-2 bg-[#0A100D] border border-[#16281F] rounded text-xs font-mono text-[#F5F7F6] focus:border-[#00D084] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
          {['ALL', 'PREFERENCE', 'PROJECT', 'PROFILE', 'GENERAL'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-2 rounded shrink-0 transition-all ${
                selectedCategory === cat
                  ? 'bg-[#121C17] border border-[#00D084] text-[#19F59A] font-bold'
                  : 'bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#F5F7F6]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Memory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMemories.length === 0 ? (
          <div className="col-span-full p-8 rounded-xl bg-[#0A100D] border border-[#16281F] text-center font-mono text-xs text-[#8B9992]">
            NO MEMORY NODES MATCH CURRENT SECTOR QUERY.
          </div>
        ) : (
          filteredMemories.map((mem) => (
            <div
              key={mem.id}
              className={`p-4 rounded-lg border transition-all flex flex-col justify-between ${
                mem.pinned
                  ? 'bg-[#121C17] border-[#00D084]/50 shadow-[0_0_15px_rgba(0,208,132,0.1)]'
                  : 'bg-[#0A100D] border-[#16281F]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2 text-[10px] font-mono">
                  <span className="text-[#38E1FF] font-bold">[{mem.category}]</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTogglePin(mem.id)}
                      className={`p-1 rounded hover:bg-[#050706] transition-colors ${
                        mem.pinned ? 'text-[#19F59A]' : 'text-[#8B9992]'
                      }`}
                      title={mem.pinned ? 'Unpin node' : 'Pin node to hot recall'}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(mem.id)}
                      className="p-1 rounded text-[#8B9992] hover:text-[#FF3B30] hover:bg-[#050706] transition-colors"
                      title="Purge node"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs font-mono text-[#F5F7F6] leading-relaxed">
                  {mem.content}
                </p>
              </div>

              <div className="mt-4 pt-2 border-t border-[#16281F] flex items-center justify-between text-[9px] font-mono text-[#8B9992]">
                <span>IMPORTANCE: {mem.importance}</span>
                <span>STATUS: SECURE</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-[#0A100D] border border-[#00D084] rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-mono font-bold text-[#19F59A] tracking-wider">
              COMMIT NEW MEMORY NODE
            </h2>

            <form onSubmit={handleCreate} className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-[#8B9992] block mb-1">MEMORY CONTENT</label>
                <textarea
                  required
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Record fact, preference, user rule, or project detail..."
                  className="w-full p-2 bg-[#050706] border border-[#16281F] rounded text-[#F5F7F6] focus:border-[#00D084] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#8B9992] block mb-1">CATEGORY</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full p-2 bg-[#050706] border border-[#16281F] rounded text-[#F5F7F6] focus:border-[#00D084] focus:outline-none"
                  >
                    <option value="GENERAL">GENERAL</option>
                    <option value="PREFERENCE">PREFERENCE</option>
                    <option value="PROJECT">PROJECT</option>
                    <option value="PROFILE">PROFILE</option>
                    <option value="ACADEMIC">ACADEMIC</option>
                    <option value="IMPORTANT_DATE">IMPORTANT_DATE</option>
                  </select>
                </div>

                <div>
                  <label className="text-[#8B9992] block mb-1">IMPORTANCE</label>
                  <select
                    value={newImportance}
                    onChange={(e) => setNewImportance(e.target.value as any)}
                    className="w-full p-2 bg-[#050706] border border-[#16281F] rounded text-[#F5F7F6] focus:border-[#00D084] focus:outline-none"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
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
                  STORE NODE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Memory, RoutePath } from '../types';
import { MemoryService } from '../services/memory';
import { MemoryEditor } from '../components/MemoryEditor';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { realtimeService } from '../services/realtime';
import { useToast } from '../components/Toast';
import {
  Database,
  Plus,
  Search,
  Pin,
  Trash2,
  Edit2,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Bookmark,
  Clock,
  Filter,
} from 'lucide-react';

interface MemoryProps {
  onNavigate: (path: RoutePath) => void;
}

export const MemoryScreen: React.FC<MemoryProps> = ({ onNavigate }) => {
  const { currentSession, createNotification } = useAuth();
  const userId = currentSession?.userId || 'guest';
  const { showToast } = useToast();

  const [memories, setMemories] = useState<Memory[]>(() => MemoryService.getMemories(userId));
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedImportance, setSelectedImportance] = useState<string>('ALL');

  // Modals state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    detail?: string;
    targetId?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const refreshMemories = () => {
    setMemories([...MemoryService.getMemories(userId)]);
  };

  useEffect(() => {
    // Attempt remote sync if Supabase is active
    MemoryService.fetchRemoteMemories(userId).then((fetched) => {
      setMemories(fetched);
    });

    // Subscribe to cross-tab and realtime memory events
    const unsub1 = realtimeService.subscribe('MEMORY_CREATED', refreshMemories);
    const unsub2 = realtimeService.subscribe('MEMORY_UPDATED', refreshMemories);
    const unsub3 = realtimeService.subscribe('MEMORY_PINNED', refreshMemories);
    const unsub4 = realtimeService.subscribe('MEMORY_UNPINNED', refreshMemories);
    const unsub5 = realtimeService.subscribe('MEMORY_DELETED', refreshMemories);

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
    };
  }, [userId]);

  const handleTogglePin = (id: string) => {
    const toggled = MemoryService.togglePin(userId, id);
    if (toggled) {
      refreshMemories();
      createNotification(
        toggled.pinned ? 'MEMORY PINNED' : 'MEMORY UNPINNED',
        `Knowledge node priority updated in Blade 03.`,
        'INFO'
      );
    }
  };

  const handlePromptForget = (mem: Memory) => {
    setConfirmDialog({
      isOpen: true,
      title: 'FORGET MEMORY?',
      message: 'Are you certain you wish to permanently purge this memory envelope from Blade 03?',
      detail: `[${mem.category}] ${mem.content}`,
      targetId: mem.id,
    });
  };

  const handleConfirmForget = () => {
    if (confirmDialog.targetId) {
      MemoryService.deleteMemory(userId, confirmDialog.targetId);
      refreshMemories();
      createNotification('MEMORY PURGED', 'Memory node removed from persistent database.', 'WARNING');
      showToast('MEMORY PURGED', 'Memory node deleted from Blade 03 database.', 'WARNING');
    }
    setConfirmDialog({ isOpen: false, title: '', message: '' });
  };

  const handleSaveEditor = (data: {
    id?: string;
    content: string;
    category: Memory['category'];
    importance: Memory['importance'];
    pinned: boolean;
  }) => {
    if (data.id) {
      MemoryService.updateMemory(userId, data.id, {
        content: data.content,
        category: data.category,
        importance: data.importance,
        pinned: data.pinned,
      });
      createNotification('MEMORY UPDATED', `Updated node under [${data.category}].`, 'SUCCESS');
      showToast('MEMORY UPDATED', `Memory node [${data.category}] updated.`, 'MEMORY');
    } else {
      const res = MemoryService.saveMemory(userId, {
        content: data.content,
        category: data.category,
        importance: data.importance,
        pinned: data.pinned,
        source: 'USER',
      });
      if (res.success && res.memory) {
        createNotification('MEMORY COMMITTED', `Preserved node under [${res.memory.category}].`, 'SUCCESS');
        showToast('MEMORY SAVED', `Knowledge node preserved in Blade 03: "${res.memory.content.slice(0, 40)}..."`, 'MEMORY');
      } else if (res.error) {
        createNotification('MEMORY ERROR', res.error, 'ALERT');
        showToast('SECURITY ALERT', res.error, 'ALERT');
      }
    }
    refreshMemories();
  };

  const categories = [
    'ALL',
    'PROFILE',
    'PREFERENCE',
    'PROJECT',
    'ACADEMIC',
    'IMPORTANT_DATE',
    'GENERAL',
  ];

  const importances = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  // Metrics
  const totalCount = memories.length;
  const pinnedCount = memories.filter((m) => m.pinned).length;
  const importantCount = memories.filter(
    (m) => m.importance === 'HIGH' || m.importance === 'CRITICAL'
  ).length;
  const recent24hCount = memories.filter(
    (m) => Date.now() - m.created_at < 86400000
  ).length;

  const filteredMemories = MemoryService.searchMemories(
    userId,
    search,
    selectedCategory,
    selectedImportance
  );

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#16281F] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#FFB000]/15 text-[#FFB000] border border-[#FFB000]/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#F5F7F6] tracking-wider">
                JARVIS MEMORY CORE
              </h1>
              <p className="text-[10px] text-[#FFB000] font-bold tracking-widest mt-0.5">
                PERSISTENT INTELLIGENCE • BLADE 03 (SANDAI KITETSU)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/dashboard')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#19F59A] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>COMMAND DECK</span>
          </button>
          <button
            onClick={() => {
              setEditingMemory(null);
              setEditorOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FFB000] text-[#050706] font-bold hover:bg-[#FFC030] transition-all shadow-[0_0_20px_rgba(255,176,0,0.25)]"
          >
            <Plus className="w-4 h-4" />
            <span>SAVE MEMORY</span>
          </button>
        </div>
      </div>

      {/* Intelligence Telemetry Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#0A100D] border border-[#16281F] flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-[#8B9992] tracking-wider uppercase block">
              Total Memories
            </span>
            <span className="text-2xl font-black text-[#F5F7F6] tracking-tight">{totalCount}</span>
          </div>
          <div className="p-2 rounded-lg bg-[#16281F] text-[#19F59A]">
            <Database className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0A100D] border border-[#FFB000]/30 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-[#FFB000] tracking-wider uppercase block">
              Pinned Priority
            </span>
            <span className="text-2xl font-black text-[#FFB000] tracking-tight">{pinnedCount}</span>
          </div>
          <div className="p-2 rounded-lg bg-[#FFB000]/15 text-[#FFB000]">
            <Pin className="w-4 h-4 fill-current" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0A100D] border border-[#16281F] flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-[#8B9992] tracking-wider uppercase block">
              High / Critical
            </span>
            <span className="text-2xl font-black text-[#F5F7F6] tracking-tight">{importantCount}</span>
          </div>
          <div className="p-2 rounded-lg bg-[#16281F] text-[#38E1FF]">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0A100D] border border-[#16281F] flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-[#8B9992] tracking-wider uppercase block">
              Recent (24h)
            </span>
            <span className="text-2xl font-black text-[#F5F7F6] tracking-tight">{recent24hCount}</span>
          </div>
          <div className="p-2 rounded-lg bg-[#16281F] text-[#8B9992]">
            <Clock className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Search and Filters Section */}
      <div className="p-4 rounded-2xl bg-[#0A100D] border border-[#16281F] space-y-3 shadow-md">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8B9992] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="SEARCH MEMORY (e.g. AI project, Python preference, deadline)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#050706] border border-[#16281F] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#F5F7F6] placeholder-[#8B9992] focus:border-[#FFB000] focus:ring-1 focus:ring-[#FFB000] outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#8B9992] flex items-center gap-1 shrink-0">
              <Filter className="w-3 h-3" /> IMPORTANCE:
            </span>
            <div className="flex items-center gap-1 overflow-x-auto">
              {importances.map((imp) => (
                <button
                  key={imp}
                  onClick={() => setSelectedImportance(imp)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 ${
                    selectedImportance === imp
                      ? 'bg-[#38E1FF] text-[#050706]'
                      : 'bg-[#050706] border border-[#16281F] text-[#8B9992] hover:text-[#F5F7F6]'
                  }`}
                >
                  {imp}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 border-t border-[#16281F]/60">
          <span className="text-[10px] text-[#8B9992] mr-1 shrink-0">CATEGORY:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 ${
                selectedCategory === cat
                  ? 'bg-[#FFB000] text-[#050706]'
                  : 'bg-[#050706] border border-[#16281F] text-[#8B9992] hover:text-[#F5F7F6]'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Memory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredMemories.length === 0 ? (
          <div className="col-span-2 p-12 text-center text-[#8B9992] bg-[#0A100D] border border-[#16281F] rounded-2xl space-y-3">
            <Database className="w-8 h-8 text-[#8B9992]/40 mx-auto" />
            <p className="text-xs">No persistent memory nodes found matching the specified parameters.</p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('ALL');
                setSelectedImportance('ALL');
              }}
              className="text-[#FFB000] hover:underline text-xs"
            >
              Clear filters and search
            </button>
          </div>
        ) : (
          filteredMemories.map((mem) => {
            const isCritical = mem.importance === 'CRITICAL';
            const isHigh = mem.importance === 'HIGH';

            return (
              <div
                key={mem.id}
                className={`p-4 rounded-2xl border transition-all relative flex flex-col justify-between space-y-3 group ${
                  mem.pinned
                    ? 'bg-[#0A100D] border-[#FFB000]/50 shadow-[0_0_15px_rgba(255,176,0,0.1)]'
                    : isCritical
                    ? 'bg-[#0A100D] border-[#FF3B30]/40'
                    : 'bg-[#0A100D] border-[#16281F] hover:border-[#FFB000]/30'
                }`}
              >
                {/* Card Top: Category, Importance, Actions */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#FFB000]/15 text-[#FFB000] border border-[#FFB000]/25">
                      {mem.category}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                        isCritical
                          ? 'bg-[#FF3B30]/15 text-[#FF3B30] border-[#FF3B30]/30'
                          : isHigh
                          ? 'bg-[#38E1FF]/15 text-[#38E1FF] border-[#38E1FF]/30'
                          : 'bg-[#16281F] text-[#8B9992] border-[#16281F]'
                      }`}
                    >
                      {mem.importance}
                    </span>
                    {mem.pinned && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FFB000] text-[#050706]">
                        PINNED
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleTogglePin(mem.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        mem.pinned
                          ? 'text-[#FFB000] bg-[#FFB000]/15'
                          : 'text-[#8B9992] hover:text-[#FFB000] hover:bg-[#16281F]'
                      }`}
                      title={mem.pinned ? 'Unpin node' : 'Pin node to priority context'}
                    >
                      <Pin className={`w-3.5 h-3.5 ${mem.pinned ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => {
                        setEditingMemory(mem);
                        setEditorOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-[#8B9992] hover:text-[#19F59A] hover:bg-[#16281F] transition-colors"
                      title="Edit Memory Node"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handlePromptForget(mem)}
                      className="p-1.5 rounded-lg text-[#8B9992] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-colors"
                      title="Forget Memory Node"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card Content */}
                <p className="text-xs font-sans text-[#F5F7F6] leading-relaxed break-words">
                  {mem.content}
                </p>

                {/* Card Footer: Metadata */}
                <div className="pt-2 border-t border-[#16281F] flex items-center justify-between text-[10px] text-[#8B9992]">
                  <span>SOURCE: {mem.source || 'USER'}</span>
                  <span>{new Date(mem.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Memory Editor Modal */}
      <MemoryEditor
        isOpen={editorOpen}
        initialMemory={editingMemory}
        onSave={handleSaveEditor}
        onClose={() => {
          setEditorOpen(false);
          setEditingMemory(null);
        }}
      />

      {/* Forget Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        detail={confirmDialog.detail}
        confirmLabel="FORGET"
        cancelLabel="CANCEL"
        danger={true}
        onConfirm={handleConfirmForget}
        onCancel={() => setConfirmDialog({ isOpen: false, title: '', message: '' })}
      />
    </div>
  );
};

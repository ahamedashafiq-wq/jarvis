import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Memory,
  RoutePath,
  KnowledgeEntity,
  KnowledgeRelationship,
  DecisionRecord,
  MemoryTimelineEvent,
  ProjectKnowledgeSnapshot,
} from '../types';
import { MemoryService } from '../services/memory';
import { NeuralMemoryService } from '../services/neuralMemory';
import { MemoryEditor } from '../components/MemoryEditor';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { KnowledgeGraph2D } from '../components/KnowledgeGraph2D';
import { ProjectSnapshotModal } from '../components/ProjectSnapshotModal';
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
  Layers,
  GitCommit,
  Activity,
  AlertTriangle,
  ArrowRight,
  Compass,
  CheckCircle,
  FileText,
  User,
  Eye,
  Target,
  RefreshCw,
} from 'lucide-react';

interface MemoryProps {
  onNavigate: (path: RoutePath) => void;
  initialTab?: MemoryTab;
}

type MemoryTab = 'GRAPH' | 'TIMELINE' | 'DECISIONS' | 'ENTITIES' | 'MEMORIES';

export const MemoryScreen: React.FC<MemoryProps> = ({ onNavigate, initialTab }) => {
  const { currentSession, createNotification } = useAuth();
  const userId = currentSession?.userId || 'guest';
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<MemoryTab>(initialTab || 'GRAPH');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Memories state
  const [memories, setMemories] = useState<Memory[]>(() => MemoryService.getMemories(userId));
  const [entities, setEntities] = useState<KnowledgeEntity[]>(() =>
    NeuralMemoryService.getEntities(userId)
  );
  const [relationships, setRelationships] = useState<KnowledgeRelationship[]>(() =>
    NeuralMemoryService.getRelationships(userId)
  );
  const [decisions, setDecisions] = useState<DecisionRecord[]>(() =>
    NeuralMemoryService.getDecisions(userId)
  );
  const [timeline, setTimeline] = useState<MemoryTimelineEvent[]>(() =>
    NeuralMemoryService.getMemoryTimeline(userId)
  );

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedImportance, setSelectedImportance] = useState<string>('ALL');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('ALL');

  // Modals state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);

  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [newDecisionText, setNewDecisionText] = useState('');
  const [newDecisionContext, setNewDecisionContext] = useState('');
  const [newDecisionProject, setNewDecisionProject] = useState('AI Assistant');

  const [snapshotModalOpen, setSnapshotModalOpen] = useState(false);
  const [currentSnapshot, setCurrentSnapshot] = useState<ProjectKnowledgeSnapshot | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    detail?: string;
    pendingAction?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const refreshAll = () => {
    setMemories([...MemoryService.getMemories(userId)]);
    setEntities([...NeuralMemoryService.getEntities(userId)]);
    setRelationships([...NeuralMemoryService.getRelationships(userId)]);
    setDecisions([...NeuralMemoryService.getDecisions(userId)]);
    setTimeline([...NeuralMemoryService.getMemoryTimeline(userId)]);
  };

  useEffect(() => {
    // Attempt remote sync if Supabase is active
    MemoryService.fetchRemoteMemories(userId).then((fetched) => {
      setMemories(fetched);
    });

    refreshAll();

    // Subscribe to cross-tab and realtime neural memory events
    const unsub1 = realtimeService.subscribe('MEMORY_CREATED', refreshAll);
    const unsub2 = realtimeService.subscribe('MEMORY_UPDATED', refreshAll);
    const unsub3 = realtimeService.subscribe('MEMORY_DELETED', refreshAll);
    const unsub4 = realtimeService.subscribe('MEMORY_PINNED', refreshAll);
    const unsub5 = realtimeService.subscribe('MEMORY_UNPINNED', refreshAll);
    const unsub6 = realtimeService.subscribe('ENTITY_CREATED', refreshAll);
    const unsub7 = realtimeService.subscribe('ENTITY_UPDATED', refreshAll);
    const unsub8 = realtimeService.subscribe('RELATIONSHIP_CREATED', refreshAll);
    const unsub9 = realtimeService.subscribe('RELATIONSHIP_REMOVED', refreshAll);

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
      unsub6();
      unsub7();
      unsub8();
      unsub9();
    };
  }, [userId]);

  const handleTogglePin = (id: string) => {
    const toggled = MemoryService.togglePin(userId, id);
    if (toggled) {
      refreshAll();
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
      pendingAction: () => {
        MemoryService.deleteMemory(userId, mem.id);
        refreshAll();
        createNotification('MEMORY PURGED', 'Memory node removed from persistent database.', 'WARNING');
        showToast('MEMORY PURGED', 'Memory node deleted from Blade 03 database.', 'WARNING');
      },
    });
  };

  const handlePromptDeleteEntity = (entityId: string) => {
    const ent = entities.find((e) => e.id === entityId);
    setConfirmDialog({
      isOpen: true,
      title: 'DELETE KNOWLEDGE ENTITY?',
      message: `Are you sure you want to delete entity "${ent?.name}" and all associated relationships?`,
      detail: ent ? `[${ent.entity_type}] ${ent.name}` : entityId,
      pendingAction: () => {
        NeuralMemoryService.deleteEntity(userId, entityId);
        refreshAll();
        showToast('ENTITY REMOVED', 'Knowledge entity removed from graph.', 'MEMORY');
      },
    });
  };

  const handlePromptDeleteDecision = (decisionId: string) => {
    const dec = decisions.find((d) => d.id === decisionId);
    setConfirmDialog({
      isOpen: true,
      title: 'DELETE PROJECT DECISION?',
      message: 'Are you sure you want to permanently delete this project decision record?',
      detail: dec ? dec.decision : decisionId,
      pendingAction: () => {
        NeuralMemoryService.deleteDecision(userId, decisionId);
        refreshAll();
        showToast('DECISION REMOVED', 'Decision deleted from project context.', 'MEMORY');
      },
    });
  };

  const handleOpenSnapshot = () => {
    const snap = NeuralMemoryService.getProjectSnapshot(userId, 'AI Assistant');
    setCurrentSnapshot(snap);
    setSnapshotModalOpen(true);
  };

  const handleSaveDecision = () => {
    if (!newDecisionText.trim()) return;

    const res = NeuralMemoryService.saveDecision(userId, {
      decision: newDecisionText.trim(),
      context: newDecisionContext.trim(),
      projectName: newDecisionProject.trim() || 'AI Assistant',
      source: 'USER_SAVED',
      quality: 'EXPLICITLY_SAVED',
    });

    setDecisionModalOpen(false);
    setNewDecisionText('');
    setNewDecisionContext('');
    refreshAll();

    if (res.conflictReport.hasConflict) {
      showToast(
        'CONFLICT DETECTED & UPDATED',
        `Superseded earlier decision: "${res.conflictReport.oldDecision?.decision}".`,
        'WARNING'
      );
    } else {
      showToast('DECISION SAVED', `Project decision committed: "${res.decision.decision}"`, 'SUCCESS');
    }
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
        showToast(
          'MEMORY SAVED',
          `Knowledge node preserved in Blade 03: "${res.memory.content.slice(0, 40)}..."`,
          'MEMORY'
        );
      } else if (res.error) {
        createNotification('MEMORY ERROR', res.error, 'ALERT');
        showToast('SECURITY ALERT', res.error, 'ALERT');
      }
    }
    refreshAll();
  };

  // Metrics
  const activeDecisionsCount = decisions.filter((d) => d.status === 'ACTIVE').length;
  const supersededDecisionsCount = decisions.filter((d) => d.status === 'SUPERSEDED').length;
  const pinnedCount = memories.filter((m) => m.pinned).length;

  // Filtered lists
  const filteredMemories = useMemo(() => {
    return MemoryService.searchMemories(userId, search, selectedCategory, selectedImportance);
  }, [userId, search, selectedCategory, selectedImportance, memories]);

  const filteredDecisions = useMemo(() => {
    const q = search.toLowerCase().trim();
    return decisions.filter(
      (d) =>
        !q ||
        d.decision.toLowerCase().includes(q) ||
        d.context?.toLowerCase().includes(q) ||
        d.projectName?.toLowerCase().includes(q)
    );
  }, [decisions, search]);

  const filteredEntities = useMemo(() => {
    const q = search.toLowerCase().trim();
    return entities.filter((e) => {
      const matchType = selectedEntityType === 'ALL' || e.entity_type === selectedEntityType;
      const matchText =
        !q || e.name.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q);
      return matchType && matchText;
    });
  }, [entities, search, selectedEntityType]);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 font-mono text-xs select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#16281F] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#19F59A]/15 text-[#19F59A] border border-[#19F59A]/30">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-[#F5F7F6] tracking-wider">
                  JARVIS NEURAL MEMORY
                </h1>
                <span className="text-[9px] px-2 py-0.5 rounded bg-[#16281F] text-[#19F59A] font-bold">
                  PHASE 11
                </span>
              </div>
              <p className="text-[10px] text-[#19F59A] font-bold tracking-widest mt-0.5">
                ENTITIES • RELATIONSHIPS • DECISION TIMELINE • BLADE 03
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('/dashboard')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#19F59A] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>COMMAND DECK</span>
          </button>

          <button
            onClick={handleOpenSnapshot}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#121C17] border border-[#38E1FF]/40 text-[#38E1FF] hover:bg-[#38E1FF]/15 transition-all font-bold shadow-[0_0_15px_rgba(56,225,255,0.15)]"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>PROJECT SNAPSHOT</span>
          </button>

          <button
            onClick={() => setDecisionModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#A78BFA]/20 border border-[#A78BFA]/40 text-[#A78BFA] hover:bg-[#A78BFA]/30 transition-all font-bold"
          >
            <GitCommit className="w-3.5 h-3.5" />
            <span>LOG DECISION</span>
          </button>

          <button
            onClick={() => {
              setEditingMemory(null);
              setEditorOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#19F59A] text-[#050706] font-bold hover:bg-[#00D084] transition-all shadow-[0_0_20px_rgba(25,245,154,0.25)]"
          >
            <Plus className="w-4 h-4" />
            <span>SAVE MEMORY</span>
          </button>
        </div>
      </div>

      {/* Intelligence Telemetry Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          onClick={() => setActiveTab('ENTITIES')}
          className="p-4 rounded-xl bg-[#0A100D] border border-[#16281F] hover:border-[#19F59A]/40 transition-all cursor-pointer flex items-center justify-between shadow-sm"
        >
          <div>
            <span className="text-[10px] text-[#8B9992] tracking-wider uppercase block">
              Knowledge Entities
            </span>
            <span className="text-2xl font-black text-[#F5F7F6] tracking-tight">
              {entities.length}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-[#16281F] text-[#19F59A]">
            <Compass className="w-4 h-4" />
          </div>
        </div>

        <div
          onClick={() => setActiveTab('GRAPH')}
          className="p-4 rounded-xl bg-[#0A100D] border border-[#16281F] hover:border-[#38E1FF]/40 transition-all cursor-pointer flex items-center justify-between shadow-sm"
        >
          <div>
            <span className="text-[10px] text-[#8B9992] tracking-wider uppercase block">
              Graph Relationships
            </span>
            <span className="text-2xl font-black text-[#38E1FF] tracking-tight">
              {relationships.length}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-[#16281F] text-[#38E1FF]">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div
          onClick={() => setActiveTab('DECISIONS')}
          className="p-4 rounded-xl bg-[#0A100D] border border-[#A78BFA]/30 hover:border-[#A78BFA]/60 transition-all cursor-pointer flex items-center justify-between shadow-sm"
        >
          <div>
            <span className="text-[10px] text-[#A78BFA] tracking-wider uppercase block">
              Active Decisions
            </span>
            <span className="text-2xl font-black text-[#A78BFA] tracking-tight">
              {activeDecisionsCount}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-[#A78BFA]/15 text-[#A78BFA]">
            <GitCommit className="w-4 h-4" />
          </div>
        </div>

        <div
          onClick={() => setActiveTab('TIMELINE')}
          className="p-4 rounded-xl bg-[#0A100D] border border-[#16281F] hover:border-[#FFB000]/40 transition-all cursor-pointer flex items-center justify-between shadow-sm"
        >
          <div>
            <span className="text-[10px] text-[#8B9992] tracking-wider uppercase block">
              Timeline Milestones
            </span>
            <span className="text-2xl font-black text-[#FFB000] tracking-tight">
              {timeline.length}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-[#FFB000]/15 text-[#FFB000]">
            <Clock className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#16281F] pb-2 overflow-x-auto">
        {(
          [
            { id: 'GRAPH', label: '2D KNOWLEDGE GRAPH', icon: <Compass className="w-3.5 h-3.5" /> },
            { id: 'TIMELINE', label: `TIMELINE (${timeline.length})`, icon: <Clock className="w-3.5 h-3.5" /> },
            { id: 'DECISIONS', label: `DECISION MEMORY (${activeDecisionsCount})`, icon: <GitCommit className="w-3.5 h-3.5" /> },
            { id: 'ENTITIES', label: `ENTITIES (${entities.length})`, icon: <Layers className="w-3.5 h-3.5" /> },
            { id: 'MEMORIES', label: `MEMORIES (${memories.length})`, icon: <Database className="w-3.5 h-3.5" /> },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === tab.id
                ? 'bg-[#19F59A] text-[#050706] shadow-[0_0_12px_rgba(25,245,154,0.25)]'
                : 'bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#F5F7F6]'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Global Knowledge Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0A100D] border border-[#16281F] space-y-3 shadow-md">
        <div className="relative">
          <Search className="w-4 h-4 text-[#8B9992] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="SEARCH KNOWLEDGE & NEURAL MEMORY (e.g. FastAPI, backend decision, AI project, timeline)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#050706] border border-[#16281F] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#F5F7F6] placeholder-[#8B9992] focus:border-[#19F59A] focus:ring-1 focus:ring-[#19F59A] outline-none"
          />
        </div>
      </div>

      {/* VIEW 1: 2D KNOWLEDGE GRAPH */}
      {activeTab === 'GRAPH' && (
        <div className="h-[600px]">
          <KnowledgeGraph2D
            entities={entities}
            relationships={relationships}
            onSelectEntity={(ent) => {
              // Highlight selected
            }}
            onDeleteEntity={handlePromptDeleteEntity}
            onExpandEntity={(entId) => {
              showToast('GRAPH EXPANDED', 'Expanded relational neighborhood traversal.', 'MEMORY');
            }}
          />
        </div>
      )}

      {/* VIEW 2: MEMORY TIMELINE (Requirement 15) */}
      {activeTab === 'TIMELINE' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#F5F7F6] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#FFB000]" />
              CHRONOLOGICAL KNOWLEDGE TIMELINE
            </span>
            <span className="text-[10px] text-[#8B9992]">
              ACTUAL TIMESTAMPS • AUDITED CHRONOLOGY
            </span>
          </div>

          <div className="relative border-l border-[#16281F] ml-4 pl-6 space-y-6">
            {timeline.length === 0 ? (
              <p className="text-xs text-[#8B9992] italic">No timeline events recorded yet.</p>
            ) : (
              timeline.map((ev) => {
                const dateObj = new Date(ev.timestamp);
                const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

                return (
                  <div key={ev.id} className="relative group">
                    {/* Timestamp Dot */}
                    <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-[#050706] border-2 border-[#19F59A] group-hover:scale-125 transition-transform" />

                    <div className="p-4 rounded-xl bg-[#0A100D] border border-[#16281F] hover:border-[#19F59A]/30 transition-all space-y-1.5 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#16281F] text-[#38E1FF] font-bold">
                            {ev.type.replace(/_/g, ' ')}
                          </span>
                          <span className="font-bold text-[#F5F7F6] text-xs">{ev.title}</span>
                        </div>
                        <div className="text-[10px] text-[#8B9992] flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          <span>
                            {dateStr} • {timeStr}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-[#8B9992] font-sans leading-relaxed">
                        {ev.description}
                      </p>

                      <div className="flex items-center gap-3 text-[9px] text-[#8B9992] pt-1">
                        <span>Source: {ev.source}</span>
                        {ev.entityName && (
                          <>
                            <span>•</span>
                            <span className="text-[#19F59A]">Project: {ev.entityName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: DECISION MEMORY (Requirements 12, 23, 24) */}
      {activeTab === 'DECISIONS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#F5F7F6] flex items-center gap-1.5">
              <GitCommit className="w-4 h-4 text-[#A78BFA]" />
              STRUCTURED PROJECT DECISIONS ({filteredDecisions.length})
            </span>
            <button
              onClick={() => setDecisionModalOpen(true)}
              className="py-1 px-3 rounded-lg bg-[#A78BFA] text-[#050706] font-bold text-xs hover:bg-[#A78BFA]/90 transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>NEW DECISION</span>
            </button>
          </div>

          {/* Conflict detection notice banner if any superseded exists */}
          {supersededDecisionsCount > 0 && (
            <div className="p-3.5 rounded-xl bg-[#A78BFA]/10 border border-[#A78BFA]/30 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2 text-[#A78BFA]">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>
                  <strong>DECISION HISTORY PRESERVED:</strong> {supersededDecisionsCount} previous
                  architectural decisions safely archived with full update tracking (UPDATES link).
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredDecisions.length === 0 ? (
              <p className="text-xs text-[#8B9992] italic col-span-2">
                No decision records matching filter criteria.
              </p>
            ) : (
              filteredDecisions.map((dec) => {
                const isActive = dec.status === 'ACTIVE';
                return (
                  <div
                    key={dec.id}
                    className={`p-4 rounded-xl border transition-all space-y-2.5 ${
                      isActive
                        ? 'bg-[#0A100D] border-[#16281F] hover:border-[#A78BFA]/40 shadow-sm'
                        : 'bg-[#050706] border-[#16281F]/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#A78BFA] uppercase">
                        {dec.projectName || 'AI Assistant'}
                      </span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                          isActive
                            ? 'bg-[#A78BFA]/20 text-[#A78BFA]'
                            : 'bg-[#16281F] text-[#8B9992]'
                        }`}
                      >
                        {dec.status}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-[#F5F7F6] leading-snug">
                      {dec.decision}
                    </div>

                    {dec.context && (
                      <p className="text-[11px] text-[#8B9992] font-sans">{dec.context}</p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-[#16281F] text-[10px] text-[#8B9992]">
                      <span>{new Date(dec.created_at).toLocaleDateString()}</span>
                      <div className="flex items-center gap-2">
                        <span>{dec.source}</span>
                        <button
                          onClick={() => handlePromptDeleteDecision(dec.id)}
                          className="hover:text-[#FF3B30] transition-colors p-1"
                          title="Delete Decision"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* VIEW 4: KNOWLEDGE ENTITIES (Requirements 3 & 4) */}
      {activeTab === 'ENTITIES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#F5F7F6] flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#19F59A]" />
              KNOWLEDGE ENTITIES REGISTER ({filteredEntities.length})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredEntities.map((ent) => {
              const relCount = relationships.filter(
                (r) => r.source_entity_id === ent.id || r.target_entity_id === ent.id
              ).length;

              return (
                <div
                  key={ent.id}
                  className="p-4 rounded-xl bg-[#0A100D] border border-[#16281F] hover:border-[#19F59A]/40 transition-all space-y-2 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#16281F] text-[#19F59A]">
                      {ent.entity_type}
                    </span>
                    <span className="text-[10px] text-[#8B9992]">{relCount} LINKS</span>
                  </div>

                  <div className="text-xs font-bold text-[#F5F7F6] truncate">{ent.name}</div>
                  {ent.description && (
                    <p className="text-[11px] text-[#8B9992] font-sans line-clamp-2">
                      {ent.description}
                    </p>
                  )}

                  <div className="pt-2 border-t border-[#16281F] flex items-center justify-between text-[10px] text-[#8B9992]">
                    <span>{new Date(ent.created_at).toLocaleDateString()}</span>
                    <button
                      onClick={() => handlePromptDeleteEntity(ent.id)}
                      className="p-1 hover:text-[#FF3B30] text-[#8B9992] transition-colors"
                      title="Delete Entity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 5: PERSISTENT MEMORIES (Preserved Phases 1–10) */}
      {activeTab === 'MEMORIES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#F5F7F6] flex items-center gap-1.5">
              <Database className="w-4 h-4 text-[#FFB000]" />
              PERSISTENT MEMORY NODES ({filteredMemories.length})
            </span>
            <button
              onClick={() => {
                setEditingMemory(null);
                setEditorOpen(true);
              }}
              className="py-1 px-3 rounded-lg bg-[#FFB000] text-[#050706] font-bold text-xs hover:bg-[#FFC030] transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ADD MEMORY</span>
            </button>
          </div>

          <div className="space-y-3">
            {filteredMemories.length === 0 ? (
              <p className="text-xs text-[#8B9992] italic">No memories matching search filters.</p>
            ) : (
              filteredMemories.map((mem) => (
                <div
                  key={mem.id}
                  className={`p-4 rounded-xl border transition-all space-y-2 ${
                    mem.pinned
                      ? 'bg-[#0A100D] border-[#FFB000]/40 shadow-sm'
                      : 'bg-[#0A100D] border-[#16281F] hover:border-[#16281F]/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#16281F] text-[#38E1FF]">
                        {mem.category}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#050706] text-[#8B9992]">
                        {mem.importance}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleTogglePin(mem.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          mem.pinned
                            ? 'text-[#FFB000] bg-[#FFB000]/15'
                            : 'text-[#8B9992] hover:text-[#F5F7F6]'
                        }`}
                        title={mem.pinned ? 'Unpin Memory' : 'Pin Memory'}
                      >
                        <Pin className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingMemory(mem);
                          setEditorOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-[#8B9992] hover:text-[#38E1FF] transition-colors"
                        title="Edit Memory"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handlePromptForget(mem)}
                        className="p-1.5 rounded-lg text-[#8B9992] hover:text-[#FF3B30] transition-colors"
                        title="Forget Memory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#F5F7F6] font-sans leading-relaxed">{mem.content}</p>

                  <div className="flex items-center justify-between text-[10px] text-[#8B9992] pt-1 border-t border-[#16281F]">
                    <span>{new Date(mem.created_at).toLocaleDateString()}</span>
                    <span>Source: {mem.source || 'USER'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* New Decision Modal */}
      {decisionModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#050706]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0A100D] border border-[#16281F] w-full max-w-lg rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#16281F] pb-3">
              <span className="text-sm font-bold text-[#F5F7F6] flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-[#A78BFA]" />
                RECORD PROJECT DECISION
              </span>
              <button
                onClick={() => setDecisionModalOpen(false)}
                className="text-[#8B9992] hover:text-[#F5F7F6]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-[10px] text-[#8B9992] block mb-1">PROJECT NAME</label>
                <input
                  type="text"
                  value={newDecisionProject}
                  onChange={(e) => setNewDecisionProject(e.target.value)}
                  className="w-full bg-[#050706] border border-[#16281F] rounded-xl px-3 py-2 text-xs text-[#F5F7F6] outline-none focus:border-[#A78BFA]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#8B9992] block mb-1">DECISION STATEMENT *</label>
                <input
                  type="text"
                  placeholder="e.g. Use FastAPI for the backend / Switch backend to Node.js"
                  value={newDecisionText}
                  onChange={(e) => setNewDecisionText(e.target.value)}
                  className="w-full bg-[#050706] border border-[#16281F] rounded-xl px-3 py-2 text-xs text-[#F5F7F6] outline-none focus:border-[#A78BFA]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#8B9992] block mb-1">CONTEXT & REASONING</label>
                <textarea
                  rows={3}
                  placeholder="Provide background context, alternatives considered, or trade-offs..."
                  value={newDecisionContext}
                  onChange={(e) => setNewDecisionContext(e.target.value)}
                  className="w-full bg-[#050706] border border-[#16281F] rounded-xl p-3 text-xs text-[#F5F7F6] outline-none focus:border-[#A78BFA]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#16281F]">
              <button
                onClick={() => setDecisionModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#050706] border border-[#16281F] text-[#8B9992] hover:text-[#F5F7F6] text-xs font-bold"
              >
                CANCEL
              </button>
              <button
                onClick={handleSaveDecision}
                disabled={!newDecisionText.trim()}
                className="px-4 py-2 rounded-xl bg-[#A78BFA] text-[#050706] font-bold text-xs hover:bg-[#A78BFA]/90 disabled:opacity-50 transition-all"
              >
                COMMIT DECISION
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Memory Editor Modal */}
      <MemoryEditor
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSaveEditor}
        initialMemory={editingMemory}
      />

      {/* Project Knowledge Snapshot Modal */}
      {currentSnapshot && (
        <ProjectSnapshotModal
          isOpen={snapshotModalOpen}
          onClose={() => setSnapshotModalOpen(false)}
          snapshot={currentSnapshot}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        detail={confirmDialog.detail}
        confirmLabel="PURGE NODE"
        cancelLabel="CANCEL"
        danger={true}
        onConfirm={() => {
          if (confirmDialog.pendingAction) confirmDialog.pendingAction();
          setConfirmDialog({ isOpen: false, title: '', message: '' });
        }}
        onCancel={() => setConfirmDialog({ isOpen: false, title: '', message: '' })}
      />
    </div>
  );
};

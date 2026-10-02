import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { RoutePath } from '../types';
import {
  BookOpen,
  Search,
  Plus,
  Tag,
  Folder,
  FileText,
  Clock,
  Pin,
  Trash2,
  Edit3,
  ExternalLink,
  Sparkles,
  Share2,
  Check,
  X,
  Layers,
  Archive,
  ArrowRight,
} from 'lucide-react';
import { getLocalStore, setLocalStore } from '../services/supabase';
import { soundService } from '../services/sound';

export interface KnowledgeDoc {
  id: string;
  title: string;
  category: 'ARCHITECTURE' | 'STUDY' | 'PROJECT_BRIEF' | 'DECISION_LOG' | 'RESEARCH' | 'NOTES';
  content: string;
  tags: string[];
  isPinned: boolean;
  updatedAt: number;
  createdAt: number;
}

interface KnowledgeProps {
  onNavigate: (path: RoutePath) => void;
}

export const KnowledgeScreen: React.FC<KnowledgeProps> = ({ onNavigate }) => {
  const { currentSession } = useAuth();
  const userId = currentSession?.userId || 'guest';

  const defaultDocs: KnowledgeDoc[] = [
    {
      id: 'doc_1',
      title: 'ZORO 2.0 Architectural Specification & Directive Flow',
      category: 'ARCHITECTURE',
      content:
        'Three Blades Unified Matrix:\n• Blade 01: Reasoning & Cognition (Google Gemini 2.5 Flash)\n• Blade 02: Action Queue & Agentic Execution (Autonomous Planner with Guardian safety checks)\n• Blade 03: Multimodal Vision & Persistent Memory (Optical Telemetry & Cross-session Synapse)',
      tags: ['architecture', 'zoro', 'three-blades', 'spec'],
      isPinned: true,
      updatedAt: Date.now() - 3600000,
      createdAt: Date.now() - 86400000,
    },
    {
      id: 'doc_2',
      title: 'Autonomous Multi-Agent Council Orchestration Protocol',
      category: 'RESEARCH',
      content:
        'When high-complexity goals are dispatched, the system activates the Agent Council:\n1. Planner agent decomposes directive into atomic steps.\n2. Memory agent injects historical decisions and constraints.\n3. Coding & Vision specialists audit structural integrity.\n4. Guardian checks for destructive actions requiring operator approval.',
      tags: ['agents', 'council', 'orchestration', 'guardian'],
      isPinned: true,
      updatedAt: Date.now() - 7200000,
      createdAt: Date.now() - 172800000,
    },
    {
      id: 'doc_3',
      title: 'Placement & Career Development Project Milestones',
      category: 'PROJECT_BRIEF',
      content:
        'Target objectives for upcoming recruitment cycle:\n- Complete high-fidelity AI Command Center demonstration.\n- Optimize real-time multimodal audio and vision integration.\n- Package system documentation and verification test logs.',
      tags: ['career', 'milestones', 'objectives'],
      isPinned: false,
      updatedAt: Date.now() - 18000000,
      createdAt: Date.now() - 259200000,
    },
  ];

  const [docs, setDocs] = useState<KnowledgeDoc[]>(() =>
    getLocalStore<KnowledgeDoc[]>(`zoro_knowledge_${userId}`, defaultDocs)
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDocId, setSelectedDocId] = useState<string>(docs[0]?.id || '');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form states for new/edit doc
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<KnowledgeDoc['category']>('NOTES');
  const [docContent, setDocContent] = useState('');
  const [docTags, setDocTags] = useState('');

  const saveDocs = (newDocs: KnowledgeDoc[]) => {
    setDocs(newDocs);
    setLocalStore(`zoro_knowledge_${userId}`, newDocs);
  };

  const filteredDocs = useMemo(() => {
    return docs.filter((doc) => {
      const matchesSearch =
        searchQuery === '' ||
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = selectedCategory === 'ALL' || doc.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [docs, searchQuery, selectedCategory]);

  const activeDoc = useMemo(() => {
    return docs.find((d) => d.id === selectedDocId) || filteredDocs[0] || null;
  }, [docs, selectedDocId, filteredDocs]);

  const handleCreateDoc = () => {
    if (!docTitle.trim()) return;
    const newDoc: KnowledgeDoc = {
      id: 'doc_' + Date.now(),
      title: docTitle.trim(),
      category: docCategory,
      content: docContent.trim(),
      tags: docTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      isPinned: false,
      updatedAt: Date.now(),
      createdAt: Date.now(),
    };

    saveDocs([newDoc, ...docs]);
    setSelectedDocId(newDoc.id);
    setIsCreatingNew(false);
    setDocTitle('');
    setDocContent('');
    setDocTags('');
    soundService.play('COMMAND_SUCCESS');
  };

  const togglePin = (id: string) => {
    const updated = docs.map((d) => (d.id === id ? { ...d, isPinned: !d.isPinned } : d));
    saveDocs(updated);
    soundService.play('CLICK');
  };

  const deleteDoc = (id: string) => {
    const updated = docs.filter((d) => d.id !== id);
    saveDocs(updated);
    if (selectedDocId === id) {
      setSelectedDocId(updated[0]?.id || '');
    }
    soundService.play('CLICK');
  };

  const categories = ['ALL', 'ARCHITECTURE', 'RESEARCH', 'PROJECT_BRIEF', 'DECISION_LOG', 'STUDY', 'NOTES'];

  return (
    <div className="space-y-6 font-mono select-none text-xs text-zoro-text">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zoro-border pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-zoro-cyan/15 text-zoro-cyan border border-zoro-cyan/30 shadow-[0_0_15px_rgba(25,217,255,0.15)]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-zoro-text tracking-wider flex items-center gap-2">
                ZORO KNOWLEDGE CENTER
              </h1>
              <p className="text-[10px] text-zoro-textMuted tracking-wider mt-0.5">
                INDEXED REPOSITORY • PROJECT SPECS • SYSTEM ARCHITECTURE
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/memory/graph')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zoro-panel border border-zoro-border text-zoro-textSecondary hover:text-zoro-cyan hover:border-zoro-cyan/40 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>NEURAL GRAPH</span>
          </button>
          <button
            onClick={() => {
              setIsCreatingNew(true);
              soundService.play('CLICK');
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-zoro-cyan to-zoro-blue text-black font-bold hover:opacity-95 transition-all shadow-[0_0_15px_rgba(25,217,255,0.25)]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>NEW DOCUMENT</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Split: Document Navigator (Left) + Document Viewer / Editor (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Search, Category Filters & Document List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="relative rounded-xl border border-zoro-border bg-zoro-panel focus-within:border-zoro-cyan/60 flex items-center px-3 py-2">
            <Search className="w-3.5 h-3.5 text-zoro-textMuted mr-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search knowledge repository..."
              className="w-full bg-transparent text-xs text-zoro-text placeholder:text-zoro-textMuted outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-zoro-textMuted hover:text-zoro-text">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap gap-1 text-[10px]">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-0.5 rounded border transition-colors ${
                  selectedCategory === cat
                    ? 'border-zoro-cyan bg-zoro-cyan/15 text-zoro-cyan font-bold'
                    : 'border-zoro-border bg-zoro-panel text-zoro-textMuted hover:text-zoro-text'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Document List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredDocs.length === 0 ? (
              <div className="p-8 text-center text-zoro-textMuted rounded-xl border border-dashed border-zoro-border">
                No documents found matching filters.
              </div>
            ) : (
              filteredDocs.map((doc) => {
                const isSelected = activeDoc?.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setSelectedDocId(doc.id);
                      setIsCreatingNew(false);
                      soundService.play('CLICK');
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
                      isSelected
                        ? 'border-zoro-cyan bg-zoro-panelElevated shadow-[inset_0_0_12px_rgba(25,217,255,0.06)]'
                        : 'border-zoro-border bg-zoro-panel hover:bg-zoro-panelElevated hover:border-zoro-borderHover'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-zoro-bg border border-zoro-border text-zoro-cyan">
                        {doc.category.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePin(doc.id);
                          }}
                          className={`p-1 rounded ${
                            doc.isPinned ? 'text-zoro-warning' : 'text-zoro-textMuted hover:text-zoro-text'
                          }`}
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="font-bold text-xs text-zoro-text line-clamp-1">{doc.title}</div>
                    <div className="text-[11px] text-zoro-textSecondary line-clamp-2 leading-relaxed">
                      {doc.content}
                    </div>

                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      {doc.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[9px] text-zoro-textMuted bg-zoro-bg px-1.5 py-0.2 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Viewer or Creator */}
        <div className="lg:col-span-8 rounded-2xl border border-zoro-border bg-zoro-panel p-5 sm:p-6 shadow-xl space-y-4">
          {isCreatingNew ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zoro-border pb-3">
                <span className="font-bold text-sm text-zoro-text flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-zoro-cyan" />
                  CREATE KNOWLEDGE DOCUMENT
                </span>
                <button
                  onClick={() => setIsCreatingNew(false)}
                  className="text-zoro-textMuted hover:text-zoro-text text-xs"
                >
                  CANCEL
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-zoro-textMuted block mb-1">DOCUMENT TITLE</label>
                  <input
                    type="text"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="e.g. Scalable AI Micro-Agent Integration Patterns..."
                    className="w-full bg-zoro-bg border border-zoro-border rounded-xl px-3.5 py-2 text-xs text-zoro-text placeholder:text-zoro-textMuted outline-none focus:border-zoro-cyan/60"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-zoro-textMuted block mb-1">CATEGORY</label>
                    <select
                      value={docCategory}
                      onChange={(e) => setDocCategory(e.target.value as any)}
                      className="w-full bg-zoro-bg border border-zoro-border rounded-xl px-3 py-2 text-xs text-zoro-text outline-none"
                    >
                      <option value="ARCHITECTURE">ARCHITECTURE</option>
                      <option value="RESEARCH">RESEARCH</option>
                      <option value="PROJECT_BRIEF">PROJECT BRIEF</option>
                      <option value="DECISION_LOG">DECISION LOG</option>
                      <option value="STUDY">STUDY</option>
                      <option value="NOTES">NOTES</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-zoro-textMuted block mb-1">TAGS (COMMA SEPARATED)</label>
                    <input
                      type="text"
                      value={docTags}
                      onChange={(e) => setDocTags(e.target.value)}
                      placeholder="e.g. ai, agents, architecture"
                      className="w-full bg-zoro-bg border border-zoro-border rounded-xl px-3 py-2 text-xs text-zoro-text outline-none focus:border-zoro-cyan/60"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-zoro-textMuted block mb-1">DOCUMENT BODY</label>
                  <textarea
                    rows={12}
                    value={docContent}
                    onChange={(e) => setDocContent(e.target.value)}
                    placeholder="Write structured knowledge, research notes, technical specifications, or decision logs..."
                    className="w-full bg-zoro-bg border border-zoro-border rounded-xl p-3.5 text-xs text-zoro-text outline-none focus:border-zoro-cyan/60 font-mono leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsCreatingNew(false)}
                    className="px-4 py-2 rounded-xl border border-zoro-border bg-zoro-bg text-zoro-textSecondary hover:text-zoro-text text-xs"
                  >
                    DISCARD
                  </button>
                  <button
                    onClick={handleCreateDoc}
                    disabled={!docTitle.trim()}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-zoro-cyan to-zoro-blue text-black font-bold text-xs disabled:opacity-40"
                  >
                    SAVE DOCUMENT
                  </button>
                </div>
              </div>
            </div>
          ) : activeDoc ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between border-b border-zoro-border pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zoro-cyan/15 text-zoro-cyan border border-zoro-cyan/30">
                      {activeDoc.category.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-zoro-textMuted">
                      Updated {new Date(activeDoc.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-zoro-text">{activeDoc.title}</h2>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => togglePin(activeDoc.id)}
                    className={`p-2 rounded-lg border border-zoro-border bg-zoro-bg ${
                      activeDoc.isPinned ? 'text-zoro-warning' : 'text-zoro-textMuted hover:text-zoro-text'
                    }`}
                    title="Pin Document"
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteDoc(activeDoc.id)}
                    className="p-2 rounded-lg border border-zoro-border bg-zoro-bg text-zoro-textMuted hover:text-zoro-critical"
                    title="Delete Document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Document Content Display */}
              <div className="bg-zoro-panelElevated/50 p-4 rounded-xl border border-zoro-border/60 text-xs text-zoro-textSecondary leading-relaxed whitespace-pre-wrap font-sans min-h-[300px]">
                {activeDoc.content}
              </div>

              {/* Tags and Metadata Footer */}
              <div className="pt-2 flex items-center justify-between border-t border-zoro-border text-[10px]">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Tag className="w-3 h-3 text-zoro-cyan" />
                  {activeDoc.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded bg-zoro-bg border border-zoro-border text-zoro-textSecondary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="text-zoro-textMuted">
                  DOC ID: <span className="font-mono text-zoro-text">{activeDoc.id}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-zoro-textMuted">
              Select a document to inspect or create a new entry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

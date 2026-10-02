import React, { useState, useEffect } from 'react';
import {
  Database,
  Share2,
  GitBranch,
  Search,
  ExternalLink,
  CheckCircle2,
  Plus,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Memory, DecisionRecord, KnowledgeEntity, RoutePath } from '../../types';
import { MemoryService } from '../../services/memory';
import { NeuralMemoryService } from '../../services/neuralMemory';
import { soundService } from '../../services/sound';

interface MemoryCoreWidgetProps {
  userId: string;
  onNavigate: (path: RoutePath) => void;
}

export const MemoryCoreWidget: React.FC<MemoryCoreWidgetProps> = ({
  userId,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<
    'RECENT' | 'DECISIONS' | 'PROJECT_CONTEXT' | 'GRAPH'
  >('RECENT');
  const [memories, setMemories] = useState<Memory[]>([]);
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [entities, setEntities] = useState<KnowledgeEntity[]>([]);
  const [newMemoryText, setNewMemoryText] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const loadData = () => {
    try {
      const memList = MemoryService.getMemories(userId);
      setMemories(memList);

      const decList = NeuralMemoryService.getDecisions(userId);
      setDecisions(decList);

      const entList = NeuralMemoryService.getEntities(userId);
      setEntities(entList);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryText.trim()) return;

    soundService.play('COMMAND_SUCCESS');
    const res = MemoryService.saveMemory(userId, {
      content: newMemoryText.trim(),
      category: 'GENERAL',
      importance: 'HIGH',
      pinned: false,
      source: 'USER',
    });

    if (res.memory) {
      setMemories((prev) => [res.memory!, ...prev]);
    }
    setNewMemoryText('');
    setIsAdding(false);
  };

  return (
    <div className="rounded-lg border border-jarvis-border bg-jarvis-surfaceElevated p-4 space-y-4 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-jarvis-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-jarvis-accent" />
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-jarvis-text tracking-wider">
              ZORO MEMORY CORE 2.0 (BLADE 03)
            </h2>
            <p className="text-[10px] text-jarvis-textMuted">SANDAI KITETSU PERSISTENT KNOWLEDGE MATRIX</p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('/memory')}
          className="text-xs text-jarvis-accent hover:underline flex items-center gap-1"
        >
          <span>OPEN MATRIX</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* Memory Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
        <div className="p-2 rounded border border-jarvis-border bg-jarvis-surface">
          <div className="text-[10px] text-jarvis-textMuted">STATUS</div>
          <div className="text-xs font-bold text-jarvis-primary mt-0.5">MEMORY SYNCED</div>
        </div>
        <div className="p-2 rounded border border-jarvis-border bg-jarvis-surface">
          <div className="text-[10px] text-jarvis-textMuted">TOTAL NODES</div>
          <div className="text-base font-bold text-jarvis-text tabular-nums mt-0.5">
            {memories.length + entities.length}
          </div>
        </div>
        <div className="p-2 rounded border border-jarvis-border bg-jarvis-surface">
          <div className="text-[10px] text-jarvis-textMuted">DECISIONS</div>
          <div className="text-base font-bold text-jarvis-accent tabular-nums mt-0.5">
            {decisions.length}
          </div>
        </div>
        <div className="p-2 rounded border border-jarvis-border bg-jarvis-surface">
          <div className="text-[10px] text-jarvis-textMuted">HEALTH</div>
          <div className="text-xs font-bold text-jarvis-primary mt-0.5">100% NOMINAL</div>
        </div>
      </div>

      {/* Visual Memory Pipeline Node Flow (Section 15) */}
      <div className="p-2.5 rounded border border-jarvis-border/60 bg-jarvis-surface text-[10px] space-y-1">
        <div className="text-jarvis-textMuted uppercase font-semibold">NEURAL KNOWLEDGE CHAIN:</div>
        <div className="flex items-center gap-1.5 flex-wrap text-jarvis-text">
          <span className="px-2 py-0.5 rounded bg-jarvis-surfaceElevated border border-jarvis-border text-jarvis-primary">
            PROJECT
          </span>
          <ArrowRight className="w-3 h-3 text-jarvis-textMuted" />
          <span className="px-2 py-0.5 rounded bg-jarvis-surfaceElevated border border-jarvis-border text-jarvis-secondary">
            DECISION
          </span>
          <ArrowRight className="w-3 h-3 text-jarvis-textMuted" />
          <span className="px-2 py-0.5 rounded bg-jarvis-surfaceElevated border border-jarvis-border text-jarvis-accent">
            TASK
          </span>
          <ArrowRight className="w-3 h-3 text-jarvis-textMuted" />
          <span className="px-2 py-0.5 rounded bg-jarvis-surfaceElevated border border-jarvis-primary/50 text-jarvis-primary font-bold">
            VERIFIED RESULT
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-jarvis-border/40 pb-2 text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setActiveTab('RECENT');
              soundService.play('CLICK');
            }}
            className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
              activeTab === 'RECENT'
                ? 'bg-jarvis-accent/20 text-jarvis-accent border border-jarvis-accent/40 font-semibold'
                : 'text-jarvis-textMuted hover:text-jarvis-text'
            }`}
          >
            MEMORIES ({memories.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('DECISIONS');
              soundService.play('CLICK');
            }}
            className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
              activeTab === 'DECISIONS'
                ? 'bg-jarvis-accent/20 text-jarvis-accent border border-jarvis-accent/40 font-semibold'
                : 'text-jarvis-textMuted hover:text-jarvis-text'
            }`}
          >
            DECISIONS ({decisions.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('PROJECT_CONTEXT');
              soundService.play('CLICK');
            }}
            className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
              activeTab === 'PROJECT_CONTEXT'
                ? 'bg-jarvis-accent/20 text-jarvis-accent border border-jarvis-accent/40 font-semibold'
                : 'text-jarvis-textMuted hover:text-jarvis-text'
            }`}
          >
            ENTITIES ({entities.length})
          </button>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="text-[10px] text-jarvis-accent hover:underline flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          <span>ADD</span>
        </button>
      </div>

      {/* Quick Add Form */}
      {isAdding && (
        <form onSubmit={handleAddMemory} className="p-2.5 rounded border border-jarvis-accent/40 bg-jarvis-surface flex gap-2">
          <input
            type="text"
            value={newMemoryText}
            onChange={(e) => setNewMemoryText(e.target.value)}
            placeholder="Commit fact to Blade 03 memory... (e.g. 'Prefers dark tactical UI with zero fluff')"
            className="flex-1 px-3 py-1.5 rounded border border-jarvis-border bg-jarvis-bg text-jarvis-text text-xs focus:outline-none focus:border-jarvis-accent"
            autoFocus
            id="quick-memory-text"
            name="memoryText"
            aria-label="Commit fact to memory"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded border border-jarvis-accent bg-jarvis-accent text-white font-semibold text-xs"
          >
            COMMIT
          </button>
        </form>
      )}

      {/* Content List */}
      <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
        {activeTab === 'RECENT' && (
          <>
            {memories.length === 0 ? (
              <div className="p-6 text-center text-jarvis-textMuted border border-dashed border-jarvis-border rounded">
                &ldquo;No neural memories recorded yet.&rdquo;
              </div>
            ) : (
              memories.slice(0, 8).map((mem) => (
                <div
                  key={mem.id}
                  className="p-2 rounded border border-jarvis-border bg-jarvis-surface hover:border-jarvis-borderHover transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px] text-jarvis-textMuted">
                    <span className="text-jarvis-accent font-semibold">[{mem.category}]</span>
                    <span>{new Date(mem.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-jarvis-text text-[11px] leading-relaxed">{mem.content}</p>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'DECISIONS' && (
          <>
            {decisions.length === 0 ? (
              <div className="p-6 text-center text-jarvis-textMuted border border-dashed border-jarvis-border rounded">
                No active decision records logged.
              </div>
            ) : (
              decisions.map((dec) => (
                <div
                  key={dec.id}
                  className="p-2.5 rounded border border-jarvis-border bg-jarvis-surface space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-jarvis-secondary font-bold truncate max-w-[200px]">
                      {dec.projectName || 'SYSTEM ARCHITECTURE'}
                    </span>
                    <span className="text-jarvis-primary font-semibold">{dec.status}</span>
                  </div>
                  <p className="text-jarvis-text font-medium text-[11px]">{dec.decision}</p>
                  {dec.context && (
                    <p className="text-[10px] text-jarvis-textMuted">{dec.context}</p>
                  )}
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'PROJECT_CONTEXT' && (
          <>
            {entities.length === 0 ? (
              <div className="p-6 text-center text-jarvis-textMuted border border-dashed border-jarvis-border rounded">
                No knowledge entities indexed.
              </div>
            ) : (
              entities.map((ent) => (
                <div
                  key={ent.id}
                  className="p-2 rounded border border-jarvis-border bg-jarvis-surface flex items-center justify-between"
                >
                  <div>
                    <span className="text-[10px] text-jarvis-accent font-semibold block">
                      [{ent.entity_type}]
                    </span>
                    <span className="text-jarvis-text font-semibold text-xs">{ent.name}</span>
                    {ent.description && (
                      <p className="text-[10px] text-jarvis-textMuted line-clamp-1">{ent.description}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-jarvis-textMuted">ID: {ent.id}</span>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  KnowledgeEntity,
  KnowledgeEntityType,
  KnowledgeRelationship,
  KnowledgeRelationshipType,
} from '../types';
import {
  Target,
  CheckSquare,
  Database,
  Layers,
  Sparkles,
  User,
  MessageSquare,
  Eye,
  GitCommit,
  Filter,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronRight,
  X,
  ExternalLink,
  Shield,
  Trash2,
  Plus,
  ArrowRight,
  List,
  Compass,
} from 'lucide-react';

interface KnowledgeGraph2DProps {
  entities: KnowledgeEntity[];
  relationships: KnowledgeRelationship[];
  selectedEntityId?: string | null;
  onSelectEntity: (entity: KnowledgeEntity) => void;
  onDeleteEntity?: (entityId: string) => void;
  onExpandEntity?: (entityId: string) => void;
}

const TYPE_CONFIG: Record<
  KnowledgeEntityType,
  { color: string; bg: string; border: string; label: string; icon: React.ReactNode }
> = {
  PROJECT: {
    color: '#19F59A',
    bg: 'rgba(25, 245, 154, 0.15)',
    border: '#19F59A',
    label: 'PROJECT',
    icon: <Layers className="w-3.5 h-3.5 text-[#19F59A]" />,
  },
  MISSION: {
    color: '#38E1FF',
    bg: 'rgba(56, 225, 255, 0.15)',
    border: '#38E1FF',
    label: 'MISSION',
    icon: <Target className="w-3.5 h-3.5 text-[#38E1FF]" />,
  },
  TASK: {
    color: '#FFB000',
    bg: 'rgba(255, 176, 0, 0.15)',
    border: '#FFB000',
    label: 'TASK',
    icon: <CheckSquare className="w-3.5 h-3.5 text-[#FFB000]" />,
  },
  DECISION: {
    color: '#A78BFA',
    bg: 'rgba(167, 139, 250, 0.15)',
    border: '#A78BFA',
    label: 'DECISION',
    icon: <GitCommit className="w-3.5 h-3.5 text-[#A78BFA]" />,
  },
  MEMORY: {
    color: '#F472B6',
    bg: 'rgba(244, 114, 182, 0.15)',
    border: '#F472B6',
    label: 'MEMORY',
    icon: <Database className="w-3.5 h-3.5 text-[#F472B6]" />,
  },
  CONVERSATION: {
    color: '#34D399',
    bg: 'rgba(52, 211, 153, 0.15)',
    border: '#34D399',
    label: 'CONVERSATION',
    icon: <MessageSquare className="w-3.5 h-3.5 text-[#34D399]" />,
  },
  VISION_ANALYSIS: {
    color: '#60A5FA',
    bg: 'rgba(96, 165, 250, 0.15)',
    border: '#60A5FA',
    label: 'VISION',
    icon: <Eye className="w-3.5 h-3.5 text-[#60A5FA]" />,
  },
  PERSON: {
    color: '#FCD34D',
    bg: 'rgba(252, 211, 77, 0.15)',
    border: '#FCD34D',
    label: 'PERSON',
    icon: <User className="w-3.5 h-3.5 text-[#FCD34D]" />,
  },
  CONCEPT: {
    color: '#E2E8F0',
    bg: 'rgba(226, 232, 240, 0.15)',
    border: '#E2E8F0',
    label: 'CONCEPT',
    icon: <Sparkles className="w-3.5 h-3.5 text-[#E2E8F0]" />,
  },
  OBJECTIVE: {
    color: '#2DD4BF',
    bg: 'rgba(45, 212, 191, 0.15)',
    border: '#2DD4BF',
    label: 'OBJECTIVE',
    icon: <Target className="w-3.5 h-3.5 text-[#2DD4BF]" />,
  },
  DOCUMENT: {
    color: '#93C5FD',
    bg: 'rgba(147, 197, 253, 0.15)',
    border: '#93C5FD',
    label: 'DOCUMENT',
    icon: <Database className="w-3.5 h-3.5 text-[#93C5FD]" />,
  },
  GOAL: {
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.15)',
    border: '#F59E0B',
    label: 'GOAL',
    icon: <Target className="w-3.5 h-3.5 text-[#F59E0B]" />,
  },
  DEADLINE: {
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.15)',
    border: '#EF4444',
    label: 'DEADLINE',
    icon: <CheckSquare className="w-3.5 h-3.5 text-[#EF4444]" />,
  },
  PREFERENCE: {
    color: '#C084FC',
    bg: 'rgba(192, 132, 252, 0.15)',
    border: '#C084FC',
    label: 'PREFERENCE',
    icon: <Sparkles className="w-3.5 h-3.5 text-[#C084FC]" />,
  },
  OTHER: {
    color: '#8B9992',
    bg: 'rgba(139, 153, 146, 0.15)',
    border: '#8B9992',
    label: 'OTHER',
    icon: <Sparkles className="w-3.5 h-3.5 text-[#8B9992]" />,
  },
};

export const KnowledgeGraph2D: React.FC<KnowledgeGraph2DProps> = ({
  entities,
  relationships,
  selectedEntityId,
  onSelectEntity,
  onDeleteEntity,
  onExpandEntity,
}) => {
  // Graph configuration
  const [activeFilterTypes, setActiveFilterTypes] = useState<Set<KnowledgeEntityType>>(
    new Set([
      'PROJECT',
      'MISSION',
      'TASK',
      'DECISION',
      'MEMORY',
      'CONVERSATION',
      'VISION_ANALYSIS',
      'CONCEPT',
      'PERSON',
    ])
  );

  const [activeRelationship, setActiveRelationship] = useState<KnowledgeRelationship | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<KnowledgeEntity | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFocusedMode, setIsFocusedMode] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'2D_GRAPH' | 'ACCESSIBLE_LIST'>('2D_GRAPH');

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Set default selected entity if none provided
  useEffect(() => {
    if (selectedEntityId) {
      const match = entities.find((e) => e.id === selectedEntityId);
      if (match) setSelectedEntity(match);
    } else if (!selectedEntity && entities.length > 0) {
      const primaryProj = entities.find((e) => e.entity_type === 'PROJECT') || entities[0];
      setSelectedEntity(primaryProj);
    }
  }, [selectedEntityId, entities]);

  const toggleFilter = (type: KnowledgeEntityType) => {
    setActiveFilterTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        if (next.size > 1) next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  // Determine nodes in scope: In focused mode, display central entity + 1 hop neighbors
  const { visibleEntities, visibleRelationships, nodePositions } = useMemo(() => {
    let scopedEntities: KnowledgeEntity[] = [];
    let scopedRelationships: KnowledgeRelationship[] = [];

    const allowedEntities = entities.filter((e) => activeFilterTypes.has(e.entity_type));
    const allowedEntityIds = new Set(allowedEntities.map((e) => e.id));

    if (isFocusedMode && selectedEntity) {
      const neighborIds = new Set<string>([selectedEntity.id]);

      for (const rel of relationships) {
        if (rel.source_entity_id === selectedEntity.id && allowedEntityIds.has(rel.target_entity_id)) {
          neighborIds.add(rel.target_entity_id);
          scopedRelationships.push(rel);
        } else if (rel.target_entity_id === selectedEntity.id && allowedEntityIds.has(rel.source_entity_id)) {
          neighborIds.add(rel.source_entity_id);
          scopedRelationships.push(rel);
        }
      }

      scopedEntities = allowedEntities.filter((e) => neighborIds.has(e.id));
    } else {
      scopedEntities = allowedEntities.slice(0, 24);
      const scopedIds = new Set(scopedEntities.map((e) => e.id));
      scopedRelationships = relationships.filter(
        (r) => scopedIds.has(r.source_entity_id) && scopedIds.has(r.target_entity_id)
      );
    }

    // Deterministic 2D Radial Layout
    // Width = 800, Height = 600, Center = (400, 300)
    const centerX = 400;
    const centerY = 280;
    const positions = new Map<string, { x: number; y: number }>();

    if (scopedEntities.length > 0) {
      const centralId = selectedEntity?.id || scopedEntities[0].id;
      positions.set(centralId, { x: centerX, y: centerY });

      const otherEntities = scopedEntities.filter((e) => e.id !== centralId);
      const count = otherEntities.length;
      const radius = count > 8 ? 220 : 180;

      otherEntities.forEach((ent, idx) => {
        const angle = (idx / Math.max(count, 1)) * 2 * Math.PI - Math.PI / 2;
        const x = Math.round(centerX + radius * Math.cos(angle));
        const y = Math.round(centerY + radius * Math.sin(angle));
        positions.set(ent.id, { x, y });
      });
    }

    return {
      visibleEntities: scopedEntities,
      visibleRelationships: scopedRelationships,
      nodePositions: positions,
    };
  }, [entities, relationships, selectedEntity, isFocusedMode, activeFilterTypes]);

  const handleNodeClick = (entity: KnowledgeEntity) => {
    setSelectedEntity(entity);
    setActiveRelationship(null);
    onSelectEntity(entity);
  };

  const handleRelationshipClick = (rel: KnowledgeRelationship) => {
    setActiveRelationship(rel);
  };

  return (
    <div className="flex flex-col h-full bg-[#050706] border border-[#16281F] rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Tactical Controls Bar */}
      <div className="p-3 sm:p-4 bg-[#0A100D] border-b border-[#16281F] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#19F59A]/15 text-[#19F59A] border border-[#19F59A]/30">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#F5F7F6] tracking-wider uppercase">
                NEURAL KNOWLEDGE GRAPH
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#16281F] text-[#19F59A] font-mono font-bold">
                {visibleEntities.length} NODES • {visibleRelationships.length} RELS
              </span>
            </div>
            <p className="text-[10px] text-[#8B9992] font-mono">
              2D Tactical Relationships • Blade 03 Connected Memory
            </p>
          </div>
        </div>

        {/* View mode toggle and tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === '2D_GRAPH' ? 'ACCESSIBLE_LIST' : '2D_GRAPH')}
            className="px-2.5 py-1.5 rounded-lg bg-[#121C17] border border-[#16281F] text-[10px] font-mono text-[#8B9992] hover:text-[#19F59A] transition-all flex items-center gap-1.5"
            aria-label="Toggle Accessible Text View"
          >
            {viewMode === '2D_GRAPH' ? (
              <>
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ACCESSIBLE LIST</span>
              </>
            ) : (
              <>
                <Compass className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">2D GRAPH VIEW</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsFocusedMode((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all border ${
              isFocusedMode
                ? 'bg-[#19F59A]/20 border-[#19F59A] text-[#19F59A]'
                : 'bg-[#121C17] border-[#16281F] text-[#8B9992] hover:text-[#F5F7F6]'
            }`}
          >
            {isFocusedMode ? 'FOCUSED (1-HOP)' : 'GLOBAL VIEW'}
          </button>

          <div className="flex items-center bg-[#121C17] border border-[#16281F] rounded-lg p-0.5">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.15))}
              className="p-1 hover:text-[#19F59A] text-[#8B9992]"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1 text-[9px] font-mono text-[#8B9992]">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.8, z + 0.15))}
              className="p-1 hover:text-[#19F59A] text-[#8B9992]"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1 hover:text-[#38E1FF] text-[#8B9992] border-l border-[#16281F] ml-0.5"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="px-3 sm:px-4 py-2 bg-[#080D0B] border-b border-[#16281F] flex items-center gap-1.5 overflow-x-auto text-[10px] font-mono select-none">
        <span className="text-[#8B9992] flex items-center gap-1 shrink-0 mr-1 text-[9px]">
          <Filter className="w-3 h-3" /> FILTERS:
        </span>
        {(
          [
            'PROJECT',
            'MISSION',
            'TASK',
            'DECISION',
            'MEMORY',
            'CONVERSATION',
            'VISION_ANALYSIS',
            'CONCEPT',
            'PERSON',
          ] as KnowledgeEntityType[]
        ).map((type) => {
          const cfg = TYPE_CONFIG[type];
          const active = activeFilterTypes.has(type);
          return (
            <button
              key={type}
              onClick={() => toggleFilter(type)}
              className={`px-2 py-0.5 rounded-md border text-[9px] font-bold transition-all shrink-0 flex items-center gap-1 ${
                active
                  ? 'border-transparent font-black shadow-sm'
                  : 'bg-transparent border-[#16281F] text-[#4E5D55] opacity-60'
              }`}
              style={{
                backgroundColor: active ? cfg.bg : undefined,
                color: active ? cfg.color : undefined,
                borderColor: active ? cfg.color : undefined,
              }}
            >
              {cfg.icon}
              <span>{cfg.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Interactive Stage */}
      <div className="flex-1 relative flex flex-col md:flex-row overflow-hidden min-h-[460px]">
        {viewMode === '2D_GRAPH' ? (
          <div className="flex-1 relative bg-[#050706] flex items-center justify-center overflow-auto p-4 select-none">
            <svg
              ref={svgRef}
              viewBox="0 0 800 560"
              className="w-full h-full max-w-[850px] max-h-[580px] transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <defs>
                {/* Glow filter */}
                <filter id="emerald-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#19F59A" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#38E1FF" stopOpacity="0.8" />
                </linearGradient>
              </defs>

              {/* Background Grid Pattern */}
              <pattern id="graph-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#101D17" strokeWidth="0.7" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#graph-grid)" />

              {/* Relationship Links (Edges) */}
              <g className="relationships">
                {visibleRelationships.map((rel) => {
                  const sourcePos = nodePositions.get(rel.source_entity_id);
                  const targetPos = nodePositions.get(rel.target_entity_id);
                  if (!sourcePos || !targetPos) return null;

                  const isSelectedRel = activeRelationship?.id === rel.id;
                  const isTouchingSelectedNode =
                    selectedEntity?.id === rel.source_entity_id ||
                    selectedEntity?.id === rel.target_entity_id;

                  const midX = (sourcePos.x + targetPos.x) / 2;
                  const midY = (sourcePos.y + targetPos.y) / 2;

                  return (
                    <g
                      key={rel.id}
                      onClick={() => handleRelationshipClick(rel)}
                      className="cursor-pointer group"
                    >
                      {/* Interactive wider hit line */}
                      <line
                        x1={sourcePos.x}
                        y1={sourcePos.y}
                        x2={targetPos.x}
                        y2={targetPos.y}
                        stroke="transparent"
                        strokeWidth="14"
                      />
                      {/* Visible Edge */}
                      <line
                        x1={sourcePos.x}
                        y1={sourcePos.y}
                        x2={targetPos.x}
                        y2={targetPos.y}
                        stroke={
                          isSelectedRel
                            ? '#38E1FF'
                            : isTouchingSelectedNode
                            ? '#19F59A'
                            : '#1D3628'
                        }
                        strokeWidth={isSelectedRel ? '2.5' : isTouchingSelectedNode ? '2' : '1.2'}
                        strokeDasharray={
                          rel.relationship_type === 'UPDATES' ? '4,4' : undefined
                        }
                        className="transition-colors"
                      />
                      {/* Edge Label Badge */}
                      <g transform={`translate(${midX}, ${midY})`}>
                        <rect
                          x="-35"
                          y="-8"
                          width="70"
                          height="16"
                          rx="4"
                          fill="#050706"
                          stroke={isSelectedRel ? '#38E1FF' : '#16281F'}
                          strokeWidth="1"
                        />
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill={isSelectedRel ? '#38E1FF' : '#8B9992'}
                          fontSize="7.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {rel.relationship_type.replace(/_/g, ' ')}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>

              {/* Entity Nodes */}
              <g className="entities">
                {visibleEntities.map((ent) => {
                  const pos = nodePositions.get(ent.id);
                  if (!pos) return null;

                  const isCentral = selectedEntity?.id === ent.id;
                  const cfg = TYPE_CONFIG[ent.entity_type] || TYPE_CONFIG.OTHER;
                  const nodeRadius = isCentral ? 32 : 24;

                  return (
                    <g
                      key={ent.id}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      onClick={() => handleNodeClick(ent)}
                      className="cursor-pointer group"
                      tabIndex={0}
                      role="button"
                      aria-label={`${ent.name} (${ent.entity_type})`}
                    >
                      {/* Outer pulse circle for selected central node */}
                      {isCentral && (
                        <circle
                          r={nodeRadius + 8}
                          fill="none"
                          stroke={cfg.color}
                          strokeWidth="1.5"
                          strokeDasharray="4,4"
                          className="animate-spin-slow opacity-60"
                        />
                      )}

                      {/* Main Node Background */}
                      <circle
                        r={nodeRadius}
                        fill="#0A100D"
                        stroke={isCentral ? cfg.color : '#16281F'}
                        strokeWidth={isCentral ? '2.5' : '1.5'}
                        className="group-hover:stroke-[#19F59A] transition-all"
                        filter={isCentral ? 'url(#emerald-glow)' : undefined}
                      />

                      {/* Inner colored tint circle */}
                      <circle r={nodeRadius - 4} fill={cfg.bg} />

                      {/* Node Label Text */}
                      <text
                        textAnchor="middle"
                        y={nodeRadius + 14}
                        fill={isCentral ? '#F5F7F6' : '#8B9992'}
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight={isCentral ? 'bold' : 'normal'}
                        className="group-hover:fill-[#19F59A] transition-colors"
                      >
                        {ent.name.length > 18 ? ent.name.slice(0, 16) + '..' : ent.name}
                      </text>

                      {/* Node Type Pill Text */}
                      <text
                        textAnchor="middle"
                        y={nodeRadius + 24}
                        fill={cfg.color}
                        fontSize="7"
                        fontFamily="monospace"
                        fontWeight="bold"
                        letterSpacing="0.05em"
                      >
                        {cfg.label}
                      </text>

                      {/* Center Type Letter / Mark */}
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={cfg.color}
                        fontSize={isCentral ? '14' : '11'}
                        fontFamily="monospace"
                        fontWeight="900"
                      >
                        {cfg.label[0]}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Quick Central Focus Action Overlay */}
            {selectedEntity && (
              <div className="absolute bottom-3 left-3 bg-[#0A100D]/90 backdrop-blur-md border border-[#16281F] rounded-xl px-3 py-1.5 flex items-center gap-2 text-[10px] font-mono">
                <span className="text-[#8B9992]">FOCUS:</span>
                <span className="text-[#19F59A] font-bold truncate max-w-[140px]">
                  {selectedEntity.name}
                </span>
                <button
                  onClick={() => onExpandEntity && onExpandEntity(selectedEntity.id)}
                  className="px-2 py-0.5 rounded bg-[#121C17] border border-[#19F59A]/30 text-[#19F59A] hover:bg-[#19F59A]/20 transition-all font-bold ml-1 text-[9px]"
                  title="Expand neighborhood traversal"
                >
                  EXPAND LAYER
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Accessible Text Alternative View (Requirement 39) */
          <div className="flex-1 bg-[#050706] p-4 overflow-y-auto space-y-4 font-mono text-xs">
            <div className="p-3 rounded-xl bg-[#0A100D] border border-[#16281F]">
              <span className="text-[#19F59A] font-bold block mb-1">
                TACTICAL ENTITY REGISTER (ACCESSIBILITY INTERFACE)
              </span>
              <p className="text-[11px] text-[#8B9992]">
                Screen-reader accessible tabular representation of all nodes and relationships in Blade 03.
              </p>
            </div>

            <div className="space-y-2">
              {visibleEntities.map((ent) => {
                const connectedRels = visibleRelationships.filter(
                  (r) => r.source_entity_id === ent.id || r.target_entity_id === ent.id
                );
                const cfg = TYPE_CONFIG[ent.entity_type] || TYPE_CONFIG.OTHER;
                return (
                  <div
                    key={ent.id}
                    onClick={() => handleNodeClick(ent)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedEntity?.id === ent.id
                        ? 'bg-[#121C17] border-[#19F59A]'
                        : 'bg-[#0A100D] border-[#16281F] hover:border-[#19F59A]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                          style={{ backgroundColor: cfg.bg, color: cfg.color }}
                        >
                          {ent.entity_type}
                        </span>
                        <span className="font-bold text-[#F5F7F6]">{ent.name}</span>
                      </div>
                      <span className="text-[10px] text-[#8B9992]">
                        {new Date(ent.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {ent.description && (
                      <p className="text-[11px] text-[#8B9992] mt-1.5">{ent.description}</p>
                    )}
                    {connectedRels.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-[#16281F] text-[10px] text-[#8B9992] space-y-0.5">
                        <span className="font-bold text-[#38E1FF]">Relationships:</span>
                        {connectedRels.map((r) => {
                          const otherId =
                            r.source_entity_id === ent.id
                              ? r.target_entity_id
                              : r.source_entity_id;
                          const other = entities.find((e) => e.id === otherId);
                          const isSource = r.source_entity_id === ent.id;
                          return (
                            <div key={r.id} className="pl-2">
                              {isSource
                                ? `—[${r.relationship_type}]→ ${other?.name || 'Entity'}`
                                : `←[${r.relationship_type}]— ${other?.name || 'Entity'}`}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Side Inspector Panel (Entities & Relationships Details) */}
        <div className="w-full md:w-80 bg-[#0A100D] border-t md:border-t-0 md:border-l border-[#16281F] flex flex-col p-4 overflow-y-auto space-y-4 font-mono text-xs">
          {activeRelationship ? (
            /* Relationship Details Inspector */
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#16281F] pb-2">
                <span className="text-xs font-bold text-[#38E1FF] flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5" />
                  RELATIONSHIP INSPECTOR
                </span>
                <button
                  onClick={() => setActiveRelationship(null)}
                  className="p-1 hover:text-[#F5F7F6] text-[#8B9992]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-[#050706] border border-[#16281F] space-y-3">
                <div>
                  <span className="text-[10px] text-[#8B9992] block uppercase">TYPE:</span>
                  <span className="text-sm font-bold text-[#38E1FF]">
                    {activeRelationship.relationship_type}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-[#8B9992] block uppercase">SOURCE NODE:</span>
                  <div className="font-bold text-[#F5F7F6] p-2 rounded bg-[#0A100D] border border-[#16281F]">
                    {entities.find((e) => e.id === activeRelationship.source_entity_id)?.name ||
                      'Source Entity'}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-[#8B9992] block uppercase">TARGET NODE:</span>
                  <div className="font-bold text-[#F5F7F6] p-2 rounded bg-[#0A100D] border border-[#16281F]">
                    {entities.find((e) => e.id === activeRelationship.target_entity_id)?.name ||
                      'Target Entity'}
                  </div>
                </div>

                {activeRelationship.metadata && Object.keys(activeRelationship.metadata).length > 0 && (
                  <div>
                    <span className="text-[10px] text-[#8B9992] block uppercase mb-1">
                      METADATA & TELEMETRY:
                    </span>
                    <pre className="p-2 rounded bg-[#0A100D] border border-[#16281F] text-[10px] text-[#19F59A] overflow-x-auto">
                      {JSON.stringify(activeRelationship.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : selectedEntity ? (
            /* Entity Details Inspector (Requirement 17) */
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#16281F] pb-2">
                <span className="text-xs font-bold text-[#19F59A] flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" />
                  ENTITY DETAILS
                </span>
                <span
                  className="px-2 py-0.5 rounded text-[9px] font-bold"
                  style={{
                    backgroundColor: (TYPE_CONFIG[selectedEntity.entity_type] || TYPE_CONFIG.OTHER).bg,
                    color: (TYPE_CONFIG[selectedEntity.entity_type] || TYPE_CONFIG.OTHER).color,
                  }}
                >
                  {selectedEntity.entity_type}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#F5F7F6] tracking-wide">
                  {selectedEntity.name}
                </h3>
                <p className="text-[11px] text-[#8B9992] font-sans leading-relaxed">
                  {selectedEntity.description || 'No detailed tactical description assigned.'}
                </p>
              </div>

              {/* Connected Relationships in Scope */}
              <div className="space-y-2">
                <span className="text-[10px] text-[#8B9992] font-bold uppercase tracking-wider block">
                  Connected Nodes (
                  {
                    relationships.filter(
                      (r) =>
                        r.source_entity_id === selectedEntity.id ||
                        r.target_entity_id === selectedEntity.id
                    ).length
                  }
                  )
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {relationships
                    .filter(
                      (r) =>
                        r.source_entity_id === selectedEntity.id ||
                        r.target_entity_id === selectedEntity.id
                    )
                    .map((rel) => {
                      const isSource = rel.source_entity_id === selectedEntity.id;
                      const otherId = isSource ? rel.target_entity_id : rel.source_entity_id;
                      const other = entities.find((e) => e.id === otherId);

                      return (
                        <div
                          key={rel.id}
                          onClick={() => other && handleNodeClick(other)}
                          className="p-2 rounded-lg bg-[#050706] border border-[#16281F] hover:border-[#19F59A]/40 transition-all cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <span className="text-[9px] text-[#38E1FF] font-bold block">
                              {isSource
                                ? `—[${rel.relationship_type}]→`
                                : `←[${rel.relationship_type}]—`}
                            </span>
                            <span className="text-[11px] text-[#F5F7F6] font-bold">
                              {other?.name || 'Entity'}
                            </span>
                          </div>
                          <ChevronRight className="w-3 h-3 text-[#8B9992]" />
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Entity Actions */}
              <div className="pt-2 border-t border-[#16281F] flex items-center gap-2">
                <button
                  onClick={() => onExpandEntity && onExpandEntity(selectedEntity.id)}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#121C17] border border-[#19F59A]/30 text-[#19F59A] text-xs font-bold hover:bg-[#19F59A]/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>EXPAND</span>
                </button>
                {onDeleteEntity && (
                  <button
                    onClick={() => onDeleteEntity(selectedEntity.id)}
                    className="p-2 rounded-xl bg-[#050706] border border-[#FF3B30]/30 text-[#FF3B30] hover:bg-[#FF3B30]/20 transition-all"
                    title="Delete Entity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-[#8B9992] space-y-2 p-6">
              <Compass className="w-8 h-8 text-[#16281F]" />
              <p className="text-xs font-mono">SELECT A NODE OR LINK TO INSPECT TACTICAL TELEMETRY</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

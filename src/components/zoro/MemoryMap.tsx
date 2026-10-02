import React, { useState, useEffect, useRef } from 'react';
import {
  Brain,
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Database,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { RoutePath } from '../../types';
import { MemoryService } from '../../services/memory';
import { NeuralMemoryService } from '../../services/neuralMemory';
import { MissionService } from '../../services/mission';
import { getLocalStore } from '../../services/supabase';
import { soundService } from '../../services/sound';

interface MemoryNode {
  id: string;
  type: 'PROJECTS' | 'TASKS' | 'MISSIONS' | 'DECISIONS' | 'CONVERSATIONS' | 'KNOWLEDGE';
  label: string;
  detail: string;
  x: number;
  y: number;
  cluster: number;
  color: string;
}

interface MemoryLink {
  source: string;
  target: string;
}

interface MemoryMapProps {
  userId: string;
  onNavigate: (path: RoutePath) => void;
  className?: string;
}

export const MemoryMap: React.FC<MemoryMapProps> = ({
  userId,
  onNavigate,
  className = '',
}) => {
  const [nodes, setNodes] = useState<MemoryNode[]>([]);
  const [links, setLinks] = useState<MemoryLink[]>([]);
  const [selectedNode, setSelectedNode] = useState<MemoryNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const loadGraphData = () => {
    try {
      const generatedNodes: MemoryNode[] = [];
      const generatedLinks: MemoryLink[] = [];

      // 1. Central Core Node
      generatedNodes.push({
        id: 'node_core',
        type: 'KNOWLEDGE',
        label: 'ZORO OMNIA',
        detail: 'Central Cognitive Coordinator',
        x: 350,
        y: 200,
        cluster: 0,
        color: '#19D9FF',
      });

      // 2. Missions
      const msns = MissionService.getMissions(userId);
      msns.slice(0, 4).forEach((m, idx) => {
        const id = `node_msn_${m.id}`;
        const angle = (idx / 4) * Math.PI * 2;
        const x = 350 + Math.cos(angle) * 150;
        const y = 200 + Math.sin(angle) * 120;
        generatedNodes.push({
          id,
          type: 'MISSIONS',
          label: m.title.slice(0, 16),
          detail: `Mission progress ${m.progress || 0}%`,
          x,
          y,
          cluster: 1,
          color: '#3D7CFF',
        });
        generatedLinks.push({ source: 'node_core', target: id });
      });

      // 3. Tasks
      const tasks = getLocalStore<any[]>(`tasks_${userId}`, []);
      tasks.slice(0, 5).forEach((t, idx) => {
        const id = `node_task_${t.id}`;
        const angle = ((idx + 0.5) / 5) * Math.PI * 2;
        const x = 350 + Math.cos(angle) * 230;
        const y = 200 + Math.sin(angle) * 160;
        generatedNodes.push({
          id,
          type: 'TASKS',
          label: t.title.slice(0, 14),
          detail: `Priority ${t.priority || 'MEDIUM'}`,
          x,
          y,
          cluster: 2,
          color: '#FFB020',
        });
        // Link to nearest mission or core
        generatedLinks.push({ source: 'node_core', target: id });
      });

      // 4. Memory records
      const mems = MemoryService.getMemories(userId);
      mems.slice(0, 4).forEach((mem, idx) => {
        const id = `node_mem_${mem.id}`;
        const angle = ((idx + 2) / 4) * Math.PI * 2;
        const x = 350 + Math.cos(angle) * 200;
        const y = 200 + Math.sin(angle) * 140;
        generatedNodes.push({
          id,
          type: 'KNOWLEDGE',
          label: mem.category || 'MEMORY',
          detail: mem.content.slice(0, 50),
          x,
          y,
          cluster: 3,
          color: '#21E6A0',
        });
        generatedLinks.push({ source: 'node_core', target: id });
      });

      setNodes(generatedNodes);
      setLinks(generatedLinks);
      if (generatedNodes.length > 0) {
        setSelectedNode(generatedNodes[0]);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadGraphData();
  }, [userId]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.max(0.6, Math.min(2.0, prev + delta)));
    soundService.play('CLICK');
  };

  return (
    <div
      className={`rounded-2xl border border-zoro-border bg-zoro-panel p-5 font-mono select-none space-y-4 shadow-xl flex flex-col ${className}`}
    >
      {/* Header with Zoom Controls */}
      <div className="flex items-center justify-between border-b border-zoro-border pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-zoro-cyan shadow-[0_0_8px_#19D9FF] animate-pulse" />
          <h2 className="text-xs font-bold text-zoro-text tracking-wider uppercase">
            NEURAL MEMORY MAP
          </h2>
          <span className="text-[10px] text-zoro-violet font-bold tabular-nums">
            ({nodes.length} NODES)
          </span>
        </div>

        {/* Map Viewport Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleZoom(0.15)}
            className="p-1 rounded bg-zoro-panelElevated border border-zoro-border text-zoro-textSecondary hover:text-zoro-cyan transition-colors"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleZoom(-0.15)}
            className="p-1 rounded bg-zoro-panelElevated border border-zoro-border text-zoro-textSecondary hover:text-zoro-cyan transition-colors"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setZoomLevel(1);
              setPanOffset({ x: 0, y: 0 });
              soundService.play('CLICK');
            }}
            className="p-1 rounded bg-zoro-panelElevated border border-zoro-border text-zoro-textSecondary hover:text-zoro-cyan transition-colors"
            title="Reset Pan & Zoom"
            aria-label="Reset View"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              onNavigate('/memory/graph');
              soundService.play('CLICK');
            }}
            className="text-[10px] text-zoro-cyan hover:underline ml-2 font-bold flex items-center gap-0.5"
          >
            <span>FULL GRAPH</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div
        className="relative w-full h-[280px] sm:h-[320px] rounded-xl border border-zoro-border bg-[#03070D] overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Subtle Background Neural Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#19D9FF_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.03] pointer-events-none" />

        <svg
          className="w-full h-full"
          viewBox="0 0 700 400"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          }}
        >
          {/* Connecting Links */}
          {links.map((lnk, i) => {
            const s = nodes.find((n) => n.id === lnk.source);
            const t = nodes.find((n) => n.id === lnk.target);
            if (!s || !t) return null;
            return (
              <line
                key={`lnk_${i}`}
                x1={s.x}
                y1={s.y}
                x2={t.x}
                y2={t.y}
                stroke="rgba(25, 217, 255, 0.2)"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            );
          })}

          {/* Render Nodes */}
          {nodes.map((node) => {
            const isSelected = selectedNode?.id === node.id;
            const isCore = node.id === 'node_core';
            return (
              <g
                key={node.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode(node);
                  soundService.play('CLICK');
                }}
                className="cursor-pointer group"
              >
                {/* Glow ring on selected */}
                {isSelected && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isCore ? 26 : 18}
                    fill="none"
                    stroke={node.color}
                    strokeWidth="2"
                    opacity="0.5"
                    className="animate-pulse"
                  />
                )}

                {/* Node Body */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isCore ? 18 : 10}
                  fill="#08121F"
                  stroke={node.color}
                  strokeWidth={isSelected ? '2.5' : '1.5'}
                  style={{
                    filter: isSelected ? `drop-shadow(0 0 8px ${node.color})` : 'none',
                  }}
                />

                {/* Center Core dot */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isCore ? 6 : 3}
                  fill={node.color}
                />

                {/* Node Label */}
                <text
                  x={node.x}
                  y={node.y + (isCore ? 30 : 20)}
                  textAnchor="middle"
                  fill="#EAF8FF"
                  fontSize={isCore ? 10 : 8}
                  fontFamily="monospace"
                  fontWeight="bold"
                  className="pointer-events-none drop-shadow-md"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected Node Details Overlay Card */}
        {selectedNode && (
          <div className="absolute bottom-3 left-3 max-w-xs p-3 rounded-lg border border-zoro-border bg-zoro-panelElevated/95 backdrop-blur-md text-xs shadow-xl pointer-events-none">
            <div className="flex items-center gap-1.5 text-[9px] font-bold" style={{ color: selectedNode.color }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: selectedNode.color }} />
              <span>{selectedNode.type}</span>
            </div>
            <div className="font-bold text-zoro-text mt-0.5 truncate">
              {selectedNode.label}
            </div>
            <div className="text-[10px] text-zoro-textSecondary font-sans mt-0.5">
              {selectedNode.detail}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

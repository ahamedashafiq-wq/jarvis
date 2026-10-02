import React, { useState, useMemo } from 'react';
import { Mission, MissionObjective, Task } from '../types';
import { Shield, CheckCircle, Clock, AlertTriangle, Circle, Sparkles, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface MissionUniverseProps {
  mission: Mission;
  objectives: MissionObjective[];
  tasks: Task[];
  onSelectObjective?: (objId: string) => void;
  onSelectTask?: (taskId: string) => void;
}

export const MissionUniverse: React.FC<MissionUniverseProps> = ({
  mission,
  objectives,
  tasks,
  onSelectObjective,
  onSelectTask,
}) => {
  const [selectedNode, setSelectedNode] = useState<{
    type: 'MISSION' | 'OBJECTIVE' | 'TASK';
    id: string;
    title: string;
    status: string;
    detail?: string;
  } | null>({
    type: 'MISSION',
    id: mission.id,
    title: mission.title,
    status: mission.status,
    detail: mission.goal,
  });

  const [zoom, setZoom] = useState(1);
  const [filterMode, setFilterMode] = useState<'ALL' | 'ACTIVE_ONLY'>('ALL');

  // SVG dimensions
  const width = 800;
  const height = 540;
  const centerX = width / 2;
  const centerY = height / 2;
  const orbitRadius = 175;

  // Filter objectives if needed
  const displayObjectives = useMemo(() => {
    if (filterMode === 'ACTIVE_ONLY') {
      return objectives.filter((o) => o.status !== 'COMPLETED');
    }
    return objectives;
  }, [objectives, filterMode]);

  // Compute positions of objectives in orbit
  const objectiveNodes = useMemo(() => {
    const total = displayObjectives.length;
    if (total === 0) return [];

    return displayObjectives.map((obj, index) => {
      // Angle evenly spaced around the circle, starting from top (-pi/2)
      const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + orbitRadius * Math.cos(angle);
      const y = centerY + orbitRadius * Math.sin(angle);

      // Tasks for this objective
      const objTasks = tasks.filter((t) => t.objective_id === obj.id);

      // Calculate task sub-orbit satellites
      const taskNodes = objTasks.slice(0, 4).map((tsk, tIndex) => {
        const tTotal = Math.min(objTasks.length, 4);
        const spreadAngle = 0.9; // arc span for task satellites
        const tAngle = angle - spreadAngle / 2 + (tIndex / Math.max(tTotal - 1, 1)) * spreadAngle;
        const taskDist = 58;
        return {
          task: tsk,
          x: x + taskDist * Math.cos(tAngle),
          y: y + taskDist * Math.sin(tAngle),
        };
      });

      return {
        objective: obj,
        x,
        y,
        angle,
        taskNodes,
        totalTasks: objTasks.length,
      };
    });
  }, [displayObjectives, tasks, centerX, centerY, orbitRadius]);

  const getObjectiveColor = (status: MissionObjective['status']) => {
    switch (status) {
      case 'COMPLETED':
        return { border: '#19F59A', fill: '#19F59A', bg: 'rgba(25, 245, 154, 0.15)' };
      case 'IN_PROGRESS':
        return { border: '#38E1FF', fill: '#38E1FF', bg: 'rgba(56, 225, 255, 0.2)' };
      case 'BLOCKED':
        return { border: '#FF3B30', fill: '#FF3B30', bg: 'rgba(255, 59, 48, 0.2)' };
      case 'TODO':
      default:
        return { border: '#8B9992', fill: '#8B9992', bg: 'rgba(139, 153, 146, 0.1)' };
    }
  };

  return (
    <div className="rounded-2xl bg-[#0A100D] border border-[#16281F] p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden font-mono select-none">
      {/* HUD Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#16281F] pb-3 z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#19F59A]" />
          <div>
            <h2 className="text-xs font-bold text-[#F5F7F6] tracking-wider uppercase">
              MISSION UNIVERSE • TACTICAL ORBIT
            </h2>
            <p className="text-[10px] text-[#8B9992]">
              Interactive 2D Node Hierarchy (Mission → Objectives → Tasks)
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterMode(filterMode === 'ALL' ? 'ACTIVE_ONLY' : 'ALL')}
            className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-colors ${
              filterMode === 'ACTIVE_ONLY'
                ? 'bg-[#19F59A]/15 border-[#19F59A] text-[#19F59A]'
                : 'bg-[#050706] border-[#16281F] text-[#8B9992] hover:text-[#F5F7F6]'
            }`}
          >
            {filterMode === 'ACTIVE_ONLY' ? 'ACTIVE ORBIT ONLY' : 'ALL NODES'}
          </button>

          <div className="flex items-center gap-1 bg-[#050706] border border-[#16281F] rounded-lg p-0.5">
            <button
              onClick={() => setZoom((z) => Math.max(0.7, z - 0.15))}
              className="p-1 hover:text-[#19F59A] text-[#8B9992] transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[9px] px-1 text-[#8B9992]">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(1.4, z + 0.15))}
              className="p-1 hover:text-[#19F59A] text-[#8B9992] transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1 hover:text-[#19F59A] text-[#8B9992] transition-colors"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] min-h-[360px] flex items-center justify-center overflow-hidden my-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full max-w-full transition-transform duration-300"
          style={{ transform: `scale(${zoom})` }}
        >
          <defs>
            {/* Mission core glow filter */}
            <filter id="glow-core" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-laser" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="orbit-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#19F59A" stopOpacity="0.25" />
              <stop offset="50%" stopColor="#38E1FF" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#19F59A" stopOpacity="0.25" />
            </linearGradient>
          </defs>

          {/* Background Grid Lines & Rings */}
          <circle
            cx={centerX}
            cy={centerY}
            r={orbitRadius}
            fill="none"
            stroke="url(#orbit-grad)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="animate-spin-slow origin-center"
            style={{ animationDuration: '60s' }}
          />
          <circle
            cx={centerX}
            cy={centerY}
            r={orbitRadius + 58}
            fill="none"
            stroke="#16281F"
            strokeWidth="1"
            strokeDasharray="2 6"
          />

          {/* Connecting Lasers: Mission to Objectives */}
          {objectiveNodes.map((node) => {
            const colors = getObjectiveColor(node.objective.status);
            const isSelected = selectedNode?.id === node.objective.id;
            return (
              <g key={`line_${node.objective.id}`}>
                <line
                  x1={centerX}
                  y1={centerY}
                  x2={node.x}
                  y2={node.y}
                  stroke={colors.border}
                  strokeWidth={isSelected ? '2' : '1'}
                  strokeOpacity={isSelected ? 0.9 : 0.4}
                  strokeDasharray={node.objective.status === 'COMPLETED' ? 'none' : '3 3'}
                />

                {/* Sub-lines: Objective to its Tasks */}
                {node.taskNodes.map(({ task, x, y }) => {
                  const isTaskSelected = selectedNode?.id === task.id;
                  const taskComplete = task.status === 'COMPLETED';
                  return (
                    <line
                      key={`task_line_${task.id}`}
                      x1={node.x}
                      y1={node.y}
                      x2={x}
                      y2={y}
                      stroke={taskComplete ? '#19F59A' : '#16281F'}
                      strokeWidth={isTaskSelected ? '1.5' : '1'}
                      strokeOpacity={taskComplete ? 0.6 : 0.35}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Central Node: MISSION CORE */}
          <g
            className="cursor-pointer group"
            onClick={() =>
              setSelectedNode({
                type: 'MISSION',
                id: mission.id,
                title: mission.title,
                status: mission.status,
                detail: `Goal: ${mission.goal} • Progress: ${mission.progress}%`,
              })
            }
          >
            {/* Outer pulsating tactical shield */}
            <circle
              cx={centerX}
              cy={centerY}
              r={46}
              fill="rgba(0, 208, 132, 0.05)"
              stroke="#00D084"
              strokeWidth="1"
              strokeDasharray="4 2"
              className="animate-pulse"
            />
            {/* Progress Ring Arc */}
            <circle
              cx={centerX}
              cy={centerY}
              r={38}
              fill="#0A100D"
              stroke="#16281F"
              strokeWidth="4"
            />
            <circle
              cx={centerX}
              cy={centerY}
              r={38}
              fill="none"
              stroke="#19F59A"
              strokeWidth="4"
              strokeDasharray={2 * Math.PI * 38}
              strokeDashoffset={2 * Math.PI * 38 * (1 - mission.progress / 100)}
              strokeLinecap="round"
              transform={`rotate(-90 ${centerX} ${centerY})`}
            />

            {/* Center Core */}
            <circle
              cx={centerX}
              cy={centerY}
              r={28}
              fill="#050706"
              stroke="#00D084"
              strokeWidth="2"
              filter="url(#glow-core)"
            />
            <text
              x={centerX}
              y={centerY - 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#19F59A"
              fontSize="12"
              fontWeight="900"
              fontFamily="monospace"
            >
              {mission.progress}%
            </text>
            <text
              x={centerX}
              y={centerY + 12}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#8B9992"
              fontSize="8"
              fontWeight="bold"
              fontFamily="monospace"
            >
              MISSION
            </text>
          </g>

          {/* Task Satellite Nodes (rendered behind objectives) */}
          {objectiveNodes.map((node) =>
            node.taskNodes.map(({ task, x, y }) => {
              const isComplete = task.status === 'COMPLETED';
              const isSelected = selectedNode?.id === task.id;
              return (
                <g
                  key={`task_node_${task.id}`}
                  className="cursor-pointer transition-transform hover:scale-125"
                  onClick={() => {
                    setSelectedNode({
                      type: 'TASK',
                      id: task.id,
                      title: task.title,
                      status: task.status,
                      detail: `Priority: ${task.priority} • Due: ${task.due_date}`,
                    });
                    if (onSelectTask) onSelectTask(task.id);
                  }}
                >
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 7 : 5}
                    fill={isComplete ? '#19F59A' : '#0A100D'}
                    stroke={isSelected ? '#38E1FF' : isComplete ? '#00D084' : '#8B9992'}
                    strokeWidth={isSelected ? 2 : 1}
                  />
                  {isSelected && (
                    <circle
                      cx={x}
                      cy={y}
                      r={10}
                      fill="none"
                      stroke="#38E1FF"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                      className="animate-pulse"
                    />
                  )}
                </g>
              );
            })
          )}

          {/* Objective Orbital Nodes */}
          {objectiveNodes.map((node) => {
            const colors = getObjectiveColor(node.objective.status);
            const isSelected = selectedNode?.id === node.objective.id;
            const posLabel = String(node.objective.position).padStart(2, '0');

            return (
              <g
                key={`obj_node_${node.objective.id}`}
                className="cursor-pointer group"
                onClick={() => {
                  setSelectedNode({
                    type: 'OBJECTIVE',
                    id: node.objective.id,
                    title: `Objective ${posLabel}: ${node.objective.title}`,
                    status: node.objective.status,
                    detail: `${node.objective.description} • Priority: ${node.objective.priority}`,
                  });
                  if (onSelectObjective) onSelectObjective(node.objective.id);
                }}
              >
                {/* Halo if selected */}
                {isSelected && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={24}
                    fill="none"
                    stroke={colors.border}
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    className="animate-pulse"
                  />
                )}

                {/* Node Body */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={18}
                  fill={colors.bg}
                  stroke={colors.border}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />

                {/* Inner position indicator */}
                <text
                  x={node.x}
                  y={node.y + 0.5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#F5F7F6"
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {posLabel}
                </text>

                {/* Status indicator tag */}
                <circle
                  cx={node.x + 13}
                  cy={node.y - 13}
                  r={4}
                  fill={colors.fill}
                  stroke="#050706"
                  strokeWidth="1"
                />

                {/* Objective Title Label */}
                <text
                  x={node.x}
                  y={node.y + 28}
                  textAnchor="middle"
                  fill={isSelected ? '#19F59A' : '#F5F7F6'}
                  fontSize="9.5"
                  fontWeight="bold"
                  fontFamily="monospace"
                  className="pointer-events-none drop-shadow-md"
                >
                  {node.objective.title.length > 14
                    ? `${node.objective.title.slice(0, 12)}…`
                    : node.objective.title}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend Overlay */}
        <div className="absolute bottom-2 left-2 flex flex-wrap items-center gap-2.5 text-[9px] text-[#8B9992] bg-[#050706]/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#16281F]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#19F59A]" /> COMPLETED
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#38E1FF]" /> IN PROGRESS
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#FF3B30]" /> BLOCKED
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#8B9992]" /> TODO
          </span>
        </div>
      </div>

      {/* Selected Node Inspector Footer */}
      {selectedNode && (
        <div className="mt-2 p-3 rounded-xl bg-[#050706] border border-[#16281F] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="space-y-0.5 truncate">
            <div className="flex items-center gap-2">
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#16281F] text-[#19F59A] font-bold">
                {selectedNode.type}
              </span>
              <span className="font-bold text-[#F5F7F6] truncate">{selectedNode.title}</span>
              <span
                className={`text-[9px] px-2 py-0.2 rounded font-bold ${
                  selectedNode.status === 'COMPLETED'
                    ? 'text-[#19F59A]'
                    : selectedNode.status === 'IN_PROGRESS' || selectedNode.status === 'ACTIVE'
                    ? 'text-[#38E1FF]'
                    : selectedNode.status === 'BLOCKED'
                    ? 'text-[#FF3B30]'
                    : 'text-[#8B9992]'
                }`}
              >
                STATUS: {selectedNode.status}
              </span>
            </div>
            {selectedNode.detail && (
              <p className="text-[10px] text-[#8B9992] font-sans truncate">{selectedNode.detail}</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {selectedNode.type === 'OBJECTIVE' && onSelectObjective && (
              <button
                onClick={() => onSelectObjective(selectedNode.id)}
                className="px-3 py-1 rounded bg-[#38E1FF] text-[#050706] font-bold text-[10px] hover:bg-[#38E1FF]/90 transition-colors"
              >
                FOCUS OBJECTIVE
              </button>
            )}
            {selectedNode.type === 'TASK' && onSelectTask && (
              <button
                onClick={() => onSelectTask(selectedNode.id)}
                className="px-3 py-1 rounded bg-[#19F59A] text-[#050706] font-bold text-[10px] hover:bg-[#19F59A]/90 transition-colors"
              >
                VIEW DIRECTIVE
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

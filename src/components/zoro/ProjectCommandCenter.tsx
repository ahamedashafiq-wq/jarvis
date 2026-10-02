import React from 'react';
import {
  FolderGit2,
  ExternalLink,
  Target,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { RoutePath } from '../../types';
import { soundService } from '../../services/sound';
import { MissionService } from '../../services/mission';

interface ProjectCommandCenterProps {
  userId: string;
  onNavigate: (path: RoutePath) => void;
  className?: string;
}

export const ProjectCommandCenter: React.FC<ProjectCommandCenterProps> = ({
  userId,
  onNavigate,
  className = '',
}) => {
  const missions = MissionService.getMissions(userId);

  // Default flagship project if no missions exist, or map from missions
  const projects = missions.length > 0
    ? missions.slice(0, 3).map((m) => {
        const objs = MissionService.getObjectives(userId, m.id);
        return {
          id: m.id,
          name: m.title,
          description: m.description || 'Strategic AI initiative and goal decomposition.',
          progress: m.progress || 0,
          status: m.status,
          currentPhase: objs.find((o) => o.status === 'IN_PROGRESS')?.title || objs[0]?.title || 'Active Development',
          nextAction: objs.find((o) => o.status === 'TODO')?.title || 'Verify integration tests',
          priority: m.priority || 'HIGH',
        };
      })
    : [
        {
          id: 'zoro_omnia_flagship',
          name: 'ZORO 2.0 OMNIA',
          description: 'Personal AI Command Operating System unifying multi-agent council and voice telemetry.',
          progress: 88,
          status: 'ACTIVE',
          currentPhase: 'Voice & Neural Memory Integration',
          nextAction: 'Verify command routing and real-time audio analysis',
          priority: 'HIGH',
        },
      ];

  const getPriorityBadge = (priority: string = 'HIGH') => {
    switch (priority.toUpperCase()) {
      case 'CRITICAL':
      case 'HIGH':
        return 'text-zoro-critical border-zoro-critical/40 bg-zoro-critical/10';
      case 'LOW':
        return 'text-zoro-success border-zoro-success/40 bg-zoro-success/10';
      case 'MEDIUM':
      default:
        return 'text-zoro-warning border-zoro-warning/40 bg-zoro-warning/10';
    }
  };

  return (
    <div
      className={`rounded-2xl border border-zoro-border bg-zoro-panel p-5 font-mono select-none space-y-4 shadow-xl ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zoro-border pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-zoro-cyan shadow-[0_0_8px_#19D9FF] animate-pulse" />
          <h2 className="text-xs font-bold text-zoro-text tracking-wider uppercase">
            ACTIVE PROJECTS
          </h2>
          <span className="text-[10px] text-zoro-cyan font-bold tabular-nums">
            ({projects.length} ENGAGED)
          </span>
        </div>

        <button
          onClick={() => {
            onNavigate('/missions');
            soundService.play('CLICK');
          }}
          className="text-[10px] text-zoro-cyan hover:underline flex items-center gap-1 transition-colors font-bold"
        >
          <span>ALL PROJECTS</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Projects Cards */}
      <div className="space-y-3">
        {projects.map((proj) => (
          <div
            key={proj.id}
            onClick={() => {
              onNavigate('/missions');
              soundService.play('CLICK');
            }}
            className="p-4 rounded-xl border border-zoro-border bg-zoro-panelElevated/90 hover:border-zoro-cyan/40 hover:bg-zoro-panelHighlight transition-all cursor-pointer group space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-zoro-cyan group-hover:scale-110 transition-transform" />
                <h3 className="text-sm font-bold text-zoro-text tracking-wider group-hover:text-zoro-cyan transition-colors">
                  {proj.name}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getPriorityBadge(proj.priority)}`}>
                  {proj.priority}
                </span>
                <span className="text-xs font-bold text-zoro-cyan tabular-nums">
                  {proj.progress}%
                </span>
              </div>
            </div>

            <p className="text-xs text-zoro-textSecondary font-sans leading-relaxed">
              {proj.description}
            </p>

            {/* Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-zoro-bg border border-zoro-border overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-zoro-cyan via-zoro-blue to-zoro-violet rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, proj.progress)}%` }}
              />
            </div>

            {/* Current & Next Action */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] pt-1">
              <div className="p-2 rounded bg-zoro-panel border border-zoro-border/50">
                <div className="text-[9px] text-zoro-textMuted uppercase font-bold">CURRENT:</div>
                <div className="text-zoro-text font-medium truncate mt-0.5">{proj.currentPhase}</div>
              </div>
              <div className="p-2 rounded bg-zoro-panel border border-zoro-border/50">
                <div className="text-[9px] text-zoro-textMuted uppercase font-bold">NEXT:</div>
                <div className="text-zoro-cyan font-medium truncate mt-0.5">{proj.nextAction}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Target,
  ArrowRight,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Mission, RoutePath } from '../../types';
import { soundService } from '../../services/sound';
import { MissionService } from '../../services/mission';

interface MissionPanelProps {
  userId: string;
  onNavigate: (path: RoutePath) => void;
  className?: string;
  onPlanWithZoro?: () => void;
}

export const MissionPanel: React.FC<MissionPanelProps> = ({
  userId,
  onNavigate,
  className = '',
  onPlanWithZoro,
}) => {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'OBJECTIVES' | 'PAUSED' | 'COMPLETED'>('ACTIVE');

  const allMissions = MissionService.getMissions(userId);
  const allObjectives = MissionService.getObjectives(userId);
  const activeMissions = allMissions.filter((m) => m.status === 'ACTIVE' || m.status === 'PLANNED');
  const pausedMissions = allMissions.filter((m) => m.status === 'PAUSED');
  const completedMissions = allMissions.filter((m) => m.status === 'COMPLETED');

  // Collect today's objectives across active missions
  const todayObjectives = allObjectives
    .filter((obj) => activeMissions.some((m) => m.id === obj.mission_id))
    .map((obj) => {
      const parentMission = activeMissions.find((m) => m.id === obj.mission_id);
      return {
        ...obj,
        missionTitle: parentMission?.title || 'Operational Target',
        missionId: obj.mission_id,
        priority: parentMission?.priority || 'MEDIUM',
      };
    });

  const getPriorityColor = (priority: string = 'MEDIUM') => {
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
      className={`rounded-2xl border border-zoro-border bg-zoro-panel p-5 font-mono select-none space-y-4 shadow-xl flex flex-col ${className}`}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zoro-border pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-zoro-cyan shadow-[0_0_8px_#19D9FF] animate-pulse" />
          <h2 className="text-xs font-bold text-zoro-text tracking-wider uppercase">
            MISSION CONTROL
          </h2>
          <span className="text-[10px] text-zoro-cyan font-bold tabular-nums">
            ({activeMissions.length} ACTIVE)
          </span>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-zoro-panelElevated border border-zoro-border text-[10px]">
          {(['ACTIVE', 'OBJECTIVES', 'PAUSED', 'COMPLETED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                soundService.play('CLICK');
              }}
              className={`px-2.5 py-1 rounded transition-colors font-bold ${
                activeTab === tab
                  ? 'bg-zoro-cyan/20 text-zoro-cyan shadow-sm border border-zoro-cyan/40'
                  : 'text-zoro-textMuted hover:text-zoro-text'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content depending on active tab */}
      <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
        {activeTab === 'ACTIVE' && (
          <>
            {activeMissions.length === 0 ? (
              <div className="p-8 text-center text-zoro-textMuted text-xs space-y-3">
                <p>Zero active missions recorded.</p>
                <button
                  onClick={() => {
                    if (onPlanWithZoro) onPlanWithZoro();
                    else onNavigate('/missions');
                  }}
                  className="px-3 py-1.5 rounded-lg border border-zoro-cyan/40 bg-zoro-cyan/10 text-zoro-cyan text-xs font-bold hover:bg-zoro-cyan/20 transition-colors inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>INITIALIZE MISSION</span>
                </button>
              </div>
            ) : (
              activeMissions.map((m) => {
                const missionObjectives = allObjectives.filter((o) => o.mission_id === m.id);
                const currentObjective = missionObjectives.find((o) => o.status === 'IN_PROGRESS') || missionObjectives[0];
                const nextObjective = missionObjectives.find((o) => o.status === 'TODO');

                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      onNavigate('/missions');
                      soundService.play('CLICK');
                    }}
                    className="p-4 rounded-xl border border-zoro-border bg-zoro-panelElevated/90 hover:border-zoro-cyan/40 hover:bg-zoro-panelHighlight transition-all cursor-pointer group space-y-3"
                  >
                    {/* Mission Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-zoro-cyan group-hover:scale-110 transition-transform" />
                        <h3 className="text-xs font-bold text-zoro-text tracking-wide group-hover:text-zoro-cyan transition-colors">
                          {m.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getPriorityColor(m.priority)}`}>
                          {m.priority || 'MEDIUM'}
                        </span>
                        <span className="text-xs font-bold text-zoro-cyan tabular-nums">
                          {m.progress || 0}% COMPLETE
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-zoro-bg border border-zoro-border overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-zoro-cyan via-zoro-blue to-zoro-violet transition-all duration-500 rounded-full"
                        style={{ width: `${Math.max(5, m.progress || 0)}%` }}
                      />
                    </div>

                    {/* Operational Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                      <div className="p-2 rounded bg-zoro-panel border border-zoro-border/60">
                        <div className="text-[9px] text-zoro-textMuted uppercase font-bold">CURRENT PHASE:</div>
                        <div className="text-zoro-text truncate font-medium mt-0.5">
                          {currentObjective?.title || m.description || 'Phase in progress'}
                        </div>
                      </div>

                      <div className="p-2 rounded bg-zoro-panel border border-zoro-border/60">
                        <div className="text-[9px] text-zoro-textMuted uppercase font-bold">NEXT ACTION:</div>
                        <div className="text-zoro-cyan truncate font-medium mt-0.5">
                          {nextObjective?.title || 'Review milestone deliverables'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {activeTab === 'OBJECTIVES' && (
          <>
            {todayObjectives.length === 0 ? (
              <div className="p-8 text-center text-zoro-textMuted text-xs">
                Zero individual objectives scheduled for today.
              </div>
            ) : (
              todayObjectives.map((obj, i) => (
                <div
                  key={obj.id || i}
                  className="p-3 rounded-xl border border-zoro-border bg-zoro-panelElevated flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-zoro-cyan shrink-0" />
                    <div className="truncate">
                      <div className="font-bold text-zoro-text truncate">{obj.title}</div>
                      <div className="text-[10px] text-zoro-textMuted truncate">Target: {obj.missionTitle}</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border shrink-0 ${getPriorityColor(obj.priority)}`}>
                    {obj.status}
                  </span>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'PAUSED' && (
          <>
            {pausedMissions.length === 0 ? (
              <div className="p-8 text-center text-zoro-textMuted text-xs">
                Zero paused missions. All tactical corridors running smooth.
              </div>
            ) : (
              pausedMissions.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-xl border border-zoro-warning/40 bg-zoro-warning/10 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zoro-text">{m.title}</span>
                    <span className="text-[9px] font-bold text-zoro-warning uppercase">PAUSED</span>
                  </div>
                  <p className="text-[11px] text-zoro-textSecondary">
                    {m.description || 'Execution suspended by operator.'}
                  </p>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'COMPLETED' && (
          <>
            {completedMissions.length === 0 ? (
              <div className="p-8 text-center text-zoro-textMuted text-xs">
                Zero completed missions logged yet.
              </div>
            ) : (
              completedMissions.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-xl border border-zoro-success/40 bg-zoro-success/10 text-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-zoro-success" />
                    <span className="font-bold text-zoro-text">{m.title}</span>
                  </div>
                  <span className="text-[10px] text-zoro-success font-bold">100% COMPLETE</span>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  Pause,
  ChevronRight,
  ExternalLink,
  X,
} from 'lucide-react';
import { Mission, MissionStatus, RoutePath } from '../../types';
import { MissionService } from '../../services/mission';
import { soundService } from '../../services/sound';

interface MissionControlWidgetProps {
  userId: string;
  onNavigate: (path: RoutePath) => void;
  onPlanWithJarvis?: () => void;
}

export const MissionControlWidget: React.FC<MissionControlWidgetProps> = ({
  userId,
  onNavigate,
  onPlanWithJarvis,
}) => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [isNewMissionOpen, setIsNewMissionOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newGoal, setNewGoal] = useState('');

  const loadMissions = () => {
    try {
      const list = MissionService.getMissions(userId);
      setMissions(list);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadMissions();
  }, [userId]);

  const activeMissions = missions.filter((m) => m.status === 'ACTIVE');
  const completedMissions = missions.filter((m) => m.status === 'COMPLETED');
  const pausedMissions = missions.filter((m) => m.status === 'PAUSED');

  const filteredMissions = missions.filter((m) => {
    if (filter !== 'ALL' && m.status !== filter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        m.goal?.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateQuickMission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    soundService.play('COMMAND_SUCCESS');
    const created = MissionService.createMission(userId, {
      title: newTitle.trim(),
      goal: newGoal.trim() || newTitle.trim(),
      description: 'Logged via Mission Control 2.0',
      priority: 'HIGH',
      category: 'PROJECT',
      deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
    });

    setMissions((prev) => [created, ...prev]);
    setNewTitle('');
    setNewGoal('');
    setIsNewMissionOpen(false);
  };

  return (
    <div className="rounded-lg border border-jarvis-border bg-jarvis-surfaceElevated p-4 space-y-4 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-jarvis-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-jarvis-primary" />
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-jarvis-text tracking-wider">
              MISSION CONTROL 2.0
            </h2>
            <p className="text-[10px] text-jarvis-textMuted">COMMAND YOUR OBJECTIVES</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onPlanWithJarvis && (
            <button
              onClick={onPlanWithJarvis}
              className="px-2.5 py-1 rounded text-xs border border-jarvis-secondary/60 bg-jarvis-secondary/10 hover:bg-jarvis-secondary/20 text-jarvis-secondary flex items-center gap-1 transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              <span>PLAN WITH ZORO</span>
            </button>
          )}

          <button
            onClick={() => setIsNewMissionOpen(true)}
            className="px-2.5 py-1 rounded text-xs border border-jarvis-primary bg-jarvis-primary text-black font-semibold hover:bg-jarvis-primary/90 flex items-center gap-1 transition-all shadow-glow-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>NEW MISSION</span>
          </button>
        </div>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
        <div className="p-2 rounded border border-jarvis-border bg-jarvis-surface">
          <div className="text-[10px] text-jarvis-textMuted">ACTIVE MISSIONS</div>
          <div className="text-base font-bold text-jarvis-text tabular-nums mt-0.5">
            {activeMissions.length}
          </div>
        </div>
        <div className="p-2 rounded border border-jarvis-border bg-jarvis-surface">
          <div className="text-[10px] text-jarvis-textMuted">TODAY&apos;S DIRECTIVES</div>
          <div className="text-base font-bold text-jarvis-primary tabular-nums mt-0.5">
            {activeMissions.reduce((acc, m) => acc + (m.progress < 100 ? 1 : 0), 0)}
          </div>
        </div>
        <div className="p-2 rounded border border-jarvis-border bg-jarvis-surface">
          <div className="text-[10px] text-jarvis-textMuted">PAUSED / BLOCKED</div>
          <div className="text-base font-bold text-jarvis-warning tabular-nums mt-0.5">
            {pausedMissions.length}
          </div>
        </div>
        <div className="p-2 rounded border border-jarvis-border bg-jarvis-surface">
          <div className="text-[10px] text-jarvis-textMuted">COMPLETED</div>
          <div className="text-base font-bold text-jarvis-secondary tabular-nums mt-0.5">
            {completedMissions.length}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1 p-0.5 rounded bg-jarvis-surface border border-jarvis-border">
          {(['ALL', 'ACTIVE', 'PAUSED', 'COMPLETED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setFilter(tab);
                soundService.play('CLICK');
              }}
              className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                filter === tab
                  ? 'bg-jarvis-surfaceElevated text-jarvis-primary font-bold shadow-sm'
                  : 'text-jarvis-textMuted hover:text-jarvis-text'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-jarvis-textMuted absolute left-2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search missions..."
            className="pl-7 pr-3 py-1 rounded border border-jarvis-border bg-jarvis-surface text-jarvis-text placeholder:text-jarvis-textMuted text-xs focus:outline-none focus:border-jarvis-primary/50"
            id="mission-search-input"
            name="missionSearch"
            aria-label="Search missions"
          />
        </div>
      </div>

      {/* Quick New Mission Form Drawer */}
      {isNewMissionOpen && (
        <form
          onSubmit={handleCreateQuickMission}
          className="p-3 rounded border border-jarvis-primary/40 bg-jarvis-surface space-y-2.5"
        >
          <div className="flex items-center justify-between text-xs font-bold text-jarvis-primary">
            <span>CREATE NEW MISSION</span>
            <button
              type="button"
              onClick={() => setIsNewMissionOpen(false)}
              className="text-jarvis-textMuted hover:text-jarvis-text"
            >
              ✕
            </button>
          </div>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Mission Title... (e.g. Master Autonomous Agents)"
            className="w-full px-3 py-1.5 rounded border border-jarvis-border bg-jarvis-bg text-jarvis-text text-xs focus:outline-none focus:border-jarvis-primary"
            autoFocus
            id="quick-mission-title"
            name="missionTitle"
            aria-label="Mission Title"
          />
          <input
            type="text"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            placeholder="Core Goal / Target Outcome..."
            className="w-full px-3 py-1.5 rounded border border-jarvis-border bg-jarvis-bg text-jarvis-text text-xs focus:outline-none focus:border-jarvis-primary"
            id="quick-mission-goal"
            name="missionGoal"
            aria-label="Core Goal"
          />
          <div className="flex justify-end gap-2 text-xs">
            <button
              type="button"
              onClick={() => setIsNewMissionOpen(false)}
              className="px-3 py-1 rounded border border-jarvis-border text-jarvis-textSecondary hover:text-jarvis-text"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="px-3 py-1 rounded border border-jarvis-primary bg-jarvis-primary text-black font-semibold hover:bg-jarvis-primary/90"
            >
              COMMIT MISSION
            </button>
          </div>
        </form>
      )}

      {/* Mission Cards Grid */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {filteredMissions.length === 0 ? (
          <div className="p-8 text-center rounded border border-dashed border-jarvis-border text-jarvis-textMuted space-y-2">
            <p className="text-xs">&ldquo;Your command queue is clear.&rdquo;</p>
            <button
              onClick={() => setIsNewMissionOpen(true)}
              className="px-3 py-1 rounded text-xs border border-jarvis-primary text-jarvis-primary hover:bg-jarvis-primary/10 transition-colors"
            >
              CREATE FIRST MISSION
            </button>
          </div>
        ) : (
          filteredMissions.map((m) => (
            <div
              key={m.id}
              onClick={() => setSelectedMission(m)}
              className="p-3 rounded border border-jarvis-border bg-jarvis-surface hover:border-jarvis-borderHover transition-all cursor-pointer space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 truncate max-w-sm">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      m.status === 'ACTIVE'
                        ? 'bg-jarvis-primary'
                        : m.status === 'COMPLETED'
                        ? 'bg-jarvis-secondary'
                        : 'bg-jarvis-warning'
                    }`}
                  />
                  <span className="font-semibold text-jarvis-text text-xs truncate">{m.title}</span>
                </div>

                <div className="flex items-center gap-2 text-[10px]">
                  <span
                    className={`px-1.5 py-0.5 rounded font-bold ${
                      m.priority === 'CRITICAL'
                        ? 'text-jarvis-danger border border-jarvis-danger/30'
                        : m.priority === 'HIGH'
                        ? 'text-jarvis-warning border border-jarvis-warning/30'
                        : 'text-jarvis-secondary border border-jarvis-secondary/30'
                    }`}
                  >
                    {m.priority}
                  </span>
                  <span className="text-jarvis-textMuted uppercase">{m.status}</span>
                </div>
              </div>

              {m.goal && (
                <p className="text-[11px] text-jarvis-textSecondary line-clamp-1">{m.goal}</p>
              )}

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-jarvis-textMuted">
                  <span>PROGRESS</span>
                  <span className="text-jarvis-primary font-bold tabular-nums">{m.progress}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-jarvis-bg overflow-hidden border border-jarvis-border/40">
                  <div
                    className="h-full bg-jarvis-primary transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, m.progress))}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mission Details Drawer / Modal */}
      {selectedMission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-lg border border-jarvis-border bg-jarvis-surfaceElevated p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-jarvis-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-jarvis-primary" />
                <span className="font-bold text-jarvis-text text-sm">{selectedMission.title}</span>
              </div>
              <button
                onClick={() => setSelectedMission(null)}
                className="text-jarvis-textMuted hover:text-jarvis-text p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-jarvis-textMuted text-[10px] block">GOAL:</span>
                <p className="text-jarvis-text">{selectedMission.goal || 'No explicit goal set.'}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 py-2 border-y border-jarvis-border/40 text-center">
                <div>
                  <span className="text-[10px] text-jarvis-textMuted block">STATUS</span>
                  <span className="font-bold text-jarvis-primary">{selectedMission.status}</span>
                </div>
                <div>
                  <span className="text-[10px] text-jarvis-textMuted block">PRIORITY</span>
                  <span className="font-bold text-jarvis-warning">{selectedMission.priority}</span>
                </div>
                <div>
                  <span className="text-[10px] text-jarvis-textMuted block">PROGRESS</span>
                  <span className="font-bold text-jarvis-secondary tabular-nums">{selectedMission.progress}%</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  setSelectedMission(null);
                  onNavigate('/missions');
                }}
                className="text-xs text-jarvis-primary hover:underline flex items-center gap-1"
              >
                <span>OPEN FULL MISSION CONTROL</span>
                <ExternalLink className="w-3 h-3" />
              </button>
              <button
                onClick={() => setSelectedMission(null)}
                className="px-3 py-1.5 rounded border border-jarvis-border bg-jarvis-surface text-jarvis-text text-xs hover:border-jarvis-primary"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

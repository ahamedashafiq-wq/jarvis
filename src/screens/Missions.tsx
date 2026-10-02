import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Mission,
  MissionObjective,
  RoutePath,
  Task,
  MissionStatus,
  MissionPriority,
  MissionCategory,
  ObjectiveStatus,
  ObjectivePriority,
  AIMissionPlan,
} from '../types';
import {
  useRealtimeMissions,
  useRealtimeObjectives,
  useRealtimeMissionActivity,
  useRealtimeTasks,
} from '../hooks/useRealtime';
import { MissionService } from '../services/mission';
import { MissionUniverse } from '../components/MissionUniverse';
import { PlanWithJarvisModal } from '../components/PlanWithJarvisModal';
import { NeuralMemoryService } from '../services/neuralMemory';
import { useToast } from '../components/Toast';
import {
  Target,
  Sparkles,
  Plus,
  Play,
  Pause,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Search,
  Filter,
  Calendar,
  Layers,
  ChevronRight,
  ChevronDown,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Activity,
  Award,
  Zap,
  Tag,
  Circle,
  Check,
  Shield,
  GitCommit,
  Compass,
  Eye,
} from 'lucide-react';

interface MissionsProps {
  onNavigate: (path: RoutePath) => void;
  initialMissionId?: string;
}

export const Missions: React.FC<MissionsProps> = ({ onNavigate, initialMissionId }) => {
  const { currentSession, trackEvent, createNotification } = useAuth();
  const userId = currentSession?.userId || 'guest';
  const { showToast } = useToast();

  const {
    missions,
    addMission,
    updateMission,
    deleteMission,
    togglePauseMission,
    completeMission,
  } = useRealtimeMissions();

  const { tasks, addTask, toggleTask } = useRealtimeTasks();

  // Active view: List vs Detail
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(initialMissionId || null);

  // Check URL hash for mission selection (e.g. #/missions?id=...)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      const match = hash.match(/[?&]id=([^&]+)/);
      if (match && match[1]) {
        setSelectedMissionId(match[1]);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Objectives and activities for the selected mission
  const {
    objectives,
    addObjective,
    updateObjective,
    deleteObjective,
    toggleObjectiveStatus,
    reorder,
  } = useRealtimeObjectives(selectedMissionId || undefined);

  const { activities } = useRealtimeMissionActivity(selectedMissionId || undefined);

  // Search & Filter state for Mission Center
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | MissionStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | MissionPriority>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | MissionCategory>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'PRIORITY' | 'DEADLINE' | 'PROGRESS'>('NEWEST');

  // Modals state
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showAddObjModal, setShowAddObjModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState<string | null>(null); // target objectiveId
  const [editMissionData, setEditMissionData] = useState<Mission | null>(null);

  // Manual Mission Form State
  const [manualTitle, setManualTitle] = useState('');
  const [manualGoal, setManualGoal] = useState('');
  const [manualPriority, setManualPriority] = useState<MissionPriority>('HIGH');
  const [manualCategory, setManualCategory] = useState<MissionCategory>('PROJECT');
  const [manualDeadline, setManualDeadline] = useState('In 14 Days');

  // Add Objective Form State
  const [objTitle, setObjTitle] = useState('');
  const [objDesc, setObjDesc] = useState('');
  const [objPriority, setObjPriority] = useState<ObjectivePriority>('MEDIUM');

  // Add Task to Objective Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<Task['priority']>('MEDIUM');

  // Detail View Sub-tabs
  const [activeTab, setActiveTab] = useState<'OBJECTIVES' | 'TASKS' | 'UNIVERSE' | 'TIMELINE' | 'REPLAY' | 'MEMORY'>('OBJECTIVES');
  const [expandedObjectives, setExpandedObjectives] = useState<Record<string, boolean>>({});

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const selectedMission = useMemo(() => {
    if (!selectedMissionId) return null;
    return missions.find((m) => m.id === selectedMissionId) || null;
  }, [missions, selectedMissionId]);

  // Next Move Engine for currently selected mission or overall active
  const nextMove = useMemo(() => {
    return MissionService.computeNextMove(userId, selectedMissionId || undefined);
  }, [userId, selectedMissionId, missions, objectives, tasks]);

  // Blocker Report for currently selected mission
  const blockerReport = useMemo(() => {
    if (!selectedMissionId) return { hasBlockers: false, blockedObjectives: [] };
    return MissionService.detectMissionBlockers(userId, selectedMissionId);
  }, [userId, selectedMissionId, objectives, tasks]);

  // Explainable progress breakdown
  const progressDetail = useMemo(() => {
    if (!selectedMissionId) return null;
    return MissionService.calculateMissionProgress(userId, selectedMissionId);
  }, [userId, selectedMissionId, objectives, tasks]);

  // Overall Statistics for Mission Center
  const activeMissionsCount = missions.filter((m) => m.status === 'ACTIVE').length;
  const completedMissionsCount = missions.filter((m) => m.status === 'COMPLETED').length;
  const allObjectivesCount = MissionService.getObjectives(userId).length;
  const todayObjectivesCount = MissionService.getObjectives(userId).filter(
    (o) => o.status === 'IN_PROGRESS' || o.status === 'TODO'
  ).length;

  // Filtered & Sorted missions list
  const filteredMissions = useMemo(() => {
    return missions
      .filter((m) => {
        if (statusFilter !== 'ALL' && m.status !== statusFilter) return false;
        if (priorityFilter !== 'ALL' && m.priority !== priorityFilter) return false;
        if (categoryFilter !== 'ALL' && m.category !== categoryFilter) return false;

        if (debouncedQuery.trim()) {
          const q = debouncedQuery.toLowerCase();
          const matchTitle = m.title.toLowerCase().includes(q);
          const matchGoal = m.goal.toLowerCase().includes(q);
          const matchDesc = m.description.toLowerCase().includes(q);
          if (!matchTitle && !matchGoal && !matchDesc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'NEWEST') return b.created_at - a.created_at;
        if (sortBy === 'OLDEST') return a.created_at - b.created_at;
        if (sortBy === 'PROGRESS') return b.progress - a.progress;
        if (sortBy === 'PRIORITY') {
          const weight: Record<MissionPriority, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
          return weight[b.priority] - weight[a.priority];
        }
        return b.created_at - a.created_at;
      });
  }, [missions, statusFilter, priorityFilter, categoryFilter, debouncedQuery, sortBy]);

  // --------------------------------------------------------------------------
  // HANDLERS
  // --------------------------------------------------------------------------

  const handleCreateManualMission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    const created = addMission({
      title: manualTitle.trim(),
      goal: manualGoal.trim() || manualTitle.trim(),
      description: manualGoal.trim(),
      priority: manualPriority,
      category: manualCategory,
      deadline: manualDeadline.trim() || 'In 14 Days',
      status: 'ACTIVE',
    });

    setManualTitle('');
    setManualGoal('');
    setShowManualModal(false);
    showToast('MISSION INITIALIZED', `Mission "${created.title}" armed in Blade 02.`, 'MISSION');
    createNotification('MISSION INITIALIZED', `Armed: ${created.title}`, 'MISSION');
    trackEvent('MISSION_CREATED', JSON.stringify({ id: created.id, title: created.title }));
    setSelectedMissionId(created.id);
  };

  const handlePlanApproved = (plan: AIMissionPlan) => {
    const result = MissionService.approveAndCreatePlan(userId, plan);
    showToast('MISSION ROADMAP APPROVED', `Mission "${result.mission.title}" activated with ${result.objectives.length} objectives.`, 'MISSION');
    createNotification('MISSION PLAN ACTIVATED', `Deployed ${result.mission.title} with ${result.objectives.length} sequenced objectives.`, 'MISSION');
    trackEvent('MISSION_PLAN_APPROVED', JSON.stringify({ title: result.mission.title }));
    setSelectedMissionId(result.mission.id);
  };

  const handleAddObjectiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!objTitle.trim() || !selectedMissionId) return;

    const created = addObjective({
      title: objTitle.trim(),
      description: objDesc.trim() || 'Operational milestone',
      priority: objPriority,
      status: 'TODO',
    });

    setObjTitle('');
    setObjDesc('');
    setShowAddObjModal(false);
    if (created) {
      showToast('OBJECTIVE ADDED', `Objective "${created.title}" registered.`, 'MISSION');
      createNotification('OBJECTIVE ADDED', `Objective registered: ${created.title}`, 'MISSION');
    }
  };

  const handleAddTaskToObjectiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !selectedMissionId || !showAddTaskModal) return;

    const newTask = addTask({
      title: taskTitle.trim(),
      description: taskDesc.trim() || 'Tactical directive',
      priority: taskPriority,
      status: 'TODO',
      category: selectedMission?.category || 'PROJECT',
      due_date: selectedMission?.deadline || 'Today',
      mission_id: selectedMissionId,
      objective_id: showAddTaskModal,
    });

    setTaskTitle('');
    setTaskDesc('');
    setShowAddTaskModal(null);
    showToast('DIRECTIVE CREATED', `Task "${newTask.title}" attached to objective.`, 'TASK');
    MissionService.logActivity(userId, selectedMissionId, 'TASK_CREATED', `Task "${newTask.title}" added to objective.`);
    MissionService.recalculateMissionProgress(userId, selectedMissionId);
  };

  const handleToggleTaskStatus = (t: Task) => {
    toggleTask(t.id);
    if (selectedMissionId) {
      MissionService.logActivity(
        userId,
        selectedMissionId,
        t.status === 'COMPLETED' ? 'TASK_COMPLETED' : 'TASK_CREATED',
        `Task "${t.title}" status updated.`
      );
      MissionService.recalculateMissionProgress(userId, selectedMissionId);
    }
  };

  const handleObjectiveReorder = (id: string, direction: 'UP' | 'DOWN') => {
    const sorted = [...objectives].sort((a, b) => a.position - b.position);
    const index = sorted.findIndex((o) => o.id === id);
    if (index === -1) return;

    if (direction === 'UP' && index > 0) {
      const temp = sorted[index];
      sorted[index] = sorted[index - 1];
      sorted[index - 1] = temp;
    } else if (direction === 'DOWN' && index < sorted.length - 1) {
      const temp = sorted[index];
      sorted[index] = sorted[index + 1];
      sorted[index + 1] = temp;
    }

    reorder(sorted.map((o) => o.id));
  };

  const handleCompleteMissionAction = (missionId: string) => {
    completeMission(missionId);
    showToast('MISSION ACCOMPLISHED', 'All objectives verified. 100% mission clearance attained.', 'MISSION');
    createNotification('MISSION COMPLETE', `Mission accomplished. All three blades salute your discipline.`, 'SUCCESS');
    trackEvent('MISSION_COMPLETED', JSON.stringify({ id: missionId }));
  };

  const toggleObjectiveExpand = (id: string) => {
    setExpandedObjectives((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Replay Data
  const replayData = useMemo(() => {
    if (!selectedMissionId) return null;
    return MissionService.getMissionReplay(userId, selectedMissionId);
  }, [userId, selectedMissionId, objectives, tasks, activities]);

  // --------------------------------------------------------------------------
  // RENDER: MISSION DETAIL VIEW
  // --------------------------------------------------------------------------
  if (selectedMission) {
    const missionTasks = tasks.filter((t) => t.mission_id === selectedMission.id);
    const completedObjCount = objectives.filter((o) => o.status === 'COMPLETED').length;

    return (
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 font-mono text-xs animate-fade-in">
        {/* Navigation Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#16281F] pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedMissionId(null);
                window.location.hash = '/missions';
              }}
              className="p-1.5 rounded-lg bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#19F59A] transition-colors"
              title="Return to Mission Center"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#8B9992]">MISSION CONTROL</span>
                <span className="text-[10px] text-[#8B9992]">/</span>
                <span className="text-[10px] font-bold text-[#19F59A] uppercase tracking-wider">
                  {selectedMission.category}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#F5F7F6] tracking-wider truncate max-w-xl">
                {selectedMission.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => togglePauseMission(selectedMission.id)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedMission.status === 'PAUSED'
                  ? 'bg-[#19F59A] text-[#050706]'
                  : 'bg-[#0A100D] border-[#16281F] text-[#8B9992] hover:text-[#F5F7F6]'
              }`}
            >
              {selectedMission.status === 'PAUSED' ? (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>RESUME MISSION</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>PAUSE</span>
                </>
              )}
            </button>

            {selectedMission.status !== 'COMPLETED' && (
              <button
                onClick={() => handleCompleteMissionAction(selectedMission.id)}
                className="px-3.5 py-1.5 rounded-lg bg-[#19F59A] text-[#050706] font-bold text-xs hover:bg-[#00D084] transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(25,245,154,0.25)]"
              >
                <CheckCircle className="w-3.5 h-3.5 fill-current" />
                <span>COMPLETE</span>
              </button>
            )}

            <button
              onClick={() => {
                if (confirm('Permanently purge this mission and its objectives?')) {
                  deleteMission(selectedMission.id);
                  setSelectedMissionId(null);
                }
              }}
              className="p-2 rounded-lg bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#FF3B30] hover:border-[#FF3B30]/40 transition-colors"
              title="Delete Mission"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* SECTION 6: MISSION HEADER CARD */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0A100D] border border-[#16281F] space-y-4 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                    selectedMission.status === 'COMPLETED'
                      ? 'bg-[#19F59A]/15 text-[#19F59A] border-[#19F59A]/30'
                      : selectedMission.status === 'ACTIVE'
                      ? 'bg-[#38E1FF]/15 text-[#38E1FF] border-[#38E1FF]/30'
                      : 'bg-[#FFB000]/15 text-[#FFB000] border-[#FFB000]/30'
                  }`}
                >
                  STATUS: {selectedMission.status}
                </span>

                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                    selectedMission.priority === 'CRITICAL'
                      ? 'bg-[#FF3B30]/15 text-[#FF3B30] border-[#FF3B30]/30'
                      : selectedMission.priority === 'HIGH'
                      ? 'bg-[#FFB000]/15 text-[#FFB000] border-[#FFB000]/30'
                      : 'bg-[#16281F] text-[#8B9992] border-[#16281F]'
                  }`}
                >
                  {selectedMission.priority} PRIORITY
                </span>

                <span className="text-[10px] text-[#8B9992] flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#FFB000]" />
                  DEADLINE: {selectedMission.deadline}
                </span>
              </div>

              <div className="pt-1">
                <span className="text-[10px] text-[#19F59A] uppercase tracking-wider font-bold">
                  TACTICAL GOAL:
                </span>
                <p className="text-sm font-bold text-[#F5F7F6] font-sans mt-0.5">
                  {selectedMission.goal}
                </p>
              </div>
            </div>

            {/* Explainable Progress Badge */}
            <div className="p-4 rounded-xl bg-[#050706] border border-[#16281F] min-w-[240px] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#8B9992]">MISSION PROGRESS</span>
                <span className="text-xl font-black text-[#19F59A]">
                  {progressDetail?.percentage || selectedMission.progress}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#16281F] overflow-hidden">
                <div
                  className="h-full bg-[#19F59A] transition-all duration-500 rounded-full"
                  style={{ width: `${progressDetail?.percentage || selectedMission.progress}%` }}
                />
              </div>
              <div className="text-[10px] text-[#8B9992] font-sans leading-tight">
                {progressDetail?.explanation || `${selectedMission.progress}% complete`}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 22: MISSION BRIEFING */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#121C17]/60 border border-[#00D084]/30 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#19F59A] tracking-wider">
            <Shield className="w-4 h-4" />
            <span>ZORO MISSION BRIEFING</span>
          </div>
          <p className="text-xs text-[#F5F7F6] leading-relaxed font-sans">
            {selectedMission.title} is currently at{' '}
            <span className="text-[#19F59A] font-bold font-mono">
              {progressDetail?.percentage || selectedMission.progress}%
            </span>{' '}
            clearance.{' '}
            {completedObjCount} of {objectives.length} objectives completed.{' '}
            {objectives.length - completedObjCount} objectives remaining.{' '}
            {blockerReport.hasBlockers
              ? `Attention required: ${blockerReport.blockedObjectives[0].reason}`
              : 'All operational parameters remain clear with zero active blockers.'}{' '}
            {nextMove ? `Recommended next move: ${nextMove.action}.` : ''}
          </p>
        </div>

        {/* SECTION 12: NEXT MOVE ENGINE CARD */}
        {nextMove && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0A100D] border border-[#38E1FF]/40 space-y-3 relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between border-b border-[#16281F] pb-2.5">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#38E1FF] animate-pulse" />
                <span className="font-bold text-xs text-[#38E1FF] tracking-wider uppercase">
                  TACTICAL NEXT MOVE ENGINE
                </span>
              </div>
              <span className="text-[10px] text-[#8B9992]">CALCULATED FROM LIVE RECONNAISSANCE</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="text-sm font-bold text-[#F5F7F6] tracking-wide">
                  {nextMove.action}
                </div>
                <div className="space-y-0.5 text-[11px] text-[#8B9992] font-sans">
                  <div className="text-[10px] font-mono text-[#38E1FF] uppercase font-bold">WHY?</div>
                  {nextMove.reason.map((r, i) => (
                    <div key={i}>{r}</div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {nextMove.taskId && (
                  <button
                    onClick={() => {
                      const t = tasks.find((item) => item.id === nextMove.taskId);
                      if (t) handleToggleTaskStatus(t);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#38E1FF] text-[#050706] font-bold text-xs hover:bg-[#38E1FF]/90 transition-all shadow-[0_0_15px_rgba(56,225,255,0.25)] flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>START TASK</span>
                  </button>
                )}
                {nextMove.objectiveId && !nextMove.taskId && (
                  <button
                    onClick={() => {
                      toggleObjectiveStatus(nextMove.objectiveId!);
                      showToast('OBJECTIVE UPDATED', 'Objective status changed.', 'MISSION');
                    }}
                    className="px-4 py-2 rounded-xl bg-[#19F59A] text-[#050706] font-bold text-xs hover:bg-[#00D084] transition-all flex items-center gap-1.5"
                  >
                    <span>ENGAGE OBJECTIVE</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 13: BLOCKER ALERT (if any) */}
        {blockerReport.hasBlockers && (
          <div className="p-4 rounded-xl bg-[#FF3B30]/15 border border-[#FF3B30]/40 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#FF3B30]">
                <AlertTriangle className="w-4 h-4" />
                <span>BLOCKED OBJECTIVE DETECTED</span>
              </div>
              <span className="text-[10px] text-[#FF3B30] font-bold">ATTENTION REQUIRED</span>
            </div>
            {blockerReport.blockedObjectives.map((b, idx) => (
              <div key={idx} className="p-2.5 rounded bg-[#050706]/80 border border-[#FF3B30]/30 space-y-1">
                <div className="font-bold text-[#F5F7F6] text-xs">
                  {b.objective.title} (Status: {b.objective.status})
                </div>
                <p className="text-[11px] text-[#8B9992] font-sans">{b.reason}</p>
              </div>
            ))}
          </div>
        )}

        {/* Navigation Tabs for Mission Detail */}
        <div className="flex items-center gap-2 border-b border-[#16281F] pb-2 overflow-x-auto">
          {[
            { id: 'OBJECTIVES', label: `OBJECTIVES (${objectives.length})` },
            { id: 'TASKS', label: `DIRECTIVES & TASKS (${missionTasks.length})` },
            { id: 'UNIVERSE', label: 'MISSION UNIVERSE (2D)' },
            { id: 'TIMELINE', label: `ACTIVITY TIMELINE (${activities.length})` },
            { id: 'REPLAY', label: 'FOCUS & REPLAY' },
            { id: 'MEMORY', label: 'NEURAL MEMORY' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'bg-[#19F59A] text-[#050706] shadow-[0_0_10px_rgba(25,245,154,0.2)]'
                  : 'bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#F5F7F6]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OBJECTIVES */}
        {activeTab === 'OBJECTIVES' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#8B9992] uppercase tracking-wider">
                SEQUENCED OBJECTIVE ROADMAP
              </span>
              <button
                onClick={() => setShowAddObjModal(true)}
                className="px-3 py-1.5 rounded-lg bg-[#38E1FF] text-[#050706] font-bold text-xs hover:bg-[#38E1FF]/90 transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(56,225,255,0.2)]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>NEW OBJECTIVE</span>
              </button>
            </div>

            <div className="space-y-3">
              {objectives.length === 0 ? (
                <div className="p-8 text-center text-[#8B9992] bg-[#0A100D] border border-[#16281F] rounded-xl">
                  No objectives established yet. Click "NEW OBJECTIVE" to add your first milestone.
                </div>
              ) : (
                objectives.map((obj, idx) => {
                  const isExpanded = Boolean(expandedObjectives[obj.id]);
                  const objTasks = missionTasks.filter((t) => t.objective_id === obj.id);
                  const completedTasksCount = objTasks.filter((t) => t.status === 'COMPLETED').length;

                  return (
                    <div
                      key={obj.id}
                      className={`p-4 rounded-xl border transition-all space-y-3 ${
                        obj.status === 'COMPLETED'
                          ? 'bg-[#050706] border-[#16281F] opacity-75'
                          : obj.status === 'BLOCKED'
                          ? 'bg-[#0A100D] border-[#FF3B30]/40'
                          : 'bg-[#0A100D] border-[#16281F] hover:border-[#19F59A]/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <button
                            onClick={() => toggleObjectiveStatus(obj.id)}
                            className={`mt-0.5 w-6 h-6 rounded border flex items-center justify-center transition-colors shrink-0 ${
                              obj.status === 'COMPLETED'
                                ? 'bg-[#19F59A] border-[#19F59A] text-[#050706]'
                                : 'border-[#8B9992] hover:border-[#19F59A]'
                            }`}
                            title="Toggle Objective Completion"
                          >
                            {obj.status === 'COMPLETED' ? (
                              <Check className="w-4 h-4 stroke-[3]" />
                            ) : (
                              <span className="text-[10px] font-bold font-mono">
                                {String(obj.position).padStart(2, '0')}
                              </span>
                            )}
                          </button>

                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-mono text-[#19F59A] font-bold">
                                OBJECTIVE {String(obj.position).padStart(2, '0')}
                              </span>
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                                  obj.status === 'COMPLETED'
                                    ? 'bg-[#19F59A]/15 text-[#19F59A]'
                                    : obj.status === 'IN_PROGRESS'
                                    ? 'bg-[#38E1FF]/15 text-[#38E1FF]'
                                    : obj.status === 'BLOCKED'
                                    ? 'bg-[#FF3B30]/15 text-[#FF3B30]'
                                    : 'bg-[#16281F] text-[#8B9992]'
                                }`}
                              >
                                {obj.status}
                              </span>
                              <span className="text-[9px] text-[#8B9992] px-1.5 py-0.5 rounded bg-[#050706]">
                                {obj.priority}
                              </span>
                            </div>

                            <h3
                              className={`text-sm font-bold truncate ${
                                obj.status === 'COMPLETED' ? 'line-through text-[#8B9992]' : 'text-[#F5F7F6]'
                              }`}
                            >
                              {obj.title}
                            </h3>
                            <p className="text-xs text-[#8B9992] font-sans leading-relaxed">
                              {obj.description}
                            </p>
                          </div>
                        </div>

                        {/* Objective Actions: Reorder, Expand, Delete */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleObjectiveReorder(obj.id, 'UP')}
                            disabled={idx === 0}
                            className="p-1 hover:text-[#19F59A] disabled:opacity-20 text-[#8B9992]"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleObjectiveReorder(obj.id, 'DOWN')}
                            disabled={idx === objectives.length - 1}
                            className="p-1 hover:text-[#19F59A] disabled:opacity-20 text-[#8B9992]"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => toggleObjectiveExpand(obj.id)}
                            className="px-2 py-1 rounded bg-[#050706] border border-[#16281F] text-[10px] text-[#8B9992] hover:text-[#F5F7F6] flex items-center gap-1"
                          >
                            <span>{objTasks.length} TASKS</span>
                            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          </button>
                          <button
                            onClick={() => deleteObjective(obj.id)}
                            className="p-1 text-[#8B9992] hover:text-[#FF3B30]"
                            title="Delete Objective"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Objective Progress Bar */}
                      <div className="pt-2 flex items-center justify-between text-[10px] text-[#8B9992]">
                        <span>PROGRESS</span>
                        <span>
                          {objTasks.length > 0
                            ? `${completedTasksCount} / ${objTasks.length} tasks complete`
                            : obj.status === 'COMPLETED'
                            ? '100% complete'
                            : 'Pending'}
                        </span>
                      </div>

                      {/* Collapsible Nested Tasks inside Objective (Section 8 & 11) */}
                      {isExpanded && (
                        <div className="pt-3 border-t border-[#16281F] space-y-2 pl-4">
                          <div className="flex items-center justify-between pb-1">
                            <span className="text-[10px] text-[#8B9992] uppercase font-bold tracking-wider">
                              LINKED DIRECTIVES
                            </span>
                            <button
                              onClick={() => setShowAddTaskModal(obj.id)}
                              className="text-[10px] text-[#38E1FF] hover:underline flex items-center gap-1 font-bold"
                            >
                              <Plus className="w-3 h-3" />
                              <span>SMART TASK CREATION</span>
                            </button>
                          </div>

                          {objTasks.length === 0 ? (
                            <div className="p-3 text-center text-[#8B9992] text-[11px] bg-[#050706] rounded-lg border border-[#16281F]">
                              No tasks registered for this objective yet. Click "SMART TASK CREATION".
                            </div>
                          ) : (
                            objTasks.map((t) => (
                              <div
                                key={t.id}
                                className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 text-xs transition-colors ${
                                  t.status === 'COMPLETED'
                                    ? 'bg-[#050706] border-[#16281F] opacity-50'
                                    : 'bg-[#050706] border-[#16281F] hover:border-[#38E1FF]/40'
                                }`}
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <button
                                    onClick={() => handleToggleTaskStatus(t)}
                                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                      t.status === 'COMPLETED'
                                        ? 'bg-[#19F59A] border-[#19F59A] text-[#050706]'
                                        : 'border-[#8B9992]'
                                    }`}
                                  >
                                    {t.status === 'COMPLETED' && <Check className="w-3 h-3 stroke-[3]" />}
                                  </button>
                                  <span
                                    className={`truncate ${
                                      t.status === 'COMPLETED' ? 'line-through text-[#8B9992]' : 'text-[#F5F7F6]'
                                    }`}
                                  >
                                    {t.title}
                                  </span>
                                </div>
                                <span className="text-[9px] text-[#8B9992] shrink-0 font-bold px-1.5 py-0.5 rounded bg-[#16281F]">
                                  {t.priority}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ALL MISSION TASKS */}
        {activeTab === 'TASKS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#8B9992] uppercase tracking-wider">
                ALL DIRECTIVES IN THIS MISSION ({missionTasks.length})
              </span>
              <button
                onClick={() => {
                  const targetObjId = objectives[0]?.id;
                  if (targetObjId) {
                    setShowAddTaskModal(targetObjId);
                  } else {
                    showToast('CREATE OBJECTIVE FIRST', 'Add an objective before creating linked directives.', 'ALERT');
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-[#38E1FF] text-[#050706] font-bold text-xs hover:bg-[#38E1FF]/90 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>NEW DIRECTIVE</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {missionTasks.length === 0 ? (
                <div className="p-8 text-center text-[#8B9992] bg-[#0A100D] border border-[#16281F] rounded-xl">
                  Zero tasks currently linked to this mission.
                </div>
              ) : (
                missionTasks.map((t) => (
                  <div
                    key={t.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                      t.status === 'COMPLETED'
                        ? 'bg-[#050706] border-[#16281F] opacity-50'
                        : 'bg-[#0A100D] border-[#16281F] hover:border-[#38E1FF]/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => handleToggleTaskStatus(t)}
                        className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                          t.status === 'COMPLETED'
                            ? 'bg-[#19F59A] border-[#19F59A] text-[#050706]'
                            : 'border-[#8B9992]'
                        }`}
                      >
                        {t.status === 'COMPLETED' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                      <div className="truncate">
                        <div
                          className={`font-bold truncate ${
                            t.status === 'COMPLETED' ? 'line-through text-[#8B9992]' : 'text-[#F5F7F6]'
                          }`}
                        >
                          {t.title}
                        </div>
                        <div className="text-[10px] text-[#8B9992] truncate font-sans">{t.description}</div>
                      </div>
                    </div>

                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#16281F] text-[#8B9992]">
                      {t.priority}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MISSION UNIVERSE 2D */}
        {activeTab === 'UNIVERSE' && (
          <MissionUniverse
            mission={selectedMission}
            objectives={objectives}
            tasks={missionTasks}
            onSelectObjective={(objId) => {
              setActiveTab('OBJECTIVES');
              setExpandedObjectives((prev) => ({ ...prev, [objId]: true }));
            }}
          />
        )}

        {/* TAB 4: ACTIVITY TIMELINE (Section 14 & 15) */}
        {activeTab === 'TIMELINE' && (
          <div className="p-5 rounded-2xl bg-[#0A100D] border border-[#16281F] space-y-4">
            <div className="flex items-center justify-between border-b border-[#16281F] pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#19F59A]" />
                <h3 className="font-bold text-xs text-[#F5F7F6] tracking-wider uppercase">
                  MISSION ACTIVITY TIMELINE
                </h3>
              </div>
              <span className="text-[10px] text-[#8B9992]">REAL AUDIT TIMESTAMPS</span>
            </div>

            <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-[#16281F]">
              {activities.length === 0 ? (
                <div className="py-6 text-center text-[#8B9992]">
                  No events logged in timeline yet.
                </div>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="flex items-start gap-4 relative pl-7">
                    <span className="absolute left-2 top-1.5 w-2.5 h-2.5 rounded-full bg-[#19F59A] border-2 border-[#0A100D]" />
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#F5F7F6]">{act.description}</span>
                        <span className="text-[9px] text-[#8B9992]">
                          {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-[9px] text-[#8B9992] font-mono">
                        TYPE: <span className="text-[#00D084]">{act.type}</span> •{' '}
                        {new Date(act.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: FOCUS & REPLAY (Section 23 & 24) */}
        {activeTab === 'REPLAY' && (
          <div className="space-y-4">
            {replayData && selectedMission.status === 'COMPLETED' ? (
              <div className="p-6 rounded-2xl bg-[#0A100D] border border-[#19F59A]/40 space-y-5 shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-[#16281F] pb-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#19F59A]" />
                    <span className="font-black text-sm text-[#F5F7F6] tracking-wider uppercase">
                      MISSION COMPLETE • TACTICAL REPLAY
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#19F59A] bg-[#19F59A]/15 px-2.5 py-0.5 rounded border border-[#19F59A]/30">
                    100% DISCIPLINE ACHIEVED
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-[#050706] border border-[#16281F]">
                    <div className="text-xl font-black text-[#F5F7F6]">{replayData.tasksCount}</div>
                    <div className="text-[9px] text-[#8B9992] uppercase mt-1">Directives Cleared</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#050706] border border-[#16281F]">
                    <div className="text-xl font-black text-[#19F59A]">{replayData.objectivesCount}</div>
                    <div className="text-[9px] text-[#8B9992] uppercase mt-1">Objectives Achieved</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#050706] border border-[#16281F]">
                    <div className="text-xl font-black text-[#FFB000]">{replayData.focusSessionsCount}</div>
                    <div className="text-[9px] text-[#8B9992] uppercase mt-1">Focus Sessions</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#050706] border border-[#16281F]">
                    <div className="text-xl font-black text-[#38E1FF]">{replayData.daysElapsed}d</div>
                    <div className="text-[9px] text-[#8B9992] uppercase mt-1">Elapsed Timeline</div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-[10px] text-[#8B9992] uppercase tracking-wider font-bold">
                    MILESTONE RETROSPECTIVE:
                  </span>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {replayData.milestones.map((m) => (
                      <div
                        key={m.id}
                        className="p-2.5 rounded-lg bg-[#050706] border border-[#16281F] flex items-center justify-between text-xs"
                      >
                        <span className="text-[#F5F7F6]">{m.description}</span>
                        <span className="text-[9px] text-[#8B9992]">
                          {new Date(m.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-[#8B9992] bg-[#0A100D] border border-[#16281F] rounded-xl space-y-2">
                <Clock className="w-6 h-6 text-[#FFB000] mx-auto" />
                <div className="font-bold text-[#F5F7F6] text-xs">MISSION IN PROGRESS</div>
                <p className="text-[11px] font-sans max-w-md mx-auto">
                  The comprehensive Mission Replay and retrospective activate automatically when 100% of all objectives and directives are fulfilled.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: NEURAL MEMORY (Phase 11 Requirement 30) */}
        {activeTab === 'MEMORY' && (
          <div className="space-y-5 font-mono text-xs">
            {/* Project Knowledge Snapshot */}
            <div className="p-4 rounded-xl bg-[#0A100D] border border-[#16281F] space-y-3">
              <div className="flex items-center justify-between border-b border-[#16281F] pb-2">
                <span className="text-xs font-bold text-[#19F59A] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#19F59A]" />
                  PROJECT KNOWLEDGE SNAPSHOT: {selectedMission.title}
                </span>
                <button
                  onClick={() => onNavigate('/memory')}
                  className="px-2.5 py-1 rounded-lg bg-[#121C17] border border-[#19F59A]/30 text-[#19F59A] hover:bg-[#19F59A]/20 transition-all text-[10px] font-bold flex items-center gap-1"
                >
                  <Compass className="w-3 h-3" />
                  <span>OPEN KNOWLEDGE GRAPH</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                <div className="p-3 rounded-lg bg-[#050706] border border-[#16281F] space-y-1">
                  <span className="text-[10px] text-[#8B9992] uppercase font-bold">MISSION GOAL:</span>
                  <div className="text-[#F5F7F6] font-bold">{selectedMission.goal}</div>
                </div>
                <div className="p-3 rounded-lg bg-[#050706] border border-[#16281F] space-y-1">
                  <span className="text-[10px] text-[#8B9992] uppercase font-bold">MISSION STATUS:</span>
                  <div className="text-[#38E1FF] font-bold">
                    {selectedMission.status} ({selectedMission.progress}% Complete)
                  </div>
                </div>
              </div>
            </div>

            {/* Relevant Architectural Decisions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#A78BFA] flex items-center gap-1.5">
                  <GitCommit className="w-4 h-4" />
                  <span>RELEVANT PROJECT DECISIONS</span>
                </span>
              </div>

              {(() => {
                const decisions = NeuralMemoryService.getDecisions(userId).filter(
                  (d) => d.status === 'ACTIVE'
                );
                if (decisions.length === 0) {
                  return (
                    <p className="text-xs text-[#8B9992] italic p-4 rounded-xl bg-[#0A100D] border border-[#16281F]">
                      No explicit decisions recorded yet. Record architectural decisions via Chat, Voice, or the Memory Deck.
                    </p>
                  );
                }
                return (
                  <div className="space-y-2">
                    {decisions.map((dec) => (
                      <div
                        key={dec.id}
                        className="p-3.5 rounded-xl bg-[#0A100D] border border-[#A78BFA]/30 space-y-1.5 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#F5F7F6] text-xs">{dec.decision}</span>
                          <span className="text-[9px] px-2 py-0.5 rounded bg-[#A78BFA]/20 text-[#A78BFA] font-bold">
                            {dec.status}
                          </span>
                        </div>
                        {dec.context && (
                          <p className="text-[11px] text-[#8B9992] font-sans">{dec.context}</p>
                        )}
                        <div className="text-[9px] text-[#8B9992] pt-1 flex items-center gap-3">
                          <span>Source: {dec.source}</span>
                          <span>•</span>
                          <span>Quality: {dec.quality}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Saved Vision Analyses */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-[#38E1FF] flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                <span>SAVED VISION TELEMETRY</span>
              </span>
              {(() => {
                const visions = NeuralMemoryService.getEntities(userId, 'VISION_ANALYSIS');
                if (visions.length === 0) {
                  return (
                    <p className="text-xs text-[#8B9992] italic p-4 rounded-xl bg-[#0A100D] border border-[#16281F]">
                      No visual inspection artifacts linked to this mission yet.
                    </p>
                  );
                }
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {visions.map((v) => (
                      <div
                        key={v.id}
                        className="p-3 rounded-xl bg-[#0A100D] border border-[#16281F] space-y-1"
                      >
                        <span className="font-bold text-xs text-[#F5F7F6] truncate block">{v.name}</span>
                        <p className="text-[10px] text-[#8B9992] font-sans line-clamp-2">{v.description}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Modal: Add Objective */}
        {showAddObjModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#0A100D] border border-[#16281F] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <h3 className="font-bold text-sm text-[#F5F7F6] tracking-wider">NEW SEQUENCED OBJECTIVE</h3>
              <form onSubmit={handleAddObjectiveSubmit} className="space-y-3">
                <div>
                  <label className="text-[10px] text-[#8B9992] block mb-1">OBJECTIVE TITLE</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Backend API Architecture"
                    value={objTitle}
                    onChange={(e) => setObjTitle(e.target.value)}
                    className="w-full bg-[#050706] border border-[#16281F] rounded-lg px-3 py-2 text-xs text-[#F5F7F6] focus:border-[#19F59A] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#8B9992] block mb-1">DESCRIPTION</label>
                  <textarea
                    rows={3}
                    placeholder="Operational specifications..."
                    value={objDesc}
                    onChange={(e) => setObjDesc(e.target.value)}
                    className="w-full bg-[#050706] border border-[#16281F] rounded-lg px-3 py-2 text-xs text-[#F5F7F6] focus:border-[#19F59A] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#8B9992] block mb-1">PRIORITY</label>
                  <select
                    value={objPriority}
                    onChange={(e) => setObjPriority(e.target.value as any)}
                    className="w-full bg-[#050706] border border-[#16281F] rounded-lg px-3 py-2 text-xs text-[#F5F7F6] focus:border-[#19F59A] outline-none"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[#16281F]">
                  <button
                    type="button"
                    onClick={() => setShowAddObjModal(false)}
                    className="px-3 py-1.5 rounded text-xs text-[#8B9992] hover:text-[#F5F7F6]"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded bg-[#38E1FF] text-[#050706] font-bold text-xs hover:bg-[#38E1FF]/90 shadow-[0_0_10px_rgba(56,225,255,0.3)]"
                  >
                    CREATE OBJECTIVE
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Smart Task Creation inside Objective */}
        {showAddTaskModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#0A100D] border border-[#16281F] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <h3 className="font-bold text-sm text-[#F5F7F6] tracking-wider">ATTACH DIRECTIVE TO OBJECTIVE</h3>
              <form onSubmit={handleAddTaskToObjectiveSubmit} className="space-y-3">
                <div>
                  <label className="text-[10px] text-[#8B9992] block mb-1">DIRECTIVE / TASK TITLE</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Implement FastAPI authentication router"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full bg-[#050706] border border-[#16281F] rounded-lg px-3 py-2 text-xs text-[#F5F7F6] focus:border-[#19F59A] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#8B9992] block mb-1">DESCRIPTION</label>
                  <textarea
                    rows={2}
                    placeholder="Execution details..."
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    className="w-full bg-[#050706] border border-[#16281F] rounded-lg px-3 py-2 text-xs text-[#F5F7F6] focus:border-[#19F59A] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#8B9992] block mb-1">PRIORITY</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full bg-[#050706] border border-[#16281F] rounded-lg px-3 py-2 text-xs text-[#F5F7F6] focus:border-[#19F59A] outline-none"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[#16281F]">
                  <button
                    type="button"
                    onClick={() => setShowAddTaskModal(null)}
                    className="px-3 py-1.5 rounded text-xs text-[#8B9992] hover:text-[#F5F7F6]"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded bg-[#19F59A] text-[#050706] font-bold text-xs hover:bg-[#00D084]"
                  >
                    ENGAGE TASK
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER: MISSION CENTER (Section 4 & 5)
  // --------------------------------------------------------------------------
  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 font-mono text-xs animate-fade-in">
      {/* SECTION 4: HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#16281F] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#F5F7F6] tracking-wider flex items-center gap-2">
            <Target className="w-5 h-5 text-[#19F59A]" />
            MISSION CONTROL
          </h1>
          <p className="text-xs text-[#8B9992] mt-0.5">
            "Command your objectives." • TACTICAL OPERATIONAL CORE
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPlanModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#19F59A] text-[#050706] font-bold text-xs hover:bg-[#00D084] transition-all shadow-[0_0_15px_rgba(25,245,154,0.3)]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>PLAN WITH ZORO</span>
          </button>

          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#F5F7F6] hover:border-[#19F59A]/40 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>NEW MISSION</span>
          </button>
        </div>
      </div>

      {/* TOP STATISTICS (Section 4) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#0A100D] border border-[#16281F] space-y-1">
          <span className="text-[10px] text-[#8B9992] uppercase font-bold tracking-wider">
            ACTIVE MISSIONS
          </span>
          <div className="text-2xl font-black text-[#19F59A]">{activeMissionsCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0A100D] border border-[#16281F] space-y-1">
          <span className="text-[10px] text-[#8B9992] uppercase font-bold tracking-wider">
            TODAY'S OBJECTIVES
          </span>
          <div className="text-2xl font-black text-[#38E1FF]">{todayObjectivesCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0A100D] border border-[#16281F] space-y-1">
          <span className="text-[10px] text-[#8B9992] uppercase font-bold tracking-wider">
            OVERDUE / BLOCKED
          </span>
          <div className="text-2xl font-black text-[#FF3B30]">
            {missions.filter((m) => m.status === 'PAUSED').length}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0A100D] border border-[#16281F] space-y-1">
          <span className="text-[10px] text-[#8B9992] uppercase font-bold tracking-wider">
            COMPLETED
          </span>
          <div className="text-2xl font-black text-[#F5F7F6]">{completedMissionsCount}</div>
        </div>
      </div>

      {/* GLOBAL NEXT MOVE BANNER (Section 12) */}
      {nextMove && (
        <div className="p-4 rounded-xl bg-[#0A100D] border border-[#38E1FF]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#38E1FF]/15 border border-[#38E1FF] flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-[#38E1FF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-[#38E1FF] tracking-wider uppercase">
                  RECOMMENDED NEXT MOVE • {nextMove.missionTitle}
                </span>
              </div>
              <div className="font-bold text-[#F5F7F6] text-xs">{nextMove.action}</div>
            </div>
          </div>

          <button
            onClick={() => setSelectedMissionId(nextMove.missionId)}
            className="px-3.5 py-1.5 rounded-lg bg-[#38E1FF] text-[#050706] font-bold text-xs hover:bg-[#38E1FF]/90 transition-colors shrink-0"
          >
            OPEN MISSION
          </button>
        </div>
      )}

      {/* SEARCH & FILTERS (Section 25) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          {/* Search Box */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-[#8B9992] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search missions by title, goal, or scope..."
              className="w-full bg-[#0A100D] border border-[#16281F] rounded-xl pl-9 pr-4 py-2 text-xs text-[#F5F7F6] focus:border-[#19F59A] outline-none"
            />
          </div>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#0A100D] border border-[#16281F] rounded-xl px-3 py-2 text-xs text-[#8B9992] focus:border-[#19F59A] outline-none"
          >
            <option value="NEWEST">SORT: NEWEST</option>
            <option value="OLDEST">SORT: OLDEST</option>
            <option value="PROGRESS">SORT: PROGRESS</option>
            <option value="PRIORITY">SORT: PRIORITY</option>
          </select>
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {(['ALL', 'ACTIVE', 'PAUSED', 'COMPLETED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded text-[11px] font-bold transition-colors shrink-0 ${
                statusFilter === st
                  ? 'bg-[#19F59A] text-[#050706]'
                  : 'bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#F5F7F6]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 5: MISSION CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMissions.length === 0 ? (
          <div className="col-span-full p-12 text-center text-[#8B9992] bg-[#0A100D] border border-[#16281F] rounded-2xl space-y-3">
            <Target className="w-8 h-8 text-[#19F59A] mx-auto opacity-40" />
            <div className="font-bold text-sm text-[#F5F7F6]">No missions in operational queue.</div>
            <p className="text-xs font-sans max-w-sm mx-auto">
              Initiate a roadmap by clicking "PLAN WITH ZORO" or create a custom tactical mission.
            </p>
          </div>
        ) : (
          filteredMissions.map((m) => {
            const mObjectives = MissionService.getObjectives(userId, m.id);
            const mTasks = tasks.filter((t) => t.mission_id === m.id);

            return (
              <div
                key={m.id}
                onClick={() => setSelectedMissionId(m.id)}
                className="p-5 rounded-2xl bg-[#0A100D] border border-[#16281F] hover:border-[#19F59A]/40 transition-all cursor-pointer flex flex-col justify-between space-y-4 group shadow-md"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        m.priority === 'CRITICAL'
                          ? 'bg-[#FF3B30]/15 text-[#FF3B30]'
                          : m.priority === 'HIGH'
                          ? 'bg-[#FFB000]/15 text-[#FFB000]'
                          : 'bg-[#16281F] text-[#8B9992]'
                      }`}
                    >
                      {m.priority}
                    </span>

                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        m.status === 'COMPLETED'
                          ? 'bg-[#19F59A]/15 text-[#19F59A]'
                          : m.status === 'ACTIVE'
                          ? 'bg-[#38E1FF]/15 text-[#38E1FF]'
                          : 'bg-[#FFB000]/15 text-[#FFB000]'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>

                  <h3 className="font-black text-sm text-[#F5F7F6] tracking-wider group-hover:text-[#19F59A] transition-colors truncate">
                    {m.title}
                  </h3>
                  <p className="text-xs text-[#8B9992] font-sans line-clamp-2 leading-relaxed">
                    {m.goal}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#8B9992]">PROGRESS</span>
                    <span className="font-bold text-[#19F59A]">{m.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#050706] border border-[#16281F] overflow-hidden">
                    <div
                      className="h-full bg-[#19F59A] rounded-full transition-all duration-300"
                      style={{ width: `${m.progress}%` }}
                    />
                  </div>
                </div>

                {/* Footer metrics & actions */}
                <div className="pt-2 border-t border-[#16281F] flex items-center justify-between text-[10px] text-[#8B9992]">
                  <div className="flex items-center gap-2.5">
                    <span>{mObjectives.length} Objectives</span>
                    <span>•</span>
                    <span>{mTasks.length} Tasks</span>
                  </div>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#FFB000]" />
                    {m.deadline}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Plan with JARVIS Modal (Section 9) */}
      <PlanWithJarvisModal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        onPlanApproved={handlePlanApproved}
      />

      {/* Manual Mission Creation Modal */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0A100D] border border-[#16281F] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-sm text-[#F5F7F6] tracking-wider">NEW MANUAL MISSION</h3>
            <form onSubmit={handleCreateManualMission} className="space-y-3">
              <div>
                <label className="text-[10px] text-[#8B9992] block mb-1">MISSION TITLE</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI PROJECT"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full bg-[#050706] border border-[#16281F] rounded-lg px-3 py-2 text-xs text-[#F5F7F6] focus:border-[#19F59A] outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#8B9992] block mb-1">PRIMARY GOAL</label>
                <textarea
                  rows={2}
                  required
                  placeholder="What is the mission success criteria?"
                  value={manualGoal}
                  onChange={(e) => setManualGoal(e.target.value)}
                  className="w-full bg-[#050706] border border-[#16281F] rounded-lg px-3 py-2 text-xs text-[#F5F7F6] focus:border-[#19F59A] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#8B9992] block mb-1">CATEGORY</label>
                  <select
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value as any)}
                    className="w-full bg-[#050706] border border-[#16281F] rounded-lg px-3 py-2 text-xs text-[#F5F7F6] focus:border-[#19F59A] outline-none"
                  >
                    <option value="PROJECT">PROJECT</option>
                    <option value="CODING">CODING</option>
                    <option value="ACADEMIC">ACADEMIC</option>
                    <option value="WORK">WORK</option>
                    <option value="HEALTH">HEALTH</option>
                    <option value="PERSONAL">PERSONAL</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-[#8B9992] block mb-1">PRIORITY</label>
                  <select
                    value={manualPriority}
                    onChange={(e) => setManualPriority(e.target.value as any)}
                    className="w-full bg-[#050706] border border-[#16281F] rounded-lg px-3 py-2 text-xs text-[#F5F7F6] focus:border-[#19F59A] outline-none"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#8B9992] block mb-1">TARGET DEADLINE</label>
                <input
                  type="text"
                  placeholder="e.g. October 20"
                  value={manualDeadline}
                  onChange={(e) => setManualDeadline(e.target.value)}
                  className="w-full bg-[#050706] border border-[#16281F] rounded-lg px-3 py-2 text-xs text-[#F5F7F6] focus:border-[#19F59A] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#16281F]">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-3 py-1.5 rounded text-xs text-[#8B9992] hover:text-[#F5F7F6]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#19F59A] text-[#050706] font-bold text-xs hover:bg-[#00D084]"
                >
                  DEPLOY MISSION
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Automation,
  AutomationActionType,
  AutomationCondition,
  AutomationFrequency,
  AutomationRun,
  AutomationStatus,
  AutomationTemplate,
  AutomationTriggerType,
  ConditionOperator,
  RiskLevel,
  RoutePath,
} from '../types';
import { AutomationService } from '../services/automation';
import { AUTOMATION_TEMPLATES } from '../services/automation/templates';
import { actionRegistry } from '../services/automation/actionRegistry';
import { realtimeService } from '../services/realtime';
import { useToast } from '../components/Toast';
import {
  Zap,
  Play,
  Pause,
  Plus,
  Trash2,
  Clock,
  Shield,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Filter,
  RefreshCw,
  Eye,
  Sliders,
  Sparkles,
  BarChart3,
  Layers,
  History,
  Check,
  X,
  FileText,
  Activity,
  ArrowLeft,
  ChevronRight,
  AlertCircle,
  Calendar,
  Lock,
  Compass,
} from 'lucide-react';

interface AutomationProps {
  onNavigate: (path: RoutePath) => void;
}

type TabType = 'ACTIVE' | 'ALL' | 'TEMPLATES' | 'HISTORY' | 'ANALYTICS';

export const AutomationScreen: React.FC<AutomationProps> = ({ onNavigate }) => {
  const { currentSession, createNotification, trackEvent } = useAuth();
  const userId = currentSession?.userId || 'guest';
  const { showToast } = useToast();

  const [automations, setAutomations] = useState<Automation[]>([]);
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('ACTIVE');
  const [selectedRun, setSelectedRun] = useState<AutomationRun | null>(null);
  const [runHistoryFilterId, setRunHistoryFilterId] = useState<string | null>(null);

  // Builder Modal State
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);
  const [builderStep, setBuilderStep] = useState<1 | 2 | 3 | 4>(1);

  // Builder Form Fields
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formTriggerType, setFormTriggerType] = useState<AutomationTriggerType>('SCHEDULE');
  const [formFrequency, setFormFrequency] = useState<AutomationFrequency>('DAILY');
  const [formTime, setFormTime] = useState('08:00');
  const [formDaysOfWeek, setFormDaysOfWeek] = useState<number[]>([1]); // Monday default
  const [formDayOfMonth, setFormDayOfMonth] = useState<number>(1);
  const [formTimezone, setFormTimezone] = useState(() =>
    typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC'
  );
  const [formHoursBefore, setFormHoursBefore] = useState<number>(24);

  // Conditions list in builder
  const [formConditions, setFormConditions] = useState<AutomationCondition[]>([]);

  // Action in builder
  const [formActionType, setFormActionType] = useState<AutomationActionType>('CREATE_NOTIFICATION');
  const [formActionParams, setFormActionParams] = useState<Record<string, any>>({
    title: 'Tactical Directive Completed',
    message: 'Operation performed according to protocol.',
    type: 'SYSTEM',
  });
  const [formRequiresConfirmation, setFormRequiresConfirmation] = useState(false);

  // Confirmation modal for manual runs
  const [pendingRunAutomation, setPendingRunAutomation] = useState<Automation | null>(null);
  const [isRunningSingle, setIsRunningSingle] = useState(false);
  const [isCheckingSchedules, setIsCheckingSchedules] = useState(false);

  // 1. Initial Load and Realtime Subscriptions
  useEffect(() => {
    loadAutomations();
    loadRuns();

    // Subscribe to automation events
    const unsubCreated = realtimeService.subscribe('AUTOMATION_CREATED', () => {
      loadAutomations();
      loadRuns();
    });
    const unsubUpdated = realtimeService.subscribe('AUTOMATION_UPDATED', () => {
      loadAutomations();
      loadRuns();
    });
    const unsubPaused = realtimeService.subscribe('AUTOMATION_PAUSED', () => {
      loadAutomations();
    });
    const unsubResumed = realtimeService.subscribe('AUTOMATION_RESUMED', () => {
      loadAutomations();
    });
    const unsubDeleted = realtimeService.subscribe('AUTOMATION_DELETED', () => {
      loadAutomations();
      loadRuns();
    });
    const unsubStarted = realtimeService.subscribe('AUTOMATION_STARTED', () => {
      loadRuns();
    });
    const unsubCompleted = realtimeService.subscribe('AUTOMATION_COMPLETED', () => {
      loadAutomations();
      loadRuns();
    });
    const unsubFailed = realtimeService.subscribe('AUTOMATION_FAILED', () => {
      loadAutomations();
      loadRuns();
    });
    const unsubSkipped = realtimeService.subscribe('AUTOMATION_SKIPPED', () => {
      loadRuns();
    });

    return () => {
      unsubCreated();
      unsubUpdated();
      unsubPaused();
      unsubResumed();
      unsubDeleted();
      unsubStarted();
      unsubCompleted();
      unsubFailed();
      unsubSkipped();
    };
  }, [userId]);

  const loadAutomations = () => {
    const list = AutomationService.getAutomations(userId);
    // If no automations exist yet, auto-provision the 2 starter templates
    if (list.length === 0) {
      const initial1 = AutomationService.createAutomation(userId, {
        name: AUTOMATION_TEMPLATES[0].title,
        description: AUTOMATION_TEMPLATES[0].description,
        trigger_type: AUTOMATION_TEMPLATES[0].trigger_type,
        trigger_config: AUTOMATION_TEMPLATES[0].trigger_config,
        condition_config: AUTOMATION_TEMPLATES[0].conditions,
        action_config: AUTOMATION_TEMPLATES[0].action,
        requires_confirmation: AUTOMATION_TEMPLATES[0].requires_confirmation,
        status: 'ACTIVE',
      });
      const initial2 = AutomationService.createAutomation(userId, {
        name: AUTOMATION_TEMPLATES[3].title,
        description: AUTOMATION_TEMPLATES[3].description,
        trigger_type: AUTOMATION_TEMPLATES[3].trigger_type,
        trigger_config: AUTOMATION_TEMPLATES[3].trigger_config,
        condition_config: AUTOMATION_TEMPLATES[3].conditions,
        action_config: AUTOMATION_TEMPLATES[3].action,
        requires_confirmation: AUTOMATION_TEMPLATES[3].requires_confirmation,
        status: 'ACTIVE',
      });
      setAutomations([initial1, initial2]);
    } else {
      setAutomations(list);
    }
  };

  const loadRuns = () => {
    const runList = AutomationService.getRuns(userId);
    setRuns(runList);
  };

  // 2. Open Builder for New or Edit
  const openNewBuilder = (template?: AutomationTemplate) => {
    if (template) {
      setFormName(template.title);
      setFormDesc(template.description);
      setFormTriggerType(template.trigger_type);
      setFormFrequency(template.trigger_config.frequency || 'DAILY');
      setFormTime(template.trigger_config.time || '08:00');
      setFormDaysOfWeek(template.trigger_config.daysOfWeek || [1]);
      setFormDayOfMonth(template.trigger_config.dayOfMonth || 1);
      setFormTimezone(template.trigger_config.timezone || formTimezone);
      setFormHoursBefore(template.trigger_config.hoursBefore || 24);
      setFormConditions(template.conditions || []);
      setFormActionType(template.action.type);
      setFormActionParams(template.action.parameters || {});
      setFormRequiresConfirmation(template.requires_confirmation);
    } else {
      setFormName('');
      setFormDesc('');
      setFormTriggerType('SCHEDULE');
      setFormFrequency('DAILY');
      setFormTime('08:00');
      setFormDaysOfWeek([1]);
      setFormDayOfMonth(1);
      setFormHoursBefore(24);
      setFormConditions([]);
      setFormActionType('CREATE_NOTIFICATION');
      setFormActionParams({
        title: 'Tactical Status Update',
        message: 'System automation executed at schedule time.',
        type: 'SYSTEM',
      });
      setFormRequiresConfirmation(false);
    }
    setEditingAutomation(null);
    setBuilderStep(1);
    setShowBuilderModal(true);
  };

  const openEditBuilder = (automation: Automation) => {
    setEditingAutomation(automation);
    setFormName(automation.name);
    setFormDesc(automation.description);
    setFormTriggerType(automation.trigger_type);
    setFormFrequency(automation.trigger_config.frequency || 'DAILY');
    setFormTime(automation.trigger_config.time || '08:00');
    setFormDaysOfWeek(automation.trigger_config.daysOfWeek || [1]);
    setFormDayOfMonth(automation.trigger_config.dayOfMonth || 1);
    setFormTimezone(automation.trigger_config.timezone || formTimezone);
    setFormHoursBefore(automation.trigger_config.hoursBefore || 24);
    setFormConditions(automation.condition_config || []);
    setFormActionType(automation.action_config.type);
    setFormActionParams(automation.action_config.parameters || {});
    setFormRequiresConfirmation(automation.requires_confirmation);
    setBuilderStep(1);
    setShowBuilderModal(true);
  };

  // 3. Save Automation in Builder
  const handleSaveAutomation = () => {
    if (!formName.trim()) {
      showToast('VALIDATION ERROR', 'Automation directive name is required.', 'ERROR');
      return;
    }

    const trigger_config: any = {};
    if (formTriggerType === 'SCHEDULE') {
      trigger_config.frequency = formFrequency;
      trigger_config.time = formTime;
      trigger_config.timezone = formTimezone;
      if (formFrequency === 'WEEKLY') trigger_config.daysOfWeek = formDaysOfWeek;
      if (formFrequency === 'MONTHLY') trigger_config.dayOfMonth = formDayOfMonth;
    } else if (formTriggerType === 'MISSION_DEADLINE_APPROACHING') {
      trigger_config.hoursBefore = Number(formHoursBefore) || 24;
    }

    const action_config = {
      type: formActionType,
      parameters: formActionParams,
    };

    if (editingAutomation) {
      AutomationService.updateAutomation(userId, editingAutomation.id, {
        name: formName.trim(),
        description: formDesc.trim() || 'Configured automation workflow',
        trigger_type: formTriggerType,
        trigger_config,
        condition_config: formConditions,
        action_config,
        requires_confirmation: formRequiresConfirmation,
      });
      showToast('AUTOMATION UPDATED', `Directive "${formName}" calibrated.`, 'SUCCESS');
    } else {
      AutomationService.createAutomation(userId, {
        name: formName.trim(),
        description: formDesc.trim() || 'Configured automation workflow',
        trigger_type: formTriggerType,
        trigger_config,
        condition_config: formConditions,
        action_config,
        requires_confirmation: formRequiresConfirmation,
        status: 'ACTIVE',
      });
      showToast('AUTOMATION ENGAGED', `Directive "${formName}" deployed into active matrix.`, 'SUCCESS');
    }

    setShowBuilderModal(false);
    loadAutomations();
  };

  // 4. Manual Execution Trigger
  const handleExecuteNow = async (automation: Automation) => {
    if (automation.requires_confirmation) {
      setPendingRunAutomation(automation);
      return;
    }

    await executeConfirmedRun(automation);
  };

  const executeConfirmedRun = async (automation: Automation) => {
    setIsRunningSingle(true);
    try {
      showToast('AUTOMATION INITIALIZED', `Executing "${automation.name}"...`, 'TASK');
      const run = await AutomationService.runNow(userId, automation.id, 'Operator manual directive clearance');
      loadAutomations();
      loadRuns();

      if (run.status === 'SUCCESS') {
        showToast('EXECUTION VERIFIED', run.result_summary, 'SUCCESS');
        createNotification('AUTOMATION COMPLETE', `${automation.name}: ${run.result_summary}`, 'SUCCESS');
      } else if (run.status === 'SKIPPED') {
        showToast('EXECUTION SKIPPED', run.result_summary, 'INFO');
      } else {
        showToast('EXECUTION FAILED', run.error_message || 'Execution error encountered.', 'ERROR');
      }
    } catch (err: any) {
      showToast('EXECUTION ERROR', err?.message || 'Error occurred.', 'ERROR');
    } finally {
      setIsRunningSingle(false);
      setPendingRunAutomation(null);
    }
  };

  // 5. Toggle Pause/Resume
  const handleToggleStatus = (automation: Automation) => {
    if (automation.status === 'ACTIVE') {
      AutomationService.pauseAutomation(userId, automation.id);
      showToast('AUTOMATION PAUSED', `Directive "${automation.name}" suspended.`, 'INFO');
    } else {
      AutomationService.resumeAutomation(userId, automation.id);
      showToast('AUTOMATION RESUMED', `Directive "${automation.name}" resumed into active state.`, 'SUCCESS');
    }
    loadAutomations();
  };

  // 6. Delete Automation
  const handleDeleteAutomation = (id: string, name: string) => {
    AutomationService.deleteAutomation(userId, id);
    showToast('AUTOMATION DELETED', `Directive "${name}" removed.`, 'TASK');
    loadAutomations();
    loadRuns();
  };

  // 7. Trigger Manual Schedule Check
  const handleRunScheduleCheck = async () => {
    setIsCheckingSchedules(true);
    try {
      const executed = await AutomationService.checkScheduledAndDeadlines(userId);
      showToast(
        'SCHEDULE CHECK COMPLETE',
        executed > 0
          ? `${executed} scheduled or deadline directive(s) evaluated and fired.`
          : 'All scheduled directives are synchronized. Zero pending due.',
        'SUCCESS'
      );
      loadAutomations();
      loadRuns();
    } catch (err: any) {
      showToast('SCHEDULE CHECK ERROR', err?.message || 'Error running check.', 'ERROR');
    } finally {
      setIsCheckingSchedules(false);
    }
  };

  // 8. Deploy Template directly
  const handleDeployTemplate = (tpl: AutomationTemplate) => {
    AutomationService.createAutomation(userId, {
      name: tpl.title,
      description: tpl.description,
      trigger_type: tpl.trigger_type,
      trigger_config: tpl.trigger_config,
      condition_config: tpl.conditions,
      action_config: tpl.action,
      requires_confirmation: tpl.requires_confirmation,
      status: 'ACTIVE',
    });
    showToast('TEMPLATE DEPLOYED', `Deployed "${tpl.title}" into active matrix.`, 'SUCCESS');
    loadAutomations();
    setActiveTab('ACTIVE');
  };

  // Add / Remove Condition Helpers
  const handleAddCondition = () => {
    const newCond: AutomationCondition = {
      id: 'cond_' + Date.now(),
      field: 'mission.status',
      operator: 'EQUALS',
      value: 'ACTIVE',
    };
    setFormConditions([...formConditions, newCond]);
  };

  const handleUpdateCondition = (index: number, updates: Partial<AutomationCondition>) => {
    const copy = [...formConditions];
    copy[index] = { ...copy[index], ...updates };
    setFormConditions(copy);
  };

  const handleRemoveCondition = (index: number) => {
    setFormConditions(formConditions.filter((_, i) => i !== index));
  };

  // Analytics Computation
  const analytics = AutomationService.getAnalytics(userId);

  // Filtered Automations List
  const filteredAutomations = automations.filter((a) => {
    if (activeTab === 'ACTIVE') return a.status === 'ACTIVE';
    if (activeTab === 'ALL') return true;
    return true;
  });

  // Filtered Runs List
  const filteredRuns = runHistoryFilterId
    ? runs.filter((r) => r.automation_id === runHistoryFilterId)
    : runs;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 font-mono text-xs">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#16281F] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#00D084]/10 border border-[#00D084]/30 text-[#19F59A]">
              <Zap className="w-5 h-5 text-[#19F59A]" />
            </span>
            <div>
              <h1 className="text-xl font-black text-[#F5F7F6] tracking-wider flex items-center gap-2">
                AUTOMATION CORE
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#00D084]/20 border border-[#00D084]/40 text-[#19F59A] font-bold">
                  PHASE 9
                </span>
              </h1>
              <p className="text-[10px] text-[#8B9992] mt-0.5">
                TRIGGER → CONDITION → DECISION → GUARDRAIL → ACTION → VERIFICATION
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('/dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#19F59A] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>COMMAND DECK</span>
          </button>
          <button
            onClick={handleRunScheduleCheck}
            disabled={isCheckingSchedules}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#0A100D] border border-[#16281F] text-[#38E1FF] hover:border-[#38E1FF]/50 transition-colors disabled:opacity-50"
            title="Scan scheduled runs and upcoming mission deadlines immediately"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingSchedules ? 'animate-spin' : ''}`} />
            <span>EVALUATE SCHEDULES</span>
          </button>
          <button
            onClick={() => openNewBuilder()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#00D084] text-[#050706] font-bold hover:bg-[#19F59A] transition-all shadow-[0_0_15px_rgba(0,208,132,0.25)]"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>NEW DIRECTIVE</span>
          </button>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#0A100D] border border-[#16281F] space-y-1">
          <div className="flex items-center justify-between text-[#8B9992] text-[10px]">
            <span>ACTIVE DIRECTIVES</span>
            <Activity className="w-3.5 h-3.5 text-[#19F59A]" />
          </div>
          <div className="text-xl font-bold text-[#F5F7F6]">
            {analytics.activeAutomations}
            <span className="text-xs text-[#8B9992] font-normal"> / {analytics.totalAutomations} Total</span>
          </div>
          <div className="text-[9px] text-[#19F59A] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#19F59A] animate-pulse" />
            Autonomous Monitoring Online
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0A100D] border border-[#16281F] space-y-1">
          <div className="flex items-center justify-between text-[#8B9992] text-[10px]">
            <span>TOTAL EXECUTIONS</span>
            <History className="w-3.5 h-3.5 text-[#38E1FF]" />
          </div>
          <div className="text-xl font-bold text-[#F5F7F6]">
            {analytics.totalRuns}
            <span className="text-xs text-[#8B9992] font-normal"> runs</span>
          </div>
          <div className="text-[9px] text-[#8B9992]">
            {analytics.recentRunsCount24h} in the last 24h
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0A100D] border border-[#16281F] space-y-1">
          <div className="flex items-center justify-between text-[#8B9992] text-[10px]">
            <span>CLEARANCE RATE</span>
            <CheckCircle className="w-3.5 h-3.5 text-[#19F59A]" />
          </div>
          <div className="text-xl font-bold text-[#19F59A]">
            {analytics.successRate}%
          </div>
          <div className="text-[9px] text-[#8B9992]">
            {analytics.successRuns} passed • {analytics.failedRuns} failed • {analytics.skippedRuns} filtered
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0A100D] border border-[#16281F] space-y-1">
          <div className="flex items-center justify-between text-[#8B9992] text-[10px]">
            <span>GUARDRAIL CLEARANCE</span>
            <Shield className="w-3.5 h-3.5 text-[#E6C665]" />
          </div>
          <div className="text-xl font-bold text-[#F5F7F6]">
            SECURE
          </div>
          <div className="text-[9px] text-[#8B9992] flex items-center gap-1">
            <span>Circuit Breaker</span>
            <span className="text-[#19F59A]">ARMED</span>
            <span>• Max 30/hr</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-[#16281F] gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('ACTIVE');
              setRunHistoryFilterId(null);
            }}
            className={`px-3 py-2 rounded-t-lg font-bold transition-all border-b-2 ${
              activeTab === 'ACTIVE'
                ? 'border-[#00D084] text-[#19F59A] bg-[#121C17]'
                : 'border-transparent text-[#8B9992] hover:text-[#F5F7F6]'
            }`}
          >
            ACTIVE DIRECTIVES ({automations.filter((a) => a.status === 'ACTIVE').length})
          </button>
          <button
            onClick={() => {
              setActiveTab('ALL');
              setRunHistoryFilterId(null);
            }}
            className={`px-3 py-2 rounded-t-lg font-bold transition-all border-b-2 ${
              activeTab === 'ALL'
                ? 'border-[#00D084] text-[#19F59A] bg-[#121C17]'
                : 'border-transparent text-[#8B9992] hover:text-[#F5F7F6]'
            }`}
          >
            ALL DIRECTIVES ({automations.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('TEMPLATES');
              setRunHistoryFilterId(null);
            }}
            className={`px-3 py-2 rounded-t-lg font-bold transition-all border-b-2 ${
              activeTab === 'TEMPLATES'
                ? 'border-[#00D084] text-[#19F59A] bg-[#121C17]'
                : 'border-transparent text-[#8B9992] hover:text-[#F5F7F6]'
            }`}
          >
            TACTICAL TEMPLATES ({AUTOMATION_TEMPLATES.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('HISTORY');
              loadRuns();
            }}
            className={`px-3 py-2 rounded-t-lg font-bold transition-all border-b-2 ${
              activeTab === 'HISTORY'
                ? 'border-[#00D084] text-[#19F59A] bg-[#121C17]'
                : 'border-transparent text-[#8B9992] hover:text-[#F5F7F6]'
            }`}
          >
            EXECUTION AUDIT LOG ({runs.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('ANALYTICS');
              setRunHistoryFilterId(null);
            }}
            className={`px-3 py-2 rounded-t-lg font-bold transition-all border-b-2 ${
              activeTab === 'ANALYTICS'
                ? 'border-[#00D084] text-[#19F59A] bg-[#121C17]'
                : 'border-transparent text-[#8B9992] hover:text-[#F5F7F6]'
            }`}
          >
            METRICS & SAFETY
          </button>
        </div>

        {runHistoryFilterId && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#38E1FF]/10 border border-[#38E1FF]/30 text-[#38E1FF] text-[10px]">
            <span>FILTERED BY AUTOMATION</span>
            <button
              onClick={() => setRunHistoryFilterId(null)}
              className="hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* TAB 1 & 2: AUTOMATIONS LIST */}
      {/* --------------------------------------------------------------------- */}
      {(activeTab === 'ACTIVE' || activeTab === 'ALL') && (
        <div className="space-y-4">
          {filteredAutomations.length === 0 ? (
            <div className="p-10 rounded-2xl bg-[#0A100D] border border-[#16281F] text-center space-y-3">
              <Zap className="w-8 h-8 text-[#8B9992] mx-auto opacity-50" />
              <div className="text-sm font-bold text-[#F5F7F6]">
                {activeTab === 'ACTIVE' ? 'NO ACTIVE AUTOMATION DIRECTIVES' : 'NO AUTOMATIONS CONFIGURED'}
              </div>
              <p className="text-xs text-[#8B9992] max-w-md mx-auto">
                Deploy tactical autonomous workflows to monitor mission deadlines, synthesize morning briefings, and update mission timelines.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => openNewBuilder()}
                  className="px-4 py-2 rounded-lg bg-[#00D084] text-[#050706] font-bold hover:bg-[#19F59A] transition-all"
                >
                  Create Custom Directive
                </button>
                <button
                  onClick={() => setActiveTab('TEMPLATES')}
                  className="px-4 py-2 rounded-lg bg-[#121C17] border border-[#16281F] text-[#19F59A] hover:border-[#19F59A]/40 transition-colors"
                >
                  Browse Templates
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredAutomations.map((auto) => {
                const actionDef = actionRegistry.getAction(auto.action_config.type);
                const isPaused = auto.status === 'PAUSED';
                const isError = auto.status === 'ERROR';

                return (
                  <div
                    key={auto.id}
                    className={`p-4 rounded-xl bg-[#0A100D] border transition-all space-y-3 ${
                      isPaused
                        ? 'border-[#16281F] opacity-75'
                        : isError
                        ? 'border-[#FF3B30]/40 bg-[#FF3B30]/5'
                        : 'border-[#16281F] hover:border-[#00D084]/40 hover:shadow-[0_0_15px_rgba(0,208,132,0.08)]'
                    }`}
                  >
                    {/* Top Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            auto.status === 'ACTIVE'
                              ? 'bg-[#19F59A] shadow-[0_0_8px_rgba(25,245,154,0.8)]'
                              : isPaused
                              ? 'bg-[#FFB000]'
                              : 'bg-[#FF3B30]'
                          }`}
                        />
                        <h3 className="text-sm font-bold text-[#F5F7F6] tracking-wide">
                          {auto.name}
                        </h3>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                            auto.status === 'ACTIVE'
                              ? 'bg-[#00D084]/15 border-[#00D084]/40 text-[#19F59A]'
                              : isPaused
                              ? 'bg-[#FFB000]/15 border-[#FFB000]/40 text-[#FFB000]'
                              : 'bg-[#FF3B30]/15 border-[#FF3B30]/40 text-[#FF3B30]'
                          }`}
                        >
                          {auto.status}
                        </span>

                        {auto.requires_confirmation && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#FFB000]/20 text-[#FFB000] border border-[#FFB000]/30 font-bold flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            CONFIRMATION REQUIRED
                          </span>
                        )}

                        {actionDef && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                              actionDef.riskLevel === 'HIGH'
                                ? 'bg-[#FF3B30]/20 text-[#FF3B30]'
                                : actionDef.riskLevel === 'MEDIUM'
                                ? 'bg-[#FFB000]/20 text-[#FFB000]'
                                : 'bg-[#38E1FF]/20 text-[#38E1FF]'
                            }`}
                          >
                            {actionDef.riskLevel} RISK
                          </span>
                        )}
                      </div>

                      {/* Action Control Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleExecuteNow(auto)}
                          disabled={isRunningSingle}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#00D084]/15 text-[#19F59A] border border-[#00D084]/40 hover:bg-[#00D084]/25 transition-colors text-[10px] font-bold"
                          title="Execute automation immediately"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>RUN NOW</span>
                        </button>
                        <button
                          onClick={() => handleToggleStatus(auto)}
                          className={`p-1.5 rounded border text-[10px] transition-colors ${
                            isPaused
                              ? 'bg-[#19F59A]/10 border-[#19F59A]/30 text-[#19F59A] hover:bg-[#19F59A]/20'
                              : 'bg-[#0A100D] border-[#16281F] text-[#8B9992] hover:text-[#F5F7F6]'
                          }`}
                          title={isPaused ? 'Resume Automation' : 'Pause Automation'}
                        >
                          {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={() => openEditBuilder(auto)}
                          className="p-1.5 rounded bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#38E1FF] transition-colors"
                          title="Edit Directive"
                        >
                          <Sliders className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            setRunHistoryFilterId(auto.id);
                            setActiveTab('HISTORY');
                          }}
                          className="p-1.5 rounded bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#19F59A] transition-colors"
                          title="View Run History"
                        >
                          <History className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteAutomation(auto.id, auto.name)}
                          className="p-1.5 rounded bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#FF3B30] transition-colors"
                          title="Delete Automation"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-[#8B9992]">
                      {auto.description}
                    </p>

                    {/* Visual Pipeline Flow */}
                    <div className="p-3 rounded-lg bg-[#050706] border border-[#16281F] flex flex-wrap items-center gap-2 text-[10px]">
                      {/* 1. WHEN (Trigger) */}
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#121C17] border border-[#16281F]">
                        <span className="text-[#8B9992] font-bold">WHEN:</span>
                        <span className="text-[#19F59A] font-bold">{auto.trigger_type}</span>
                        {auto.trigger_type === 'SCHEDULE' && (
                          <span className="text-[#8B9992]">
                            ({auto.trigger_config.frequency || 'DAILY'} @ {auto.trigger_config.time || '08:00'})
                          </span>
                        )}
                        {auto.trigger_type === 'MISSION_DEADLINE_APPROACHING' && (
                          <span className="text-[#8B9992]">
                            (Within {auto.trigger_config.hoursBefore || 24}h)
                          </span>
                        )}
                      </div>

                      <ArrowRight className="w-3 h-3 text-[#8B9992]" />

                      {/* 2. IF (Conditions) */}
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#121C17] border border-[#16281F]">
                        <span className="text-[#8B9992] font-bold">IF:</span>
                        {auto.condition_config && auto.condition_config.length > 0 ? (
                          <span className="text-[#38E1FF]">
                            {auto.condition_config.map((c) => `${c.field} ${c.operator} ${c.value}`).join(' & ')}
                          </span>
                        ) : (
                          <span className="text-[#8B9992]">Direct Pass (Zero filters)</span>
                        )}
                      </div>

                      <ArrowRight className="w-3 h-3 text-[#8B9992]" />

                      {/* 3. GUARDRAIL */}
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#121C17] border border-[#16281F]">
                        <Shield className="w-3 h-3 text-[#E6C665]" />
                        <span className="text-[#E6C665]">PROTECTED</span>
                      </div>

                      <ArrowRight className="w-3 h-3 text-[#8B9992]" />

                      {/* 4. THEN (Action) */}
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#121C17] border border-[#16281F]">
                        <span className="text-[#8B9992] font-bold">THEN:</span>
                        <span className="text-[#19F59A] font-bold">
                          {actionDef?.name || auto.action_config.type}
                        </span>
                      </div>

                      <ArrowRight className="w-3 h-3 text-[#8B9992]" />

                      {/* 5. VERIFY */}
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#121C17] border border-[#16281F]">
                        <CheckCircle className="w-3 h-3 text-[#19F59A]" />
                        <span className="text-[#19F59A]">VERIFY</span>
                      </div>
                    </div>

                    {/* Card Footer Telemetry */}
                    <div className="flex flex-wrap items-center justify-between text-[10px] text-[#8B9992] pt-1">
                      <div className="flex items-center gap-3">
                        <span>
                          Total Runs: <b className="text-[#F5F7F6]">{auto.total_runs}</b>
                        </span>
                        <span>
                          Success: <b className="text-[#19F59A]">{auto.success_runs}</b>
                        </span>
                        {auto.failure_runs > 0 && (
                          <span className="text-[#FF3B30]">
                            Failures: <b>{auto.failure_runs}</b>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        {auto.last_run_at && (
                          <span>
                            Last run: <b className="text-[#F5F7F6]">{new Date(auto.last_run_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</b>
                          </span>
                        )}
                        {auto.next_run_at && auto.status === 'ACTIVE' && (
                          <span className="text-[#38E1FF]">
                            Next run: <b className="text-[#38E1FF]">{new Date(auto.next_run_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</b>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 3: TACTICAL TEMPLATES */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'TEMPLATES' && (
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-[#0A100D] border border-[#16281F] text-xs text-[#8B9992] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#19F59A]" />
            <span>
              Tactical Battle-Tested Templates: One-click deployment for disciplined, verified autonomous workflows.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AUTOMATION_TEMPLATES.map((tpl) => (
              <div
                key={tpl.id}
                className="p-4 rounded-xl bg-[#0A100D] border border-[#16281F] hover:border-[#00D084]/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#00D084]/20 border border-[#00D084]/40 text-[#19F59A]">
                      {tpl.badge}
                    </span>
                    <span className="text-[9px] text-[#8B9992] font-mono">
                      {tpl.trigger_type}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#F5F7F6]">{tpl.title}</h3>
                  <p className="text-[11px] text-[#8B9992] leading-relaxed">
                    {tpl.description}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-2 text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-[#050706] border border-[#16281F] text-[#8B9992]">
                      Action: <strong className="text-[#19F59A]">{tpl.action.type}</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#050706] border border-[#16281F] text-[#8B9992]">
                      Risk: <strong className="text-[#38E1FF]">{tpl.risk_level}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#16281F]">
                  <button
                    onClick={() => openNewBuilder(tpl)}
                    className="px-3 py-1.5 rounded bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#F5F7F6] text-[10px]"
                  >
                    Customize
                  </button>
                  <button
                    onClick={() => handleDeployTemplate(tpl)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#00D084] text-[#050706] font-bold hover:bg-[#19F59A] text-[10px] transition-all"
                  >
                    <Plus className="w-3 h-3 stroke-[3]" />
                    <span>Deploy Directive</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 4: EXECUTION AUDIT LOG */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8B9992]">
              Showing {filteredRuns.length} recorded execution events
            </span>
            <button
              onClick={loadRuns}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#19F59A] text-[10px]"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh Log</span>
            </button>
          </div>

          {filteredRuns.length === 0 ? (
            <div className="p-8 rounded-xl bg-[#0A100D] border border-[#16281F] text-center text-[#8B9992]">
              No automation runs recorded yet. Use &quot;RUN NOW&quot; or wait for a scheduled trigger to record telemetry.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRuns.map((run) => {
                const isSuccess = run.status === 'SUCCESS';
                const isSkipped = run.status === 'SKIPPED';
                const isFailed = run.status === 'FAILED';

                return (
                  <div
                    key={run.id}
                    className="p-3 rounded-lg bg-[#0A100D] border border-[#16281F] hover:border-[#16281F]/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                          isSuccess
                            ? 'bg-[#00D084]/15 border-[#00D084]/40 text-[#19F59A]'
                            : isSkipped
                            ? 'bg-[#8B9992]/15 border-[#8B9992]/40 text-[#8B9992]'
                            : 'bg-[#FF3B30]/15 border-[#FF3B30]/40 text-[#FF3B30]'
                        }`}
                      >
                        {run.status}
                      </span>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#F5F7F6]">
                            {run.automation_name}
                          </span>
                          <span className="text-[10px] text-[#8B9992]">
                            [{run.trigger_type}]
                          </span>
                          {run.verified && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00D084]/20 text-[#19F59A] font-bold">
                              VERIFIED
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#8B9992] mt-0.5">
                          {run.result_summary}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-[10px] text-[#8B9992] shrink-0">
                      {run.duration_ms !== undefined && (
                        <span>{run.duration_ms}ms</span>
                      )}
                      <span>
                        {new Date(run.started_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                      <button
                        onClick={() => setSelectedRun(run)}
                        className="p-1 rounded bg-[#121C17] border border-[#16281F] hover:text-[#19F59A] text-[#8B9992]"
                        title="Inspect Execution Trace"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 5: METRICS & SAFETY */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Triggers */}
            <div className="p-4 rounded-xl bg-[#0A100D] border border-[#16281F] space-y-3">
              <h3 className="text-xs font-bold text-[#F5F7F6] flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#19F59A]" />
                TRIGGER DISTRIBUTION
              </h3>
              <div className="space-y-2">
                {analytics.topTriggers.map((item) => (
                  <div key={item.trigger} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#F5F7F6]">{item.trigger}</span>
                      <span className="text-[#8B9992]">{item.count} directives</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#050706] overflow-hidden">
                      <div
                        className="h-full bg-[#19F59A] rounded-full"
                        style={{
                          width: `${Math.min(100, (item.count / (automations.length || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Actions */}
            <div className="p-4 rounded-xl bg-[#0A100D] border border-[#16281F] space-y-3">
              <h3 className="text-xs font-bold text-[#F5F7F6] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#38E1FF]" />
                ACTION DISPATCH BREAKDOWN
              </h3>
              <div className="space-y-2">
                {analytics.topActions.map((item) => (
                  <div key={item.action} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#F5F7F6]">{item.action}</span>
                      <span className="text-[#8B9992]">{item.count} configured</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#050706] overflow-hidden">
                      <div
                        className="h-full bg-[#38E1FF] rounded-full"
                        style={{
                          width: `${Math.min(100, (item.count / (automations.length || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Guardrails Matrix Card */}
          <div className="p-4 rounded-xl bg-[#0A100D] border border-[#16281F] space-y-3">
            <h3 className="text-xs font-bold text-[#F5F7F6] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#E6C665]" />
              ACTIVE GUARDRAILS & EXECUTION POLICIES
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px]">
              <div className="p-3 rounded-lg bg-[#050706] border border-[#16281F] space-y-1">
                <span className="text-[#8B9992] text-[10px]">LOOP DETECTION</span>
                <div className="text-[#19F59A] font-bold">ENFORCED</div>
                <p className="text-[10px] text-[#8B9992]">
                  Halts execution if recursion or cyclic trigger is detected in call chain.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#050706] border border-[#16281F] space-y-1">
                <span className="text-[#8B9992] text-[10px]">DEPTH LIMIT</span>
                <div className="text-[#19F59A] font-bold">MAX 3 HOPS</div>
                <p className="text-[10px] text-[#8B9992]">
                  Cascading automation chains terminate after 3 downstream activations.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#050706] border border-[#16281F] space-y-1">
                <span className="text-[#8B9992] text-[10px]">RATE LIMITER</span>
                <div className="text-[#19F59A] font-bold">30 RUNS / HOUR</div>
                <p className="text-[10px] text-[#8B9992]">
                  Prevents runaway trigger flooding per authenticated operator.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#050706] border border-[#16281F] space-y-1">
                <span className="text-[#8B9992] text-[10px]">CIRCUIT BREAKER</span>
                <div className="text-[#19F59A] font-bold">3 FAILURES</div>
                <p className="text-[10px] text-[#8B9992]">
                  Automations self-pause into ERROR state after 3 consecutive failures.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL 1: BUILDER MODAL */}
      {/* --------------------------------------------------------------------- */}
      {showBuilderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0A100D] border border-[#16281F] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#16281F] flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#F5F7F6] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#19F59A]" />
                  {editingAutomation ? 'CALIBRATE DIRECTIVE' : 'NEW AUTOMATION DIRECTIVE'}
                </h2>
                <p className="text-[10px] text-[#8B9992]">
                  Step {builderStep} of 4 • {builderStep === 1 ? 'Trigger & Identity' : builderStep === 2 ? 'Conditions Filter' : builderStep === 3 ? 'Safe Action' : 'Guardrail Review'}
                </p>
              </div>
              <button
                onClick={() => setShowBuilderModal(false)}
                className="p-1.5 rounded-lg text-[#8B9992] hover:text-[#F5F7F6] hover:bg-[#121C17]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper Indicator */}
            <div className="grid grid-cols-4 border-b border-[#16281F] text-[10px] font-bold text-center">
              <button
                onClick={() => setBuilderStep(1)}
                className={`py-2 transition-colors ${
                  builderStep === 1
                    ? 'bg-[#121C17] text-[#19F59A] border-b-2 border-[#19F59A]'
                    : 'text-[#8B9992] hover:text-[#F5F7F6]'
                }`}
              >
                1. TRIGGER
              </button>
              <button
                onClick={() => setBuilderStep(2)}
                className={`py-2 transition-colors ${
                  builderStep === 2
                    ? 'bg-[#121C17] text-[#19F59A] border-b-2 border-[#19F59A]'
                    : 'text-[#8B9992] hover:text-[#F5F7F6]'
                }`}
              >
                2. CONDITIONS
              </button>
              <button
                onClick={() => setBuilderStep(3)}
                className={`py-2 transition-colors ${
                  builderStep === 3
                    ? 'bg-[#121C17] text-[#19F59A] border-b-2 border-[#19F59A]'
                    : 'text-[#8B9992] hover:text-[#F5F7F6]'
                }`}
              >
                3. ACTION
              </button>
              <button
                onClick={() => setBuilderStep(4)}
                className={`py-2 transition-colors ${
                  builderStep === 4
                    ? 'bg-[#121C17] text-[#19F59A] border-b-2 border-[#19F59A]'
                    : 'text-[#8B9992] hover:text-[#F5F7F6]'
                }`}
              >
                4. REVIEW
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {/* STEP 1: IDENTITY & TRIGGER */}
              {builderStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#8B9992] uppercase font-bold">
                      Directive Title
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Daily Strategic Briefing"
                      className="w-full px-3 py-2 rounded-lg bg-[#050706] border border-[#16281F] text-[#F5F7F6] focus:border-[#00D084] outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-[#8B9992] uppercase font-bold">
                      Description
                    </label>
                    <input
                      type="text"
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      placeholder="Operational purpose and outcome"
                      className="w-full px-3 py-2 rounded-lg bg-[#050706] border border-[#16281F] text-[#F5F7F6] focus:border-[#00D084] outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-[#8B9992] uppercase font-bold">
                      Trigger Event
                    </label>
                    <select
                      value={formTriggerType}
                      onChange={(e) => setFormTriggerType(e.target.value as AutomationTriggerType)}
                      className="w-full px-3 py-2 rounded-lg bg-[#050706] border border-[#16281F] text-[#F5F7F6] focus:border-[#00D084] outline-none"
                    >
                      <option value="SCHEDULE">SCHEDULE (Time-based cron: daily, weekly, monthly)</option>
                      <option value="MISSION_CREATED">MISSION_CREATED (Fired when new strategic mission is added)</option>
                      <option value="MISSION_COMPLETED">MISSION_COMPLETED (Fired when a mission reaches 100%)</option>
                      <option value="MISSION_DEADLINE_APPROACHING">MISSION_DEADLINE_APPROACHING (Monitors mission due dates)</option>
                      <option value="OBJECTIVE_COMPLETED">OBJECTIVE_COMPLETED (Fired when a mission milestone finishes)</option>
                      <option value="TASK_CREATED">TASK_CREATED (Fired when directive logged into Blade 02)</option>
                      <option value="TASK_COMPLETED">TASK_COMPLETED (Fired when directive marked completed)</option>
                      <option value="FOCUS_COMPLETED">FOCUS_COMPLETED (Fired when Santoryu focus timer finishes)</option>
                      <option value="MANUAL">MANUAL (Exclusively run on operator manual trigger)</option>
                    </select>
                  </div>

                  {/* Trigger-Specific Configurations */}
                  {formTriggerType === 'SCHEDULE' && (
                    <div className="p-3.5 rounded-xl bg-[#050706] border border-[#16281F] space-y-3">
                      <div className="text-[10px] text-[#19F59A] font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        SCHEDULE TIMING SPECIFICATION
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-[#8B9992]">Cadence</label>
                          <select
                            value={formFrequency}
                            onChange={(e) => setFormFrequency(e.target.value as AutomationFrequency)}
                            className="w-full px-3 py-1.5 rounded bg-[#0A100D] border border-[#16281F] text-[#F5F7F6]"
                          >
                            <option value="DAILY">DAILY</option>
                            <option value="WEEKLY">WEEKLY</option>
                            <option value="MONTHLY">MONTHLY</option>
                            <option value="ONCE">SPECIFIC DATE / ONCE</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-[#8B9992]">Execution Time</label>
                          <input
                            type="time"
                            value={formTime}
                            onChange={(e) => setFormTime(e.target.value)}
                            className="w-full px-3 py-1.5 rounded bg-[#0A100D] border border-[#16281F] text-[#F5F7F6]"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-[#8B9992]">Operator Timezone</label>
                        <input
                          type="text"
                          value={formTimezone}
                          onChange={(e) => setFormTimezone(e.target.value)}
                          className="w-full px-3 py-1.5 rounded bg-[#0A100D] border border-[#16281F] text-[#F5F7F6]"
                        />
                      </div>
                    </div>
                  )}

                  {formTriggerType === 'MISSION_DEADLINE_APPROACHING' && (
                    <div className="p-3.5 rounded-xl bg-[#050706] border border-[#16281F] space-y-2">
                      <label className="text-[10px] text-[#8B9992]">
                        Trigger Threshold (Hours Before Deadline)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="168"
                        value={formHoursBefore}
                        onChange={(e) => setFormHoursBefore(parseInt(e.target.value, 10) || 24)}
                        className="w-full px-3 py-1.5 rounded bg-[#0A100D] border border-[#16281F] text-[#F5F7F6]"
                      />
                      <p className="text-[10px] text-[#8B9992]">
                        Triggers when any active mission has less than {formHoursBefore} hours remaining until deadline.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: CONDITIONS ENGINE */}
              {builderStep === 2 && (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-[#050706] border border-[#16281F] text-[11px] text-[#8B9992] flex items-center justify-between">
                    <span>
                      Conditions are evaluated against real live data before any action executes.
                    </span>
                    <button
                      onClick={handleAddCondition}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#00D084]/20 border border-[#00D084]/40 text-[#19F59A] text-[10px] font-bold"
                    >
                      <Plus className="w-3 h-3" />
                      <span>ADD FILTER</span>
                    </button>
                  </div>

                  {formConditions.length === 0 ? (
                    <div className="p-6 rounded-xl bg-[#050706] border border-[#16281F] text-center text-[#8B9992] space-y-2">
                      <Filter className="w-6 h-6 text-[#8B9992] mx-auto opacity-50" />
                      <div>Zero conditions configured.</div>
                      <p className="text-[10px]">
                        Directive will execute unconditionally whenever the trigger event fires.
                      </p>
                      <button
                        onClick={handleAddCondition}
                        className="px-3 py-1 rounded bg-[#121C17] border border-[#16281F] text-[#19F59A] text-[10px]"
                      >
                        + Add First Condition
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formConditions.map((cond, idx) => (
                        <div
                          key={cond.id || idx}
                          className="p-3 rounded-lg bg-[#050706] border border-[#16281F] space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-[#19F59A] font-bold">
                              CONDITION #{idx + 1}
                            </span>
                            <button
                              onClick={() => handleRemoveCondition(idx)}
                              className="text-[#8B9992] hover:text-[#FF3B30]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {/* Field */}
                            <div>
                              <label className="text-[9px] text-[#8B9992]">Target Field</label>
                              <select
                                value={cond.field}
                                onChange={(e) =>
                                  handleUpdateCondition(idx, { field: e.target.value })
                                }
                                className="w-full px-2 py-1.5 rounded bg-[#0A100D] border border-[#16281F] text-[#F5F7F6] text-[10px]"
                              >
                                <option value="mission.status">mission.status</option>
                                <option value="mission.priority">mission.priority</option>
                                <option value="mission.progress">mission.progress</option>
                                <option value="mission.is_incomplete">mission.is_incomplete</option>
                                <option value="task.priority">task.priority</option>
                                <option value="task.status">task.status</option>
                                <option value="task.is_incomplete">task.is_incomplete</option>
                              </select>
                            </div>

                            {/* Operator */}
                            <div>
                              <label className="text-[9px] text-[#8B9992]">Operator</label>
                              <select
                                value={cond.operator}
                                onChange={(e) =>
                                  handleUpdateCondition(idx, {
                                    operator: e.target.value as ConditionOperator,
                                  })
                                }
                                className="w-full px-2 py-1.5 rounded bg-[#0A100D] border border-[#16281F] text-[#F5F7F6] text-[10px]"
                              >
                                <option value="EQUALS">EQUALS (=)</option>
                                <option value="NOT_EQUALS">NOT_EQUALS (!=)</option>
                                <option value="GREATER_THAN">GREATER_THAN (&gt;)</option>
                                <option value="LESS_THAN">LESS_THAN (&lt;)</option>
                                <option value="CONTAINS">CONTAINS</option>
                              </select>
                            </div>

                            {/* Value */}
                            <div>
                              <label className="text-[9px] text-[#8B9992]">Target Value</label>
                              <input
                                type="text"
                                value={String(cond.value)}
                                onChange={(e) =>
                                  handleUpdateCondition(idx, { value: e.target.value })
                                }
                                placeholder="ACTIVE, HIGH, 80"
                                className="w-full px-2 py-1.5 rounded bg-[#0A100D] border border-[#16281F] text-[#F5F7F6] text-[10px]"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: ACTION REGISTRY */}
              {builderStep === 3 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#8B9992] uppercase font-bold">
                      Safe Action Selection
                    </label>
                    <select
                      value={formActionType}
                      onChange={(e) => {
                        const nextType = e.target.value as AutomationActionType;
                        setFormActionType(nextType);
                        if (nextType === 'CREATE_NOTIFICATION') {
                          setFormActionParams({
                            title: 'Tactical Status Update',
                            message: 'System automation executed at schedule time.',
                            type: 'SYSTEM',
                          });
                        } else if (nextType === 'CREATE_TASK') {
                          setFormActionParams({
                            title: 'Review Tactical Roadmap',
                            description: 'Auto-generated action directive',
                            priority: 'HIGH',
                          });
                        } else if (nextType === 'START_FOCUS') {
                          setFormActionParams({ duration: 25 });
                        } else if (nextType === 'CREATE_ACTIVITY_EVENT') {
                          setFormActionParams({
                            description: 'Routine automation milestone logged.',
                            type: 'MISSION_UPDATED',
                          });
                        } else {
                          setFormActionParams({});
                        }
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-[#050706] border border-[#16281F] text-[#F5F7F6] focus:border-[#00D084] outline-none"
                    >
                      {actionRegistry.getAllActions().map((act) => (
                        <option key={act.type} value={act.type}>
                          {act.name} [{act.riskLevel} RISK] — {act.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Action Specific Parameters */}
                  <div className="p-3.5 rounded-xl bg-[#050706] border border-[#16281F] space-y-3">
                    <div className="text-[10px] text-[#38E1FF] font-bold flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5" />
                      ACTION PARAMETERS (Supports {'{{title}}'}, {'{{progress}}'}, {'{{duration}}'})
                    </div>

                    {formActionType === 'CREATE_NOTIFICATION' && (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-[#8B9992]">Alert Title</label>
                          <input
                            type="text"
                            value={formActionParams.title || ''}
                            onChange={(e) =>
                              setFormActionParams({ ...formActionParams, title: e.target.value })
                            }
                            className="w-full px-3 py-1.5 rounded bg-[#0A100D] border border-[#16281F] text-[#F5F7F6]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-[#8B9992]">Alert Message</label>
                          <textarea
                            rows={2}
                            value={formActionParams.message || ''}
                            onChange={(e) =>
                              setFormActionParams({ ...formActionParams, message: e.target.value })
                            }
                            className="w-full px-3 py-1.5 rounded bg-[#0A100D] border border-[#16281F] text-[#F5F7F6]"
                          />
                        </div>
                      </div>
                    )}

                    {formActionType === 'CREATE_TASK' && (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-[#8B9992]">Task Title</label>
                          <input
                            type="text"
                            value={formActionParams.title || ''}
                            onChange={(e) =>
                              setFormActionParams({ ...formActionParams, title: e.target.value })
                            }
                            className="w-full px-3 py-1.5 rounded bg-[#0A100D] border border-[#16281F] text-[#F5F7F6]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] text-[#8B9992]">Priority</label>
                            <select
                              value={formActionParams.priority || 'MEDIUM'}
                              onChange={(e) =>
                                setFormActionParams({ ...formActionParams, priority: e.target.value })
                              }
                              className="w-full px-3 py-1.5 rounded bg-[#0A100D] border border-[#16281F] text-[#F5F7F6]"
                            >
                              <option value="LOW">LOW</option>
                              <option value="MEDIUM">MEDIUM</option>
                              <option value="HIGH">HIGH</option>
                              <option value="CRITICAL">CRITICAL</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-[#8B9992]">Due Date</label>
                            <input
                              type="text"
                              value={formActionParams.dueDate || 'Today'}
                              onChange={(e) =>
                                setFormActionParams({ ...formActionParams, dueDate: e.target.value })
                              }
                              className="w-full px-3 py-1.5 rounded bg-[#0A100D] border border-[#16281F] text-[#F5F7F6]"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {formActionType === 'GENERATE_BRIEFING' && (
                      <p className="text-[10px] text-[#8B9992]">
                        Uses Gemini to digest live active missions, priority tasks, and upcoming deadlines into a structured morning briefing notification.
                      </p>
                    )}

                    {formActionType === 'GENERATE_MISSION_SUMMARY' && (
                      <p className="text-[10px] text-[#8B9992]">
                        Aggregates weekly mission completion rate, focus sessions, and task clearances into an executive retrospective.
                      </p>
                    )}

                    {formActionType === 'START_FOCUS' && (
                      <div className="space-y-1">
                        <label className="text-[10px] text-[#8B9992]">Duration (Minutes)</label>
                        <input
                          type="number"
                          value={formActionParams.duration || 25}
                          onChange={(e) =>
                            setFormActionParams({
                              ...formActionParams,
                              duration: parseInt(e.target.value, 10) || 25,
                            })
                          }
                          className="w-full px-3 py-1.5 rounded bg-[#0A100D] border border-[#16281F] text-[#F5F7F6]"
                        />
                      </div>
                    )}

                    {formActionType === 'CREATE_ACTIVITY_EVENT' && (
                      <div className="space-y-1">
                        <label className="text-[10px] text-[#8B9992]">Milestone Description</label>
                        <input
                          type="text"
                          value={formActionParams.description || ''}
                          onChange={(e) =>
                            setFormActionParams({ ...formActionParams, description: e.target.value })
                          }
                          placeholder="e.g. Focus immersion completed: {{duration}} mins."
                          className="w-full px-3 py-1.5 rounded bg-[#0A100D] border border-[#16281F] text-[#F5F7F6]"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 4: REVIEW & SAFETY */}
              {builderStep === 4 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[#050706] border border-[#16281F] space-y-3">
                    <h3 className="text-xs font-bold text-[#F5F7F6] flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#E6C665]" />
                      GUARDRAIL & EXECUTION VERIFICATION SUMMARY
                    </h3>

                    <div className="space-y-2 text-[11px]">
                      <div className="flex justify-between py-1 border-b border-[#16281F]">
                        <span className="text-[#8B9992]">Directive Name:</span>
                        <span className="text-[#F5F7F6] font-bold">{formName || 'Untitled'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#16281F]">
                        <span className="text-[#8B9992]">Trigger Type:</span>
                        <span className="text-[#19F59A] font-bold">{formTriggerType}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#16281F]">
                        <span className="text-[#8B9992]">Conditions Configured:</span>
                        <span className="text-[#38E1FF] font-bold">{formConditions.length} rules</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#16281F]">
                        <span className="text-[#8B9992]">Action Executable:</span>
                        <span className="text-[#19F59A] font-bold">{formActionType}</span>
                      </div>
                    </div>

                    {/* Operator Confirmation Gate */}
                    <div className="p-3 rounded-lg bg-[#0A100D] border border-[#16281F] flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-bold text-[#F5F7F6]">
                          Require Operator Confirmation
                        </div>
                        <p className="text-[9px] text-[#8B9992]">
                          If enabled, manual clearance is required before performing high-impact actions.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formRequiresConfirmation}
                        onChange={(e) => setFormRequiresConfirmation(e.target.checked)}
                        className="w-4 h-4 accent-[#00D084]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 border-t border-[#16281F] flex items-center justify-between">
              {builderStep > 1 ? (
                <button
                  onClick={() => setBuilderStep((prev) => (prev - 1) as any)}
                  className="px-4 py-2 rounded-lg bg-[#050706] border border-[#16281F] text-[#8B9992] hover:text-[#F5F7F6] text-xs"
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              {builderStep < 4 ? (
                <button
                  onClick={() => setBuilderStep((prev) => (prev + 1) as any)}
                  className="px-4 py-2 rounded-lg bg-[#00D084] text-[#050706] font-bold hover:bg-[#19F59A] text-xs transition-all"
                >
                  Continue to Step {builderStep + 1}
                </button>
              ) : (
                <button
                  onClick={handleSaveAutomation}
                  className="px-5 py-2 rounded-lg bg-[#00D084] text-[#050706] font-black hover:bg-[#19F59A] text-xs shadow-[0_0_20px_rgba(0,208,132,0.3)] transition-all"
                >
                  {editingAutomation ? 'SAVE CHANGES' : 'ENGAGE DIRECTIVE'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL 2: CONFIRMATION MODAL FOR MANUAL RUN */}
      {/* --------------------------------------------------------------------- */}
      {pendingRunAutomation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0A100D] border border-[#FFB000]/50 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-[0_0_40px_rgba(255,176,0,0.15)]">
            <div className="flex items-center gap-3 text-[#FFB000]">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-[#F5F7F6]">OPERATOR CLEARANCE REQUIRED</h3>
                <p className="text-[10px] text-[#8B9992]">Directive requires deliberate confirmation</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#050706] border border-[#16281F] text-xs space-y-1">
              <div>
                <span className="text-[#8B9992]">Directive: </span>
                <span className="font-bold text-[#F5F7F6]">{pendingRunAutomation.name}</span>
              </div>
              <div>
                <span className="text-[#8B9992]">Action: </span>
                <span className="text-[#19F59A] font-bold">{pendingRunAutomation.action_config.type}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setPendingRunAutomation(null)}
                className="px-4 py-2 rounded-lg bg-[#050706] border border-[#16281F] text-[#8B9992] hover:text-[#F5F7F6] text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => executeConfirmedRun(pendingRunAutomation)}
                disabled={isRunningSingle}
                className="px-4 py-2 rounded-lg bg-[#FFB000] text-[#050706] font-bold hover:bg-[#FFB000]/90 text-xs transition-all shadow-[0_0_15px_rgba(255,176,0,0.3)]"
              >
                Authorize & Execute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL 3: RUN DETAILS INSPECTOR */}
      {/* --------------------------------------------------------------------- */}
      {selectedRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0A100D] border border-[#16281F] rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-[0_0_40px_rgba(0,0,0,0.8)]">
            <div className="flex items-center justify-between border-b border-[#16281F] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#19F59A]" />
                <h3 className="text-sm font-bold text-[#F5F7F6]">
                  EXECUTION TRACE: {selectedRun.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRun(null)}
                className="text-[#8B9992] hover:text-[#F5F7F6]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-[#050706] border border-[#16281F] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#8B9992]">Directive:</span>
                  <span className="font-bold text-[#F5F7F6]">{selectedRun.automation_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8B9992]">Status:</span>
                  <span className="font-bold text-[#19F59A]">{selectedRun.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8B9992]">Trigger Type:</span>
                  <span className="text-[#38E1FF]">{selectedRun.trigger_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8B9992]">Execution Duration:</span>
                  <span>{selectedRun.duration_ms || 0}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8B9992]">Verification Status:</span>
                  <span className={selectedRun.verified ? 'text-[#19F59A]' : 'text-[#8B9992]'}>
                    {selectedRun.verified ? 'PASSED & AUDITED' : 'N/A'}
                  </span>
                </div>
              </div>

              {selectedRun.condition_evaluation && (
                <div className="p-3 rounded-lg bg-[#050706] border border-[#16281F] space-y-1">
                  <span className="text-[10px] text-[#8B9992] font-bold">CONDITION EVALUATION:</span>
                  <div className="text-[10px] space-y-0.5">
                    {selectedRun.condition_evaluation.details.map((d, i) => (
                      <div key={i} className="text-[#8B9992]">
                        • {d}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 rounded-lg bg-[#050706] border border-[#16281F] space-y-1">
                <span className="text-[10px] text-[#8B9992] font-bold">OUTCOME SUMMARY:</span>
                <p className="text-[11px] text-[#F5F7F6]">
                  {selectedRun.result_summary}
                </p>
                {selectedRun.error_message && (
                  <p className="text-[11px] text-[#FF3B30] mt-1">
                    Error Detail: {selectedRun.error_message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRun(null)}
                className="px-4 py-1.5 rounded-lg bg-[#121C17] border border-[#16281F] text-[#F5F7F6] text-xs hover:border-[#19F59A]/40"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

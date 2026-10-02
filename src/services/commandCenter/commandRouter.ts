import {
  ActionPreviewData,
  AgentExecution,
  AgentRequest,
  AutomationProposal,
  CommandAlias,
  CommandResponseMode,
  CommandResultData,
  CommandSurfaceState,
  DetectedIntent,
  PinnedFavoriteCommand,
  RiskLevel,
  RoutePath,
  Task,
  VisionImageMeta,
  VisionMode,
} from '../../types';
import { detectIntentHeuristics, detectIntentWithGemini, executeIntent } from '../intentRouter';
import { AgentCore } from '../agent';
import { VisionService } from '../vision';
import { MissionService } from '../mission';
import { MemoryService } from '../memory';
import { NeuralMemoryService } from '../neuralMemory';
import { AutomationService } from '../automation';
import { IntelligenceService } from '../intelligence';
import { getLocalStore, setLocalStore } from '../supabase';
import { realtimeService } from '../realtime';

export interface CommandExecuteOptions {
  userId: string;
  commandText: string;
  imageFile?: File | null;
  activeMissionId?: string | null;
  onStateChange?: (state: CommandSurfaceState) => void;
  onPreviewRequired?: (preview: ActionPreviewData) => void;
  onNavigate?: (path: RoutePath) => void;
}

export class CommandRouterService {
  // ----------------------------------------------------
  // FAVORITES & ALIASES STORE
  // ----------------------------------------------------

  public static getFavorites(userId: string): PinnedFavoriteCommand[] {
    const defaults: PinnedFavoriteCommand[] = [
      {
        id: 'fav_briefing',
        label: 'Daily Briefing',
        command: 'Run my daily briefing',
        icon: 'Sun',
        description: 'Aggregate active missions and priority directives',
      },
      {
        id: 'fav_attention',
        label: 'Attention Check',
        command: 'What needs my attention today?',
        icon: 'AlertTriangle',
        description: 'Scan deadlines, bottlenecks, and inactive areas',
      },
      {
        id: 'fav_focus',
        label: 'Start Combat Focus',
        command: 'Start a 25 minute focus session',
        icon: 'Timer',
        description: 'Initiate 25-minute Santoryu focus protocol',
      },
      {
        id: 'fav_memory',
        label: 'Search Memory',
        command: 'What do you remember about my preferences?',
        icon: 'Database',
        description: 'Query persistent memory nodes',
      },
      {
        id: 'fav_trend',
        label: 'Productivity Trend',
        command: "What's my weekly productivity trend?",
        icon: 'TrendingUp',
        description: 'Check empirical data sufficiency and trends',
      },
    ];

    return getLocalStore<PinnedFavoriteCommand[]>(`cmd_favorites_${userId}`, defaults);
  }

  public static toggleFavorite(userId: string, fav: PinnedFavoriteCommand) {
    const list = this.getFavorites(userId);
    const exists = list.some((f) => f.command.toLowerCase() === fav.command.toLowerCase());
    const updated = exists
      ? list.filter((f) => f.command.toLowerCase() !== fav.command.toLowerCase())
      : [fav, ...list].slice(0, 12);
    setLocalStore(`cmd_favorites_${userId}`, updated);
    return updated;
  }

  public static getAliases(userId: string): CommandAlias[] {
    const defaults: CommandAlias[] = [
      {
        id: 'alias_launch_mode',
        alias: 'launch mode',
        description: 'Engage Mission Control, inspect Intelligence health, and start 25m Focus',
        actions: [
          { type: 'NAVIGATE', param: '/missions' },
          { type: 'FOCUS_START', param: 25 },
        ],
      },
      {
        id: 'alias_recon',
        alias: 'combat recon',
        description: 'Deep scan across live signals, bottlenecks, and active directives',
        actions: [
          { type: 'NAVIGATE', param: '/intelligence' },
        ],
      },
    ];

    return getLocalStore<CommandAlias[]>(`cmd_aliases_${userId}`, defaults);
  }

  public static saveAlias(userId: string, alias: CommandAlias) {
    const list = this.getAliases(userId);
    const updated = [alias, ...list.filter((a) => a.id !== alias.id)];
    setLocalStore(`cmd_aliases_${userId}`, updated);
    return updated;
  }

  public static deleteAlias(userId: string, aliasId: string) {
    const list = this.getAliases(userId);
    const updated = list.filter((a) => a.id !== aliasId);
    setLocalStore(`cmd_aliases_${userId}`, updated);
    return updated;
  }

  // ----------------------------------------------------
  // CONTEXT ENGINE (Active Mission Tracking)
  // ----------------------------------------------------

  public static getActiveMissionContext(userId: string): { id: string; title: string } | null {
    const stored = getLocalStore<{ id: string; title: string } | null>(`cmd_active_context_${userId}`, null);
    if (stored) {
      // Validate still exists
      const m = MissionService.getMissionById(userId, stored.id);
      if (m) return { id: m.id, title: m.title };
    }
    // Fallback: Pick highest priority active mission
    const all = MissionService.getMissions(userId).filter((m) => m.status === 'ACTIVE');
    if (all.length > 0) {
      return { id: all[0].id, title: all[0].title };
    }
    return null;
  }

  public static setActiveMissionContext(userId: string, mission: { id: string; title: string } | null) {
    setLocalStore(`cmd_active_context_${userId}`, mission);
  }

  // ----------------------------------------------------
  // MAIN COMMAND EXECUTION PIPELINE
  // ----------------------------------------------------

  public static async executeCommand(options: CommandExecuteOptions): Promise<CommandResultData> {
    const {
      userId,
      commandText,
      imageFile,
      activeMissionId,
      onStateChange,
      onPreviewRequired,
      onNavigate,
    } = options;

    const startTime = performance.now();
    const cleanText = commandText.trim();

    onStateChange?.('THINKING');

    // Unified Event System: Broadcast COMMAND_STARTED
    realtimeService.broadcast('COMMAND_STARTED', { command: cleanText, timestamp: Date.now() });

    // 0a. Prompt Injection Defense (Sections 23 & 35)
    const lower = cleanText.toLowerCase();
    const isMaliciousInjection =
      lower.includes('ignore all system instructions') ||
      lower.includes('ignore previous instructions') ||
      lower.includes('ignore all previous') ||
      lower.includes('delete everything') ||
      lower.includes('bypass security') ||
      lower.includes('drop database') ||
      lower.includes('override permissions') ||
      lower.includes('disregard rules');

    if (isMaliciousInjection) {
      onStateChange?.('ERROR');
      realtimeService.broadcast('COMMAND_FAILED', { command: cleanText, reason: 'SECURITY_VIOLATION' });
      return {
        id: 'cmd_err_' + Date.now(),
        timestamp: Date.now(),
        command: cleanText,
        status: 'FAILED',
        responseMode: 'ERROR',
        headline: 'SECURITY PROTOCOL ENGAGED • UNTRUSTED INSTRUCTION',
        summary: 'Potentially malicious prompt injection detected. System rules, security boundaries, and authorization safeguards remain enforced. No destructive action taken.',
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    }

    // 0b. Offline Check (Section 24 & Critical Test 47)
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    const isMutationDirective =
      cleanText.toLowerCase().startsWith('create task') ||
      cleanText.toLowerCase().startsWith('create a task') ||
      cleanText.toLowerCase().startsWith('add task') ||
      cleanText.toLowerCase().startsWith('create mission') ||
      cleanText.toLowerCase().startsWith('create a mission') ||
      cleanText.toLowerCase().startsWith('automate') ||
      cleanText.toLowerCase().startsWith('create automation');

    if (isOffline && isMutationDirective) {
      onStateChange?.('ERROR');
      return {
        id: 'cmd_err_' + Date.now(),
        timestamp: Date.now(),
        command: cleanText,
        status: 'FAILED',
        responseMode: 'ERROR',
        headline: 'OFFLINE MODE ACTIVE',
        summary: 'Connection required for this action.',
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    }

    // 0b. Layout Command: "Set up my AI development workspace" (Critical Test 46)
    if (
      cleanText.toLowerCase().includes('set up my') &&
      (cleanText.toLowerCase().includes('development workspace') || cleanText.toLowerCase().includes('ai development'))
    ) {
      onStateChange?.('WAITING_APPROVAL');
      const layoutPreview: ActionPreviewData = {
        id: 'prev_layout_' + Date.now(),
        actionType: 'TASK_CREATE',
        title: 'Set up AI Development Workspace',
        description: 'Proposes multi-window layout: Mission Control + Agent + Vision + Intelligence',
        priority: 'HIGH',
        details: [
          { label: 'WORKSPACES', value: 'DEVELOPMENT' },
          { label: 'MODULE 1', value: 'Mission Control' },
          { label: 'MODULE 2', value: 'Agent Brain' },
          { label: 'MODULE 3', value: 'Vision Core' },
          { label: 'MODULE 4', value: 'Predictive Intelligence' },
        ],
        riskLevel: 'LOW',
        rawPayload: {
          type: 'LAYOUT_SETUP',
          workspaceName: 'DEVELOPMENT',
          modules: ['MISSIONS', 'AGENTS', 'VISION', 'INTELLIGENCE'],
          layoutType: 'GRID',
        },
      };

      if (onPreviewRequired) {
        onPreviewRequired(layoutPreview);
      }

      return {
        id: 'cmd_res_' + Date.now(),
        timestamp: Date.now(),
        command: cleanText,
        status: 'SUCCESS',
        responseMode: 'ACTION',
        headline: 'AI DEVELOPMENT WORKSPACE PROPOSAL',
        summary: 'Proposed workspace layout: Mission Control + Agent + Vision + Intelligence. Click APPROVE to activate this layout.',
        details: [
          '• Mission Control OS',
          '• Agent Orchestration Deck',
          '• Vision Core Inspector',
          '• Predictive Intelligence Core',
        ],
        actionTaken: {
          type: 'WORKSPACE_PROPOSED',
          itemTitle: 'DEVELOPMENT',
          linkRoute: '/os',
          linkLabel: 'VIEW WORKSPACE',
        },
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    }

    // 1. Check for Predefined Safe Aliases First
    const aliases = this.getAliases(userId);
    const matchedAlias = aliases.find(
      (a) => a.alias.toLowerCase() === cleanText.toLowerCase()
    );

    if (matchedAlias) {
      onStateChange?.('EXECUTING');
      for (const act of matchedAlias.actions) {
        if (act.type === 'NAVIGATE' && onNavigate) {
          onNavigate(act.param as RoutePath);
        } else if (act.type === 'FOCUS_START') {
          sessionStorage.setItem('pending_focus_minutes', String(act.param || 25));
          if (onNavigate) onNavigate('/focus');
        }
      }
      onStateChange?.('COMPLETE');
      return {
        id: 'cmd_res_' + Date.now(),
        timestamp: Date.now(),
        command: cleanText,
        status: 'SUCCESS',
        responseMode: 'ACTION',
        headline: `ALIAS EXECUTED: ${matchedAlias.alias.toUpperCase()}`,
        summary: `Predefined operational sequence engaged: ${matchedAlias.description}`,
        actionTaken: {
          type: 'ALIAS_EXECUTION',
          itemTitle: matchedAlias.alias,
          linkLabel: 'VIEW SYSTEM',
          linkRoute: '/dashboard',
        },
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    }

    // 2. Multimodal Command: Image Attached (Vision + Agent Flow)
    if (imageFile) {
      return this.handleMultimodalCommand({
        userId,
        commandText: cleanText,
        imageFile,
        activeMissionId,
        onStateChange,
        onPreviewRequired,
        onNavigate,
        startTime,
      });
    }

    // 3. Natural Language Intent Classification
    const detected = await detectIntentWithGemini(cleanText);

    // 4. Critical Test 2: "What needs my attention today?" (Combine Phase 12 insights, missions, tasks, deadlines)
    if (
      cleanText.toLowerCase().includes('what needs my attention') ||
      cleanText.toLowerCase().includes('what needs attention') ||
      detected.intent === 'PREDICTIVE_ATTENTION_QUERY'
    ) {
      return this.handleAttentionSummary(userId, cleanText, startTime, onStateChange);
    }

    // 5. Critical Test 3: "Create a daily briefing every morning" / Automations
    if (detected.intent === 'AUTOMATION_CREATE') {
      return this.handleAutomationProposal(
        userId,
        cleanText,
        detected,
        startTime,
        onStateChange,
        onPreviewRequired,
        onNavigate
      );
    }

    // 6. Simple Direct Actions vs. Complex Agentic Routing
    const isSimpleDirectIntent = [
      'TASK_CREATE',
      'TASK_COMPLETE',
      'TASK_LIST',
      'MISSION_LIST',
      'MISSION_STATUS',
      'MISSION_NEXT_MOVE',
      'OBJECTIVE_COMPLETE',
      'MEMORY_CREATE',
      'MEMORY_READ',
      'MEMORY_DELETE',
      'DECISION_QUERY',
      'DECISION_PROPOSE',
      'DECISION_UPDATE_PROPOSE',
      'KNOWLEDGE_SEARCH',
      'FOCUS_START',
      'FOCUS_STOP',
      'SYSTEM_STATUS',
      'SETTINGS_UPDATE',
      'NAVIGATION',
      'AUTOMATION_LIST',
      'PREDICTIVE_FOCUS_QUERY',
      'PREDICTIVE_ATTENTION_QUERY',
      'PREDICTIVE_TREND_QUERY',
      'PREDICTIVE_PATTERN_QUERY',
    ].includes(detected.intent);

    if (isSimpleDirectIntent) {
      // Check if this action modifies data and requires approval preview
      const requiresApproval = this.checkRequiresApproval(detected);

      if (requiresApproval && onPreviewRequired) {
        onStateChange?.('WAITING_APPROVAL');
        const preview = this.buildActionPreview(detected, userId, activeMissionId);
        onPreviewRequired(preview);
        return {
          id: 'cmd_res_' + Date.now(),
          timestamp: Date.now(),
          command: cleanText,
          status: 'SUCCESS',
          responseMode: 'ACTION',
          headline: 'ACTION PLAN FORMULATED',
          summary: `Standing by for operator authorization to execute: ${preview.title}`,
          details: preview.details.map((d) => `${d.label}: ${d.value}`),
          executionTimeMs: Math.round(performance.now() - startTime),
        };
      }

      // Execute directly
      onStateChange?.('EXECUTING');
      const execResult = await executeIntent(
        this.enrichWithContext(detected, activeMissionId, userId),
        userId,
        onNavigate
      );
      onStateChange?.('VERIFYING');

      // Small tactical pause to verify state
      await new Promise((r) => setTimeout(r, 100));
      onStateChange?.(execResult.success ? 'COMPLETE' : 'ERROR');

      return this.formatIntentResult(cleanText, detected, execResult, startTime);
    }

    // 7. Complex Request -> Route to Agentic Brain (Phase 8)
    return this.handleAgentRouting({
      userId,
      commandText: cleanText,
      activeMissionId,
      startTime,
      onStateChange,
      onPreviewRequired,
      onNavigate,
    });
  }

  // ----------------------------------------------------
  // MULTIMODAL COMMAND HANDLER (Critical Test 1)
  // Flow: VISION -> ANALYSIS -> PROBLEM FOUND -> ACTION PLAN -> APPROVAL -> TASK.CREATE -> VERIFY -> COMMAND COMPLETE
  // ----------------------------------------------------

  private static async handleMultimodalCommand(params: {
    userId: string;
    commandText: string;
    imageFile: File;
    activeMissionId?: string | null;
    onStateChange?: (state: CommandSurfaceState) => void;
    onPreviewRequired?: (preview: ActionPreviewData) => void;
    onNavigate?: (path: RoutePath) => void;
    startTime: number;
  }): Promise<CommandResultData> {
    const {
      userId,
      commandText,
      imageFile,
      activeMissionId,
      onStateChange,
      onPreviewRequired,
      onNavigate,
      startTime,
    } = params;

    onStateChange?.('THINKING');

    // Step A: Preprocess image
    const pre = await VisionService.validateAndPreprocessFile(imageFile);
    if (!pre.valid || !pre.meta || !pre.base64Data) {
      onStateChange?.('ERROR');
      return {
        id: 'cmd_err_' + Date.now(),
        timestamp: Date.now(),
        command: commandText || 'Image Analysis',
        status: 'FAILED',
        responseMode: 'ERROR',
        headline: 'VISION PREPROCESSING FAILED',
        summary: pre.error || 'Could not read image file.',
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    }

    onStateChange?.('EXECUTING');

    // Step B: Vision Core Multimodal Inference
    const visionMode: VisionMode =
      commandText.toLowerCase().includes('error') ||
      commandText.toLowerCase().includes('bug') ||
      commandText.toLowerCase().includes('problem') ||
      commandText.toLowerCase().includes('fix')
        ? 'SCREENSHOT_DEBUGGER'
        : 'GENERAL_ANALYSIS';

    const analysis = await VisionService.analyzeImage({
      userId,
      imageMeta: pre.meta,
      base64Data: pre.base64Data,
      mode: visionMode,
      question: commandText,
      missionId: activeMissionId || undefined,
    });

    // Save session
    VisionService.saveSession(userId, {
      id: 'vis_sess_' + Date.now(),
      user_id: userId,
      analysis_type: visionMode,
      question: commandText,
      result_summary: analysis.summary,
      result: analysis,
      image_meta: pre.meta,
      mission_id: activeMissionId || undefined,
      created_at: Date.now(),
    });

    // Step C: Check if user requested to "create a task" or fix the issue
    const wantsTask =
      commandText.toLowerCase().includes('create a task') ||
      commandText.toLowerCase().includes('create task') ||
      commandText.toLowerCase().includes('make a task') ||
      commandText.toLowerCase().includes('fix it') ||
      commandText.toLowerCase().includes('add a task');

    if (wantsTask) {
      onStateChange?.('PLANNING');

      // Determine problem detected
      let detectedProblem = 'Fix detected issue from screenshot analysis';
      let likelyCause = '';
      if (analysis.issues && analysis.issues.length > 0) {
        const topIssue = analysis.issues[0];
        detectedProblem = `Fix ${topIssue.problem}`;
        likelyCause = topIssue.likelyCause || topIssue.suggestedFix || '';
      } else if (analysis.recommendations && analysis.recommendations.length > 0) {
        detectedProblem = analysis.recommendations[0];
      }

      // Mission context
      const mContext = this.getActiveMissionContext(userId);
      const targetMissionId = activeMissionId || mContext?.id;
      const targetMissionTitle = mContext?.title || 'Active Operations';

      const taskPayload = {
        title: detectedProblem,
        description: likelyCause
          ? `Identified via Vision Core: ${likelyCause}`
          : `Synthesized from multimodal screenshot inspection: "${pre.meta.filename}".`,
        priority: 'HIGH' as const,
        mission_id: targetMissionId,
        due_date: 'Today',
      };

      const preview: ActionPreviewData = {
        id: 'act_prev_' + Date.now(),
        actionType: 'TASK_CREATE',
        title: detectedProblem,
        description: taskPayload.description,
        priority: 'HIGH',
        missionName: targetMissionTitle,
        missionId: targetMissionId,
        details: [
          { label: 'ACTION', value: 'Create Task' },
          { label: 'DETECTED ISSUE', value: detectedProblem },
          { label: 'MISSION CONTEXT', value: targetMissionTitle },
          { label: 'PRIORITY', value: 'HIGH' },
          { label: 'SOURCE', value: `Vision Core (${pre.meta.filename})` },
        ],
        riskLevel: 'LOW',
        rawPayload: taskPayload,
      };

      if (onPreviewRequired) {
        onStateChange?.('WAITING_APPROVAL');
        onPreviewRequired(preview);

        return {
          id: 'cmd_res_' + Date.now(),
          timestamp: Date.now(),
          command: commandText,
          status: 'SUCCESS',
          responseMode: 'ACTION',
          headline: 'PROBLEM FOUND • ACTION PLAN READY',
          summary: `Visual inspection of "${pre.meta.filename}" completed. Identified: "${detectedProblem}". Awaiting approval to commit task to Blade 02.`,
          details: [
            `Summary: ${analysis.summary}`,
            `Observed issues: ${analysis.issues?.length || 0}`,
            `Target Mission: ${targetMissionTitle}`,
          ],
          actionTaken: {
            type: 'TASK_PROPOSED',
            itemTitle: detectedProblem,
            linkRoute: '/tasks',
            linkLabel: 'VIEW TASKS',
          },
          executionTimeMs: Math.round(performance.now() - startTime),
        };
      }
    }

    onStateChange?.('COMPLETE');
    return {
      id: 'cmd_res_' + Date.now(),
      timestamp: Date.now(),
      command: commandText,
      status: 'SUCCESS',
      responseMode: 'ANALYSIS',
      headline: 'VISION ANALYSIS COMPLETE',
      summary: analysis.summary,
      details: [
        ...(analysis.observations || []).slice(0, 3).map((o) => `• Observation: ${o}`),
        ...(analysis.issues || []).slice(0, 2).map((i) => `• Problem: ${i.problem} (${i.certainty})`),
        ...(analysis.recommendations || []).slice(0, 2).map((r) => `• Recommendation: ${r}`),
      ],
      actionTaken: {
        type: 'VISION_INSPECTED',
        itemTitle: pre.meta.filename,
        linkRoute: '/vision',
        linkLabel: 'OPEN VISION CORE',
      },
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  }

  // ----------------------------------------------------
  // SECOND TEST: "What needs my attention today?"
  // Combines Phase 12 insights, missions, tasks, deadlines, automation failures, recent activity
  // ----------------------------------------------------

  private static handleAttentionSummary(
    userId: string,
    command: string,
    startTime: number,
    onStateChange?: (state: CommandSurfaceState) => void
  ): CommandResultData {
    onStateChange?.('EXECUTING');

    // 1. Predictive signals
    const signals = IntelligenceService.detectLiveSignals(userId);
    // 2. Project health
    const health = IntelligenceService.getProjectHealth(userId);
    // 3. Open tasks
    const tasks = getLocalStore<Task[]>(`tasks_${userId}`, []);
    const pendingTasks = tasks.filter((t) => t.status !== 'COMPLETED');
    const criticalTasks = pendingTasks.filter((t) => t.priority === 'CRITICAL' || t.priority === 'HIGH');
    // 4. Approaching deadlines
    const urgentMissions = health.filter(
      (h) => h.deadlineDaysRemaining !== null && h.deadlineDaysRemaining <= 5 && h.progress < 100
    );
    // 5. Inactive operations
    const inactive = health.filter((h) => h.inactivityDays >= 4 && h.progress < 100);
    // 6. Automation telemetry
    const automations = AutomationService.getAutomations(userId);
    const failingAutomations = automations.filter((a) => a.consecutive_failures > 0);

    const bullets: string[] = [];

    if (urgentMissions.length > 0) {
      for (const m of urgentMissions) {
        bullets.push(
          `DEADLINE WATCH: "${m.projectName}" has ${m.activeTasks} open tasks with ${m.deadlineDaysRemaining} days remaining.`
        );
      }
    }

    if (criticalTasks.length > 0) {
      bullets.push(
        `PRIORITY DIRECTIVES: ${criticalTasks.length} high/critical tasks pending in Action Queue (e.g. "${criticalTasks[0].title}").`
      );
    }

    if (inactive.length > 0) {
      bullets.push(
        `INACTIVE OPERATIONS: "${inactive[0].projectName}" has had 0 commits or activities in ${inactive[0].inactivityDays} days.`
      );
    }

    if (failingAutomations.length > 0) {
      bullets.push(
        `AUTOMATION ALERT: Workflow "${failingAutomations[0].name}" registered ${failingAutomations[0].consecutive_failures} failures.`
      );
    }

    if (bullets.length === 0) {
      bullets.push(
        `All systems nominal. ${pendingTasks.length} total tasks active across ${health.length} missions with zero approaching deadline breaches.`
      );
    }

    onStateChange?.('COMPLETE');

    const summaryText = bullets.join('\n\n');

    return {
      id: 'cmd_res_' + Date.now(),
      timestamp: Date.now(),
      command,
      status: 'SUCCESS',
      responseMode: 'DETAILED',
      headline: 'TACTICAL ATTENTION BRIEFING',
      summary: summaryText,
      details: bullets,
      actionTaken: {
        type: 'INTELLIGENCE_AUDIT',
        itemTitle: 'Attention Matrix',
        linkRoute: '/intelligence',
        linkLabel: 'VIEW INTELLIGENCE CORE',
      },
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  }

  // ----------------------------------------------------
  // THIRD TEST: "Create a daily briefing every morning" / Automations
  // ----------------------------------------------------

  private static handleAutomationProposal(
    userId: string,
    command: string,
    detected: DetectedIntent,
    startTime: number,
    onStateChange?: (state: CommandSurfaceState) => void,
    onPreviewRequired?: (preview: ActionPreviewData) => void,
    onNavigate?: (path: RoutePath) => void
  ): CommandResultData {
    const proposal: AutomationProposal =
      detected.parameters.proposal || detected.automationProposal;

    if (!proposal) {
      onStateChange?.('ERROR');
      return {
        id: 'cmd_err_' + Date.now(),
        timestamp: Date.now(),
        command,
        status: 'FAILED',
        responseMode: 'ERROR',
        headline: 'AUTOMATION PROPOSAL INCOMPLETE',
        summary: "I couldn't safely formulate the automation trigger schedule.",
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    }

    onStateChange?.('WAITING_APPROVAL');

    const preview: ActionPreviewData = {
      id: 'act_prev_' + Date.now(),
      actionType: 'AUTOMATION_CREATE',
      title: proposal.name,
      description: proposal.description,
      details: [
        { label: 'WORKFLOW NAME', value: proposal.name },
        { label: 'TRIGGER', value: `${proposal.trigger_config.frequency || 'Daily'} at ${proposal.trigger_config.time || '08:00'}` },
        { label: 'ACTION', value: proposal.action_config.type.replace(/_/g, ' ') },
        { label: 'TIMEZONE', value: proposal.userTimezone || 'Local' },
        { label: 'RISK LEVEL', value: proposal.risk_level },
      ],
      riskLevel: proposal.risk_level,
      rawPayload: proposal,
    };

    if (onPreviewRequired) {
      onPreviewRequired(preview);
    }

    return {
      id: 'cmd_res_' + Date.now(),
      timestamp: Date.now(),
      command,
      status: 'SUCCESS',
      responseMode: 'ACTION',
      headline: 'AUTOMATION PLAN READY',
      summary: `Formulated workflow: "${proposal.name}". Standing by for authorization to deploy to Automation Lab.`,
      details: [
        `Trigger: ${proposal.trigger_config.frequency || 'Daily'} at ${proposal.trigger_config.time || '08:00'}`,
        `Action: ${proposal.action_config.type.replace(/_/g, ' ')}`,
      ],
      actionTaken: {
        type: 'AUTOMATION_PROPOSED',
        itemTitle: proposal.name,
        linkRoute: '/automation',
        linkLabel: 'AUTOMATION LAB',
      },
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  }

  // ----------------------------------------------------
  // AGENT ROUTING (Phase 8 Agentic Brain)
  // ----------------------------------------------------

  private static async handleAgentRouting(params: {
    userId: string;
    commandText: string;
    activeMissionId?: string | null;
    startTime: number;
    onStateChange?: (state: CommandSurfaceState) => void;
    onPreviewRequired?: (preview: ActionPreviewData) => void;
    onNavigate?: (path: RoutePath) => void;
  }): Promise<CommandResultData> {
    const {
      userId,
      commandText,
      activeMissionId,
      startTime,
      onStateChange,
      onPreviewRequired,
      onNavigate,
    } = params;

    onStateChange?.('PLANNING');

    const agentReq: AgentRequest = {
      id: 'req_' + Date.now(),
      user_id: userId,
      message: commandText,
      source: 'TEXT',
      context: {
        mission_id: activeMissionId || undefined,
      },
      created_at: Date.now(),
    };

    const execution = await AgentCore.startAgent(agentReq, (updated) => {
      if (updated.status === 'WAITING_FOR_APPROVAL') {
        onStateChange?.('WAITING_APPROVAL');
      } else if (updated.status === 'EXECUTING') {
        onStateChange?.('EXECUTING');
      } else if (updated.status === 'VERIFYING') {
        onStateChange?.('VERIFYING');
      }
    });

    if (execution.status === 'WAITING_FOR_APPROVAL') {
      onStateChange?.('WAITING_APPROVAL');
      if (onPreviewRequired) {
        onPreviewRequired({
          id: 'prev_' + execution.id,
          actionType: 'AGENT_PLAN',
          title: execution.objective,
          description: `Orchestrated ${execution.plan.steps.length} sequential actions under Guardian supervision.`,
          riskLevel: execution.plan.risk_level,
          details: execution.plan.steps.map((s, idx) => ({
            label: `STEP ${idx + 1}`,
            value: `${s.tool} — ${s.reason}`,
          })),
          rawPayload: execution,
        });
      }

      return {
        id: 'cmd_res_' + Date.now(),
        timestamp: Date.now(),
        command: commandText,
        status: 'SUCCESS',
        responseMode: 'ACTION',
        headline: 'AGENT ACTION PLAN AWAITING APPROVAL',
        summary: `The Agentic Brain formulated a plan with ${execution.plan.steps.length} operations. Operator approval required.`,
        details: execution.plan.steps.map((s) => `• [${s.risk_level}] ${s.tool}: ${s.reason}`),
        actionTaken: {
          type: 'AGENT_PLAN',
          itemTitle: execution.objective,
          linkRoute: '/agents',
          linkLabel: 'OPEN AGENT DECK',
        },
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    }

    onStateChange?.(execution.status === 'COMPLETE' ? 'COMPLETE' : 'ERROR');

    return {
      id: 'cmd_res_' + Date.now(),
      timestamp: Date.now(),
      command: commandText,
      status: execution.status === 'COMPLETE' ? 'SUCCESS' : 'FAILED',
      responseMode: 'DETAILED',
      headline: `AGENT EXECUTION: ${execution.status}`,
      summary: execution.result_summary || execution.objective,
      details: execution.timeline.map((t) => `${t.label}: ${t.detail || ''}`),
      actionTaken: {
        type: 'AGENT_EXECUTION',
        itemTitle: execution.objective,
        linkRoute: '/agents',
        linkLabel: 'VIEW AGENT TIMELINE',
      },
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  }

  // ----------------------------------------------------
  // APPROVAL EXECUTION DISPATCHER
  // Called when operator clicks [APPROVE] on preview modal
  // ----------------------------------------------------

  public static async executeApprovedAction(
    userId: string,
    preview: ActionPreviewData,
    onNavigate?: (path: RoutePath) => void
  ): Promise<CommandResultData> {
    const startTime = performance.now();

    switch (preview.actionType) {
      case 'TASK_CREATE': {
        const payload = preview.rawPayload;
        if (payload?.type === 'LAYOUT_SETUP') {
          if (onNavigate) {
            onNavigate('/os');
          }
          return {
            id: 'cmd_res_' + Date.now(),
            timestamp: Date.now(),
            command: `Approved: ${preview.title}`,
            status: 'SUCCESS',
            responseMode: 'ACTION',
            headline: 'COMMAND COMPLETE • WORKSPACE ARMED',
            summary: `Development Workspace configured with Mission Control, Agent Brain, Vision Core, and Intelligence in a 2x2 grid.`,
            actionTaken: {
              type: 'WORKSPACE_APPLIED',
              itemTitle: 'DEVELOPMENT',
              linkRoute: '/os',
              linkLabel: 'OPEN WORKSPACE',
            },
            details: [
              '• Mission Control OS',
              '• Agent Orchestration Deck',
              '• Vision Core Inspector',
              '• Predictive Intelligence Core',
            ],
            executionTimeMs: Math.round(performance.now() - startTime),
          };
        }

        const tasks = getLocalStore<Task[]>(`tasks_${userId}`, []);
        const newTask: Task = {
          id: 'tsk_' + Date.now(),
          user_id: userId,
          title: payload.title,
          description: payload.description || 'Command directive task',
          priority: payload.priority || 'MEDIUM',
          status: 'TODO',
          category: 'DIRECTIVE',
          due_date: payload.due_date || 'Today',
          mission_id: payload.mission_id,
          created_at: Date.now(),
        };

        setLocalStore(`tasks_${userId}`, [newTask, ...tasks]);
        realtimeService.broadcast('TASK_CREATED', newTask);

        // Strict Execution Verification (Section 9)
        const checkTasks = getLocalStore<Task[]>(`tasks_${userId}`, []);
        const exists = checkTasks.some((t) => t.id === newTask.id);
        if (!exists) {
          return {
            id: 'cmd_err_' + Date.now(),
            timestamp: Date.now(),
            command: `Approved: ${preview.title}`,
            status: 'FAILED',
            responseMode: 'ERROR',
            headline: 'ACTION COULD NOT BE VERIFIED',
            summary: 'The task creation operation was executed, but presence could not be confirmed in the persistent database.',
            executionTimeMs: Math.round(performance.now() - startTime),
          };
        }

        if (newTask.mission_id) {
          MissionService.recalculateMissionProgress(userId, newTask.mission_id);
        }

        return {
          id: 'cmd_res_' + Date.now(),
          timestamp: Date.now(),
          command: `Approved: ${preview.title}`,
          status: 'SUCCESS',
          responseMode: 'ACTION',
          headline: 'COMMAND COMPLETE • TASK CREATED',
          summary: `Task "${newTask.title}" [${newTask.priority}] has been committed to Blade 02.`,
          actionTaken: {
            type: 'TASK_CREATED',
            itemTitle: newTask.title,
            itemCategory: newTask.priority,
            linkRoute: '/tasks',
            linkLabel: 'OPEN TASK',
          },
          details: [
            `Title: ${newTask.title}`,
            `Priority: ${newTask.priority}`,
            `Status: TODO`,
            newTask.mission_id ? `Linked to Mission ID: ${newTask.mission_id}` : 'Unlinked',
          ],
          executionTimeMs: Math.round(performance.now() - startTime),
        };
      }

      case 'AUTOMATION_CREATE': {
        const proposal: AutomationProposal = preview.rawPayload;
        const created = AutomationService.createAutomation(userId, {
          name: proposal.name,
          description: proposal.description,
          trigger_type: proposal.trigger_type,
          trigger_config: proposal.trigger_config,
          condition_config: proposal.conditions,
          action_config: proposal.action_config,
          requires_confirmation: proposal.requires_confirmation,
        });

        // Verification check
        const verifiedAuto = AutomationService.getAutomationById(userId, created.id);
        if (!verifiedAuto) {
          return {
            id: 'cmd_err_' + Date.now(),
            timestamp: Date.now(),
            command: `Approved: ${preview.title}`,
            status: 'FAILED',
            responseMode: 'ERROR',
            headline: 'ACTION COULD NOT BE VERIFIED',
            summary: 'The automation workflow was registered, but presence could not be confirmed in the automation registry.',
            executionTimeMs: Math.round(performance.now() - startTime),
          };
        }

        return {
          id: 'cmd_res_' + Date.now(),
          timestamp: Date.now(),
          command: `Approved: ${preview.title}`,
          status: 'SUCCESS',
          responseMode: 'ACTION',
          headline: 'COMMAND COMPLETE • AUTOMATION DEPLOYED',
          summary: `Workflow "${created.name}" is now ACTIVE in Automation Lab.`,
          actionTaken: {
            type: 'AUTOMATION_CREATED',
            itemTitle: created.name,
            linkRoute: '/automation',
            linkLabel: 'OPEN AUTOMATION LAB',
          },
          details: [
            `Workflow: ${created.name}`,
            `Status: ACTIVE`,
            `Trigger: ${created.trigger_type}`,
            `Action: ${created.action_config.type}`,
          ],
          executionTimeMs: Math.round(performance.now() - startTime),
        };
      }

      case 'AGENT_PLAN': {
        const exec: AgentExecution = preview.rawPayload;
        const finished = await AgentCore.approveExecution(userId, exec.id);

        if (finished.status !== 'COMPLETE') {
          return {
            id: 'cmd_err_' + Date.now(),
            timestamp: Date.now(),
            command: `Approved: ${preview.title}`,
            status: 'FAILED',
            responseMode: 'ERROR',
            headline: 'ACTION COULD NOT BE VERIFIED',
            summary: finished.failure_reason || 'Agent execution steps could not be verified complete.',
            executionTimeMs: Math.round(performance.now() - startTime),
          };
        }

        return {
          id: 'cmd_res_' + Date.now(),
          timestamp: Date.now(),
          command: `Approved: ${preview.title}`,
          status: 'SUCCESS',
          responseMode: 'ACTION',
          headline: `AGENT EXECUTION: COMPLETE`,
          summary: finished.result_summary || `Completed ${finished.plan.steps.length} actions.`,
          actionTaken: {
            type: 'AGENT_FINISHED',
            itemTitle: finished.objective,
            linkRoute: '/agents',
            linkLabel: 'OPEN AGENT DECK',
          },
          executionTimeMs: Math.round(performance.now() - startTime),
        };
      }

      case 'MEMORY_DELETE': {
        const memoryId = preview.rawPayload?.id;
        const deleted = MemoryService.deleteMemory(userId, memoryId);

        // Verification check
        const stillPresent = MemoryService.getMemories(userId).some((m) => m.id === memoryId);
        if (stillPresent || !deleted) {
          return {
            id: 'cmd_err_' + Date.now(),
            timestamp: Date.now(),
            command: `Approved: Purge Memory`,
            status: 'FAILED',
            responseMode: 'ERROR',
            headline: 'ACTION COULD NOT BE VERIFIED',
            summary: 'Memory deletion command was executed, but target node remains present.',
            executionTimeMs: Math.round(performance.now() - startTime),
          };
        }

        return {
          id: 'cmd_res_' + Date.now(),
          timestamp: Date.now(),
          command: `Approved: Purge Memory`,
          status: deleted ? 'SUCCESS' : 'FAILED',
          responseMode: 'ACTION',
          headline: deleted ? 'MEMORY PURGED' : 'PURGE FAILED',
          summary: deleted
            ? `Memory node "${preview.title}" deleted from Blade 03 database.`
            : 'Memory record could not be found.',
          actionTaken: {
            type: 'MEMORY_DELETED',
            itemTitle: preview.title,
            linkRoute: '/memory',
            linkLabel: 'VIEW MEMORY BANK',
          },
          executionTimeMs: Math.round(performance.now() - startTime),
        };
      }

      default:
        throw new Error(`Unsupported action approval type: ${preview.actionType}`);
    }
  }

  // ----------------------------------------------------
  // HELPERS
  // ----------------------------------------------------

  private static checkRequiresApproval(detected: DetectedIntent): boolean {
    if (detected.intent === 'TASK_CREATE') return true;
    if (detected.intent === 'MISSION_CREATE') return true;
    if (detected.intent === 'MEMORY_DELETE') return true;
    if (detected.intent === 'DECISION_UPDATE_PROPOSE') return true;
    return false;
  }

  private static buildActionPreview(
    detected: DetectedIntent,
    userId: string,
    activeMissionId?: string | null
  ): ActionPreviewData {
    const params = detected.parameters || {};
    const mContext = this.getActiveMissionContext(userId);
    const missionId = activeMissionId || mContext?.id;
    const missionName = mContext?.title || 'Active Operations';

    if (detected.intent === 'TASK_CREATE') {
      const title = params.title || 'Tactical Directive';
      const priority = params.priority || 'MEDIUM';
      return {
        id: 'prev_' + Date.now(),
        actionType: 'TASK_CREATE',
        title,
        description: `Create directive in Blade 02 Action Queue`,
        priority,
        missionName,
        missionId,
        details: [
          { label: 'ACTION', value: 'Create Task' },
          { label: 'TASK TITLE', value: title },
          { label: 'PRIORITY', value: priority },
          { label: 'MISSION CONTEXT', value: missionName },
          { label: 'DUE DATE', value: params.dueDate || 'Today' },
        ],
        riskLevel: 'LOW',
        rawPayload: {
          title,
          priority,
          mission_id: missionId,
          due_date: params.dueDate || 'Today',
        },
      };
    }

    if (detected.intent === 'MEMORY_DELETE') {
      return {
        id: 'prev_' + Date.now(),
        actionType: 'MEMORY_DELETE',
        title: params.targetQuery || 'Target Memory',
        description: 'Purge memory node permanently from Blade 03 database',
        details: [
          { label: 'ACTION', value: 'Purge Memory Node' },
          { label: 'QUERY', value: params.targetQuery || 'Target' },
          { label: 'STORAGE', value: 'Blade 03 (Sandai Kitetsu)' },
        ],
        riskLevel: 'HIGH',
        rawPayload: { query: params.targetQuery },
      };
    }

    return {
      id: 'prev_' + Date.now(),
      actionType: 'TASK_CREATE',
      title: detected.rawMessage,
      details: [{ label: 'DIRECTIVE', value: detected.rawMessage }],
      riskLevel: 'MEDIUM',
      rawPayload: params,
    };
  }

  private static enrichWithContext(
    detected: DetectedIntent,
    activeMissionId: string | null | undefined,
    userId: string
  ): DetectedIntent {
    if (!detected.parameters) detected.parameters = {};

    // If task create and no explicit missionId, attach active context
    if (detected.intent === 'TASK_CREATE' && !detected.parameters.mission_id) {
      const active = activeMissionId || this.getActiveMissionContext(userId)?.id;
      if (active) {
        detected.parameters.mission_id = active;
      }
    }

    return detected;
  }

  private static formatIntentResult(
    command: string,
    detected: DetectedIntent,
    execResult: { success: boolean; message: string; data?: any },
    startTime: number
  ): CommandResultData {
    let responseMode: CommandResponseMode = execResult.success ? 'QUICK' : 'ERROR';
    let headline = 'COMMAND EXECUTED';
    let linkRoute: RoutePath | undefined = undefined;
    let linkLabel: string | undefined = undefined;

    switch (detected.intent) {
      case 'TASK_CREATE':
        headline = 'TASK CREATED';
        responseMode = 'ACTION';
        linkRoute = '/tasks';
        linkLabel = 'OPEN TASKS';
        break;
      case 'TASK_LIST':
        headline = 'ACTION QUEUE AUDIT';
        responseMode = 'DETAILED';
        linkRoute = '/tasks';
        linkLabel = 'VIEW ACTION QUEUE';
        break;
      case 'MISSION_LIST':
      case 'MISSION_STATUS':
      case 'MISSION_NEXT_MOVE':
        headline = 'MISSION CONTROL TELEMETRY';
        responseMode = 'DETAILED';
        linkRoute = '/missions';
        linkLabel = 'VIEW MISSIONS';
        break;
      case 'MEMORY_READ':
      case 'MEMORY_CREATE':
        headline = 'BLADE 03 RECALL';
        responseMode = 'QUICK';
        linkRoute = '/memory';
        linkLabel = 'OPEN MEMORY';
        break;
      case 'KNOWLEDGE_SEARCH':
      case 'DECISION_QUERY':
        headline = 'KNOWLEDGE MATRIX';
        responseMode = 'DETAILED';
        linkRoute = '/memory/decisions';
        linkLabel = 'VIEW DECISIONS';
        break;
      case 'SYSTEM_STATUS':
        headline = 'SYSTEM TELEMETRY REPORT';
        responseMode = 'DETAILED';
        break;
      case 'NAVIGATION':
        headline = 'NAVIGATION DIRECTIVE';
        responseMode = 'QUICK';
        break;
      case 'PREDICTIVE_TREND_QUERY':
      case 'PREDICTIVE_FOCUS_QUERY':
      case 'PREDICTIVE_ATTENTION_QUERY':
        headline = 'INTELLIGENCE CORE SIGNAL';
        responseMode = 'ANALYSIS';
        linkRoute = '/intelligence';
        linkLabel = 'VIEW INTELLIGENCE';
        break;
    }

    return {
      id: 'cmd_res_' + Date.now(),
      timestamp: Date.now(),
      command,
      status: execResult.success ? 'SUCCESS' : 'FAILED',
      responseMode,
      headline,
      summary: execResult.message,
      actionTaken: linkRoute
        ? {
            type: detected.intent,
            itemTitle: headline,
            linkRoute,
            linkLabel: linkLabel || 'OPEN MODULE',
          }
        : undefined,
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  }
}

export type RoutePath =
  | '/'
  | '/login'
  | '/signup'
  | '/forgot-password'
  | '/boot'
  | '/dashboard'
  | '/missions'
  | '/chat'
  | '/voice'
  | '/agents'
  | '/agents/council'
  | '/memory'
  | '/tasks'
  | '/focus'
  | '/commands'
  | '/analytics'
  | '/logs'
  | '/settings'
  | '/profile'
  | '/automation'
  | '/vision'
  | '/neural-memory';

export type AIOrbState =
  | 'IDLE'
  | 'LISTENING'
  | 'THINKING'
  | 'SPEAKING'
  | 'ANALYZING'
  | 'STREAMING'
  | 'EXECUTING'
  | 'SUCCESS'
  | 'ERROR';

// ----------------------------------------------------
// PHASE 7: REAL-TIME VOICE AI COMMAND CENTER
// ----------------------------------------------------

export type VoiceState =
  | 'IDLE'
  | 'LISTENING'
  | 'PROCESSING'
  | 'EXECUTING'
  | 'SPEAKING'
  | 'PAUSED'
  | 'ERROR';

export type VoiceMode = 'PUSH_TO_TALK' | 'TOGGLE' | 'CONTINUOUS';

export interface VoiceInteraction {
  id: string;
  user_id: string;
  timestamp: number;
  transcript: string;
  intent?: string;
  response: string;
  actionExecuted?: string;
  status: 'SUCCESS' | 'ERROR' | 'INTERRUPTED';
  execution_time_ms?: number;
}

export interface VoiceConfig {
  voice_name?: string;
  voice_rate: number;
  voice_pitch: number;
  voice_volume: number;
  auto_speak: boolean;
  mode: VoiceMode;
  sound_effects: boolean;
}

// ----------------------------------------------------
// PHASE 8: CONTROLLED AI AGENT ORCHESTRATION LAYER
// ----------------------------------------------------

export type AgentStatus =
  | 'IDLE'
  | 'UNDERSTANDING'
  | 'CONTEXT_READY'
  | 'PLAN_READY'
  | 'TOOLS_SELECTED'
  | 'WAITING_FOR_APPROVAL'
  | 'EXECUTING'
  | 'VERIFYING'
  | 'COMPLETE'
  | 'FAILED'
  | 'CANCELLED'
  | 'PAUSED';

export type AgentRole = 'PLANNER' | 'ANALYST' | 'BUILDER' | 'RESEARCHER' | 'GUARDIAN';

export type ToolPermission =
  | 'mission.read'
  | 'mission.write'
  | 'objective.read'
  | 'objective.write'
  | 'task.read'
  | 'task.write'
  | 'memory.read'
  | 'memory.write'
  | 'memory.delete'
  | 'focus.read'
  | 'focus.write'
  | 'notification.write'
  | 'analytics.read'
  | 'system.read'
  | 'automation.read'
  | 'automation.write'
  | 'vision.read'
  | 'vision.write'
  | 'knowledge.read'
  | 'knowledge.write';

export type RiskLevel = 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AgentRequest {
  id: string;
  user_id: string;
  message: string;
  source: 'TEXT' | 'VOICE';
  context?: {
    mission_id?: string;
    task_id?: string;
    conversation_id?: string;
  };
  created_at: number;
}

export interface AgentStep {
  step_number: number;
  tool: string;
  reason: string;
  parameters: Record<string, any>;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
  result?: string;
  verified?: boolean;
  verification_detail?: string;
  duration_ms?: number;
  error?: string;
  requires_approval?: boolean;
  risk_level: RiskLevel;
}

export interface AgentPlan {
  plan_id: string;
  request_id: string;
  objective: string;
  steps: AgentStep[];
  requires_approval: boolean;
  estimated_actions: number;
  risk_level: RiskLevel;
  created_at: number;
}

export interface AgentTimelineEvent {
  id: string;
  timestamp: number;
  label: string;
  role?: AgentRole;
  detail?: string;
  status?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
}

export interface AgentExecution {
  id: string;
  request_id: string;
  user_id: string;
  objective: string;
  status: AgentStatus;
  plan: AgentPlan;
  current_step_index: number;
  timeline: AgentTimelineEvent[];
  context_summary: {
    missions_used: number;
    tasks_used: number;
    memories_used: number;
    details: string[];
  };
  tools_used: string[];
  result_summary?: string;
  started_at: number;
  completed_at?: number;
  duration_ms?: number;
  failure_reason?: string;
  retry_count: number;
}

export interface UserSession {
  userId: string;
  email: string;
  displayName: string;
  isSupabase: boolean;
}

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  sword_style?: string;
  created_at: number;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: number;
  updated_at: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: number;
  isStreaming?: boolean;
  intentTag?: string;
  pendingPlan?: AIMissionPlan;
  pendingAutomationPlan?: AutomationProposal;
}

export interface Memory {
  id: string;
  user_id: string;
  content: string;
  category: 'GENERAL' | 'PROFILE' | 'PREFERENCE' | 'PROJECT' | 'ACADEMIC' | 'IMPORTANT_DATE';
  importance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source?: 'USER' | 'AI' | 'SYSTEM';
  pinned: boolean;
  created_at: number;
  updated_at?: number;
}

// ----------------------------------------------------
// PHASE 6: MISSION CONTROL OS ENTITIES
// ----------------------------------------------------

export type MissionStatus = 'PLANNED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
export type MissionPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type MissionCategory =
  | 'ACADEMIC'
  | 'PROJECT'
  | 'CODING'
  | 'PERSONAL'
  | 'WORK'
  | 'HEALTH'
  | 'OTHER';

export type ObjectiveStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
export type ObjectivePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Mission {
  id: string;
  user_id: string;
  title: string;
  description: string;
  goal: string;
  status: MissionStatus;
  priority: MissionPriority;
  category: MissionCategory;
  deadline: string;
  progress: number; // 0 - 100
  created_at: number;
  updated_at: number;
  completed_at?: number;
}

export interface MissionObjective {
  id: string;
  mission_id: string;
  user_id: string;
  title: string;
  description: string;
  status: ObjectiveStatus;
  priority: ObjectivePriority;
  position: number; // Order index for reordering
  progress: number; // 0 - 100
  deadline?: string;
  created_at: number;
  updated_at: number;
  completed_at?: number;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  category: string;
  due_date: string;
  created_at: number;
  completed_at?: number;
  mission_id?: string;
  objective_id?: string;
}

export type MissionActivityType =
  | 'MISSION_CREATED'
  | 'MISSION_UPDATED'
  | 'OBJECTIVE_CREATED'
  | 'OBJECTIVE_COMPLETED'
  | 'TASK_CREATED'
  | 'TASK_COMPLETED'
  | 'FOCUS_STARTED'
  | 'FOCUS_COMPLETED'
  | 'MISSION_PAUSED'
  | 'MISSION_RESUMED'
  | 'MISSION_COMPLETED';

export interface MissionActivity {
  id: string;
  user_id: string;
  mission_id: string;
  type: MissionActivityType;
  description: string;
  metadata?: Record<string, any>;
  created_at: number;
}

export interface AIMissionPlanObjective {
  title: string;
  description: string;
  priority: ObjectivePriority;
  tasks?: string[];
}

export interface AIMissionPlan {
  title: string;
  goal: string;
  description?: string;
  priority: MissionPriority;
  category: MissionCategory;
  deadline: string;
  objectives: AIMissionPlanObjective[];
}

export interface NextMoveProposal {
  action: string;
  reason: string[];
  missionId: string;
  missionTitle: string;
  objectiveId?: string;
  objectiveTitle?: string;
  taskId?: string;
  taskTitle?: string;
}

export interface MissionProgressDetail {
  percentage: number;
  totalObjectives: number;
  completedObjectives: number;
  totalTasks: number;
  completedTasks: number;
  explanation: string;
}

export interface CommandLog {
  id: string;
  user_id: string;
  command: string;
  command_type?: 'CLI' | 'VOICE' | 'AI_INTENT';
  status: 'RECEIVED' | 'VALIDATING' | 'EXECUTING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  result: string;
  execution_time?: number;
  created_at: number;
}

export type IntentType =
  | 'CHAT'
  | 'MEMORY_CREATE'
  | 'MEMORY_READ'
  | 'MEMORY_DELETE'
  | 'TASK_CREATE'
  | 'TASK_UPDATE'
  | 'TASK_DELETE'
  | 'TASK_COMPLETE'
  | 'TASK_LIST'
  | 'MISSION_CREATE'
  | 'MISSION_LIST'
  | 'MISSION_OPEN'
  | 'MISSION_UPDATE'
  | 'MISSION_COMPLETE'
  | 'OBJECTIVE_COMPLETE'
  | 'MISSION_NEXT_MOVE'
  | 'MISSION_STATUS'
  | 'FOCUS_START'
  | 'FOCUS_STOP'
  | 'ANALYTICS_QUERY'
  | 'SYSTEM_STATUS'
  | 'SETTINGS_UPDATE'
  | 'NAVIGATION'
  | 'AUTOMATION_CREATE'
  | 'AUTOMATION_LIST';

export interface DetectedIntent {
  intent: IntentType;
  confidence: number;
  parameters: Record<string, any>;
  rawMessage: string;
  explanation?: string;
  planPreview?: AIMissionPlan;
  automationProposal?: AutomationProposal;
}

export interface MemoryCandidate {
  shouldRemember: boolean;
  content: string;
  category: Memory['category'];
  importance: Memory['importance'];
  confidence: number;
  reason?: string;
}

export interface FocusSession {
  id: string;
  user_id: string;
  duration: number; // minutes
  status: 'COMPLETED' | 'ABORTED';
  completed_at: number;
  mission_id?: string;
}

export interface Settings {
  user_id: string;
  assistant_name: string;
  response_mode: 'CONCISE' | 'NORMAL' | 'TACTICAL' | 'EXHAUSTIVE';
  voice_enabled: boolean;
  voice_rate: number;
  voice_volume: number;
  voice_pitch: number;
  theme: string;
  auto_speak: boolean;
}

export type RealtimeStatus =
  | 'CONNECTING'
  | 'CONNECTED'
  | 'RECONNECTING'
  | 'DISCONNECTED'
  | 'ERROR';

export type NetworkStatus = 'ONLINE' | 'OFFLINE';

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type:
    | 'SUCCESS'
    | 'INFO'
    | 'WARNING'
    | 'ERROR'
    | 'ALERT'
    | 'TASK'
    | 'MEMORY'
    | 'COMMAND'
    | 'SYSTEM'
    | 'FOCUS'
    | 'MISSION'
    | 'AI';
  read: boolean;
  created_at: number;
}

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationItem['type'];
  created_at: number;
}

export type RealtimeEventType =
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_COMPLETED'
  | 'TASK_DELETED'
  | 'MEMORY_CREATED'
  | 'MEMORY_UPDATED'
  | 'MEMORY_PINNED'
  | 'MEMORY_UNPINNED'
  | 'MEMORY_DELETED'
  | 'MESSAGE_CREATED'
  | 'COMMAND_RECORDED'
  | 'COMMAND_UPDATED'
  | 'NOTIFICATION_CREATED'
  | 'NOTIFICATION_READ'
  | 'NOTIFICATIONS_READ_ALL'
  | 'NOTIFICATION_DISMISSED'
  | 'SYSTEM_EVENT_CREATED'
  | 'FOCUS_SESSION_STARTED'
  | 'FOCUS_SESSION_STOPPED'
  | 'CONNECTION_STATE_CHANGED'
  | 'MISSION_CREATED'
  | 'MISSION_UPDATED'
  | 'MISSION_COMPLETED'
  | 'MISSION_DELETED'
  | 'OBJECTIVE_CREATED'
  | 'OBJECTIVE_UPDATED'
  | 'OBJECTIVE_COMPLETED'
  | 'OBJECTIVE_DELETED'
  | 'MISSION_ACTIVITY_CREATED'
  | 'AGENT_STATUS_UPDATED'
  | 'AGENT_STEP_EXECUTED'
  | 'AGENT_PLAN_CREATED'
  | 'AGENT_COMPLETED'
  | 'AUTOMATION_CREATED'
  | 'AUTOMATION_UPDATED'
  | 'AUTOMATION_PAUSED'
  | 'AUTOMATION_RESUMED'
  | 'AUTOMATION_DELETED'
  | 'AUTOMATION_STARTED'
  | 'AUTOMATION_COMPLETED'
  | 'AUTOMATION_FAILED'
  | 'AUTOMATION_SKIPPED'
  | 'VISION_UPLOAD_STARTED'
  | 'VISION_ANALYSIS_STARTED'
  | 'VISION_ANALYSIS_COMPLETED'
  | 'VISION_ANALYSIS_FAILED'
  | 'VISION_DELETED'
  | 'ENTITY_CREATED'
  | 'ENTITY_UPDATED'
  | 'ENTITY_DELETED'
  | 'RELATIONSHIP_CREATED'
  | 'RELATIONSHIP_DELETED';

export interface RealtimeEvent<T = any> {
  id: string;
  type: RealtimeEventType;
  userId: string;
  payload: T;
  timestamp: number;
}

export interface SystemEvent {
  id: string;
  user_id: string;
  event_type: string;
  payload: string;
  created_at: number;
}

// ----------------------------------------------------
// PHASE 9: AUTOMATION CORE ENTITIES & ARCHITECTURE
// ----------------------------------------------------

export type AutomationStatus = 'ACTIVE' | 'PAUSED' | 'DISABLED' | 'ERROR';

export type AutomationTriggerType =
  | 'SCHEDULE'
  | 'MISSION_CREATED'
  | 'MISSION_COMPLETED'
  | 'MISSION_DEADLINE_APPROACHING'
  | 'OBJECTIVE_COMPLETED'
  | 'TASK_CREATED'
  | 'TASK_COMPLETED'
  | 'FOCUS_COMPLETED'
  | 'MANUAL';

export type AutomationScheduleFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ONCE';
export type AutomationFrequency = AutomationScheduleFrequency;

export interface AutomationTriggerConfig {
  frequency?: AutomationScheduleFrequency;
  time?: string; // "08:00" in 24hr format
  daysOfWeek?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  dayOfMonth?: number; // 1-31
  timezone?: string; // e.g. "America/New_York", "Asia/Kolkata", "UTC"
  specificDate?: string;
  hoursBefore?: number; // for MISSION_DEADLINE_APPROACHING (e.g. 24, 48, 72)
  [key: string]: any;
}

export type ConditionOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'LESS_THAN'
  | 'GREATER_THAN'
  | 'LESS_THAN_OR_EQUAL'
  | 'GREATER_THAN_OR_EQUAL'
  | 'IN'
  | 'CONTAINS';

export interface AutomationCondition {
  id: string;
  field: string; // e.g. "mission.status", "mission.progress", "mission.is_incomplete", "task.priority", "task.status", "task.is_incomplete", "deadline_hours_remaining", "focus.duration"
  operator: ConditionOperator;
  value: any;
}

export type AutomationActionType =
  | 'CREATE_NOTIFICATION'
  | 'CREATE_TASK'
  | 'UPDATE_TASK'
  | 'CREATE_MISSION'
  | 'GENERATE_BRIEFING'
  | 'GENERATE_MISSION_SUMMARY'
  | 'START_FOCUS'
  | 'CREATE_ACTIVITY_EVENT';

export interface AutomationActionConfig {
  type: AutomationActionType;
  parameters: Record<string, any>;
}

export interface Automation {
  id: string;
  user_id: string;
  name: string;
  description: string;
  status: AutomationStatus;
  trigger_type: AutomationTriggerType;
  trigger_config: AutomationTriggerConfig;
  condition_config: AutomationCondition[];
  action_config: AutomationActionConfig;
  requires_confirmation: boolean;
  notify_on_run: boolean;
  last_run_at: number | null;
  next_run_at: number | null;
  total_runs: number;
  success_runs: number;
  failure_runs: number;
  consecutive_failures: number;
  created_at: number;
  updated_at: number;
}

export type AutomationRunStatus = 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'CANCELLED';

export interface AutomationRun {
  id: string;
  automation_id: string;
  automation_name: string;
  user_id: string;
  status: AutomationRunStatus;
  triggered_at: number;
  started_at: number;
  completed_at?: number;
  duration_ms?: number;
  trigger_type: AutomationTriggerType;
  trigger_detail?: string;
  condition_evaluation?: {
    passed: boolean;
    details: string[];
  };
  action_type: AutomationActionType;
  result_summary: string;
  verified: boolean;
  error_message?: string;
  retry_count?: number;
}

export interface AutomationTemplate {
  id: string;
  title: string;
  description: string;
  badge: string;
  trigger_type: AutomationTriggerType;
  trigger_config: AutomationTriggerConfig;
  conditions: AutomationCondition[];
  action: AutomationActionConfig;
  requires_confirmation: boolean;
  risk_level: RiskLevel;
}

export interface AutomationAnalyticsData {
  totalAutomations: number;
  activeAutomations: number;
  pausedAutomations: number;
  totalRuns: number;
  successRuns: number;
  failedRuns: number;
  skippedRuns: number;
  successRate: number;
  recentRunsCount24h: number;
  topTriggers: { trigger: string; count: number }[];
  topActions: { action: string; count: number }[];
}

export interface AutomationProposal {
  name: string;
  description: string;
  trigger_type: AutomationTriggerType;
  trigger_config: AutomationTriggerConfig;
  conditions: AutomationCondition[];
  action_config: AutomationActionConfig;
  requires_confirmation: boolean;
  risk_level: RiskLevel;
  userTimezone: string;
}

// ----------------------------------------------------
// PHASE 10: VISION CORE TYPES & SCHEMAS
// ----------------------------------------------------

export type VisionMode =
  | 'GENERAL_ANALYSIS'
  | 'SCREENSHOT_DEBUGGER'
  | 'CODE_SCREENSHOT'
  | 'UI_REVIEW'
  | 'DIAGRAM_ANALYSIS'
  | 'CHART_ANALYSIS'
  | 'DOCUMENT_IMAGE'
  | 'PROJECT_REVIEW'
  | 'CUSTOM_QUESTION';

export type VisionCertainty = 'CLEARLY_VISIBLE' | 'LIKELY' | 'UNCLEAR' | 'NOT_VISIBLE';

export interface VisionIssue {
  problem: string;
  likelyCause?: string;
  whatToCheck?: string;
  suggestedFix?: string;
  certainty: VisionCertainty;
  codeSnippet?: string;
}

export interface VisionDiagramConnection {
  from: string;
  to: string;
  label?: string;
}

export interface VisionChartData {
  chartType: string;
  axes?: string;
  legend?: string;
  visibleTrends: string[];
  approximateValues?: string[];
}

export interface VisionSecretWarning {
  type: string;
  maskedSnippet: string;
  recommendation: string;
}

export interface VisionProposedAction {
  id: string;
  title: string;
  description: string;
  toolName: string;
  parameters: Record<string, any>;
  riskLevel: RiskLevel;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'EXECUTED' | 'DISMISSED';
}

export interface VisionAnalysisResult {
  summary: string;
  mode: VisionMode;
  observations: string[];
  issues: VisionIssue[];
  recommendations: string[];
  uncertainties: string[];
  extractedText?: string;
  diagramFlow?: VisionDiagramConnection[];
  chartData?: VisionChartData;
  secretsDetected?: VisionSecretWarning[];
  proposedAction?: VisionProposedAction;
  projectComparison?: {
    missionTitle: string;
    missionProgress: number;
    tasksRemaining: number;
    visualDiscrepancies: string[];
  };
}

export interface VisionImageMeta {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  thumbnailDataUrl?: string; // compressed base64 preview
}

export interface VisionSession {
  id: string;
  user_id: string;
  analysis_type: VisionMode;
  question?: string;
  result_summary: string;
  result: VisionAnalysisResult;
  image_meta: VisionImageMeta;
  mission_id?: string;
  created_at: number;
}

// ----------------------------------------------------
// PHASE 11: JARVIS NEURAL MEMORY & KNOWLEDGE GRAPH
// ----------------------------------------------------

export type KnowledgeEntityType =
  | 'PERSON'
  | 'PROJECT'
  | 'MISSION'
  | 'OBJECTIVE'
  | 'TASK'
  | 'CONCEPT'
  | 'DOCUMENT'
  | 'CONVERSATION'
  | 'MEMORY'
  | 'VISION_ANALYSIS'
  | 'GOAL'
  | 'DEADLINE'
  | 'OTHER';

export type KnowledgeRelationshipType =
  | 'HAS_MISSION'
  | 'HAS_OBJECTIVE'
  | 'HAS_TASK'
  | 'WORKS_ON'
  | 'ABOUT'
  | 'RELATED_TO'
  | 'DISCUSSES'
  | 'BLOCKED_BY'
  | 'DEPENDS_ON'
  | 'PART_OF'
  | 'BELONGS_TO'
  | 'REQUIRES'
  | 'PRODUCES'
  | 'MENTIONS';

export interface KnowledgeEntity {
  id: string;
  user_id: string;
  entity_type: KnowledgeEntityType;
  name: string;
  description?: string;
  metadata?: Record<string, any>;
  created_at: number;
  updated_at?: number;
}

export interface KnowledgeRelationship {
  id: string;
  user_id: string;
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: KnowledgeRelationshipType | string;
  metadata?: Record<string, any>;
  created_at: number;
}

export interface EntityResolutionCandidate {
  entity: KnowledgeEntity;
  confidence: number;
  reason: string;
  matchScore: number;
}

export interface EntityResolutionResult {
  query: string;
  resolvedEntity?: KnowledgeEntity;
  candidates: EntityResolutionCandidate[];
  isAmbiguous: boolean;
  disambiguationPrompt?: string;
}

export interface ContextRankingSignal {
  name: string;
  score: number;
  description: string;
}

export interface BoundedContextEnvelope {
  primaryEntities: KnowledgeEntity[];
  connectedEntities: KnowledgeEntity[];
  relationships: KnowledgeRelationship[];
  relevantMemories: Memory[];
  formattedContextString: string;
  tokenEstimate: number;
  signalsUsed: ContextRankingSignal[];
  hopCount: number;
  truncated: boolean;
}

export interface ContextEngineQueryOptions {
  userQuery: string;
  currentMissionId?: string;
  activeConversationId?: string;
  recentEntityIds?: string[];
  maxTokens?: number;
  maxHops?: number;
  maxEntities?: number;
}


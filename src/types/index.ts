export type RoutePath =
  | '/'
  | '/login'
  | '/signup'
  | '/forgot-password'
  | '/boot'
  | '/dashboard'
  | '/chat'
  | '/voice'
  | '/memory'
  | '/tasks'
  | '/focus'
  | '/commands'
  | '/analytics'
  | '/logs'
  | '/settings'
  | '/profile';

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
  | 'FOCUS_START'
  | 'FOCUS_STOP'
  | 'ANALYTICS_QUERY'
  | 'SYSTEM_STATUS'
  | 'SETTINGS_UPDATE'
  | 'NAVIGATION';

export interface DetectedIntent {
  intent: IntentType;
  confidence: number;
  parameters: Record<string, any>;
  rawMessage: string;
  explanation?: string;
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
  | 'CONNECTION_STATE_CHANGED';

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

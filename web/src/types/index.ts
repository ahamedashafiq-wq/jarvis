export type RoutePath =
  | '/'
  | '/login'
  | '/signup'
  | '/forgot-password'
  | '/dashboard'
  | '/chat'
  | '/voice'
  | '/memory'
  | '/tasks'
  | '/commands'
  | '/analytics'
  | '/settings'
  | '/profile';

export type AIOrbState = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'EXECUTING' | 'SUCCESS' | 'ERROR';

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
}

export interface Memory {
  id: string;
  user_id: string;
  content: string;
  category: 'GENERAL' | 'PROFILE' | 'PREFERENCE' | 'PROJECT' | 'ACADEMIC' | 'IMPORTANT_DATE';
  importance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  pinned: boolean;
  created_at: number;
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
  status: 'SUCCESS' | 'ERROR' | 'VALIDATING';
  result: string;
  created_at: number;
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
  voice_pitch: number;
  theme: string;
  auto_speak: boolean;
}

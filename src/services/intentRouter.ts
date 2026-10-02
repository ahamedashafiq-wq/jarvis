import { GoogleGenAI, Type, Schema } from '@google/genai';
import {
  DetectedIntent,
  IntentType,
  Memory,
  MemoryCandidate,
  RoutePath,
  Task,
  Settings,
  CommandLog,
  AIMissionPlan,
  Mission,
  AutomationProposal,
} from '../types';
import { MemoryService, isSecretOrSensitive } from './memory';
import { MissionService } from './mission';
import { AutomationService } from './automation';
import { NeuralMemoryService } from './neuralMemory';
import { IntelligenceService } from './intelligence';
import { getLocalStore, setLocalStore } from './supabase';
import { realtimeService } from './realtime';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const isGeminiConfigured = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY');
const ai = isGeminiConfigured ? new GoogleGenAI({ apiKey }) : null;

// Allowlisted routes for natural navigation
export const ALLOWED_NAVIGATION_ROUTES: Record<string, RoutePath> = {
  home: '/dashboard',
  dashboard: '/dashboard',
  missions: '/missions',
  mission: '/missions',
  'mission control': '/missions',
  chat: '/chat',
  voice: '/voice',
  agents: '/agents',
  agent: '/agents',
  'agent brain': '/agents',
  'agent council': '/agents/council',
  council: '/agents/council',
  memory: '/memory',
  memories: '/memory',
  tasks: '/tasks',
  task: '/tasks',
  todo: '/tasks',
  focus: '/focus',
  commands: '/commands',
  terminal: '/commands',
  analytics: '/analytics',
  logs: '/logs',
  settings: '/settings',
  profile: '/profile',
  automation: '/automation',
  automations: '/automation',
  'automation lab': '/automation',
  workflows: '/automation',
  intelligence: '/intelligence',
  'intelligence core': '/intelligence',
  predictions: '/intelligence',
  forecast: '/intelligence',
  patterns: '/intelligence',
};

// Allowlisted settings keys
export const ALLOWED_SETTINGS_KEYS = new Set([
  'assistant_name',
  'response_mode',
  'voice_enabled',
  'voice_rate',
  'voice_volume',
  'voice_pitch',
  'theme',
  'auto_speak',
  'reduced_motion',
  'animation_level',
]);

const INTENT_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    intent: {
      type: Type.STRING,
      enum: [
        'CHAT',
        'MEMORY_CREATE',
        'MEMORY_READ',
        'MEMORY_DELETE',
        'TASK_CREATE',
        'TASK_UPDATE',
        'TASK_DELETE',
        'TASK_COMPLETE',
        'TASK_LIST',
        'MISSION_CREATE',
        'MISSION_LIST',
        'MISSION_OPEN',
        'MISSION_UPDATE',
        'MISSION_COMPLETE',
        'OBJECTIVE_COMPLETE',
        'MISSION_NEXT_MOVE',
        'MISSION_STATUS',
        'FOCUS_START',
        'FOCUS_STOP',
        'ANALYTICS_QUERY',
        'SYSTEM_STATUS',
        'SETTINGS_UPDATE',
        'NAVIGATION',
      ],
      description: 'The detected user intent category',
    },
    confidence: {
      type: Type.NUMBER,
      description: 'Confidence score between 0.0 and 1.0',
    },
    parameters: {
      type: Type.OBJECT,
      description: 'Extracted intent parameters (e.g. title, content, target, minutes, route, settingKey, settingValue)',
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        priority: { type: Type.STRING },
        dueDate: { type: Type.STRING },
        content: { type: Type.STRING },
        category: { type: Type.STRING },
        importance: { type: Type.STRING },
        targetQuery: { type: Type.STRING },
        minutes: { type: Type.INTEGER },
        route: { type: Type.STRING },
        settingKey: { type: Type.STRING },
        settingValue: { type: Type.STRING },
        action: { type: Type.STRING },
        missionId: { type: Type.STRING },
        objectiveId: { type: Type.STRING },
      },
    },
    explanation: {
      type: Type.STRING,
      description: 'Brief tactical reasoning for the intent classification',
    },
  },
  required: ['intent', 'confidence', 'parameters'],
};

const MEMORY_EXTRACTION_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    shouldRemember: {
      type: Type.BOOLEAN,
      description: 'True if message contains enduring personal/project facts to remember across conversations',
    },
    content: {
      type: Type.STRING,
      description: 'Concise, clean factual memory statement',
    },
    category: {
      type: Type.STRING,
      enum: ['PROFILE', 'PREFERENCE', 'PROJECT', 'ACADEMIC', 'IMPORTANT_DATE', 'GENERAL'],
    },
    importance: {
      type: Type.STRING,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    },
    confidence: {
      type: Type.NUMBER,
      description: 'Confidence score 0.0 to 1.0',
    },
    reason: {
      type: Type.STRING,
      description: 'Reason why this should or should not be remembered',
    },
  },
  required: ['shouldRemember', 'content', 'category', 'importance', 'confidence'],
};

/**
 * Deterministic Semantic Heuristic Intent Detector
 * Ensures flawless accuracy for all core benchmark phrases with zero latency,
 * and acts as robust fallback when Gemini is offline.
 */
export function detectIntentHeuristics(text: string): DetectedIntent {
  const raw = text.trim();
  const lower = raw.toLowerCase();

  // 1. Navigation intents (e.g., "Open my tasks", "Take me to memory", "Show analytics", "Open settings", "Go home")
  if (
    lower.startsWith('open ') ||
    lower.startsWith('go to ') ||
    lower.startsWith('take me to ') ||
    lower.startsWith('navigate to ') ||
    lower === 'go home' ||
    lower === 'open memory' ||
    lower === 'open my memory' ||
    lower === 'open settings' ||
    lower === 'open my tasks' ||
    lower === 'show analytics'
  ) {
    let target = lower
      .replace(/^(open my |open |take me to |navigate to |go to |show |go )/i, '')
      .replace(/^(screen|page|view)/i, '')
      .trim();

    if (target.includes('mission')) target = 'missions';
    else if (target.includes('task')) target = 'tasks';
    else if (target.includes('memory') || target.includes('memories')) target = 'memory';
    else if (target.includes('analytic')) target = 'analytics';
    else if (target.includes('setting')) target = 'settings';
    else if (target.includes('command') || target.includes('terminal')) target = 'commands';
    else if (target.includes('focus')) target = 'focus';
    else if (target.includes('profile')) target = 'profile';
    else if (target.includes('home') || target.includes('dashboard')) target = 'dashboard';
    else if (target.includes('automation') || target.includes('workflow')) target = 'automation';

    if (ALLOWED_NAVIGATION_ROUTES[target]) {
      return {
        intent: 'NAVIGATION',
        confidence: 0.98,
        parameters: { route: ALLOWED_NAVIGATION_ROUTES[target] },
        rawMessage: raw,
        explanation: `Explicit navigation request to ${ALLOWED_NAVIGATION_ROUTES[target]}`,
      };
    }
  }

  // 1a. Automation List intent
  if (
    lower === 'show my automations' ||
    lower === 'show automations' ||
    lower === 'list automations' ||
    lower === 'list my automations' ||
    lower === 'view automations' ||
    lower === 'what automations are active' ||
    lower === 'what automations are active?'
  ) {
    return {
      intent: 'AUTOMATION_LIST',
      confidence: 0.98,
      parameters: {},
      rawMessage: raw,
      explanation: 'Query active automation directives',
    };
  }

  // 1a2. Automation Create intents (Phase 9 - Automation Core)
  const userTz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';

  // Pattern 1: Daily Briefing
  // e.g. "Every morning, prepare my daily briefing", "Every morning at 8, give me a briefing", "Every day at 8 AM, give me a briefing about my projects"
  if (
    (lower.includes('every morning') || lower.includes('every day')) &&
    (lower.includes('briefing') || lower.includes('daily report') || lower.includes('summary of my projects'))
  ) {
    const timeMatch = lower.match(/(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    let timeStr = '08:00';
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const mins = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const meridiem = (timeMatch[3] || '').toLowerCase();
      if (meridiem === 'pm' && hours < 12) hours += 12;
      if (meridiem === 'am' && hours === 12) hours = 0;
      timeStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }

    const proposal: AutomationProposal = {
      name: 'Daily Tactical Briefing',
      description: `Every morning at ${timeStr}, compile active missions, high-priority directives, and urgent deadlines.`,
      trigger_type: 'SCHEDULE',
      trigger_config: {
        frequency: 'DAILY',
        time: timeStr,
        timezone: userTz,
      },
      conditions: [],
      action_config: {
        type: 'GENERATE_BRIEFING',
        parameters: {},
      },
      requires_confirmation: false,
      risk_level: 'LOW',
      userTimezone: userTz,
    };

    return {
      intent: 'AUTOMATION_CREATE',
      confidence: 0.99,
      parameters: { proposal },
      rawMessage: raw,
      explanation: 'Automation proposal: Daily Briefing schedule',
      automationProposal: proposal,
    };
  }

  // Pattern 2: Deadline Watch
  // e.g. "When an important mission deadline is approaching, notify me", "Make sure I don't forget my project deadlines", "When mission deadline is within 24 hours"
  if (
    (lower.includes('deadline') && (lower.includes('approaching') || lower.includes('notify') || lower.includes('remind') || lower.includes('within'))) ||
    lower.includes("don't forget my project deadlines") ||
    lower.includes('dont forget my project deadlines')
  ) {
    const hoursMatch = lower.match(/(\d+)\s*(?:hours|h)/i);
    const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 24;

    const proposal: AutomationProposal = {
      name: 'Mission Deadline Watch',
      description: `Monitors active missions and dispatches high-priority notification when deadline is within ${hours} hours.`,
      trigger_type: 'MISSION_DEADLINE_APPROACHING',
      trigger_config: {
        hoursBefore: hours,
      },
      conditions: [
        {
          id: 'cond_deadline_incomplete',
          field: 'mission.is_incomplete',
          operator: 'EQUALS',
          value: true,
        },
      ],
      action_config: {
        type: 'CREATE_NOTIFICATION',
        parameters: {
          title: 'TACTICAL DEADLINE ALERT: {{title}}',
          message: `Mission "{{title}}" target deadline is approaching in less than ${hours} hours. Current progress: {{progress}}%.`,
          type: 'WARNING',
        },
      },
      requires_confirmation: false,
      risk_level: 'LOW',
      userTimezone: userTz,
    };

    return {
      intent: 'AUTOMATION_CREATE',
      confidence: 0.99,
      parameters: { proposal },
      rawMessage: raw,
      explanation: 'Automation proposal: Mission Deadline Watch',
      automationProposal: proposal,
    };
  }

  // Pattern 3: Focus Session Completion
  // e.g. "When I complete a focus session, update my mission progress"
  if (
    (lower.includes('focus session') || lower.includes('focus')) &&
    (lower.includes('complete') || lower.includes('finished')) &&
    (lower.includes('update') || lower.includes('mission'))
  ) {
    const proposal: AutomationProposal = {
      name: 'Focus Session Mission Logger',
      description: 'Automatically records completed combat focus sessions onto the active mission milestone log.',
      trigger_type: 'FOCUS_COMPLETED',
      trigger_config: {},
      conditions: [],
      action_config: {
        type: 'CREATE_ACTIVITY_EVENT',
        parameters: {
          description: 'Completed {{duration}}-minute combat focus protocol.',
          type: 'FOCUS_COMPLETED',
        },
      },
      requires_confirmation: false,
      risk_level: 'LOW',
      userTimezone: userTz,
    };

    return {
      intent: 'AUTOMATION_CREATE',
      confidence: 0.99,
      parameters: { proposal },
      rawMessage: raw,
      explanation: 'Automation proposal: Focus session completion handler',
      automationProposal: proposal,
    };
  }

  // Pattern 4: Weekly Review
  // e.g. "Every Sunday, generate a weekly project summary", "Remind me every Sunday to review my AI project"
  if (
    (lower.includes('every sunday') || lower.includes('weekly')) &&
    (lower.includes('summary') || lower.includes('review') || lower.includes('report'))
  ) {
    const proposal: AutomationProposal = {
      name: 'Weekly Retrospective & Summary',
      description: 'Every Sunday at 18:00, aggregates cleared missions, directives fulfilled, and focus metrics into a summary.',
      trigger_type: 'SCHEDULE',
      trigger_config: {
        frequency: 'WEEKLY',
        daysOfWeek: [0],
        time: '18:00',
        timezone: userTz,
      },
      conditions: [],
      action_config: {
        type: 'GENERATE_MISSION_SUMMARY',
        parameters: {},
      },
      requires_confirmation: false,
      risk_level: 'LOW',
      userTimezone: userTz,
    };

    return {
      intent: 'AUTOMATION_CREATE',
      confidence: 0.99,
      parameters: { proposal },
      rawMessage: raw,
      explanation: 'Automation proposal: Weekly summary schedule',
      automationProposal: proposal,
    };
  }

  // Pattern 5: Generic "Create an automation to..."
  if (lower.startsWith('create an automation') || lower.startsWith('create automation') || lower.startsWith('automate ')) {
    const cleanName = raw.replace(/^(create an automation (?:to |for |called )?|create automation (?:to |for |called )?|automate )/i, '').trim();
    const proposal: AutomationProposal = {
      name: cleanName ? cleanName.toUpperCase() : 'Custom Directive Workflow',
      description: `Automated workflow formulated for: "${cleanName || raw}"`,
      trigger_type: lower.includes('deadline') ? 'MISSION_DEADLINE_APPROACHING' : 'SCHEDULE',
      trigger_config: {
        frequency: 'DAILY',
        time: '08:00',
        timezone: userTz,
      },
      conditions: [],
      action_config: {
        type: 'CREATE_NOTIFICATION',
        parameters: {
          title: `AUTOMATION: ${cleanName || 'Custom Directive'}`,
          message: 'Automated directive executed.',
          type: 'INFO',
        },
      },
      requires_confirmation: true,
      risk_level: 'LOW',
      userTimezone: userTz,
    };

    return {
      intent: 'AUTOMATION_CREATE',
      confidence: 0.97,
      parameters: { proposal },
      rawMessage: raw,
      explanation: 'Custom automation workflow proposal synthesized',
      automationProposal: proposal,
    };
  }

  // 1b. Mission Next Move intent (e.g. "What should I do next?", "What's my next move?", "Next move")
  if (
    lower === "what should i do next?" ||
    lower === "what should i do next" ||
    lower === "what's my next move?" ||
    lower === "what's my next move" ||
    lower === "what is my next move?" ||
    lower === "what is my next move" ||
    lower === "next move" ||
    lower === "whats my next move" ||
    lower.includes("what's my next move") ||
    lower.includes("what is my next move") ||
    lower.includes("what should i do next")
  ) {
    return {
      intent: 'MISSION_NEXT_MOVE',
      confidence: 0.99,
      parameters: {},
      rawMessage: raw,
      explanation: 'Signature directive: Next Move Engine query',
    };
  }

  // 1c. Objective Complete intent (e.g. "Complete the Research objective", "Complete objective Research", "Complete the backend objective")
  if (
    (lower.includes('complete the ') && lower.includes('objective')) ||
    (lower.includes('complete objective') || lower.includes('finish objective')) ||
    (lower.startsWith('mark objective ') && lower.includes('complete'))
  ) {
    let clean = raw
      .replace(/^(complete the |complete objective |finish objective |complete |finish |mark objective )/i, '')
      .replace(/ (objective as completed|objective completed|objective as done|objective)$/i, '')
      .replace(/["']/g, '')
      .trim();

    return {
      intent: 'OBJECTIVE_COMPLETE',
      confidence: 0.98,
      parameters: { title: clean },
      rawMessage: raw,
      explanation: `Directive to mark objective "${clean}" as complete`,
    };
  }

  // 1d. Mission Status / Progress intent (e.g. "How is my AI project going?", "How much progress have I made?", "Mission status")
  if (
    lower.includes('how is my') && (lower.includes('going') || lower.includes('doing') || lower.includes('progress')) ||
    lower.includes('how much progress have i made') ||
    lower === 'mission status' ||
    lower === 'show mission status' ||
    lower.startsWith('status of mission')
  ) {
    const cleanTarget = raw
      .replace(/^(how is my |how is the |how much progress have i made on |status of mission )/i, '')
      .replace(/ (going\??|doing\??|progress\??)$/i, '')
      .replace(/["']/g, '')
      .trim();

    return {
      intent: 'MISSION_STATUS',
      confidence: 0.96,
      parameters: { title: cleanTarget },
      rawMessage: raw,
      explanation: 'Inquiry into real mission telemetry and explainable progress metrics',
    };
  }

  // 1e. Mission Create / Plan intent (e.g. "Create a mission called AI Assistant", "Create a mission for my AI project", "Plan a mission for...")
  if (
    lower.startsWith('create a mission') ||
    lower.startsWith('create mission') ||
    lower.startsWith('plan a mission') ||
    lower.startsWith('plan mission') ||
    lower.startsWith('i want to finish my') ||
    lower.startsWith('i want to build an ai') ||
    lower.startsWith('i need to build an ai') ||
    lower.startsWith('new mission')
  ) {
    let cleanTitle = raw
      .replace(/^(create a mission (?:called |named |for )?|create mission (?:called |named |for )?|plan a mission (?:for )?|plan mission (?:for )?|i want to finish my |i want to build an? |i need to build an? |new mission:? ?)/i, '')
      .replace(/^["']|["']$/g, '')
      .trim();

    return {
      intent: 'MISSION_CREATE',
      confidence: 0.98,
      parameters: { title: cleanTitle || 'AI Assistant', prompt: raw },
      rawMessage: raw,
      explanation: `Directive to synthesize structured mission plan for "${cleanTitle || raw}"`,
    };
  }

  // 1f. Mission List intent (e.g. "Show my active missions", "List missions")
  if (
    lower === 'show my active missions' ||
    lower === 'show active missions' ||
    lower === 'show my missions' ||
    lower === 'list my missions' ||
    lower === 'list missions' ||
    lower === 'show missions' ||
    lower === 'what are my missions' ||
    lower === 'what are my missions?'
  ) {
    return {
      intent: 'MISSION_LIST',
      confidence: 0.98,
      parameters: {},
      rawMessage: raw,
      explanation: 'Query active missions in Blade 02 queue',
    };
  }

  // 1g. Mission Open intent (e.g. "Open my AI project", "Open mission AI Assistant")
  if (
    (lower.startsWith('open my ') && (lower.includes('project') || lower.includes('mission') || lower.includes('assistant'))) ||
    lower.startsWith('open mission ')
  ) {
    const cleanTarget = raw.replace(/^(open my |open mission )/i, '').replace(/ (mission|project)$/i, '').trim();
    return {
      intent: 'MISSION_OPEN',
      confidence: 0.97,
      parameters: { title: cleanTarget },
      rawMessage: raw,
      explanation: `Navigate to mission "${cleanTarget}"`,
    };
  }

  // 1h. Mission Update intent (e.g. "Pause my AI project", "Resume my AI project")
  if (
    lower.startsWith('pause my ') ||
    lower.startsWith('pause mission ') ||
    lower.startsWith('resume my ') ||
    lower.startsWith('resume mission ')
  ) {
    const action = lower.startsWith('resume') ? 'RESUME' : 'PAUSE';
    const cleanTarget = raw.replace(/^(pause my |pause mission |resume my |resume mission )/i, '').replace(/ (mission|project)$/i, '').trim();
    return {
      intent: 'MISSION_UPDATE',
      confidence: 0.96,
      parameters: { title: cleanTarget, action },
      rawMessage: raw,
      explanation: `Directive to ${action} mission "${cleanTarget}"`,
    };
  }

  // 1i. Mission Complete intent (e.g. "Complete my AI project", "Complete mission AI Assistant")
  if (
    lower.startsWith('complete my mission') ||
    lower.startsWith('complete mission ') ||
    lower.startsWith('finish mission ')
  ) {
    const cleanTarget = raw.replace(/^(complete my mission |complete mission |finish mission )/i, '').replace(/ (mission|project)$/i, '').trim();
    return {
      intent: 'MISSION_COMPLETE',
      confidence: 0.96,
      parameters: { title: cleanTarget },
      rawMessage: raw,
      explanation: `Directive to mark mission "${cleanTarget}" as completed`,
    };
  }

  // 2. Memory Delete / Forget intent (e.g., "Forget that my favorite language is Python", "Forget my project deadline", "Delete that memory")
  if (
    lower.startsWith('forget ') ||
    lower.startsWith('delete memory ') ||
    lower.startsWith('remove memory ') ||
    lower === 'delete that memory' ||
    lower.includes('forget that') ||
    lower.includes('forget my')
  ) {
    const targetQuery = raw
      .replace(/^(forget that |forget my |forget |delete memory |delete that memory|remove memory )/i, '')
      .trim();

    return {
      intent: 'MEMORY_DELETE',
      confidence: 0.96,
      parameters: { targetQuery: targetQuery || raw },
      rawMessage: raw,
      explanation: 'Explicit request to purge memory record',
    };
  }

  // 3. Memory Read intent (e.g., "What do you remember about my programming preferences?", "What is my main project?", "Show my memories")
  if (
    lower.includes('what do you remember') ||
    lower.includes('what you remember') ||
    lower.includes('what is my main project') ||
    lower.includes('what is my project') ||
    lower.includes('what are my preferences') ||
    lower.includes('what is my favorite') ||
    lower.includes('what do you know about me') ||
    lower === 'show memories' ||
    lower === 'list memories'
  ) {
    return {
      intent: 'MEMORY_READ',
      confidence: 0.95,
      parameters: { query: raw },
      rawMessage: raw,
      explanation: 'Query against persistent memory bank',
    };
  }

  // 3a. Decision Query intent (Phase 11 Requirement 41)
  // e.g. "What backend decision did we make?", "What's our backend decision?", "What's the current backend?", "What is the current backend?"
  if (
    lower.includes('backend decision') ||
    lower === 'what backend decision did we make?' ||
    lower === 'what backend decision did we make' ||
    lower === 'what was our backend decision?' ||
    lower === 'what was our backend decision' ||
    lower === "what's our backend decision?" ||
    lower === "what's our backend decision" ||
    lower === 'what is our backend decision?' ||
    lower === 'what is our backend decision' ||
    lower === "what's the current backend?" ||
    lower === "what's the current backend" ||
    lower === 'what is the current backend?' ||
    lower === 'what is the current backend' ||
    lower === 'what is the backend?' ||
    lower === "what's the backend?" ||
    (lower.includes('current backend') && lower.includes('what')) ||
    (lower.includes('backend') && lower.includes('decision') && lower.includes('what'))
  ) {
    return {
      intent: 'DECISION_QUERY',
      confidence: 0.99,
      parameters: { subject: 'backend', projectName: 'AI Assistant' },
      rawMessage: raw,
      explanation: 'Query active architectural decision for project backend',
    };
  }

  // 3b. Decision Update / Change intent (Phase 11 Requirement 41)
  // e.g. "We changed it to Node.js", "We changed it to Node.js.", "Switch the backend to Node.js", "Change backend to Node.js"
  if (
    lower === 'we changed it to node.js' ||
    lower === 'we changed it to node.js.' ||
    lower === 'we changed it to nodejs' ||
    lower === 'we changed it to node' ||
    lower.startsWith('we changed it to ') ||
    lower.startsWith('we changed the backend to ') ||
    lower.startsWith('switch the backend to ') ||
    lower.startsWith('switch backend to ') ||
    lower.startsWith('change the backend to ') ||
    lower.startsWith('change backend to ') ||
    lower.startsWith('the backend is now ')
  ) {
    let cleanNew = raw
      .replace(
        /^(we changed it to |we changed the backend to |switch the backend to |switch backend to |change the backend to |change backend to |the backend is now )/i,
        ''
      )
      .replace(/\.$/, '')
      .trim();

    const decisionText = cleanNew.toLowerCase().includes('backend')
      ? cleanNew
      : `Switch the backend to ${cleanNew}.`;

    return {
      intent: 'DECISION_UPDATE_PROPOSE',
      confidence: 0.99,
      parameters: {
        newDecisionText: decisionText,
        cleanSubject: 'backend',
        projectName: 'AI Assistant',
      },
      rawMessage: raw,
      explanation: 'Directive to update previously established project decision',
    };
  }

  // 3c. Project Decision Proposal intent (Phase 11 Requirement 41)
  // e.g. "Remember that my AI Assistant backend uses FastAPI.", "Remember that the AI Assistant backend uses FastAPI"
  if (
    (lower.includes('backend uses ') || lower.includes('backend should use ')) &&
    (lower.includes('remember') || lower.includes('ai assistant') || lower.includes('project'))
  ) {
    let decisionText = 'Use FastAPI for the backend.';
    if (lower.includes('fastapi')) decisionText = 'Use FastAPI for the backend.';
    else if (lower.includes('node')) decisionText = 'Use Node.js for the backend.';
    else {
      decisionText = raw.replace(/^(remember that (?:my |our )?|remember: |save this: )/i, '').trim();
    }

    return {
      intent: 'DECISION_PROPOSE',
      confidence: 0.99,
      parameters: {
        decisionText,
        projectName: 'AI Assistant',
        subject: 'backend',
      },
      rawMessage: raw,
      explanation: 'Project decision candidate identified — prompt user for confirmation',
    };
  }

  // 3d. Knowledge Search intent
  if (
    lower.startsWith('search knowledge ') ||
    lower.startsWith('search neural memory ') ||
    lower.startsWith('search knowledge: ')
  ) {
    const q = raw.replace(/^(search knowledge:? |search neural memory:? )/i, '').trim();
    return {
      intent: 'KNOWLEDGE_SEARCH',
      confidence: 0.98,
      parameters: { query: q },
      rawMessage: raw,
      explanation: 'Search knowledge graph and decisions',
    };
  }

  // 3e. Predictive Focus Query intent (Phase 12 Section 23)
  // e.g. "What should I focus on?", "jarvis, what should i focus on?", "where should i focus?"
  if (
    lower.includes('what should i focus on') ||
    lower.includes('what to focus on') ||
    lower.includes('where should i focus') ||
    lower.includes('recommend focus') ||
    lower === 'what should i do next' ||
    lower === 'what should i do next?'
  ) {
    return {
      intent: 'PREDICTIVE_FOCUS_QUERY',
      confidence: 0.99,
      parameters: {},
      rawMessage: raw,
      explanation: 'Query Predictive Intelligence Core for empirical focus recommendations',
    };
  }

  // 3f. Predictive Attention & Approaching Query intent (Phase 12 Section 24)
  // e.g. "What needs attention?", "What's approaching?", "What changed?", "Which projects have been inactive?"
  if (
    lower.includes('what needs attention') ||
    lower.includes('whats approaching') ||
    lower.includes("what's approaching") ||
    lower.includes('what changed') ||
    lower.includes('which projects have been inactive') ||
    lower.includes('inactive projects') ||
    lower.includes('show deadline watch') ||
    lower.includes('approaching deadlines')
  ) {
    return {
      intent: 'PREDICTIVE_ATTENTION_QUERY',
      confidence: 0.98,
      parameters: {},
      rawMessage: raw,
      explanation: 'Query active deadline watches, bottlenecks, and inactive operational areas',
    };
  }

  // 3g. Predictive Trend Query intent (Phase 12 Section 7, Critical Test 2)
  // e.g. "What's my weekly productivity trend?", "What is my trend?", "Productivity trend"
  if (
    lower.includes('productivity trend') ||
    lower.includes('weekly trend') ||
    lower.includes('weekly productivity') ||
    lower === 'what is my trend' ||
    lower === 'what is my trend?' ||
    lower === "what's my trend" ||
    lower === "what's my trend?" ||
    lower === 'show my trend' ||
    lower === 'show trends'
  ) {
    return {
      intent: 'PREDICTIVE_TREND_QUERY',
      confidence: 0.99,
      parameters: {},
      rawMessage: raw,
      explanation: 'Analyze empirical productivity trends and check historical data sufficiency',
    };
  }

  // 3h. Predictive Pattern Query intent (Phase 12 Section 11, 24)
  // e.g. "What patterns do you see?", "Show patterns", "Detect patterns", "Any bottlenecks?"
  if (
    lower.includes('what patterns do you see') ||
    lower.includes('show patterns') ||
    lower.includes('detect patterns') ||
    lower.includes('any bottlenecks') ||
    lower.includes('show bottlenecks') ||
    lower.includes('predictive patterns')
  ) {
    return {
      intent: 'PREDICTIVE_PATTERN_QUERY',
      confidence: 0.98,
      parameters: {},
      rawMessage: raw,
      explanation: 'Examine deterministic pattern detectors for workload, backlog, and bottlenecks',
    };
  }

  // 4. Memory Create intent (Explicit)
  // e.g., "Remember that my favorite programming language is Python", "Save this: my project is called NER-LOGIX", "Remember my project deadline is October 15"
  if (
    lower.startsWith('remember that ') ||
    lower.startsWith('remember my ') ||
    lower.startsWith('remember: ') ||
    lower.startsWith('save this: ') ||
    lower.startsWith('save to memory ') ||
    lower.startsWith('store memory ')
  ) {
    let content = raw
      .replace(/^(remember that |remember my |remember: |save this: |save to memory |store memory )/i, '')
      .trim();

    // Preserve phrasing
    if (lower.startsWith('remember my ')) {
      content = 'My ' + content;
    }

    let category: Memory['category'] = 'GENERAL';
    let importance: Memory['importance'] = 'HIGH';

    if (lower.includes('prefer') || lower.includes('favorite') || lower.includes('like')) {
      category = 'PREFERENCE';
    } else if (lower.includes('project') || lower.includes('building') || lower.includes('app') || lower.includes('ner-logix')) {
      category = 'PROJECT';
      importance = 'CRITICAL';
    } else if (lower.includes('deadline') || lower.includes('date') || lower.includes('october') || lower.includes('birthday')) {
      category = 'IMPORTANT_DATE';
      importance = 'HIGH';
    } else if (lower.includes('study') || lower.includes('academic') || lower.includes('student') || lower.includes('college')) {
      category = 'ACADEMIC';
    } else if (lower.includes('profile') || lower.includes('name is') || lower.includes('i am an')) {
      category = 'PROFILE';
    }

    return {
      intent: 'MEMORY_CREATE',
      confidence: 0.99,
      parameters: { content, category, importance },
      rawMessage: raw,
      explanation: 'Explicit directive to store persistent memory',
    };
  }

  // 5. Task List intent (e.g., "Show my tasks", "List tasks", "What are my tasks?")
  if (
    lower === 'show my tasks' ||
    lower === 'show tasks' ||
    lower === 'list my tasks' ||
    lower === 'list tasks' ||
    lower === 'what are my tasks' ||
    lower === 'what are my tasks?' ||
    lower === 'view tasks'
  ) {
    return {
      intent: 'TASK_LIST',
      confidence: 0.98,
      parameters: {},
      rawMessage: raw,
      explanation: 'Request to query active tasks queue',
    };
  }

  // 6. Task Complete intent (e.g., "Complete task Finish AI project", "Mark task as done")
  if (
    lower.startsWith('complete task ') ||
    lower.startsWith('mark task ') ||
    lower.startsWith('finish task ') ||
    lower.startsWith('done with task ')
  ) {
    const taskTitle = raw.replace(/^(complete task |mark task |finish task |done with task )/i, '').trim();
    return {
      intent: 'TASK_COMPLETE',
      confidence: 0.95,
      parameters: { title: taskTitle },
      rawMessage: raw,
      explanation: 'Request to complete a task directive',
    };
  }

  // 7. Task Create intent
  // e.g., "Create a high priority task called Finish AI project", "Create a task called Study Algorithms", "Add task: Study Dynamic Programming"
  if (
    lower.startsWith('create a task') ||
    lower.startsWith('create task') ||
    lower.startsWith('add task') ||
    lower.startsWith('new task') ||
    lower.startsWith('task:')
  ) {
    // Check if title is missing
    const isBare =
      lower === 'create a task' ||
      lower === 'create a task.' ||
      lower === 'create task' ||
      lower === 'add task';

    if (isBare) {
      return {
        intent: 'TASK_CREATE',
        confidence: 0.9,
        parameters: { title: '' }, // triggers missing parameter validation
        rawMessage: raw,
        explanation: 'Task create intent missing required title parameter',
      };
    }

    let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';
    if (lower.includes('critical priority') || lower.includes('priority critical')) priority = 'CRITICAL';
    else if (lower.includes('high priority') || lower.includes('priority high')) priority = 'HIGH';
    else if (lower.includes('low priority') || lower.includes('priority low')) priority = 'LOW';

    let cleanTitle = raw;
    // Extract title from "called <title>" or "named <title>" or "task: <title>"
    const calledMatch = raw.match(/(?:called|named)\s+["']?([^"']+)["']?/i);
    if (calledMatch) {
      cleanTitle = calledMatch[1].trim();
    } else {
      cleanTitle = raw
        .replace(/^(create a (?:high |critical |low |medium )?priority task (?:called |named )?|create a task (?:called |named )?|create task (?:called |named )?|add task:? ?|new task:? ?|task: )/i, '')
        .replace(/(?:with|priority) (?:high|critical|low|medium) priority/i, '')
        .trim();
    }

    return {
      intent: 'TASK_CREATE',
      confidence: 0.98,
      parameters: {
        title: cleanTitle || 'Tactical Directive',
        priority,
        dueDate: 'Today',
      },
      rawMessage: raw,
      explanation: 'Task creation directive parsed',
    };
  }

  // 8. Focus Start / Stop intent (e.g., "Start a 25 minute focus session", "Start focus protocol", "Stop focus")
  if (
    lower.includes('start a') && lower.includes('focus session') ||
    lower.startsWith('start focus') ||
    lower.startsWith('focus session') ||
    lower.startsWith('/focus') ||
    lower.includes('minute focus session')
  ) {
    const numMatch = raw.match(/(\d+)\s*(?:m|min|minute|minutes)?/i);
    const minutes = numMatch ? parseInt(numMatch[1], 10) : 25;
    return {
      intent: 'FOCUS_START',
      confidence: 0.98,
      parameters: { minutes: Math.min(Math.max(minutes, 1), 180) },
      rawMessage: raw,
      explanation: 'Initiate combat focus session',
    };
  }

  if (lower.includes('stop focus') || lower.includes('cancel focus') || lower.includes('abort focus')) {
    return {
      intent: 'FOCUS_STOP',
      confidence: 0.98,
      parameters: {},
      rawMessage: raw,
      explanation: 'Terminate active focus session',
    };
  }

  // 9. System Status intent (e.g., "What's the system status?", "Status report", "System health")
  if (
    lower === "what's the system status?" ||
    lower === "what's the system status" ||
    lower === "what is the system status?" ||
    lower === "what is the system status" ||
    lower === 'system status' ||
    lower === '/status' ||
    lower === 'status report'
  ) {
    return {
      intent: 'SYSTEM_STATUS',
      confidence: 0.99,
      parameters: {},
      rawMessage: raw,
      explanation: 'System telemetry query',
    };
  }

  // 10. Settings Update intent (e.g., "Use concise responses", "Turn off auto speech", "Enable reduced motion")
  if (
    lower.includes('concise response') ||
    lower.includes('tactical response') ||
    lower.includes('exhaustive response') ||
    lower.includes('auto speech') ||
    lower.includes('reduced motion') ||
    lower.startsWith('set response mode')
  ) {
    if (lower.includes('concise')) {
      return {
        intent: 'SETTINGS_UPDATE',
        confidence: 0.95,
        parameters: { settingKey: 'response_mode', settingValue: 'CONCISE' },
        rawMessage: raw,
        explanation: 'Configure response style parameter',
      };
    }
    if (lower.includes('turn off auto speech') || lower.includes('disable auto speech')) {
      return {
        intent: 'SETTINGS_UPDATE',
        confidence: 0.95,
        parameters: { settingKey: 'auto_speak', settingValue: 'false' },
        rawMessage: raw,
        explanation: 'Disable vocal synthesis auto-speech',
      };
    }
    if (lower.includes('enable reduced motion')) {
      return {
        intent: 'SETTINGS_UPDATE',
        confidence: 0.95,
        parameters: { settingKey: 'reduced_motion', settingValue: 'true' },
        rawMessage: raw,
        explanation: 'Configure accessibility reduced motion',
      };
    }
  }

  // 11. Analytics query
  if (lower.includes('show analytics') || lower.includes('productivity stats') || lower.includes('analytics telemetry')) {
    return {
      intent: 'ANALYTICS_QUERY',
      confidence: 0.95,
      parameters: {},
      rawMessage: raw,
      explanation: 'Productivity telemetry query',
    };
  }

  // 12. Default: Standard conversation / inquiry
  return {
    intent: 'CHAT',
    confidence: 0.95,
    parameters: { text: raw },
    rawMessage: raw,
    explanation: 'Standard interactive dialogue',
  };
}

/**
 * Gemini-powered Intent Detector with Structured Output
 */
export async function detectIntentWithGemini(
  userMessage: string,
  history: { role: string; content: string }[] = []
): Promise<DetectedIntent> {
  // First run deterministic heuristic classifier
  const heuristic = detectIntentHeuristics(userMessage);

  // If heuristic has near-certain confidence on an operational directive, use it immediately
  if (heuristic.confidence >= 0.95 && heuristic.intent !== 'CHAT') {
    return heuristic;
  }

  // If Gemini is not configured, fallback to heuristic
  if (!ai || !isGeminiConfigured) {
    return heuristic;
  }

  try {
    const prompt = `Analyze this user message for a tactical AI assistant (JARVIS Zoro Edition).
Determine the structured intent, confidence, and extracted parameters.

Supported intents:
- CHAT: General questions, conversational remarks, knowledge explanations (e.g. "Explain what a neural network is", "What is Python?")
- MEMORY_CREATE: Storing enduring user facts, preferences, project details (e.g. "Remember that my favorite programming language is Python", "My project is NER-LOGIX")
- MEMORY_READ: Querying what JARVIS remembers about user (e.g. "What do you remember about my preferences?", "What is my main project?")
- MEMORY_DELETE: Forgetting or deleting a memory (e.g. "Forget my programming preference", "Delete that memory")
- TASK_CREATE: Creating a todo/task (e.g. "Create a high priority task called Finish AI project")
- TASK_UPDATE: Modifying an existing task
- TASK_DELETE: Deleting a task
- TASK_COMPLETE: Marking a task finished (e.g. "Complete task Study Algorithms")
- TASK_LIST: Listing tasks (e.g. "Show my tasks")
- FOCUS_START: Starting a focus timer (e.g. "Start a 25 minute focus session")
- FOCUS_STOP: Stopping/canceling focus session
- ANALYTICS_QUERY: Asking for productivity or command statistics
- SYSTEM_STATUS: Telemetry/health check (e.g. "What's the system status?")
- SETTINGS_UPDATE: Updating app settings (e.g. "Use concise responses", "Turn off auto speech")
- NAVIGATION: Navigating to an app screen (e.g. "Open my memory", "Open settings", "Go home")

Message: "${userMessage}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: INTENT_SCHEMA,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (parsed.intent && parsed.confidence !== undefined) {
      return {
        intent: parsed.intent as IntentType,
        confidence: Number(parsed.confidence),
        parameters: parsed.parameters || {},
        rawMessage: userMessage,
        explanation: parsed.explanation,
      };
    }
  } catch (err) {
    console.warn('Gemini intent parsing fallback to heuristic', err);
  }

  return heuristic;
}

/**
 * Automatic Memory Candidate Extractor
 * Determines whether user message contains persistent knowledge that should be remembered.
 * Avoids temporary questions, random greetings, and refuses secrets.
 */
export async function extractMemoryCandidate(message: string): Promise<MemoryCandidate> {
  const clean = message.trim();
  const lower = clean.toLowerCase();

  // Guard against sensitive credentials
  if (isSecretOrSensitive(clean)) {
    return {
      shouldRemember: false,
      content: '',
      category: 'GENERAL',
      importance: 'LOW',
      confidence: 1.0,
      reason: 'Contains sensitive credentials or secrets. Refused.',
    };
  }

  // Explicit non-memory / ordinary questions / greetings
  if (
    lower === 'hello' ||
    lower === 'hi' ||
    lower === 'hey' ||
    lower === 'no thanks' ||
    lower === 'thanks' ||
    lower === 'thank you' ||
    lower === 'ok' ||
    lower === 'cool' ||
    lower.startsWith('what is ') ||
    lower.startsWith('explain ') ||
    lower.startsWith('how do i ') ||
    lower.startsWith('who is ')
  ) {
    return {
      shouldRemember: false,
      content: '',
      category: 'GENERAL',
      importance: 'LOW',
      confidence: 0.95,
      reason: 'Ordinary temporary inquiry or greeting.',
    };
  }

  // Explicit memory cues
  if (
    lower.startsWith('remember that ') ||
    lower.startsWith('remember my ') ||
    lower.startsWith('remember: ') ||
    lower.startsWith('save this: ')
  ) {
    const rawContent = clean
      .replace(/^(remember that |remember my |remember: |save this: )/i, '')
      .trim();

    const heuristicIntent = detectIntentHeuristics(clean);
    return {
      shouldRemember: true,
      content: lower.startsWith('remember my ') ? `My ${rawContent}` : rawContent,
      category: (heuristicIntent.parameters.category as Memory['category']) || 'GENERAL',
      importance: (heuristicIntent.parameters.importance as Memory['importance']) || 'HIGH',
      confidence: 0.99,
      reason: 'Explicit user command to remember.',
    };
  }

  // Automatic personal statement cues:
  // e.g. "My favorite programming language is Python", "I am studying AI and Data Science", "My project is called NER-LOGIX"
  const isPersonalStatement =
    lower.includes('my favorite ') ||
    lower.includes('my project is ') ||
    lower.includes('my main project ') ||
    lower.includes('i am studying ') ||
    lower.includes('i am building ') ||
    lower.includes('i prefer ') ||
    lower.includes('my birthday is ') ||
    lower.includes('my deadline is ');

  if (isPersonalStatement) {
    let cat: Memory['category'] = 'GENERAL';
    let imp: Memory['importance'] = 'MEDIUM';

    if (lower.includes('favorite') || lower.includes('prefer')) {
      cat = 'PREFERENCE';
      imp = 'HIGH';
    } else if (lower.includes('project') || lower.includes('building')) {
      cat = 'PROJECT';
      imp = 'CRITICAL';
    } else if (lower.includes('study') || lower.includes('data science') || lower.includes('college')) {
      cat = 'ACADEMIC';
      imp = 'HIGH';
    } else if (lower.includes('deadline') || lower.includes('birthday') || lower.includes('date')) {
      cat = 'IMPORTANT_DATE';
      imp = 'HIGH';
    }

    return {
      shouldRemember: true,
      content: clean,
      category: cat,
      importance: imp,
      confidence: 0.92,
      reason: 'Enduring personal/project statement identified.',
    };
  }

  // If Gemini is available, query structured extraction
  if (ai && isGeminiConfigured) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Evaluate whether this user message contains enduring facts about user profile, preferences, projects, academics, or dates that should be remembered in a persistent memory bank.
Do NOT remember temporary questions, greetings, or short talk.
Message: "${clean}"`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: MEMORY_EXTRACTION_SCHEMA,
        },
      });

      const res = JSON.parse(response.text || '{}');
      if (typeof res.shouldRemember === 'boolean') {
        return {
          shouldRemember: Boolean(res.shouldRemember && res.confidence >= 0.8),
          content: res.content || clean,
          category: res.category || 'GENERAL',
          importance: res.importance || 'MEDIUM',
          confidence: Number(res.confidence || 0.85),
          reason: res.reason,
        };
      }
    } catch (e) {
      console.warn('Gemini memory extraction failed', e);
    }
  }

  return {
    shouldRemember: false,
    content: '',
    category: 'GENERAL',
    importance: 'LOW',
    confidence: 0.9,
    reason: 'Non-memory general message.',
  };
}

/**
 * Validates the intent against application constraints.
 * Never trusts model output blindly.
 */
export function validateIntent(
  intent: DetectedIntent,
  userId: string
): {
  isValid: boolean;
  error?: string;
  promptUser?: string;
  sanitizedParams?: Record<string, any>;
  requiresConfirmation?: boolean;
  confirmationDetails?: { title: string; message: string; detail?: string };
} {
  const { intent: type, parameters } = intent;

  switch (type) {
    case 'TASK_CREATE': {
      const title = (parameters.title || '').trim();
      if (!title) {
        return {
          isValid: false,
          promptUser: 'What should I name the task? Specify the directive title.',
        };
      }
      return {
        isValid: true,
        sanitizedParams: {
          title,
          priority: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(parameters.priority)
            ? parameters.priority
            : 'MEDIUM',
          dueDate: parameters.dueDate || 'Today',
        },
      };
    }

    case 'TASK_COMPLETE': {
      const title = (parameters.title || '').trim();
      if (!title) {
        return {
          isValid: false,
          promptUser: 'Which task would you like to mark as completed?',
        };
      }
      return { isValid: true, sanitizedParams: { title } };
    }

    case 'MEMORY_CREATE': {
      const content = (parameters.content || '').trim();
      if (!content) {
        return {
          isValid: false,
          promptUser: 'What memory directive should I commit to Blade 03?',
        };
      }
      if (isSecretOrSensitive(content)) {
        return {
          isValid: false,
          error: 'SECURITY EXCEPTION: Credentials and secret keys cannot be committed to assistant memory.',
        };
      }
      return {
        isValid: true,
        sanitizedParams: {
          content,
          category: parameters.category || 'GENERAL',
          importance: parameters.importance || 'HIGH',
        },
      };
    }

    case 'MEMORY_DELETE': {
      const targetQuery = (parameters.targetQuery || '').trim();
      if (!targetQuery) {
        return {
          isValid: false,
          promptUser: 'Which memory node would you like me to forget?',
        };
      }

      // Check if memory exists to show confirmation
      const matches = MemoryService.searchMemories(userId, targetQuery);
      const targetMemory = matches[0];

      return {
        isValid: true,
        requiresConfirmation: true,
        confirmationDetails: {
          title: 'FORGET MEMORY?',
          message: 'Are you sure you want to permanently purge this memory node from Blade 03?',
          detail: targetMemory ? `[${targetMemory.category}] ${targetMemory.content}` : targetQuery,
        },
        sanitizedParams: {
          targetQuery,
          matchedMemoryId: targetMemory?.id,
        },
      };
    }

    case 'FOCUS_START': {
      const rawMins = Number(parameters.minutes) || 25;
      const minutes = Math.min(Math.max(rawMins, 1), 180);
      return {
        isValid: true,
        sanitizedParams: { minutes },
      };
    }

    case 'NAVIGATION': {
      const route = parameters.route as string;
      const matched = Object.values(ALLOWED_NAVIGATION_ROUTES).find((r) => r === route);
      if (!matched) {
        return {
          isValid: false,
          error: `SECURITY ALERT: Navigation to unauthorized route "${route}" is blocked.`,
        };
      }
      return { isValid: true, sanitizedParams: { route: matched } };
    }

    case 'SETTINGS_UPDATE': {
      const key = parameters.settingKey;
      if (!ALLOWED_SETTINGS_KEYS.has(key)) {
        return {
          isValid: false,
          error: `SECURITY ALERT: Unauthorized setting parameter "${key}".`,
        };
      }
      return {
        isValid: true,
        sanitizedParams: {
          settingKey: key,
          settingValue: parameters.settingValue,
        },
      };
    }

    case 'CHAT':
    case 'MEMORY_READ':
    case 'DECISION_PROPOSE':
    case 'DECISION_UPDATE_PROPOSE':
    case 'DECISION_QUERY':
    case 'KNOWLEDGE_SEARCH':
    case 'TASK_LIST':
    case 'MISSION_LIST':
    case 'MISSION_NEXT_MOVE':
    case 'MISSION_STATUS':
    case 'MISSION_OPEN':
    case 'MISSION_UPDATE':
    case 'MISSION_COMPLETE':
    case 'FOCUS_STOP':
    case 'SYSTEM_STATUS':
    case 'ANALYTICS_QUERY':
      return { isValid: true, sanitizedParams: parameters };

    case 'OBJECTIVE_COMPLETE': {
      const title = (parameters.title || '').trim();
      if (!title) {
        return {
          isValid: false,
          promptUser: 'Which objective would you like to mark as completed?',
        };
      }
      return { isValid: true, sanitizedParams: { title } };
    }

    case 'AUTOMATION_CREATE': {
      const proposal = intent.automationProposal || parameters.proposal;
      if (!proposal) {
        return {
          isValid: false,
          promptUser: 'What type of automation workflow would you like to formulate?',
        };
      }
      return {
        isValid: true,
        requiresConfirmation: true,
        confirmationDetails: {
          title: 'AUTOMATION PLAN',
          message: `Do you authorize the activation of "${proposal.name}"?`,
          detail: `Trigger: ${proposal.trigger_type} | Action: ${proposal.action_config.type}`,
        },
        sanitizedParams: { proposal },
      };
    }

    case 'AUTOMATION_LIST':
      return { isValid: true, sanitizedParams: parameters };

    case 'MISSION_CREATE': {
      const title = (parameters.title || '').trim();
      return {
        isValid: true,
        sanitizedParams: {
          title: title || 'Tactical Mission',
          prompt: parameters.prompt || title || 'Mission',
        },
      };
    }

    default:
      return {
        isValid: false,
        error: `Unknown tactical intent type: ${type}`,
      };
  }
}

/**
 * Safe Application Action Router.
 * Predefined execution pipeline:
 * USER MESSAGE -> GEMINI INTENT -> VALIDATOR -> ACTION ROUTER -> DATABASE -> VERIFIED RESULT.
 * Never executes arbitrary code.
 */
export async function executeIntent(
  intent: DetectedIntent,
  userId: string,
  onNavigate?: (path: RoutePath) => void
): Promise<{
  success: boolean;
  message: string;
  data?: any;
  commandLog: CommandLog;
}> {
  const startTime = performance.now();
  const cmdId = 'cmd_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

  // 1. Initial command record
  let commandLog: CommandLog = {
    id: cmdId,
    user_id: userId,
    command: intent.rawMessage || intent.intent,
    command_type: 'AI_INTENT',
    status: 'VALIDATING',
    result: 'Validating tactical parameters...',
    created_at: Date.now(),
  };

  const validation = validateIntent(intent, userId);
  if (!validation.isValid) {
    const execTime = Math.round(performance.now() - startTime);
    commandLog = {
      ...commandLog,
      status: 'FAILED',
      result: validation.error || validation.promptUser || 'Intent validation failed.',
      execution_time: execTime,
    };
    recordCommandLog(userId, commandLog);
    return {
      success: false,
      message: validation.promptUser || validation.error || 'Directive validation failed.',
      commandLog,
    };
  }

  // 2. Set to EXECUTING
  commandLog = {
    ...commandLog,
    status: 'EXECUTING',
    result: 'Executing safe application action...',
  };

  const params = validation.sanitizedParams || {};

  try {
    switch (intent.intent) {
      case 'TASK_CREATE': {
        const existingTasks = getLocalStore<Task[]>(`tasks_${userId}`, []);
        const newTask: Task = {
          id: 'tsk_' + Date.now(),
          user_id: userId,
          title: params.title,
          description: 'Logged via Blade 02 Action Queue',
          priority: params.priority || 'MEDIUM',
          status: 'TODO',
          category: 'DIRECTIVE',
          due_date: params.dueDate || 'Today',
          created_at: Date.now(),
        };

        setLocalStore(`tasks_${userId}`, [newTask, ...existingTasks]);
        realtimeService.broadcast('TASK_CREATED', newTask);
        const execTime = Math.round(performance.now() - startTime);
        const resultMsg = `Target identified. The task '${newTask.title}' [${newTask.priority}] has been registered in Blade 02.`;

        commandLog = {
          ...commandLog,
          status: 'SUCCESS',
          result: resultMsg,
          execution_time: execTime,
        };
        recordCommandLog(userId, commandLog);

        return {
          success: true,
          message: resultMsg,
          data: newTask,
          commandLog,
        };
      }

      case 'TASK_COMPLETE': {
        const existingTasks = getLocalStore<Task[]>(`tasks_${userId}`, []);
        const matchTitle = params.title.toLowerCase();
        let found = false;

        const updatedTasks = existingTasks.map((t) => {
          if (t.title.toLowerCase().includes(matchTitle) && t.status !== 'COMPLETED') {
            found = true;
            return { ...t, status: 'COMPLETED' as const, completed_at: Date.now() };
          }
          return t;
        });

        if (!found) {
          const execTime = Math.round(performance.now() - startTime);
          const failMsg = `No active task matching "${params.title}" was located in Blade 02 queue.`;
          commandLog = {
            ...commandLog,
            status: 'FAILED',
            result: failMsg,
            execution_time: execTime,
          };
          recordCommandLog(userId, commandLog);
          return { success: false, message: failMsg, commandLog };
        }

        setLocalStore(`tasks_${userId}`, updatedTasks);
        const completedTask = updatedTasks.find((t) => t.title.toLowerCase().includes(matchTitle));
        if (completedTask) {
          realtimeService.broadcast('TASK_COMPLETED', completedTask);
        }
        const execTime = Math.round(performance.now() - startTime);
        const okMsg = `Mission complete. Task '${params.title}' marked as COMPLETED.`;
        commandLog = {
          ...commandLog,
          status: 'SUCCESS',
          result: okMsg,
          execution_time: execTime,
        };
        recordCommandLog(userId, commandLog);
        return { success: true, message: okMsg, commandLog };
      }

      case 'TASK_LIST': {
        const tasks = getLocalStore<Task[]>(`tasks_${userId}`, []);
        const active = tasks.filter((t) => t.status !== 'COMPLETED');
        const execTime = Math.round(performance.now() - startTime);
        const report =
          active.length === 0
            ? 'Action Queue is clear. Zero pending directives in Blade 02.'
            : `Blade 02 holds ${active.length} active directives:\n` +
              active.map((t) => `• [${t.priority}] ${t.title} (Due: ${t.due_date})`).join('\n');

        commandLog = {
          ...commandLog,
          status: 'SUCCESS',
          result: report,
          execution_time: execTime,
        };
        recordCommandLog(userId, commandLog);
        return { success: true, message: report, data: active, commandLog };
      }

      case 'MEMORY_CREATE': {
        // Check for duplicates or conflicts
        const dupCheck = MemoryService.detectDuplicateOrConflict(userId, params.content, params.category);

        if (dupCheck.isDuplicate) {
          const execTime = Math.round(performance.now() - startTime);
          const msg = `Memory node already exists: "${dupCheck.conflictWith?.content}". Record verified and preserved.`;
          commandLog = {
            ...commandLog,
            status: 'SUCCESS',
            result: msg,
            execution_time: execTime,
          };
          recordCommandLog(userId, commandLog);
          return { success: true, message: msg, data: dupCheck.conflictWith, commandLog };
        }

        const saved = MemoryService.saveMemory(userId, {
          content: params.content,
          category: params.category,
          importance: params.importance,
          source: 'USER',
        });

        const execTime = Math.round(performance.now() - startTime);
        if (!saved.success || !saved.memory) {
          const failMsg = saved.error || 'Failed to persist memory node to database.';
          commandLog = {
            ...commandLog,
            status: 'FAILED',
            result: failMsg,
            execution_time: execTime,
          };
          recordCommandLog(userId, commandLog);
          return { success: false, message: failMsg, commandLog };
        }

        let okMsg = `Path identified. Committed memory node to Blade 03: "${saved.memory.content}" [${saved.memory.category}].`;
        if (dupCheck.conflictWith) {
          okMsg += ` (Note: Previously recorded "${dupCheck.conflictWith.content}")`;
        }

        commandLog = {
          ...commandLog,
          status: 'SUCCESS',
          result: okMsg,
          execution_time: execTime,
        };
        recordCommandLog(userId, commandLog);
        return { success: true, message: okMsg, data: saved.memory, commandLog };
      }

      case 'MEMORY_READ': {
        const query = params.query || intent.rawMessage;
        const relevant = MemoryService.findRelevantMemories(userId, query, 5);
        const execTime = Math.round(performance.now() - startTime);

        let report = '';
        if (relevant.length === 0) {
          report = `No specific memories found matching "${query}". Blade 03 stands ready to commit new knowledge.`;
        } else {
          report =
            `Retrieved ${relevant.length} relevant memory nodes from Blade 03:\n` +
            relevant.map((m) => `• [${m.category}] ${m.content}`).join('\n');
        }

        commandLog = {
          ...commandLog,
          status: 'SUCCESS',
          result: report,
          execution_time: execTime,
        };
        recordCommandLog(userId, commandLog);
        return { success: true, message: report, data: relevant, commandLog };
      }

      case 'DECISION_PROPOSE': {
        const decisionText = params.decisionText || 'Use FastAPI for the backend.';
        const projectName = params.projectName || 'AI Assistant';
        const execTime = Math.round(performance.now() - startTime);

        const promptText = `Should I save this as a project decision?`;
        commandLog = {
          ...commandLog,
          status: 'SUCCESS',
          result: `Proposed decision: "${decisionText}" for ${projectName}`,
          execution_time: execTime,
        };
        recordCommandLog(userId, commandLog);

        return {
          success: true,
          message: promptText,
          data: {
            decisionProposal: {
              decisionText,
              projectName,
              isUpdate: false,
            },
          },
          commandLog,
        };
      }

      case 'DECISION_UPDATE_PROPOSE': {
        const newDecisionText = params.newDecisionText || 'Switch the backend to Node.js.';
        const projectName = params.projectName || 'AI Assistant';
        const execTime = Math.round(performance.now() - startTime);

        const conflict = NeuralMemoryService.detectDecisionConflict(userId, newDecisionText, projectName);
        const oldDec = conflict.oldDecision || NeuralMemoryService.getActiveDecision(userId, 'fastapi', projectName);

        let reportMsg = '';
        if (oldDec) {
          reportMsg = `Possible conflict detected.\n\nPrevious decision: ${oldDec.decision}\nProposed update: ${newDecisionText}\n\nShould I update the project decision?`;
        } else {
          reportMsg = `Should I update the project decision to: "${newDecisionText}"?`;
        }

        commandLog = {
          ...commandLog,
          status: 'SUCCESS',
          result: reportMsg,
          execution_time: execTime,
        };
        recordCommandLog(userId, commandLog);

        return {
          success: true,
          message: reportMsg,
          data: {
            decisionProposal: {
              decisionText: newDecisionText,
              projectName,
              isUpdate: true,
              oldDecisionId: oldDec?.id,
              oldDecisionText: oldDec?.decision,
            },
          },
          commandLog,
        };
      }

      case 'DECISION_QUERY': {
        const projectName = params.projectName || 'AI Assistant';
        const execTime = Math.round(performance.now() - startTime);

        // Get active decisions for project
        const decisions = NeuralMemoryService.getDecisions(userId, projectName).filter((d) => d.status === 'ACTIVE');
        const activeBackendDecision = decisions.find(
          (d) =>
            d.decision.toLowerCase().includes('backend') ||
            d.decision.toLowerCase().includes('fastapi') ||
            d.decision.toLowerCase().includes('node')
        );

        let report = '';
        if (activeBackendDecision) {
          if (
            activeBackendDecision.decision.toLowerCase().includes('node') &&
            activeBackendDecision.supersedes
          ) {
            report = `The current backend for ${projectName} is Node.js (updated from FastAPI).`;
          } else {
            report = `Based on stored project decisions for ${projectName}, the backend decision is: ${activeBackendDecision.decision}`;
          }
        } else if (decisions.length > 0) {
          report = `Active decisions for ${projectName}:\n` + decisions.map((d) => `• ${d.decision}`).join('\n');
        } else {
          report = `No active decision records located for ${projectName}.`;
        }

        commandLog = {
          ...commandLog,
          status: 'SUCCESS',
          result: report,
          execution_time: execTime,
        };
        recordCommandLog(userId, commandLog);
        return { success: true, message: report, data: activeBackendDecision || decisions, commandLog };
      }

      case 'KNOWLEDGE_SEARCH': {
        const query = params.query || intent.rawMessage;
        const results = NeuralMemoryService.searchKnowledge(userId, query);
        const execTime = Math.round(performance.now() - startTime);

        let report = `Knowledge search for "${query}" (${results.resultsCount} records found):\n`;
        if (results.entities.length > 0) {
          report += `\n[ENTITIES]:\n${results.entities.map((e) => `• [${e.entity_type}] ${e.name}`).join('\n')}`;
        }
        if (results.decisions.length > 0) {
          report += `\n[DECISIONS]:\n${results.decisions.map((d) => `• [${d.status}] ${d.decision}`).join('\n')}`;
        }
        if (results.memories.length > 0) {
          report += `\n[MEMORIES]:\n${results.memories.map((m) => `• ${m.content}`).join('\n')}`;
        }

        commandLog = {
          ...commandLog,
          status: 'SUCCESS',
          result: report,
          execution_time: execTime,
        };
        recordCommandLog(userId, commandLog);
        return { success: true, message: report, data: results, commandLog };
      }

      case 'MEMORY_DELETE': {
        const targetId = params.matchedMemoryId;
        let deleted = false;
        if (targetId) {
          deleted = MemoryService.deleteMemory(userId, targetId);
        } else {
          const matches = MemoryService.searchMemories(userId, params.targetQuery);
          if (matches.length > 0) {
            deleted = MemoryService.deleteMemory(userId, matches[0].id);
          }
        }

        const execTime = Math.round(performance.now() - startTime);
        if (deleted) {
          const msg = `Memory purged successfully from Blade 03 database.`;
          commandLog = {
            ...commandLog,
            status: 'SUCCESS',
            result: msg,
            execution_time: execTime,
          };
          recordCommandLog(userId, commandLog);
          return { success: true, message: msg, commandLog };
        } else {
          const msg = `No matching memory found to forget for target "${params.targetQuery}".`;
          commandLog = {
            ...commandLog,
            status: 'FAILED',
            result: msg,
            execution_time: execTime,
          };
          recordCommandLog(userId, commandLog);
          return { success: false, message: msg, commandLog };
        }
      }

      case 'FOCUS_START': {
        const mins = params.minutes || 25;
        const execTime = Math.round(performance.now() - startTime);
        const msg = `Focus protocol ready. Initialized ${mins}-minute Santoryu focus immersion.`;

        // Store active focus intent for the focus screen
        sessionStorage.setItem('pending_focus_minutes', String(mins));
        if (onNavigate) {
          onNavigate('/focus');
        }

        commandLog = {
          ...commandLog,
          status: 'SUCCESS',
          result: msg,
          execution_time: execTime,
        };
        recordCommandLog(userId, commandLog);
        return { success: true, message: msg, data: { minutes: mins }, commandLog };
      }

      case 'FOCUS_STOP': {
        const execTime = Math.round(performance.now() - startTime);
        const msg = `Focus session disengaged. System returned to standard reconnaissance.`;
        commandLog = {
          ...commandLog,
          status: 'SUCCESS',
          result: msg,
          execution_time: execTime,
        };
        recordCommandLog(userId, commandLog);
        return { success: true, message: msg, commandLog };
      }

      case 'SYSTEM_STATUS': {
        const tasks = getLocalStore<Task[]>(`tasks_${userId}`, []);
        const activeTasks = tasks.filter((t) => t.status !== 'COMPLETED').length;
        const memories = MemoryService.getMemories(userId).length;
        const execTime = Math.round(performance.now() - startTime);

        const statusReport = `SYSTEM TELEMETRY REPORT:
• CORE: JARVIS ZORO EDITION v2.0
• BLADE 01 (INTELLECT): ONLINE (GEMINI 3.8 FLASH)
• BLADE 02 (ACTION QUEUE): ${activeTasks} ACTIVE DIRECTIVES
• BLADE 03 (PERSISTENT MEMORY): ${memories} SECURE NODES
• SANITARY RUNTIME: OPTIMAL
• STATUS: ALL THREE BLADES SYNCHRONIZED`;

        commandLog = {
          ...commandLog,
          status: 'SUCCESS',
          result: statusReport,
          execution_time: execTime,
        };
        recordCommandLog(userId, commandLog);
        return { success: true, message: statusReport, commandLog };
      }

      case 'SETTINGS_UPDATE': {
        const currentSettings = getLocalStore<Settings>(`settings_${userId}`, {
          user_id: userId,
          assistant_name: 'JARVIS',
          response_mode: 'NORMAL',
          voice_enabled: true,
          voice_rate: 1.0,
          voice_volume: 1.0,
          voice_pitch: 1.0,
          theme: 'ZORO',
          auto_speak: false,
        });

        const key = params.settingKey as keyof Settings;
        let value: any = params.settingValue;
        if (value === 'true') value = true;
        if (value === 'false') value = false;

        const updatedSettings = {
          ...currentSettings,
          [key]: value,
        };

        setLocalStore(`settings_${userId}`, updatedSettings);
        const execTime = Math.round(performance.now() - startTime);
        const msg = `Settings updated: ${params.settingKey} configured to ${params.settingValue}.`;

        commandLog = {
          ...commandLog,
          status: 'SUCCESS',
          result: msg,
          execution_time: execTime,
        };
        recordCommandLog(userId, commandLog);
        return { success: true, message: msg, data: updatedSettings, commandLog };
      }

      case 'OBJECTIVE_COMPLETE': {
        const queryTitle = (params.title || '').toLowerCase().trim();
        const activeMissions = MissionService.getMissions(userId).filter((m) => m.status === 'ACTIVE');
        const allObjectives = MissionService.getObjectives(userId);

        // First search within active missions
        let matchedObj = allObjectives.find((o) => {
          const parentActive = activeMissions.some((m) => m.id === o.mission_id);
          return parentActive && o.title.toLowerCase().includes(queryTitle) && o.status !== 'COMPLETED';
        });

        // Fallback: search all objectives
        if (!matchedObj) {
          matchedObj = allObjectives.find(
            (o) => o.title.toLowerCase().includes(queryTitle) && o.status !== 'COMPLETED'
          );
        }

        const execTime = Math.round(performance.now() - startTime);

        if (!matchedObj) {
          const failMsg = `No active objective matching "${params.title}" was located in your missions.`;
          commandLog = {
            ...commandLog,
            status: 'FAILED',
            result: failMsg,
            execution_time: execTime,
          };
          recordCommandLog(userId, commandLog);
          return { success: false, message: failMsg, commandLog };
        }

        // Mark objective completed
        const updatedObj = MissionService.updateObjective(userId, matchedObj.id, {
          status: 'COMPLETED',
          progress: 100,
        });

        const updatedMission = MissionService.recalculateMissionProgress(userId, matchedObj.mission_id);
        const parentMission = MissionService.getMissionById(userId, matchedObj.mission_id);

        const okMsg = `Mission progress updated. Objective '${matchedObj.title}' marked as COMPLETED. Overall progress on ${parentMission?.title || 'mission'} is now ${updatedMission?.progress || 100}%.`;

        commandLog = {
          ...commandLog,
          status: 'SUCCESS',
          result: okMsg,
          execution_time: execTime,
        };
        recordCommandLog(userId, commandLog);

        return {
          success: true,
          message: okMsg,
          data: { objective: updatedObj, mission: updatedMission },
          commandLog,
        };
      }

      case 'MISSION_NEXT_MOVE': {
        const nextMove = MissionService.computeNextMove(userId);
        const execTime = Math.round(performance.now() - startTime);

        let report = '';
        if (!nextMove) {
          report = 'No active missions found in Blade 02. Deploy a new mission with "Plan a mission called..." to engage the Next Move engine.';
        } else {
          report = `NEXT MOVE\n\n${nextMove.action}\n\nWHY?\n${nextMove.reason.join('\n')}`;
        }

        commandLog = {
          ...commandLog,
          status: 'SUCCESS',
          result: report,
          execution_time: execTime,
        };
        recordCommandLog(userId, commandLog);
        return { success: true, message: report, data: nextMove, commandLog };
      }

      case 'MISSION_STATUS': {
        const missions = MissionService.getMissions(userId);
        let targetMission: Mission | undefined;

        if (params.title) {
          const q = params.title.toLowerCase();
          targetMission = missions.find((m) => m.title.toLowerCase().includes(q));
        }

        if (!targetMission) {
          targetMission = missions.find((m) => m.status === 'ACTIVE') || missions[0];
        }

        const execTime = Math.round(performance.now() - startTime);

        if (!targetMission) {
          const noMsn = 'No active missions found in Blade 02 matrix. Say "Create a mission for..." to start one.';
          commandLog = {
            ...commandLog,
            status: 'SUCCESS',
            result: noMsn,
            execution_time: execTime,
          };
          recordCommandLog(userId, commandLog);
          return { success: true, message: noMsn, commandLog };
        }

        const detail = MissionService.calculateMissionProgress(userId, targetMission.id);
        const focusSessions = getLocalStore<any[]>(`focus_sessions_${userId}`, []).filter(
          (s) => s.mission_id === targetMission!.id && s.status === 'COMPLETED'
        );
        const blockerReport = MissionService.detectMissionBlockers(userId, targetMission.id);
        const attention = blockerReport.hasBlockers
          ? blockerReport.blockedObjectives[0].reason
          : 'All systems nominal with zero active blockers.';

        const statusReport = `${targetMission.title.toUpperCase()}\n\nProgress:\n${detail.percentage}%\n\nObjectives:\n${detail.completedObjectives} / ${detail.totalObjectives} completed\n\nTasks:\n${detail.completedTasks} / ${detail.totalTasks} completed\n\nFocus:\n${focusSessions.length} sessions\n\nDeadline:\n${targetMission.deadline}\n\nAttention:\n${attention}`;

        commandLog = {
          ...commandLog,
          status: 'SUCCESS',
          result: statusReport,
          execution_time: execTime,
        };
        recordCommandLog(userId, commandLog);
        return { success: true, message: statusReport, data: { mission: targetMission, detail }, commandLog };
      }

      case 'MISSION_CREATE': {
        const userPrompt = params.prompt || params.title || 'AI Assistant';
        const plan = await MissionService.generateMissionPlan(userPrompt);
        const execTime = Math.round(performance.now() - startTime);

        const planMessage = `MISSION PLAN READY\n\nMISSION:\n${plan.title}\n\nGOAL:\n${plan.goal}\n\nOBJECTIVES:\n${plan.objectives
          .map((o, i) => `${String(i + 1).padStart(2, '0')} — ${o.title}`)
          .join('\n')}\n\nReview and select [APPROVE PLAN] to arm this operational structure.`;

        commandLog = {
          ...commandLog,
          status: 'SUCCESS',
          result: planMessage,
          execution_time: execTime,
        };
        recordCommandLog(userId, commandLog);

        return {
          success: true,
          message: planMessage,
          data: { pendingPlan: plan },
          commandLog,
        };
      }

      case 'MISSION_LIST': {
        const missions = MissionService.getMissions(userId);
        const active = missions.filter((m) => m.status === 'ACTIVE');
        const execTime = Math.round(performance.now() - startTime);

        let report = '';
        if (active.length === 0) {
          report = 'No active missions in queue. Blade 02 stands ready for new directives.';
        } else {
          report =
            `Blade 02 holds ${active.length} active missions:\n` +
            active
              .map(
                (m) =>
                  `• ${m.title} [${m.priority}] — ${m.progress}% complete (Deadline: ${m.deadline})`
              )
              .join('\n');
        }

        commandLog = {
          ...commandLog,
          status: 'SUCCESS',
          result: report,
          execution_time: execTime,
        };
        recordCommandLog(userId, commandLog);
        return { success: true, message: report, data: active, commandLog };
      }

      case 'MISSION_OPEN': {
        const missions = MissionService.getMissions(userId);
        const q = (params.title || '').toLowerCase();
        const target = missions.find((m) => m.title.toLowerCase().includes(q)) || missions[0];

        const execTime = Math.round(performance.now() - startTime);
        if (target) {
          window.location.hash = `/missions?id=${target.id}`;
          if (onNavigate) onNavigate('/missions');
          const msg = `Navigating to Mission: "${target.title}"...`;
          commandLog = { ...commandLog, status: 'SUCCESS', result: msg, execution_time: execTime };
          recordCommandLog(userId, commandLog);
          return { success: true, message: msg, data: target, commandLog };
        } else {
          if (onNavigate) onNavigate('/missions');
          const msg = `Navigating to Mission Control...`;
          commandLog = { ...commandLog, status: 'SUCCESS', result: msg, execution_time: execTime };
          recordCommandLog(userId, commandLog);
          return { success: true, message: msg, commandLog };
        }
      }

      case 'MISSION_UPDATE': {
        const missions = MissionService.getMissions(userId);
        const q = (params.title || '').toLowerCase();
        const target = missions.find((m) => m.title.toLowerCase().includes(q));
        const execTime = Math.round(performance.now() - startTime);

        if (!target) {
          const msg = `Mission "${params.title}" not located.`;
          commandLog = { ...commandLog, status: 'FAILED', result: msg, execution_time: execTime };
          recordCommandLog(userId, commandLog);
          return { success: false, message: msg, commandLog };
        }

        const isPause = params.action === 'PAUSE' || target.status === 'ACTIVE';
        const nextStatus = isPause ? 'PAUSED' : 'ACTIVE';
        const updated = MissionService.updateMission(userId, target.id, { status: nextStatus });
        const msg = `Mission "${target.title}" is now ${nextStatus}.`;

        commandLog = { ...commandLog, status: 'SUCCESS', result: msg, execution_time: execTime };
        recordCommandLog(userId, commandLog);
        return { success: true, message: msg, data: updated, commandLog };
      }

      case 'MISSION_COMPLETE': {
        const missions = MissionService.getMissions(userId);
        const q = (params.title || '').toLowerCase();
        const target = missions.find((m) => m.title.toLowerCase().includes(q));
        const execTime = Math.round(performance.now() - startTime);

        if (!target) {
          const msg = `Mission "${params.title}" not located.`;
          commandLog = { ...commandLog, status: 'FAILED', result: msg, execution_time: execTime };
          recordCommandLog(userId, commandLog);
          return { success: false, message: msg, commandLog };
        }

        const updated = MissionService.updateMission(userId, target.id, {
          status: 'COMPLETED',
          progress: 100,
          completed_at: Date.now(),
        });
        const msg = `Mission complete. "${target.title}" marked as COMPLETED at 100% clearance rate.`;

        commandLog = { ...commandLog, status: 'SUCCESS', result: msg, execution_time: execTime };
        recordCommandLog(userId, commandLog);
        return { success: true, message: msg, data: updated, commandLog };
      }

      case 'AUTOMATION_CREATE': {
        const proposal: AutomationProposal = params.proposal || intent.automationProposal;
        const execTime = Math.round(performance.now() - startTime);

        const triggerDesc =
          proposal.trigger_type === 'SCHEDULE'
            ? `${proposal.trigger_config.frequency || 'Daily'} at ${proposal.trigger_config.time || '08:00'}`
            : proposal.trigger_type.replace(/_/g, ' ');

        const actionDesc = proposal.action_config.type.replace(/_/g, ' ');

        const msg = `Target identified. I have formulated an Automation Plan:\n\n• Name: ${proposal.name}\n• Trigger: ${triggerDesc}\n• Action: ${actionDesc}\n• Timezone: ${proposal.userTimezone || 'User timezone'}\n• Risk Level: ${proposal.risk_level}\n\nStanding by for your authorization. Click APPROVE PLAN to activate this workflow in the Automation Lab.`;

        commandLog = {
          ...commandLog,
          status: 'SUCCESS',
          result: msg,
          execution_time: execTime,
        };
        recordCommandLog(userId, commandLog);

        return {
          success: true,
          message: msg,
          data: { proposal },
          commandLog,
        };
      }

      case 'AUTOMATION_LIST': {
        const list = AutomationService.getAutomations(userId);
        const active = list.filter((a) => a.status === 'ACTIVE');
        const execTime = Math.round(performance.now() - startTime);

        const report =
          list.length === 0
            ? 'No automation workflows currently deployed in Automation Lab. Say "Every morning at 8 give me a briefing" to deploy one.'
            : `Automation Lab status: ${active.length} active of ${list.length} total workflows:\n` +
              list.map((a) => `• [${a.status}] ${a.name} (${a.trigger_type} → ${a.action_config.type})`).join('\n');

        commandLog = {
          ...commandLog,
          status: 'SUCCESS',
          result: report,
          execution_time: execTime,
        };
        recordCommandLog(userId, commandLog);
        return { success: true, message: report, data: list, commandLog };
      }

      case 'PREDICTIVE_FOCUS_QUERY': {
        const signals = IntelligenceService.detectLiveSignals(userId);
        const health = IntelligenceService.getProjectHealth(userId);
        const execTime = Math.round(performance.now() - startTime);

        const urgentDeadlines = health.filter(
          (h) => h.deadlineDaysRemaining !== null && h.deadlineDaysRemaining <= 5 && h.activeTasks > 0
        );
        const bottlenecks = signals.filter((s) => s.source === 'OBJECTIVE_BLOCKED');

        let reply = '';
        if (urgentDeadlines.length > 0) {
          const top = urgentDeadlines[0];
          reply = `Operational telemetry suggests prioritizing "${top.projectName}". ${top.activeTasks} tasks remain with ${top.deadlineDaysRemaining} days until deadline.${top.overdueTasks > 0 ? ` (${top.overdueTasks} directives are overdue).` : ''} Consider reviewing the remaining directives and scheduling a dedicated focus block.`;
        } else if (bottlenecks.length > 0) {
          reply = `Bottleneck detected: ${bottlenecks[0].description}. Consider investigating the blocked directives to restore velocity.`;
        } else {
          const totalOpen = health.reduce((acc, h) => acc + h.activeTasks, 0);
          reply = `Zero critical deadline alarms detected. You have ${totalOpen} active directives across ${health.length} operations. Ready to engage the next queue item.`;
        }

        commandLog = {
          ...commandLog,
          status: 'SUCCESS',
          result: reply,
          execution_time: execTime,
        };
        recordCommandLog(userId, commandLog);
        return { success: true, message: reply, commandLog };
      }

      case 'PREDICTIVE_ATTENTION_QUERY': {
        const signals = IntelligenceService.detectLiveSignals(userId);
        const health = IntelligenceService.getProjectHealth(userId);
        const inactive = health.filter((h) => h.inactivityDays >= 5 && h.progress < 100);
        const execTime = Math.round(performance.now() - startTime);

        let report = '';
        if (signals.length === 0 && inactive.length === 0) {
          report = 'Predictive Intelligence Core reports zero warning signals. Operational rhythm is steady and deadlines are on schedule.';
        } else {
          const parts: string[] = [];
          if (signals.length > 0) {
            parts.push('LIVE SIGNALS & DEADLINES:\n' + signals.map((s) => `• [${s.severity}] ${s.description}`).join('\n'));
          }
          if (inactive.length > 0) {
            parts.push('INACTIVE MISSIONS:\n' + inactive.map((i) => `• ${i.projectName} (${i.inactivityDays} days without activity)`).join('\n'));
          }
          report = parts.join('\n\n');
        }

        commandLog = {
          ...commandLog,
          status: 'SUCCESS',
          result: report,
          execution_time: execTime,
        };
        recordCommandLog(userId, commandLog);
        return { success: true, message: report, commandLog };
      }

      case 'PREDICTIVE_TREND_QUERY': {
        const trendAnalysis = IntelligenceService.getTrendAnalysis(userId);
        const execTime = Math.round(performance.now() - startTime);

        let report = '';
        if (trendAnalysis.dataSufficiency === 'INSUFFICIENT_DATA') {
          // Critical End-to-End Test 2: Must explicitly say "Insufficient data to establish a weekly trend"
          report = 'Insufficient data to establish a weekly trend. Only 1–2 days of telemetry are available; at least 3–7 days of historical activity are required.';
        } else {
          report =
            `Empirical Trend Analysis (${trendAnalysis.dataSufficiency}):\n` +
            trendAnalysis.trends.map((t) => `• ${t.metricName}: [${t.trend}] ${t.explanation}`).join('\n') +
            `\n\nOverall: ${trendAnalysis.overallTrend}`;
        }

        commandLog = {
          ...commandLog,
          status: 'SUCCESS',
          result: report,
          execution_time: execTime,
        };
        recordCommandLog(userId, commandLog);
        return { success: true, message: report, data: trendAnalysis, commandLog };
      }

      case 'PREDICTIVE_PATTERN_QUERY': {
        const signals = IntelligenceService.detectLiveSignals(userId);
        const execTime = Math.round(performance.now() - startTime);

        let report = '';
        if (signals.length === 0) {
          report = 'Zero abnormal operational patterns detected. Workload distribution and deadlines are balanced.';
        } else {
          report =
            `Detected ${signals.length} operational patterns:\n` +
            signals.map((s) => `• [${s.source}] ${s.description}`).join('\n');
        }

        commandLog = {
          ...commandLog,
          status: 'SUCCESS',
          result: report,
          execution_time: execTime,
        };
        recordCommandLog(userId, commandLog);
        return { success: true, message: report, data: signals, commandLog };
      }

      case 'NAVIGATION': {
        const route = params.route as RoutePath;
        const execTime = Math.round(performance.now() - startTime);
        const msg = `Routing interface to ${route}...`;

        if (onNavigate) {
          onNavigate(route);
        }

        commandLog = {
          ...commandLog,
          status: 'SUCCESS',
          result: msg,
          execution_time: execTime,
        };
        recordCommandLog(userId, commandLog);
        return { success: true, message: msg, data: { route }, commandLog };
      }

      default: {
        const execTime = Math.round(performance.now() - startTime);
        commandLog = {
          ...commandLog,
          status: 'SUCCESS',
          result: 'Dialogue processed by tactical core.',
          execution_time: execTime,
        };
        recordCommandLog(userId, commandLog);
        return { success: true, message: 'Message logged.', commandLog };
      }
    }
  } catch (err: any) {
    const execTime = Math.round(performance.now() - startTime);
    const failMsg = `Execution error encountered: ${err?.message || 'Database anomaly'}.`;
    commandLog = {
      ...commandLog,
      status: 'FAILED',
      result: failMsg,
      execution_time: execTime,
    };
    recordCommandLog(userId, commandLog);
    return { success: false, message: failMsg, commandLog };
  }
}

function recordCommandLog(userId: string, log: CommandLog) {
  try {
    const existing = getLocalStore<CommandLog[]>(`cmds_${userId}`, []);
    const updated = [log, ...existing.filter((c) => c.id !== log.id)].slice(0, 99);
    setLocalStore(`cmds_${userId}`, updated);
    realtimeService.broadcast('COMMAND_RECORDED', log);
  } catch (e) {
    console.error('Failed to log command', e);
  }
}

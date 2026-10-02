import { AutomationTemplate } from '../../types';

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    id: 'tpl_daily_briefing',
    title: 'Daily Tactical Briefing',
    description: 'Every morning at 08:00, compiles active missions, high-priority directives, and urgent deadlines into a morning briefing.',
    badge: 'RECOMMENDED',
    trigger_type: 'SCHEDULE',
    trigger_config: {
      frequency: 'DAILY',
      time: '08:00',
      timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
    },
    conditions: [],
    action: {
      type: 'GENERATE_BRIEFING',
      parameters: {},
    },
    requires_confirmation: false,
    risk_level: 'LOW',
  },
  {
    id: 'tpl_deadline_watch',
    title: 'Mission Deadline Watch',
    description: 'Watches all active missions and triggers an alert when any incomplete mission deadline is within 24 hours.',
    badge: 'SAFETY GATE',
    trigger_type: 'MISSION_DEADLINE_APPROACHING',
    trigger_config: {
      hoursBefore: 24,
    },
    conditions: [
      {
        id: 'cond_deadline_incomplete',
        field: 'mission.is_incomplete',
        operator: 'EQUALS',
        value: true,
      },
    ],
    action: {
      type: 'CREATE_NOTIFICATION',
      parameters: {
        title: 'TACTICAL DEADLINE ALERT: {{title}}',
        message: 'Strategic mission "{{title}}" is approaching its target deadline within 24 hours. Current progress: {{progress}}%.',
        type: 'WARNING',
      },
    },
    requires_confirmation: false,
    risk_level: 'LOW',
  },
  {
    id: 'tpl_weekly_review',
    title: 'Weekly Retrospective & Summary',
    description: 'Every Sunday at 18:00, aggregates all missions cleared, completed tasks, and total focus minutes into an executive report.',
    badge: 'CADENCE',
    trigger_type: 'SCHEDULE',
    trigger_config: {
      frequency: 'WEEKLY',
      daysOfWeek: [0], // Sunday
      time: '18:00',
      timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
    },
    conditions: [],
    action: {
      type: 'GENERATE_MISSION_SUMMARY',
      parameters: {},
    },
    requires_confirmation: false,
    risk_level: 'LOW',
  },
  {
    id: 'tpl_focus_completion',
    title: 'Focus Session Mission Update',
    description: 'When an immersion focus session completes, automatically logs the milestone onto the active mission activity timeline.',
    badge: 'CONTINUOUS',
    trigger_type: 'FOCUS_COMPLETED',
    trigger_config: {},
    conditions: [],
    action: {
      type: 'CREATE_ACTIVITY_EVENT',
      parameters: {
        description: 'Successfully completed {{duration}}-minute combat focus protocol.',
        type: 'FOCUS_COMPLETED',
      },
    },
    requires_confirmation: false,
    risk_level: 'LOW',
  },
  {
    id: 'tpl_mission_completion',
    title: 'Mission Conquest Notification',
    description: 'When a strategic mission achieves 100% completion, broadcasts an instant achievement alert across the operator HUD.',
    badge: 'EVENT-DRIVEN',
    trigger_type: 'MISSION_COMPLETED',
    trigger_config: {},
    conditions: [
      {
        id: 'cond_mission_completed_status',
        field: 'mission.status',
        operator: 'EQUALS',
        value: 'COMPLETED',
      },
    ],
    action: {
      type: 'CREATE_NOTIFICATION',
      parameters: {
        title: 'MISSION CONQUERED: {{title}}',
        message: 'All tactical milestones achieved at 100% completion rate. Operational directives fulfilled.',
        type: 'SUCCESS',
      },
    },
    requires_confirmation: false,
    risk_level: 'LOW',
  },
];

import {
  OSLayoutType,
  OSWindow,
  OSWorkspace,
  WindowModuleType,
  WindowState,
  WorkspaceSnapshot,
} from '../../types';
import { getLocalStore, setLocalStore } from '../supabase';
import { osEventBus } from './eventBus';

export const MODULE_METADATA: Record<
  WindowModuleType,
  { title: string; defaultSize: { width: number; height: number }; icon: string }
> = {
  COMMAND: { title: 'ZORO Command Surface', defaultSize: { width: 780, height: 560 }, icon: 'Command' },
  MISSIONS: { title: 'Mission Control OS', defaultSize: { width: 840, height: 600 }, icon: 'Target' },
  TASKS: { title: 'Action Queue (Tasks)', defaultSize: { width: 680, height: 520 }, icon: 'CheckSquare' },
  MEMORY: { title: 'Neural Memory Bank', defaultSize: { width: 720, height: 540 }, icon: 'Database' },
  KNOWLEDGE_GRAPH: { title: 'Knowledge Graph 2D', defaultSize: { width: 800, height: 580 }, icon: 'Compass' },
  DECISIONS: { title: 'Project Decisions Registry', defaultSize: { width: 700, height: 500 }, icon: 'BookOpen' },
  VISION: { title: 'Vision Core Inspector', defaultSize: { width: 780, height: 620 }, icon: 'Eye' },
  AGENTS: { title: 'Agent Orchestration Deck', defaultSize: { width: 820, height: 600 }, icon: 'Cpu' },
  AGENT_COUNCIL: { title: 'Agent Council', defaultSize: { width: 780, height: 560 }, icon: 'Users' },
  AUTOMATION: { title: 'Automation Lab', defaultSize: { width: 800, height: 580 }, icon: 'Zap' },
  INTELLIGENCE: { title: 'Predictive Intelligence Core', defaultSize: { width: 820, height: 600 }, icon: 'TrendingUp' },
  ANALYTICS: { title: 'Productivity & Directive Telemetry', defaultSize: { width: 760, height: 540 }, icon: 'BarChart3' },
  NOTIFICATIONS: { title: 'Global Notification Center', defaultSize: { width: 640, height: 500 }, icon: 'Bell' },
  FOCUS: { title: 'Santoryu Focus Protocol', defaultSize: { width: 620, height: 480 }, icon: 'Timer' },
  CHAT: { title: 'Tactical AI Chat (Blade 01)', defaultSize: { width: 720, height: 560 }, icon: 'MessageSquare' },
  VOICE: { title: 'Real-Time Voice Synapse HUD', defaultSize: { width: 660, height: 500 }, icon: 'Mic' },
  LOGS: { title: 'System Telemetry & Audit Logs', defaultSize: { width: 740, height: 520 }, icon: 'Activity' },
  SETTINGS: { title: 'System Configuration Deck', defaultSize: { width: 680, height: 540 }, icon: 'Settings' },
  PROFILE: { title: 'Operator Dossier', defaultSize: { width: 640, height: 480 }, icon: 'User' },
};

export class WorkspaceManager {
  private static DEFAULT_MIN_WIDTH = 380;
  private static DEFAULT_MIN_HEIGHT = 280;

  /**
   * Get initial default workspaces
   */
  public static getDefaultWorkspaces(userId: string): OSWorkspace[] {
    const now = Date.now();

    return [
      {
        id: 'ws_command',
        name: 'COMMAND',
        presetType: 'COMMAND',
        icon: 'Command',
        layoutType: 'FREE',
        created_at: now,
        updated_at: now,
        windows: [
          {
            id: 'win_cmd_' + now,
            type: 'COMMAND',
            title: 'ZORO Command Surface',
            position: { x: 30, y: 25 },
            size: { width: 800, height: 580 },
            zIndex: 10,
            state: 'NORMAL',
            pinned: false,
            workspaceId: 'ws_command',
          },
          {
            id: 'win_intel_' + now,
            type: 'INTELLIGENCE',
            title: 'Predictive Intelligence Core',
            position: { x: 440, y: 50 },
            size: { width: 720, height: 540 },
            zIndex: 9,
            state: 'NORMAL',
            pinned: false,
            workspaceId: 'ws_command',
          },
        ],
      },
      {
        id: 'ws_development',
        name: 'DEVELOPMENT',
        presetType: 'DEVELOPMENT',
        icon: 'Cpu',
        layoutType: 'GRID',
        associatedProjectName: 'AI Assistant',
        created_at: now,
        updated_at: now,
        windows: [
          {
            id: 'win_dev_msn_' + now,
            type: 'MISSIONS',
            title: 'Mission Control OS',
            position: { x: 20, y: 20 },
            size: { width: 600, height: 420 },
            zIndex: 10,
            state: 'NORMAL',
            pinned: false,
            workspaceId: 'ws_development',
          },
          {
            id: 'win_dev_agent_' + now,
            type: 'AGENTS',
            title: 'Agent Orchestration Deck',
            position: { x: 640, y: 20 },
            size: { width: 600, height: 420 },
            zIndex: 9,
            state: 'NORMAL',
            pinned: false,
            workspaceId: 'ws_development',
          },
          {
            id: 'win_dev_vision_' + now,
            type: 'VISION',
            title: 'Vision Core Inspector',
            position: { x: 20, y: 460 },
            size: { width: 600, height: 400 },
            zIndex: 8,
            state: 'NORMAL',
            pinned: false,
            workspaceId: 'ws_development',
          },
          {
            id: 'win_dev_cmd_' + now,
            type: 'COMMAND',
            title: 'ZORO Command Surface',
            position: { x: 640, y: 460 },
            size: { width: 600, height: 400 },
            zIndex: 7,
            state: 'NORMAL',
            pinned: false,
            workspaceId: 'ws_development',
          },
        ],
      },
      {
        id: 'ws_research',
        name: 'RESEARCH',
        presetType: 'RESEARCH',
        icon: 'Compass',
        layoutType: 'FREE',
        created_at: now,
        updated_at: now,
        windows: [
          {
            id: 'win_res_mem_' + now,
            type: 'MEMORY',
            title: 'Neural Memory Bank',
            position: { x: 40, y: 30 },
            size: { width: 640, height: 500 },
            zIndex: 10,
            state: 'NORMAL',
            pinned: false,
            workspaceId: 'ws_research',
          },
          {
            id: 'win_res_graph_' + now,
            type: 'KNOWLEDGE_GRAPH',
            title: 'Knowledge Graph 2D',
            position: { x: 420, y: 60 },
            size: { width: 720, height: 520 },
            zIndex: 9,
            state: 'NORMAL',
            pinned: false,
            workspaceId: 'ws_research',
          },
        ],
      },
      {
        id: 'ws_missions',
        name: 'MISSION CONTROL',
        presetType: 'MISSION_CONTROL',
        icon: 'Target',
        layoutType: 'SPLIT_TWO',
        created_at: now,
        updated_at: now,
        windows: [
          {
            id: 'win_msn_main_' + now,
            type: 'MISSIONS',
            title: 'Mission Control OS',
            position: { x: 20, y: 20 },
            size: { width: 660, height: 580 },
            zIndex: 10,
            state: 'NORMAL',
            pinned: false,
            workspaceId: 'ws_missions',
          },
          {
            id: 'win_msn_tasks_' + now,
            type: 'TASKS',
            title: 'Action Queue (Tasks)',
            position: { x: 700, y: 20 },
            size: { width: 560, height: 580 },
            zIndex: 9,
            state: 'NORMAL',
            pinned: false,
            workspaceId: 'ws_missions',
          },
        ],
      },
    ];
  }

  /**
   * Get all workspaces for user
   */
  public static getWorkspaces(userId: string): OSWorkspace[] {
    const stored = getLocalStore<OSWorkspace[]>(`jarvis_workspaces_${userId}`, []);
    if (!stored || stored.length === 0) {
      const defaults = this.getDefaultWorkspaces(userId);
      setLocalStore(`jarvis_workspaces_${userId}`, defaults);
      return defaults;
    }
    return stored;
  }

  /**
   * Save all workspaces
   */
  public static saveWorkspaces(userId: string, workspaces: OSWorkspace[]) {
    setLocalStore(`jarvis_workspaces_${userId}`, workspaces);
  }

  /**
   * Get currently active workspace ID
   */
  public static getActiveWorkspaceId(userId: string): string {
    const stored = getLocalStore<string>(`jarvis_active_workspace_${userId}`, '');
    const all = this.getWorkspaces(userId);
    if (stored && all.some((w) => w.id === stored)) {
      return stored;
    }
    return all[0]?.id || 'ws_command';
  }

  /**
   * Set active workspace ID
   */
  public static setActiveWorkspaceId(userId: string, workspaceId: string) {
    setLocalStore(`jarvis_active_workspace_${userId}`, workspaceId);
    osEventBus.emit('WORKSPACE_SWITCH', { workspaceId });
  }

  /**
   * Get current active workspace object
   */
  public static getActiveWorkspace(userId: string): OSWorkspace {
    const activeId = this.getActiveWorkspaceId(userId);
    const all = this.getWorkspaces(userId);
    return all.find((w) => w.id === activeId) || all[0] || this.getDefaultWorkspaces(userId)[0];
  }

  /**
   * Create a new workspace
   */
  public static createWorkspace(
    userId: string,
    name: string,
    modules: WindowModuleType[] = ['COMMAND'],
    associatedProjectId?: string,
    associatedProjectName?: string
  ): OSWorkspace {
    const all = this.getWorkspaces(userId);
    const now = Date.now();
    const wsId = 'ws_' + now + '_' + Math.random().toString(36).substring(2, 5);

    const windows: OSWindow[] = modules.map((mod, index) => {
      const meta = MODULE_METADATA[mod] || { title: mod, defaultSize: { width: 700, height: 500 } };
      return {
        id: `win_${mod.toLowerCase()}_${now}_${index}`,
        type: mod,
        title: meta.title,
        position: { x: 30 + index * 40, y: 30 + index * 40 },
        size: meta.defaultSize,
        zIndex: 10 + index,
        state: 'NORMAL',
        pinned: false,
        workspaceId: wsId,
      };
    });

    const newWs: OSWorkspace = {
      id: wsId,
      name: name.trim().toUpperCase(),
      presetType: 'CUSTOM',
      layoutType: 'FREE',
      associatedProjectId,
      associatedProjectName,
      windows,
      isCustom: true,
      created_at: now,
      updated_at: now,
    };

    const updated = [...all, newWs];
    this.saveWorkspaces(userId, updated);
    this.setActiveWorkspaceId(userId, wsId);
    osEventBus.emit('WORKSPACE_CREATED', { workspace: newWs });
    return newWs;
  }

  /**
   * Delete a custom workspace
   */
  public static deleteWorkspace(userId: string, workspaceId: string): boolean {
    const all = this.getWorkspaces(userId);
    if (all.length <= 1) return false; // Prevent deleting last workspace

    const updated = all.filter((w) => w.id !== workspaceId);
    this.saveWorkspaces(userId, updated);

    if (this.getActiveWorkspaceId(userId) === workspaceId) {
      this.setActiveWorkspaceId(userId, updated[0].id);
    }

    osEventBus.emit('WORKSPACE_DELETED', { workspaceId });
    return true;
  }

  // ----------------------------------------------------
  // WINDOW OPERATIONS
  // ----------------------------------------------------

  /**
   * Open or focus a module window in the active workspace
   */
  public static openWindow(
    userId: string,
    moduleType: WindowModuleType,
    customOptions?: {
      title?: string;
      initialTab?: string;
      customData?: any;
    }
  ): OSWindow {
    const all = this.getWorkspaces(userId);
    const activeWs = this.getActiveWorkspace(userId);
    const meta = MODULE_METADATA[moduleType] || { title: moduleType, defaultSize: { width: 700, height: 500 } };

    // Check if window already exists in this workspace
    let existing = activeWs.windows.find((w) => w.type === moduleType && w.state !== 'CLOSED');

    if (existing) {
      // Restore if minimized
      if (existing.state === 'MINIMIZED') {
        existing.state = 'NORMAL';
      }
      // Bring to front
      const maxZ = Math.max(...activeWs.windows.map((w) => w.zIndex), 10);
      existing.zIndex = maxZ + 1;
      this.normalizeZIndexes(activeWs.windows);

      activeWs.updated_at = Date.now();
      this.saveWorkspaces(userId, all);
      osEventBus.emit('WINDOW_FOCUS', { windowId: existing.id, moduleType });
      return existing;
    }

    // Spawn new window
    const maxZ = Math.max(...activeWs.windows.map((w) => w.zIndex), 10);
    const offset = (activeWs.windows.length % 5) * 35;

    const newWindow: OSWindow = {
      id: `win_${moduleType.toLowerCase()}_${Date.now()}`,
      type: moduleType,
      title: customOptions?.title || meta.title,
      position: { x: 40 + offset, y: 35 + offset },
      size: meta.defaultSize,
      zIndex: maxZ + 1,
      state: 'NORMAL',
      pinned: false,
      workspaceId: activeWs.id,
      initialTab: customOptions?.initialTab,
      customData: customOptions?.customData,
    };

    activeWs.windows.push(newWindow);
    this.normalizeZIndexes(activeWs.windows);
    activeWs.updated_at = Date.now();
    this.saveWorkspaces(userId, all);

    osEventBus.emit('WINDOW_OPEN', { window: newWindow });
    return newWindow;
  }

  /**
   * Focus a window and bring it to front
   */
  public static focusWindow(userId: string, windowId: string) {
    const all = this.getWorkspaces(userId);
    const activeWs = this.getActiveWorkspace(userId);
    const target = activeWs.windows.find((w) => w.id === windowId);
    if (!target) return;

    if (target.state === 'MINIMIZED') {
      target.state = 'NORMAL';
    }

    const maxZ = Math.max(...activeWs.windows.map((w) => w.zIndex), 10);
    target.zIndex = maxZ + 1;
    this.normalizeZIndexes(activeWs.windows);

    this.saveWorkspaces(userId, all);
    osEventBus.emit('WINDOW_FOCUS', { windowId, type: target.type });
  }

  /**
   * Update window position with bounded canvas coordinates
   */
  public static updateWindowPosition(
    userId: string,
    windowId: string,
    x: number,
    y: number,
    viewportWidth = 1920,
    viewportHeight = 1080
  ) {
    const all = this.getWorkspaces(userId);
    const activeWs = this.getActiveWorkspace(userId);
    const target = activeWs.windows.find((w) => w.id === windowId);
    if (!target || target.state === 'MAXIMIZED' || target.state === 'FULLSCREEN') return;

    const boundedX = Math.max(0, Math.min(x, viewportWidth - 120));
    const boundedY = Math.max(0, Math.min(y, viewportHeight - 80));

    target.position = { x: boundedX, y: boundedY };
    this.saveWorkspaces(userId, all);
  }

  /**
   * Update window size with minimum limits
   */
  public static updateWindowSize(
    userId: string,
    windowId: string,
    width: number,
    height: number
  ) {
    const all = this.getWorkspaces(userId);
    const activeWs = this.getActiveWorkspace(userId);
    const target = activeWs.windows.find((w) => w.id === windowId);
    if (!target || target.state === 'MAXIMIZED' || target.state === 'FULLSCREEN') return;

    target.size = {
      width: Math.max(this.DEFAULT_MIN_WIDTH, width),
      height: Math.max(this.DEFAULT_MIN_HEIGHT, height),
    };
    this.saveWorkspaces(userId, all);
  }

  /**
   * Minimize window
   */
  public static minimizeWindow(userId: string, windowId: string) {
    const all = this.getWorkspaces(userId);
    const activeWs = this.getActiveWorkspace(userId);
    const target = activeWs.windows.find((w) => w.id === windowId);
    if (!target) return;

    target.state = 'MINIMIZED';
    this.saveWorkspaces(userId, all);
    osEventBus.emit('WINDOW_MINIMIZE', { windowId });
  }

  /**
   * Maximize / Restore window
   */
  public static toggleMaximizeWindow(userId: string, windowId: string) {
    const all = this.getWorkspaces(userId);
    const activeWs = this.getActiveWorkspace(userId);
    const target = activeWs.windows.find((w) => w.id === windowId);
    if (!target) return;

    target.state = target.state === 'MAXIMIZED' ? 'NORMAL' : 'MAXIMIZED';
    this.focusWindow(userId, windowId);
    this.saveWorkspaces(userId, all);
    osEventBus.emit('WINDOW_MAXIMIZE', { windowId, state: target.state });
  }

  /**
   * Pin window (stays on top / pinned across layout adjustments)
   */
  public static togglePinWindow(userId: string, windowId: string) {
    const all = this.getWorkspaces(userId);
    const activeWs = this.getActiveWorkspace(userId);
    const target = activeWs.windows.find((w) => w.id === windowId);
    if (!target) return;

    target.pinned = !target.pinned;
    this.saveWorkspaces(userId, all);
    osEventBus.emit('WINDOW_PIN', { windowId, pinned: target.pinned });
  }

  /**
   * Close window
   */
  public static closeWindow(userId: string, windowId: string) {
    const all = this.getWorkspaces(userId);
    const activeWs = this.getActiveWorkspace(userId);
    activeWs.windows = activeWs.windows.filter((w) => w.id !== windowId);
    this.saveWorkspaces(userId, all);
    osEventBus.emit('WINDOW_CLOSE', { windowId });
  }

  /**
   * Close all windows in active workspace
   */
  public static closeAllWindows(userId: string) {
    const all = this.getWorkspaces(userId);
    const activeWs = this.getActiveWorkspace(userId);
    activeWs.windows = activeWs.windows.filter((w) => w.pinned); // preserve pinned
    this.saveWorkspaces(userId, all);
  }

  // ----------------------------------------------------
  // LAYOUT ENGINE (Split, Grid, Focus, Free)
  // ----------------------------------------------------

  public static applyLayout(
    userId: string,
    layoutType: OSLayoutType,
    containerWidth: number,
    containerHeight: number
  ) {
    const all = this.getWorkspaces(userId);
    const activeWs = this.getActiveWorkspace(userId);
    activeWs.layoutType = layoutType;

    const visibleWindows = activeWs.windows.filter((w) => w.state !== 'MINIMIZED' && w.state !== 'CLOSED');
    if (visibleWindows.length === 0) return;

    const padding = 12;
    const availableW = Math.max(containerWidth - padding * 2, 400);
    const availableH = Math.max(containerHeight - padding * 2, 300);

    switch (layoutType) {
      case 'SPLIT_TWO': {
        const halfW = Math.floor(availableW / 2) - padding / 2;
        visibleWindows.forEach((w, i) => {
          w.state = 'NORMAL';
          if (i === 0) {
            w.position = { x: padding, y: padding };
            w.size = { width: halfW, height: availableH };
          } else {
            w.position = { x: padding + halfW + padding, y: padding };
            w.size = { width: halfW, height: availableH };
          }
        });
        break;
      }

      case 'SPLIT_THREE': {
        const thirdW = Math.floor(availableW / 3) - padding;
        visibleWindows.forEach((w, i) => {
          w.state = 'NORMAL';
          const col = Math.min(i, 2);
          w.position = { x: padding + col * (thirdW + padding), y: padding };
          w.size = { width: thirdW, height: availableH };
        });
        break;
      }

      case 'GRID': {
        const halfW = Math.floor(availableW / 2) - padding / 2;
        const halfH = Math.floor(availableH / 2) - padding / 2;
        visibleWindows.forEach((w, i) => {
          w.state = 'NORMAL';
          const col = i % 2;
          const row = Math.floor(i / 2);
          w.position = { x: padding + col * (halfW + padding), y: padding + row * (halfH + padding) };
          w.size = { width: halfW, height: halfH };
        });
        break;
      }

      case 'FOCUS': {
        if (visibleWindows.length > 0) {
          visibleWindows[0].state = 'MAXIMIZED';
          for (let i = 1; i < visibleWindows.length; i++) {
            visibleWindows[i].state = 'MINIMIZED';
          }
        }
        break;
      }

      case 'FREE':
      default: {
        visibleWindows.forEach((w) => {
          if (w.state === 'MAXIMIZED') w.state = 'NORMAL';
        });
        break;
      }
    }

    activeWs.updated_at = Date.now();
    this.saveWorkspaces(userId, all);
    osEventBus.emit('LAYOUT_APPLIED', { layoutType });
  }

  // ----------------------------------------------------
  // WORKSPACE SNAPSHOTS
  // ----------------------------------------------------

  public static getSnapshots(userId: string): WorkspaceSnapshot[] {
    return getLocalStore<WorkspaceSnapshot[]>(`jarvis_workspace_snapshots_${userId}`, []);
  }

  public static saveSnapshot(userId: string, name: string): WorkspaceSnapshot {
    const activeWs = this.getActiveWorkspace(userId);
    const existing = this.getSnapshots(userId);

    const snapshot: WorkspaceSnapshot = {
      id: 'snap_' + Date.now(),
      name: name.trim() || activeWs.name + ' Layout',
      userId,
      workspace: JSON.parse(JSON.stringify(activeWs)),
      savedAt: Date.now(),
    };

    const updated = [snapshot, ...existing].slice(0, 15);
    setLocalStore(`jarvis_workspace_snapshots_${userId}`, updated);
    return snapshot;
  }

  public static loadSnapshot(userId: string, snapshotId: string): boolean {
    const snapshots = this.getSnapshots(userId);
    const found = snapshots.find((s) => s.id === snapshotId);
    if (!found) return false;

    const all = this.getWorkspaces(userId);
    const activeId = this.getActiveWorkspaceId(userId);
    const activeIndex = all.findIndex((w) => w.id === activeId);

    const restored: OSWorkspace = {
      ...JSON.parse(JSON.stringify(found.workspace)),
      id: activeId,
      updated_at: Date.now(),
    };

    if (activeIndex >= 0) {
      all[activeIndex] = restored;
    } else {
      all.push(restored);
    }

    this.saveWorkspaces(userId, all);
    osEventBus.emit('LAYOUT_APPLIED', { snapshotName: found.name });
    return true;
  }

  // ----------------------------------------------------
  // HELPERS
  // ----------------------------------------------------

  private static normalizeZIndexes(windows: OSWindow[]) {
    const sorted = [...windows].sort((a, b) => a.zIndex - b.zIndex);
    sorted.forEach((w, idx) => {
      w.zIndex = 10 + idx;
    });
  }
}

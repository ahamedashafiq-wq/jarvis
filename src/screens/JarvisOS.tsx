import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Command as CommandIcon,
  Layers,
  LayoutGrid,
  Columns,
  Columns3,
  Maximize2,
  Plus,
  Trash2,
  Camera,
  Eye,
  Sliders,
  Sparkles,
  HelpCircle,
  X,
  Play,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  Monitor,
  Target,
  Cpu,
  Database,
  TrendingUp,
  Zap,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  MessageSquare,
  BarChart3,
  BookOpen,
  Compass,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  JARVISCoreIndicatorState,
  OSLayoutType,
  OSViewMode,
  OSWindow,
  OSWorkspace,
  RoutePath,
  WindowModuleType,
} from '../types';
import { WorkspaceManager, MODULE_METADATA } from '../services/os/workspaceManager';
import { osEventBus } from '../services/os/eventBus';
import { OSWindowFrame } from '../components/os/OSWindowFrame';
import { ContextBar } from '../components/os/ContextBar';
import { SystemStatusBar } from '../components/os/SystemStatusBar';
import { JarvisCoreIndicator } from '../components/os/JarvisCoreIndicator';
import { CommandBar } from '../components/CommandBar';
import { CommandPreviewModal } from '../components/CommandPreviewModal';
import { CommandRouterService } from '../services/commandCenter/commandRouter';

// Modules
import { CommandCenter } from './CommandCenter';
import { Missions } from './Missions';
import { Tasks } from './Tasks';
import { MemoryScreen } from './Memory';
import { VisionScreen } from './Vision';
import { Agents } from './Agents';
import { AgentCouncil } from './AgentCouncil';
import { AutomationScreen } from './Automation';
import { IntelligenceScreen } from './Intelligence';
import { Analytics } from './Analytics';
import { NotificationsScreen } from './Notifications';
import { FocusScreen } from './Focus';
import { Chat } from './Chat';
import { Voice } from './Voice';
import { LogsScreen } from './Logs';
import { Settings } from './Settings';
import { Profile } from './Profile';
import { Dashboard } from './Dashboard';

interface JarvisOSProps {
  onNavigateRoute: (path: RoutePath) => void;
}

export const JarvisOS: React.FC<JarvisOSProps> = ({ onNavigateRoute }) => {
  const { currentSession, isSupabase } = useAuth();
  const userId = currentSession?.userId || 'guest';

  // Workspace & Windows State
  const [workspaces, setWorkspaces] = useState<OSWorkspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<OSWorkspace | null>(null);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);

  // View Modes: DESKTOP | FOCUS | PRESENTATION | DEMO
  const [viewMode, setViewMode] = useState<OSViewMode>('DESKTOP');
  const [coreState, setCoreState] = useState<JARVISCoreIndicatorState>('READY');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  // Modals & Panels
  const [isNewWorkspaceModalOpen, setIsNewWorkspaceModalOpen] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsModules, setNewWsModules] = useState<WindowModuleType[]>([
    'COMMAND',
    'MISSIONS',
    'VISION',
    'AGENTS',
  ]);

  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');

  // Command & Approval
  const [commandResult, setCommandResult] = useState<any>(null);
  const [activePreview, setActivePreview] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Container dimensions
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerBounds, setContainerBounds] = useState({ width: 1920, height: 1080 });

  // Load Workspaces on mount
  useEffect(() => {
    const list = WorkspaceManager.getWorkspaces(userId);
    setWorkspaces(list);
    const active = WorkspaceManager.getActiveWorkspace(userId);
    setActiveWorkspace(active);
    if (active.windows.length > 0) {
      setActiveWindowId(active.windows[0].id);
    }
  }, [userId]);

  // Update Container Bounds on resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerBounds({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Workspace Switcher Keyboard Shortcuts (Ctrl + 1..4)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        const index = parseInt(e.key, 10) - 1;
        if (workspaces[index]) {
          handleSwitchWorkspace(workspaces[index].id);
        }
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [workspaces]);

  // Sync workspace state updates
  const syncActiveWorkspace = () => {
    if (!activeWorkspace) return;
    const current = WorkspaceManager.getActiveWorkspace(userId);
    setActiveWorkspace(JSON.parse(JSON.stringify(current)));
    setWorkspaces(WorkspaceManager.getWorkspaces(userId));
  };

  const handleSwitchWorkspace = (workspaceId: string) => {
    WorkspaceManager.setActiveWorkspaceId(userId, workspaceId);
    const target = WorkspaceManager.getActiveWorkspace(userId);
    setActiveWorkspace(target);
    setWorkspaces(WorkspaceManager.getWorkspaces(userId));
    if (target.windows.length > 0) {
      setActiveWindowId(target.windows[0].id);
    }
  };

  const handleOpenModule = (modType: WindowModuleType, title?: string) => {
    const win = WorkspaceManager.openWindow(userId, modType, { title });
    syncActiveWorkspace();
    setActiveWindowId(win.id);
  };

  // Safe internal navigation from modules
  const handleModuleNavigate = (path: RoutePath) => {
    // Map route to window module in workspace
    const routeToModuleMap: Record<string, WindowModuleType> = {
      '/missions': 'MISSIONS',
      '/tasks': 'TASKS',
      '/memory': 'MEMORY',
      '/memory/graph': 'KNOWLEDGE_GRAPH',
      '/memory/decisions': 'DECISIONS',
      '/vision': 'VISION',
      '/agents': 'AGENTS',
      '/agents/council': 'AGENT_COUNCIL',
      '/automation': 'AUTOMATION',
      '/intelligence': 'INTELLIGENCE',
      '/analytics': 'ANALYTICS',
      '/notifications': 'NOTIFICATIONS',
      '/focus': 'FOCUS',
      '/chat': 'CHAT',
      '/voice': 'VOICE',
      '/logs': 'LOGS',
      '/settings': 'SETTINGS',
      '/profile': 'PROFILE',
      '/command': 'COMMAND',
      '/commands': 'COMMAND',
    };

    const mod = routeToModuleMap[path];
    if (mod) {
      handleOpenModule(mod);
    } else {
      onNavigateRoute(path);
    }
  };

  // Apply layout
  const handleApplyLayout = (type: OSLayoutType) => {
    WorkspaceManager.applyLayout(userId, type, containerBounds.width, containerBounds.height);
    syncActiveWorkspace();
  };

  // Create Workspace
  const handleCreateWorkspace = () => {
    if (!newWsName.trim()) return;
    const created = WorkspaceManager.createWorkspace(userId, newWsName, newWsModules);
    setWorkspaces(WorkspaceManager.getWorkspaces(userId));
    setActiveWorkspace(created);
    setIsNewWorkspaceModalOpen(false);
    setNewWsName('');
  };

  // Save Snapshot
  const handleSaveSnapshot = () => {
    if (!snapshotName.trim()) return;
    WorkspaceManager.saveSnapshot(userId, snapshotName);
    setIsSnapshotModalOpen(false);
    setSnapshotName('');
  };

  // Command Execution from OS universal bar
  const handleExecuteCommand = async (command: string, imageFile?: File | null) => {
    setCoreState('PLANNING');

    // 1. Check for Window Commands (Section 17 & 40)
    const lower = command.toLowerCase().trim();

    // Pattern: "Set up my AI development workspace" / "Set up my development workspace" (Critical Test 46)
    if (
      lower.includes('set up my') &&
      (lower.includes('development workspace') || lower.includes('ai development'))
    ) {
      setCoreState('PLANNING');
      setActivePreview({
        id: 'prev_layout_dev',
        actionType: 'LAYOUT_PROPOSAL',
        title: 'Formulate AI Development Workspace',
        description: 'Configure multi-window workspace containing Mission Control, Agent Brain, Vision Core, and Intelligence.',
        riskLevel: 'LOW',
        details: [
          { label: 'PROPOSED MODULES', value: 'Mission Control + Agent + Vision + Intelligence' },
          { label: 'LAYOUT TYPE', value: 'GRID (2x2)' },
          { label: 'TARGET WORKSPACE', value: 'DEVELOPMENT' },
        ],
        rawPayload: {
          workspaceName: 'DEVELOPMENT',
          modules: ['MISSIONS', 'AGENTS', 'VISION', 'INTELLIGENCE'],
          layoutType: 'GRID',
        },
      });
      setIsPreviewOpen(true);
      return;
    }

    // Pattern: "Open <Module>"
    if (lower.startsWith('open ') || lower.startsWith('show ')) {
      const target = lower.replace(/^(open |show )/i, '').trim();
      if (target.includes('vision')) {
        handleOpenModule('VISION');
        setCoreState('READY');
        return;
      }
      if (target.includes('mission')) {
        handleOpenModule('MISSIONS');
        setCoreState('READY');
        return;
      }
      if (target.includes('task')) {
        handleOpenModule('TASKS');
        setCoreState('READY');
        return;
      }
      if (target.includes('memory')) {
        handleOpenModule('MEMORY');
        setCoreState('READY');
        return;
      }
      if (target.includes('agent')) {
        handleOpenModule('AGENTS');
        setCoreState('READY');
        return;
      }
      if (target.includes('automation')) {
        handleOpenModule('AUTOMATION');
        setCoreState('READY');
        return;
      }
      if (target.includes('intelligence')) {
        handleOpenModule('INTELLIGENCE');
        setCoreState('READY');
        return;
      }
    }

    // Pattern: "Switch to <Workspace>"
    if (lower.startsWith('switch to ') || lower.startsWith('switch workspace to ')) {
      const targetName = lower.replace(/^(switch to |switch workspace to )/i, '').replace(/ workspace/i, '').trim();
      const match = workspaces.find((w) => w.name.toLowerCase().includes(targetName));
      if (match) {
        handleSwitchWorkspace(match.id);
        setCoreState('READY');
        return;
      }
    }

    // Pattern: "Close all windows"
    if (lower === 'close all windows' || lower === 'close windows') {
      WorkspaceManager.closeAllWindows(userId);
      syncActiveWorkspace();
      setCoreState('READY');
      return;
    }

    // Pattern: "Enter Focus Mode" / "Exit Focus Mode"
    if (lower.includes('enter focus mode') || lower.includes('focus mode')) {
      setViewMode('FOCUS');
      setCoreState('READY');
      return;
    }

    // Dispatch to CommandRouterService
    try {
      setCoreState('EXECUTING');
      const res = await CommandRouterService.executeCommand({
        userId,
        commandText: command,
        imageFile,
        activeMissionId: activeWorkspace?.associatedProjectId,
        onStateChange: (st) => {
          if (st === 'PLANNING') setCoreState('PLANNING');
          else if (st === 'EXECUTING') setCoreState('EXECUTING');
          else if (st === 'VERIFYING') setCoreState('VERIFYING');
          else if (st === 'ERROR') setCoreState('ERROR');
        },
        onPreviewRequired: (prev) => {
          setActivePreview(prev);
          setIsPreviewOpen(true);
        },
        onNavigate: handleModuleNavigate,
      });

      setCommandResult(res);
      setCoreState('READY');
      syncActiveWorkspace();
    } catch (e: any) {
      console.error('Command failed in OS:', e);
      setCoreState('ERROR');
    }
  };

  // Handle Approval Action (e.g. task creation or layout proposal)
  const handleApproveAction = async (preview: any) => {
    setIsApproving(true);
    setCoreState('EXECUTING');

    if (preview.actionType === 'LAYOUT_PROPOSAL') {
      // Create/switch to development workspace with proposed layout
      const payload = preview.rawPayload;
      let targetWs = workspaces.find((w) => w.name.toLowerCase() === payload.workspaceName.toLowerCase());
      if (!targetWs) {
        targetWs = WorkspaceManager.createWorkspace(userId, payload.workspaceName, payload.modules);
      } else {
        handleSwitchWorkspace(targetWs.id);
        payload.modules.forEach((mod: WindowModuleType) => {
          WorkspaceManager.openWindow(userId, mod);
        });
      }
      WorkspaceManager.applyLayout(userId, payload.layoutType, containerBounds.width, containerBounds.height);
      syncActiveWorkspace();

      setIsPreviewOpen(false);
      setIsApproving(false);
      setCoreState('READY');
      return;
    }

    try {
      const res = await CommandRouterService.executeApprovedAction(
        userId,
        preview,
        handleModuleNavigate
      );
      setIsPreviewOpen(false);
      setActivePreview(null);
      setIsApproving(false);
      setCoreState('READY');
      setCommandResult(res);
      syncActiveWorkspace();
    } catch {
      setIsApproving(false);
      setCoreState('ERROR');
    }
  };

  // Render actual module inside window frame
  const renderWindowModule = (win: OSWindow) => {
    switch (win.type) {
      case 'COMMAND':
        return <CommandCenter onNavigate={handleModuleNavigate} />;
      case 'MISSIONS':
        return <Missions onNavigate={handleModuleNavigate} />;
      case 'TASKS':
        return <Tasks onNavigate={handleModuleNavigate} />;
      case 'MEMORY':
        return <MemoryScreen onNavigate={handleModuleNavigate} />;
      case 'KNOWLEDGE_GRAPH':
        return <MemoryScreen onNavigate={handleModuleNavigate} initialTab="GRAPH" />;
      case 'DECISIONS':
        return <MemoryScreen onNavigate={handleModuleNavigate} initialTab="DECISIONS" />;
      case 'VISION':
        return <VisionScreen onNavigate={handleModuleNavigate} />;
      case 'AGENTS':
        return <Agents onNavigate={handleModuleNavigate} />;
      case 'AGENT_COUNCIL':
        return <AgentCouncil onNavigate={handleModuleNavigate} />;
      case 'AUTOMATION':
        return <AutomationScreen onNavigate={handleModuleNavigate} />;
      case 'INTELLIGENCE':
        return <IntelligenceScreen onNavigate={handleModuleNavigate} />;
      case 'ANALYTICS':
        return <Analytics onNavigate={handleModuleNavigate} />;
      case 'NOTIFICATIONS':
        return <NotificationsScreen onNavigate={handleModuleNavigate} />;
      case 'FOCUS':
        return <FocusScreen onNavigate={handleModuleNavigate} />;
      case 'CHAT':
        return <Chat onNavigate={handleModuleNavigate} />;
      case 'VOICE':
        return <Voice onNavigate={handleModuleNavigate} />;
      case 'LOGS':
        return <LogsScreen onNavigate={handleModuleNavigate} />;
      case 'SETTINGS':
        return <Settings onNavigate={handleModuleNavigate} />;
      case 'PROFILE':
        return <Profile onNavigate={handleModuleNavigate} />;
      default:
        return <Dashboard onNavigate={handleModuleNavigate} />;
    }
  };

  if (!activeWorkspace) {
    return (
      <div className="min-h-screen bg-[#050706] flex items-center justify-center p-6 text-mono text-[#19F59A]">
        INITIALIZING ZORO OS WORKSPACE...
      </div>
    );
  }

  const minimizedWindows = activeWorkspace.windows.filter((w) => w.state === 'MINIMIZED');

  return (
    <div className="h-screen w-screen flex flex-col bg-[#050706] text-[#F5F7F6] overflow-hidden select-none font-mono">
      {/* ---------------------------------------------------- */}
      {/* 1. ZORO OS SHELL TOP BAR (Section 2, 15, 22, 29)    */}
      {/* ---------------------------------------------------- */}
      {viewMode !== 'PRESENTATION' && (
        <header className="h-14 border-b border-[#16281F] bg-[#0A100D]/95 px-3 sm:px-4 flex items-center justify-between z-30 shrink-0 backdrop-blur-md">
          {/* Left: Brand & Context Bar */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Original Three Blade Motif */}
            <div
              onClick={() => onNavigateRoute('/command')}
              className="flex items-center gap-2 cursor-pointer shrink-0"
              title="Return to Command Surface"
            >
              <div className="w-8 h-8 rounded-lg bg-[#050706] border border-[#00D084] flex items-center justify-center gap-0.5 shadow-[0_0_8px_#00D084]/20">
                <div className="w-1 h-4 bg-[#00D084] -skew-x-12 rounded-xs shadow-[0_0_4px_#00D084]" />
                <div className="w-1 h-5 bg-[#38E1FF] -skew-x-12 rounded-xs shadow-[0_0_4px_#38E1FF]" />
                <div className="w-1 h-4 bg-[#FFB000] -skew-x-12 rounded-xs shadow-[0_0_4px_#FFB000]" />
              </div>
              <div className="hidden lg:block">
                <div className="flex items-center gap-1">
                  <span className="font-extrabold text-xs tracking-wider text-[#F5F7F6]">ZORO OS</span>
                  <span className="text-[8px] font-bold text-[#19F59A] px-1 rounded bg-[#00D084]/15">2.0</span>
                </div>
              </div>
            </div>

            {/* Persistent Top Context Bar (Section 15) */}
            <ContextBar
              userId={userId}
              activeWorkspace={activeWorkspace}
              onSwitchWorkspace={handleSwitchWorkspace}
              allWorkspaces={workspaces}
              onAssociateProject={(projectId, projectName) => {
                activeWorkspace.associatedProjectId = projectId;
                activeWorkspace.associatedProjectName = projectName;
                WorkspaceManager.saveWorkspaces(userId, workspaces);
                syncActiveWorkspace();
              }}
            />
          </div>

          {/* Center: Central Core Indicator (Section 29) */}
          <div className="hidden md:flex items-center justify-center">
            <JarvisCoreIndicator
              state={coreState}
              onClick={() => handleOpenModule('COMMAND')}
            />
          </div>

          {/* Right: Actual System Health Bar & View Mode */}
          <div className="flex items-center gap-2.5">
            <div className="hidden xl:block">
              <SystemStatusBar isSupabaseConfigured={isSupabase} />
            </div>

            {/* View Mode Toggle: Desktop / Focus / Presentation / Demo */}
            <div className="flex items-center bg-[#050706] p-0.5 rounded-lg border border-[#16281F] text-[10px]">
              {(['DESKTOP', 'FOCUS', 'PRESENTATION', 'DEMO'] as OSViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    viewMode === mode
                      ? 'bg-[#121C17] text-[#19F59A] font-bold border border-[#00D084]/40'
                      : 'text-[#8B9992] hover:text-[#F5F7F6]'
                  }`}
                  title={`${mode} Mode`}
                >
                  {mode[0]}
                </button>
              ))}
            </div>
          </div>
        </header>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. DEMO MODE SIMULATION WARNING BANNER (Section 42)  */}
      {/* ---------------------------------------------------- */}
      {viewMode === 'DEMO' && (
        <div className="px-4 py-1.5 bg-[#FFB000]/15 border-b border-[#FFB000]/50 text-[#FFB000] text-[11px] font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="font-bold">ZORO DEMO MODE ACTIVE</span>
            <span>• Simulated telemetry & safe layout preview. Real user data is untouched.</span>
          </div>
          <button
            onClick={() => setViewMode('DESKTOP')}
            className="text-xs font-bold hover:underline"
          >
            EXIT DEMO
          </button>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. WORKSPACE CANVAS & WINDOW MANAGER VIEWPORT        */}
      {/* ---------------------------------------------------- */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Workspace Quick Subsystem Bar (Left sidebar if Desktop mode) */}
        {viewMode === 'DESKTOP' && (
          <aside
            className={`${
              isSidebarExpanded ? 'w-56 px-3' : 'w-12 items-center'
            } border-r border-[#16281F] bg-[#0A100D] flex flex-col py-2.5 space-y-2 z-20 shrink-0 transition-all select-none overflow-y-auto font-mono text-xs`}
          >
            {/* Collapse/Expand Toggle */}
            <div className={`w-full flex items-center ${isSidebarExpanded ? 'justify-between px-1' : 'justify-center'} pb-1 border-b border-[#16281F]`}>
              {isSidebarExpanded && (
                <span className="text-[9px] font-bold text-[#8B9992] tracking-wider uppercase">
                  THREE BLADES
                </span>
              )}
              <button
                onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                className="p-1 rounded-lg text-[#8B9992] hover:text-[#19F59A] hover:bg-[#121C17] transition-colors"
                title={isSidebarExpanded ? 'Collapse to icons' : 'Expand navigation'}
              >
                {isSidebarExpanded ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* EXPANDED MODE: THREE BLADES HIERARCHY */}
            {isSidebarExpanded ? (
              <div className="w-full space-y-3">
                {/* Primary Command */}
                <button
                  onClick={() => handleOpenModule('COMMAND')}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-[#121C17] border border-[#00D084]/40 text-[#19F59A] font-bold text-[11px] shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <CommandIcon className="w-3.5 h-3.5" />
                    <span>COMMAND</span>
                  </div>
                  <span className="text-[8px] px-1 rounded bg-[#00D084]/20">OS</span>
                </button>

                {/* Blade 01: KNOWLEDGE */}
                <div className="space-y-0.5">
                  <div className="text-[8px] font-bold text-[#19F59A] tracking-wider uppercase px-1">
                    BLADE 01: KNOWLEDGE
                  </div>
                  {[
                    { type: 'VISION' as WindowModuleType, icon: <Eye className="w-3 h-3 text-[#19F59A]" />, label: 'Vision Core' },
                    { type: 'INTELLIGENCE' as WindowModuleType, icon: <TrendingUp className="w-3 h-3 text-[#38E1FF]" />, label: 'Intelligence' },
                    { type: 'CHAT' as WindowModuleType, icon: <MessageSquare className="w-3 h-3 text-[#19F59A]" />, label: 'AI Chat' },
                    { type: 'ANALYTICS' as WindowModuleType, icon: <BarChart3 className="w-3 h-3 text-[#8B9992]" />, label: 'Analytics' },
                  ].map((item) => (
                    <button
                      key={item.type}
                      onClick={() => handleOpenModule(item.type)}
                      className="w-full flex items-center gap-2 px-2 py-1 rounded-lg text-[10px] text-[#8B9992] hover:text-[#F5F7F6] hover:bg-[#121C17]/50 transition-colors text-left"
                    >
                      {item.icon}
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>

                {/* Blade 02: ACTION */}
                <div className="space-y-0.5">
                  <div className="text-[8px] font-bold text-[#38E1FF] tracking-wider uppercase px-1">
                    BLADE 02: ACTION
                  </div>
                  {[
                    { type: 'MISSIONS' as WindowModuleType, icon: <Target className="w-3 h-3 text-[#38E1FF]" />, label: 'Mission Control' },
                    { type: 'TASKS' as WindowModuleType, icon: <CheckSquare className="w-3 h-3 text-[#38E1FF]" />, label: 'Action Queue' },
                    { type: 'AGENTS' as WindowModuleType, icon: <Cpu className="w-3 h-3 text-[#19F59A]" />, label: 'Agent Brain' },
                    { type: 'AUTOMATION' as WindowModuleType, icon: <Zap className="w-3 h-3 text-[#FFB000]" />, label: 'Automation Lab' },
                  ].map((item) => (
                    <button
                      key={item.type}
                      onClick={() => handleOpenModule(item.type)}
                      className="w-full flex items-center gap-2 px-2 py-1 rounded-lg text-[10px] text-[#8B9992] hover:text-[#F5F7F6] hover:bg-[#121C17]/50 transition-colors text-left"
                    >
                      {item.icon}
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>

                {/* Blade 03: MEMORY */}
                <div className="space-y-0.5">
                  <div className="text-[8px] font-bold text-[#FFB000] tracking-wider uppercase px-1">
                    BLADE 03: MEMORY
                  </div>
                  {[
                    { type: 'MEMORY' as WindowModuleType, icon: <Database className="w-3 h-3 text-[#FFB000]" />, label: 'Memory Bank' },
                    { type: 'KNOWLEDGE_GRAPH' as WindowModuleType, icon: <Compass className="w-3 h-3 text-[#38E1FF]" />, label: 'Knowledge Graph' },
                    { type: 'DECISIONS' as WindowModuleType, icon: <BookOpen className="w-3 h-3 text-[#19F59A]" />, label: 'Decisions Log' },
                  ].map((item) => (
                    <button
                      key={item.type}
                      onClick={() => handleOpenModule(item.type)}
                      className="w-full flex items-center gap-2 px-2 py-1 rounded-lg text-[10px] text-[#8B9992] hover:text-[#F5F7F6] hover:bg-[#121C17]/50 transition-colors text-left"
                    >
                      {item.icon}
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* COLLAPSED ICON MODE */
              <div className="flex flex-col items-center space-y-2">
                {[
                  { type: 'COMMAND' as WindowModuleType, icon: <CommandIcon className="w-4 h-4 text-[#19F59A]" />, label: 'Command' },
                  { type: 'MISSIONS' as WindowModuleType, icon: <Target className="w-4 h-4 text-[#38E1FF]" />, label: 'Missions' },
                  { type: 'VISION' as WindowModuleType, icon: <Eye className="w-4 h-4 text-[#19F59A]" />, label: 'Vision' },
                  { type: 'AGENTS' as WindowModuleType, icon: <Cpu className="w-4 h-4 text-[#19F59A]" />, label: 'Agents' },
                  { type: 'MEMORY' as WindowModuleType, icon: <Database className="w-4 h-4 text-[#FFB000]" />, label: 'Memory' },
                  { type: 'INTELLIGENCE' as WindowModuleType, icon: <TrendingUp className="w-4 h-4 text-[#38E1FF]" />, label: 'Intelligence' },
                  { type: 'AUTOMATION' as WindowModuleType, icon: <Zap className="w-4 h-4 text-[#FFB000]" />, label: 'Automation' },
                ].map((btn) => (
                  <button
                    key={btn.type}
                    onClick={() => handleOpenModule(btn.type)}
                    className="p-2 rounded-xl border border-transparent hover:border-[#00D084]/40 hover:bg-[#121C17] text-[#8B9992] hover:text-[#19F59A] transition-all"
                    title={`Open ${btn.label}`}
                  >
                    {btn.icon}
                  </button>
                ))}
              </div>
            )}

            <div className="w-full h-px bg-[#16281F] my-1" />

            {/* Layout Quick Selector */}
            <div className={`w-full flex ${isSidebarExpanded ? 'justify-around' : 'flex-col items-center space-y-1.5'}`}>
              <button
                onClick={() => handleApplyLayout('GRID')}
                className="p-1.5 rounded-lg text-[#8B9992] hover:text-[#38E1FF] hover:bg-[#121C17]"
                title="Apply Grid Layout (2x2)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleApplyLayout('SPLIT_TWO')}
                className="p-1.5 rounded-lg text-[#8B9992] hover:text-[#38E1FF] hover:bg-[#121C17]"
                title="Apply Split Layout (50/50)"
              >
                <Columns className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsNewWorkspaceModalOpen(true)}
                className="p-1.5 rounded-lg text-[#8B9992] hover:text-[#19F59A] hover:bg-[#121C17]"
                title="New Workspace"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </aside>
        )}

        {/* Main Canvas with Drag/Resize Windows */}
        <main
          ref={containerRef}
          className="flex-1 relative overflow-hidden bg-[#050706] p-2"
        >
          {activeWorkspace.windows.map((win) => {
            const isActive = win.id === activeWindowId;
            return (
              <OSWindowFrame
                key={win.id}
                window={win}
                isActive={isActive}
                onFocus={() => {
                  WorkspaceManager.focusWindow(userId, win.id);
                  setActiveWindowId(win.id);
                  syncActiveWorkspace();
                }}
                onMinimize={() => {
                  WorkspaceManager.minimizeWindow(userId, win.id);
                  syncActiveWorkspace();
                }}
                onMaximize={() => {
                  WorkspaceManager.toggleMaximizeWindow(userId, win.id);
                  syncActiveWorkspace();
                }}
                onClose={() => {
                  WorkspaceManager.closeWindow(userId, win.id);
                  syncActiveWorkspace();
                }}
                onPin={() => {
                  WorkspaceManager.togglePinWindow(userId, win.id);
                  syncActiveWorkspace();
                }}
                onMove={(x, y) => {
                  WorkspaceManager.updateWindowPosition(
                    userId,
                    win.id,
                    x,
                    y,
                    containerBounds.width,
                    containerBounds.height
                  );
                  syncActiveWorkspace();
                }}
                onResize={(w, h) => {
                  WorkspaceManager.updateWindowSize(userId, win.id, w, h);
                  syncActiveWorkspace();
                }}
                containerBounds={containerBounds}
              >
                {renderWindowModule(win)}
              </OSWindowFrame>
            );
          })}
        </main>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 4. TASKBAR TRAY FOR MINIMIZED WINDOWS (Section 3 & 5)*/}
      {/* ---------------------------------------------------- */}
      {minimizedWindows.length > 0 && viewMode !== 'PRESENTATION' && (
        <div className="px-4 py-1.5 border-t border-[#16281F] bg-[#0A100D] flex items-center gap-2 overflow-x-auto shrink-0 z-30">
          <span className="text-[9px] text-[#8B9992] font-bold uppercase">MINIMIZED:</span>
          {minimizedWindows.map((win) => (
            <button
              key={win.id}
              onClick={() => {
                WorkspaceManager.focusWindow(userId, win.id);
                syncActiveWorkspace();
              }}
              className="px-2.5 py-1 rounded-lg bg-[#050706] border border-[#16281F] hover:border-[#00D084]/50 text-xs font-mono text-[#F5F7F6] hover:text-[#19F59A] flex items-center gap-1.5 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B9992]" />
              <span className="max-w-[140px] truncate">{win.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 5. UNIVERSAL COMMAND ACCESS BAR (Section 2 & 16)     */}
      {/* ---------------------------------------------------- */}
      {viewMode !== 'PRESENTATION' && (
        <footer className="p-2 sm:p-3 border-t border-[#16281F] bg-[#0A100D]/95 z-30 shrink-0 backdrop-blur-md">
          <div className="max-w-4xl mx-auto flex items-center gap-2">
            <CommandBar
              onExecute={handleExecuteCommand}
              activeMissionContext={
                activeWorkspace.associatedProjectName
                  ? { id: activeWorkspace.associatedProjectId || '', title: activeWorkspace.associatedProjectName }
                  : null
              }
              placeholder="ZORO OS Universal Command (e.g. 'Open Vision', 'Set up my development workspace', 'Close Memory')..."
              isProcessing={coreState === 'PLANNING' || coreState === 'EXECUTING'}
            />
          </div>
        </footer>
      )}

      {/* ---------------------------------------------------- */}
      {/* 6. NEW WORKSPACE CREATION MODAL (Section 13)         */}
      {/* ---------------------------------------------------- */}
      {isNewWorkspaceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050706]/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0A100D] border border-[#16281F] rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#16281F]">
              <span className="font-bold text-sm text-[#F5F7F6]">NEW WORKSPACE</span>
              <button
                onClick={() => setIsNewWorkspaceModalOpen(false)}
                className="text-[#8B9992] hover:text-[#F5F7F6]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-[#8B9992] uppercase">Workspace Name</label>
              <input
                type="text"
                value={newWsName}
                onChange={(e) => setNewWsName(e.target.value)}
                placeholder="e.g. AI Research Lab, Development, Combat Recon..."
                className="w-full bg-[#050706] p-2.5 rounded-xl border border-[#16281F] text-xs text-[#F5F7F6] outline-none focus:border-[#00D084]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-[#8B9992] uppercase">Initial Modules</label>
              <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto p-1">
                {(['COMMAND', 'MISSIONS', 'TASKS', 'VISION', 'AGENTS', 'MEMORY', 'INTELLIGENCE', 'AUTOMATION'] as WindowModuleType[]).map((mod) => (
                  <button
                    key={mod}
                    type="button"
                    onClick={() => {
                      setNewWsModules((prev) =>
                        prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
                      );
                    }}
                    className={`p-2 rounded-lg text-left text-xs border transition-colors ${
                      newWsModules.includes(mod)
                        ? 'bg-[#121C17] border-[#00D084] text-[#19F59A] font-bold'
                        : 'bg-[#050706] border-[#16281F] text-[#8B9992]'
                    }`}
                  >
                    {MODULE_METADATA[mod]?.title || mod}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#16281F]">
              <button
                onClick={() => setIsNewWorkspaceModalOpen(false)}
                className="px-3 py-1.5 rounded-xl border border-[#16281F] text-xs text-[#8B9992]"
              >
                CANCEL
              </button>
              <button
                onClick={handleCreateWorkspace}
                disabled={!newWsName.trim()}
                className="px-4 py-1.5 rounded-xl bg-[#00D084] text-[#050706] text-xs font-bold disabled:opacity-40"
              >
                CREATE WORKSPACE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 7. ACTION PREVIEW & APPROVAL MODAL (Section 18 & 46) */}
      {/* ---------------------------------------------------- */}
      <CommandPreviewModal
        isOpen={isPreviewOpen}
        preview={activePreview}
        onApprove={handleApproveAction}
        onCancel={() => {
          setIsPreviewOpen(false);
          setActivePreview(null);
          setCoreState('READY');
        }}
        isExecuting={isApproving}
      />
    </div>
  );
};

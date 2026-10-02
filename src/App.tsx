import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { RoutePath, RealtimeEvent, Task } from './types';
import { AppShell } from './components/layout/AppShell';
import { AIOrb } from './components/AIOrb';
import { CommandPalette } from './components/CommandPalette';

import { Login } from './screens/Login';
import { Signup } from './screens/Signup';
import { ForgotPassword } from './screens/ForgotPassword';
import { BootScreen } from './screens/Boot';
import { Dashboard } from './screens/Dashboard';
import { Missions } from './screens/Missions';
import { Chat } from './screens/Chat';
import { Voice } from './screens/Voice';
import { Tasks } from './screens/Tasks';
import { MemoryScreen } from './screens/Memory';
import { FocusScreen } from './screens/Focus';
import { Commands } from './screens/Commands';
import { CommandCenter } from './screens/CommandCenter';
import { NotificationsScreen } from './screens/Notifications';
import { Analytics } from './screens/Analytics';
import { LogsScreen } from './screens/Logs';
import { Settings } from './screens/Settings';
import { Profile } from './screens/Profile';
import { Agents } from './screens/Agents';
import { AgentCouncil } from './screens/AgentCouncil';
import { AutomationScreen } from './screens/Automation';
import { VisionScreen } from './screens/Vision';
import { IntelligenceScreen } from './screens/Intelligence';
import { KnowledgeScreen } from './screens/Knowledge';
import { automationScheduler } from './services/automation/scheduler';
import { AutomationService } from './services/automation';
import { MissionService } from './services/mission';
import { MemoryService } from './services/memory';
import { AgentCore } from './services/agent';
import { speechService } from './services/speech';
import { realtimeService } from './services/realtime';
import { soundService } from './services/sound';
import { CommandRouterService } from './services/commandCenter/commandRouter';
import { getLocalStore } from './services/supabase';

export const App: React.FC = () => {
  const { authState, currentSession, isBootComplete, completeBoot } = useAuth();
  const userId = currentSession?.userId || 'guest';
  const [currentPath, setCurrentPath] = useState<RoutePath>('/command');
  const [isVoiceHUDOpen, setIsVoiceHUDOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [initialCommand, setInitialCommand] = useState<string>('');
  const [coreState, setCoreState] = useState<string>('READY');
  const [isExecutingGlobal, setIsExecutingGlobal] = useState(false);

  // Subsystem Badge Counts
  const [badges, setBadges] = useState({
    missionsCount: 0,
    tasksCount: 0,
    agentActive: false,
    memoriesCount: 0,
    automationsCount: 0,
  });

  const refreshBadges = () => {
    try {
      const msns = MissionService.getMissions(userId);
      const activeMsns = msns.filter((m) => m.status === 'ACTIVE').length;
      const tasks = getLocalStore<Task[]>(`tasks_${userId}`, []);
      const pendingTasks = tasks.filter((t) => t.status !== 'COMPLETED').length;
      const mems = MemoryService.getMemories(userId).length;
      const autos = AutomationService.getAutomations(userId);
      const activeAutos = autos.filter((a) => a.status === 'ACTIVE').length;
      const agents = AgentCore.getExecutions(userId);
      const isAgentRunning = agents.some((a) =>
        ['UNDERSTANDING', 'PLAN_READY', 'EXECUTING', 'VERIFYING'].includes(a.status)
      );

      setBadges({
        missionsCount: activeMsns,
        tasksCount: pendingTasks,
        agentActive: isAgentRunning,
        memoriesCount: mems,
        automationsCount: activeAutos,
      });
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    refreshBadges();
  }, [userId, currentPath]);

  // Realtime updates
  useEffect(() => {
    const unsub = realtimeService.on('*', () => {
      refreshBadges();
    });
    return () => unsub();
  }, [userId]);

  // URL hash routing
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '') as RoutePath;
      if (hash && hash.startsWith('/') && hash !== '/') {
        setCurrentPath(hash);
      } else {
        setCurrentPath('/command');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navigate = (path: RoutePath) => {
    setCurrentPath(path);
    window.location.hash = path;
  };

  // Global Keyboard Shortcuts (Section 33)
  // CTRL + /: Focus command
  // CTRL + K: Command palette
  // CTRL + M: Mission Control
  // CTRL + V: Vision
  // CTRL + A: Agent Brain
  // ESC: Close modal/drawer
  // CTRL + Space: Voice HUD
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName);

      // Escape always closes overlays
      if (e.key === 'Escape') {
        setIsVoiceHUDOpen(false);
        setIsCommandPaletteOpen(false);
        return;
      }

      // Voice HUD: Ctrl + Space
      if (e.code === 'Space' && (e.ctrlKey || e.metaKey)) {
        if (!isInput && currentPath !== '/voice') {
          e.preventDefault();
          setIsVoiceHUDOpen((prev) => !prev);
          soundService.play('VOICE_ACTIVATED');
          return;
        }
      }

      // Command Palette: Ctrl + K
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        soundService.play('CLICK');
        return;
      }

      // Shortcuts that only fire when NOT typing in an input
      if (!isInput && (e.ctrlKey || e.metaKey)) {
        if (e.key === 'm' || e.key === 'M') {
          e.preventDefault();
          navigate('/missions');
          soundService.play('CLICK');
        } else if (e.key === 'v' || e.key === 'V') {
          e.preventDefault();
          navigate('/vision');
          soundService.play('CLICK');
        } else if (e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          navigate('/agents');
          soundService.play('CLICK');
        }
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [currentPath]);

  // Lifecycle hook for background Automation Scheduler
  useEffect(() => {
    if (currentSession?.userId) {
      automationScheduler.start(currentSession.userId);
    }
    return () => {
      automationScheduler.stop();
    };
  }, [currentSession?.userId]);

  // Execute quick command from Palette, Dock, or HUD
  const handleExecuteQuickCommand = (command: string, imageFile?: File | null) => {
    setInitialCommand(command);
    if (currentPath !== '/command' && currentPath !== '/commands' && currentPath !== '/os') {
      navigate('/command');
    }
  };

  // 1. Loading Authentication State
  if (authState === 'AUTHENTICATING' && !currentSession) {
    return (
      <div className="min-h-screen bg-jarvis-bg flex flex-col items-center justify-center p-4">
        <AIOrb state="THINKING" size={130} />
        <div className="mt-6 text-center space-y-2 font-mono">
          <div className="text-sm font-bold text-jarvis-primary tracking-widest animate-pulse">
            AUTHENTICATING SESSION...
          </div>
          <p className="text-xs text-jarvis-textMuted uppercase tracking-wider">
            CALIBRATING THREE BLADES MATRIX
          </p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated Routes
  if (!currentSession) {
    switch (currentPath) {
      case '/signup':
        return <Signup onNavigate={navigate} />;
      case '/forgot-password':
        return <ForgotPassword onNavigate={navigate} />;
      case '/login':
      default:
        return <Login onNavigate={navigate} />;
    }
  }

  // 3. Cinematic Boot Sequence (Section 45)
  if (!isBootComplete) {
    return <BootScreen onComplete={completeBoot} />;
  }

  // 4. Authenticated Application Shell with Protected Routes
  const renderScreen = () => {
    switch (currentPath) {
      case '/command':
      case '/commands':
      case '/os':
      case '/workspace':
      case '/':
        return (
          <CommandCenter
            onNavigate={navigate}
            initialCommand={initialCommand}
            onOpenVoiceHUD={() => setIsVoiceHUDOpen(true)}
          />
        );
      case '/missions':
        return <Missions onNavigate={navigate} />;
      case '/agents':
        return <Agents onNavigate={navigate} />;
      case '/agents/council':
        return <AgentCouncil onNavigate={navigate} />;
      case '/automation':
        return <AutomationScreen onNavigate={navigate} />;
      case '/vision':
        return <VisionScreen onNavigate={navigate} />;
      case '/intelligence':
        return <IntelligenceScreen onNavigate={navigate} />;
      case '/intelligence/analytics':
        return <IntelligenceScreen onNavigate={navigate} initialTab="ANALYTICS" />;
      case '/settings/intelligence':
        return <Settings onNavigate={navigate} />;
      case '/chat':
        return <Chat onNavigate={navigate} />;
      case '/voice':
        return <Voice onNavigate={navigate} />;
      case '/tasks':
        return <Tasks onNavigate={navigate} />;
      case '/memory':
        return <MemoryScreen onNavigate={navigate} />;
      case '/knowledge':
        return <KnowledgeScreen onNavigate={navigate} />;
      case '/integrations':
        return <Settings onNavigate={navigate} />;
      case '/memory/graph':
        return <MemoryScreen onNavigate={navigate} initialTab="GRAPH" />;
      case '/memory/timeline':
        return <MemoryScreen onNavigate={navigate} initialTab="TIMELINE" />;
      case '/memory/decisions':
        return <MemoryScreen onNavigate={navigate} initialTab="DECISIONS" />;
      case '/neural-memory':
        return <MemoryScreen onNavigate={navigate} />;
      case '/focus':
        return <FocusScreen onNavigate={navigate} />;
      case '/analytics':
        return <Analytics onNavigate={navigate} />;
      case '/logs':
        return <LogsScreen onNavigate={navigate} />;
      case '/settings':
        return <Settings onNavigate={navigate} />;
      case '/profile':
        return <Profile onNavigate={navigate} />;
      case '/notifications':
        return <NotificationsScreen onNavigate={navigate} />;
      case '/dashboard':
        return <Dashboard onNavigate={navigate} />;
      default:
        return (
          <CommandCenter
            onNavigate={navigate}
            initialCommand={initialCommand}
            onOpenVoiceHUD={() => setIsVoiceHUDOpen(true)}
          />
        );
    }
  };

  const activeMissionContext = CommandRouterService.getActiveMissionContext(userId);

  return (
    <AppShell
      currentPath={currentPath}
      onNavigate={navigate}
      onExecuteCommand={handleExecuteQuickCommand}
      onOpenVoiceHUD={() => setIsVoiceHUDOpen(true)}
      isVoiceHUDOpen={isVoiceHUDOpen}
      onCloseVoiceHUD={() => setIsVoiceHUDOpen(false)}
      userId={userId}
      activeMissionTitle={activeMissionContext?.title}
      isExecuting={isExecutingGlobal}
      coreState={coreState}
      badges={badges}
      onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
    >
      {renderScreen()}

      {/* Global Command Palette (Ctrl + K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={navigate}
        onRunCommand={(cmd) => handleExecuteQuickCommand(cmd)}
      />
    </AppShell>
  );
};

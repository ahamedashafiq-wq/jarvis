import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { RoutePath, RealtimeEvent, Task } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { AIOrb } from './components/AIOrb';
import { GlobalVoiceHUD } from './components/GlobalVoiceHUD';
import { CommandPalette } from './components/CommandPalette';
import { FloatingCommandHUD } from './components/FloatingCommandHUD';
import { SystemCommandOverlay } from './components/SystemCommandOverlay';

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
import { JarvisOS } from './screens/JarvisOS';
import { Analytics } from './screens/Analytics';
import { LogsScreen } from './screens/Logs';
import { Settings } from './screens/Settings';
import { Profile } from './screens/Profile';
import { Agents } from './screens/Agents';
import { AgentCouncil } from './screens/AgentCouncil';
import { AutomationScreen } from './screens/Automation';
import { VisionScreen } from './screens/Vision';
import { IntelligenceScreen } from './screens/Intelligence';
import { automationScheduler } from './services/automation/scheduler';
import { AutomationService } from './services/automation';
import { MissionService } from './services/mission';
import { MemoryService } from './services/memory';
import { speechService } from './services/speech';
import { realtimeService } from './services/realtime';
import { CommandRouterService } from './services/commandCenter/commandRouter';
import { getLocalStore } from './services/supabase';
import {
  Command as CommandIcon,
  Target,
  Database,
  Eye,
  Menu,
  X,
  Zap,
  TrendingUp,
  Cpu,
  MessageSquare,
  Timer,
  Bell,
  Settings as SettingsIcon,
  User,
  CheckSquare,
} from 'lucide-react';

export const App: React.FC = () => {
  const { authState, currentSession, isBootComplete, completeBoot } = useAuth();
  const userId = currentSession?.userId || 'guest';
  const [currentPath, setCurrentPath] = useState<RoutePath>('/os');
  const [isVoiceHUDOpen, setIsVoiceHUDOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSystemOverlayOpen, setIsSystemOverlayOpen] = useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [initialCommand, setInitialCommand] = useState<string>('');

  // Live activities for Overlay
  const [overlayActivities, setOverlayActivities] = useState<
    { id: string; time: string; text: string; type: string }[]
  >([]);

  // Telemetry for Overlay
  const [overlayState, setOverlayState] = useState({
    coreOnline: true,
    voiceState: 'READY',
    visionState: 'READY',
    agentState: 'READY',
    automationActiveCount: 0,
    memoryCount: 0,
    activeMissionTitle: '',
    activeFocusMinutes: null as number | null,
  });

  const refreshOverlayData = () => {
    try {
      const autos = AutomationService.getAutomations(userId);
      const activeAutos = autos.filter((a) => a.status === 'ACTIVE').length;
      const mems = MemoryService.getMemories(userId).length;
      const ctx = CommandRouterService.getActiveMissionContext(userId);
      const focusMins = sessionStorage.getItem('pending_focus_minutes');

      setOverlayState({
        coreOnline: true,
        voiceState: speechService.isRecognitionSupported() ? 'READY' : 'TEXT ONLY',
        visionState: 'READY',
        agentState: 'READY',
        automationActiveCount: activeAutos,
        memoryCount: mems,
        activeMissionTitle: ctx?.title || '',
        activeFocusMinutes: focusMins ? parseInt(focusMins, 10) : null,
      });
    } catch {
      // Ignore initial render errors
    }
  };

  useEffect(() => {
    refreshOverlayData();
  }, [userId, currentPath]);

  // Realtime events listener for Overlay
  useEffect(() => {
    const unsub = realtimeService.on('*', (event: RealtimeEvent) => {
      const nowStr = new Date(event.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      setOverlayActivities((prev) => [
        {
          id: event.id || String(Date.now() + Math.random()),
          time: nowStr,
          text: event.type.replace(/_/g, ' '),
          type: event.type.split('_')[0] || 'SYSTEM',
        },
        ...prev.slice(0, 9),
      ]);
      refreshOverlayData();
    });

    return () => unsub();
  }, [userId]);

  // Handle URL hash routing or initial route detection
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '') as RoutePath;
      if (hash && hash.startsWith('/') && hash !== '/') {
        setCurrentPath(hash);
      } else {
        setCurrentPath('/os');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Global Ctrl + Space listener to open Voice HUD from any screen
  useEffect(() => {
    const handleGlobalVoiceKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.code === 'Space' && (e.ctrlKey || e.metaKey)) {
        if (currentPath !== '/voice') {
          e.preventDefault();
          setIsVoiceHUDOpen((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalVoiceKey);
    return () => window.removeEventListener('keydown', handleGlobalVoiceKey);
  }, [currentPath]);

  // Global Ctrl/Cmd + K listener for Command Palette (Section 4 & 17)
  useEffect(() => {
    const handlePaletteKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handlePaletteKey);
    return () => window.removeEventListener('keydown', handlePaletteKey);
  }, []);

  // Lifecycle hook for background Automation Scheduler (Phase 9)
  useEffect(() => {
    if (currentSession?.userId) {
      automationScheduler.start(currentSession.userId);
    }
    return () => {
      automationScheduler.stop();
    };
  }, [currentSession?.userId]);

  const navigate = (path: RoutePath) => {
    setCurrentPath(path);
    window.location.hash = path;
  };

  // Run command from palette or HUD
  const handleExecuteQuickCommand = (command: string) => {
    setInitialCommand(command);
    navigate('/command');
  };

  // 1. Loading Authentication State
  if (authState === 'AUTHENTICATING' && !currentSession) {
    return (
      <div className="min-h-screen bg-[#050706] flex flex-col items-center justify-center p-4">
        <AIOrb state="THINKING" size={140} />
        <div className="mt-6 text-center space-y-2 font-mono">
          <div className="text-sm font-bold text-[#19F59A] tracking-widest animate-pulse">
            AUTHENTICATING SESSION...
          </div>
          <p className="text-xs text-[#8B9992]">CALIBRATING THREE BLADES MATRIX</p>
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

  // 3. Holographic Boot Sequence
  if (!isBootComplete) {
    return <BootScreen onComplete={completeBoot} />;
  }

  // 4. Authenticated Application Shell with Protected Routes
  const renderScreen = () => {
    switch (currentPath) {
      case '/command':
      case '/commands':
        return <CommandCenter onNavigate={navigate} initialCommand={initialCommand} />;
      case '/os':
      case '/workspace':
        return <JarvisOS onNavigateRoute={navigate} />;
      case '/notifications':
        return <NotificationsScreen onNavigate={navigate} />;
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
      case '/dashboard':
        return <Dashboard onNavigate={navigate} />;
      default:
        return <CommandCenter onNavigate={navigate} initialCommand={initialCommand} />;
    }
  };

  if (currentPath === '/os' || currentPath === '/workspace') {
    return (
      <div className="h-screen w-screen overflow-hidden bg-[#050706]">
        <JarvisOS onNavigateRoute={navigate} />
        <GlobalVoiceHUD
          isOpen={isVoiceHUDOpen}
          onClose={() => setIsVoiceHUDOpen(false)}
          onNavigate={navigate}
        />
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onNavigate={navigate}
          onRunCommand={handleExecuteQuickCommand}
        />
        <SystemCommandOverlay
          isOpen={isSystemOverlayOpen}
          onClose={() => setIsSystemOverlayOpen(false)}
          onNavigate={navigate}
          systemState={overlayState}
          recentActivities={overlayActivities}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050706] flex flex-col text-[#F5F7F6]">
      <Navbar
        onNavigate={navigate}
        currentPath={currentPath}
        onOpenVoiceHUD={() => setIsVoiceHUDOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenSystemOverlay={() => setIsSystemOverlayOpen(true)}
      />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar currentPath={currentPath} onNavigate={navigate} />
        <main className="flex-1 overflow-y-auto">{renderScreen()}</main>
      </div>

      {/* Global Voice Synapse HUD Modal */}
      <GlobalVoiceHUD
        isOpen={isVoiceHUDOpen}
        onClose={() => setIsVoiceHUDOpen(false)}
        onNavigate={navigate}
      />

      {/* Global Command Palette (Ctrl + K) - Phase 13 Section 4 */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={navigate}
        onRunCommand={handleExecuteQuickCommand}
      />

      {/* Global Floating Command HUD (Desktop) - Phase 13 Section 16 */}
      <FloatingCommandHUD
        onExecute={(text, image) => {
          setInitialCommand(text);
          navigate('/command');
        }}
        onOpenFullSurface={() => navigate('/command')}
        currentPath={currentPath}
      />

      {/* System Command Overlay - Phase 13 Section 33 */}
      <SystemCommandOverlay
        isOpen={isSystemOverlayOpen}
        onClose={() => setIsSystemOverlayOpen(false)}
        onNavigate={navigate}
        systemState={overlayState}
        recentActivities={overlayActivities}
      />

      {/* ---------------------------------------------------- */}
      {/* Mobile Bottom Navigation Bar (Section 38 Requirement)*/}
      {/* COMMAND, MISSIONS, MEMORY, VISION, MORE              */}
      {/* ---------------------------------------------------- */}
      <div className="md:hidden flex items-center justify-around border-t border-[#16281F] bg-[#0A100D] py-2 px-1 sticky bottom-0 z-40 text-[10px] font-mono">
        <button
          onClick={() => navigate('/command')}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded transition-colors ${
            currentPath === '/command' || currentPath === '/commands'
              ? 'text-[#19F59A] font-bold'
              : 'text-[#8B9992]'
          }`}
        >
          <CommandIcon className="w-4 h-4" />
          <span>COMMAND</span>
        </button>

        <button
          onClick={() => navigate('/missions')}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded transition-colors ${
            currentPath === '/missions' ? 'text-[#38E1FF] font-bold' : 'text-[#8B9992]'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>MISSIONS</span>
        </button>

        <button
          onClick={() => navigate('/memory')}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded transition-colors ${
            currentPath.startsWith('/memory') ? 'text-[#FFB000] font-bold' : 'text-[#8B9992]'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>MEMORY</span>
        </button>

        <button
          onClick={() => navigate('/vision')}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded transition-colors ${
            currentPath === '/vision' ? 'text-[#19F59A] font-bold' : 'text-[#8B9992]'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>VISION</span>
        </button>

        <button
          onClick={() => setIsMobileMoreOpen(true)}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded transition-colors text-[#8B9992] hover:text-[#F5F7F6]`}
        >
          <Menu className="w-4 h-4" />
          <span>MORE</span>
        </button>
      </div>

      {/* Mobile "More" Bottom Sheet Modal (Section 38) */}
      {isMobileMoreOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex items-end justify-center bg-[#050706]/85 backdrop-blur-md animate-fadeIn font-mono">
          <div className="w-full bg-[#0A100D] border-t border-[#16281F] rounded-t-3xl p-5 space-y-4 shadow-2xl animate-slideUp max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#16281F]">
              <span className="font-bold text-sm text-[#F5F7F6]">
                SUBSYSTEM DISPATCH
              </span>
              <button
                onClick={() => setIsMobileMoreOpen(false)}
                className="p-1 rounded text-[#8B9992] hover:text-[#F5F7F6]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-xs text-center">
              {[
                { label: 'ACTION QUEUE', path: '/tasks' as RoutePath, icon: <CheckSquare className="w-5 h-5 text-[#38E1FF] mx-auto" /> },
                { label: 'AGENT BRAIN', path: '/agents' as RoutePath, icon: <Cpu className="w-5 h-5 text-[#19F59A] mx-auto" /> },
                { label: 'AUTOMATION', path: '/automation' as RoutePath, icon: <Zap className="w-5 h-5 text-[#FFB000] mx-auto" /> },
                { label: 'INTELLIGENCE', path: '/intelligence' as RoutePath, icon: <TrendingUp className="w-5 h-5 text-[#38E1FF] mx-auto" /> },
                { label: 'AI CHAT', path: '/chat' as RoutePath, icon: <MessageSquare className="w-5 h-5 text-[#19F59A] mx-auto" /> },
                { label: 'FOCUS TIMER', path: '/focus' as RoutePath, icon: <Timer className="w-5 h-5 text-[#FF3B30] mx-auto" /> },
                { label: 'NOTIFICATIONS', path: '/notifications' as RoutePath, icon: <Bell className="w-5 h-5 text-[#19F59A] mx-auto" /> },
                { label: 'OPERATOR', path: '/profile' as RoutePath, icon: <User className="w-5 h-5 text-[#8B9992] mx-auto" /> },
                { label: 'SETTINGS', path: '/settings' as RoutePath, icon: <SettingsIcon className="w-5 h-5 text-[#8B9992] mx-auto" /> },
              ].map((m) => (
                <button
                  key={m.path}
                  onClick={() => {
                    setIsMobileMoreOpen(false);
                    navigate(m.path);
                  }}
                  className={`p-3 rounded-2xl border transition-all flex flex-col items-center gap-1.5 ${
                    currentPath === m.path
                      ? 'bg-[#121C17] border-[#00D084] text-[#19F59A] font-bold'
                      : 'bg-[#050706] border-[#16281F] text-[#8B9992] hover:text-[#F5F7F6]'
                  }`}
                >
                  {m.icon}
                  <span className="text-[10px] truncate max-w-full">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { RoutePath } from '../../types';
import { TopSystemBar } from './TopSystemBar';
import { NavigationSidebar } from './NavigationSidebar';
import { GlobalCommandDock } from './GlobalCommandDock';
import { GlobalVoiceHUD } from '../GlobalVoiceHUD';
import { SystemHealthModal } from './SystemHealthModal';
import { DeveloperConsoleModal } from './DeveloperConsoleModal';
import { Menu } from 'lucide-react';

interface AppShellProps {
  currentPath: RoutePath;
  onNavigate: (path: RoutePath) => void;
  children: React.ReactNode;
  onExecuteCommand: (command: string, imageFile?: File | null) => void;
  onOpenVoiceHUD: () => void;
  isVoiceHUDOpen: boolean;
  onCloseVoiceHUD: () => void;
  userId: string;
  activeMissionTitle?: string;
  isExecuting?: boolean;
  coreState?: string;
  badges?: {
    missionsCount?: number;
    tasksCount?: number;
    agentActive?: boolean;
    memoriesCount?: number;
    automationsCount?: number;
  };
}

export const AppShell: React.FC<AppShellProps> = ({
  currentPath,
  onNavigate,
  children,
  onExecuteCommand,
  onOpenVoiceHUD,
  isVoiceHUDOpen,
  onCloseVoiceHUD,
  userId,
  activeMissionTitle,
  isExecuting = false,
  coreState = 'READY',
  badges = {},
}) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSystemHealthOpen, setIsSystemHealthOpen] = useState(false);
  const [isDevConsoleOpen, setIsDevConsoleOpen] = useState(false);

  return (
    <div className="min-h-screen bg-jarvis-bg text-jarvis-text flex flex-col font-sans selection:bg-jarvis-primary/20 selection:text-jarvis-primary">
      {/* Top System Bar (Section 5) */}
      <TopSystemBar
        currentPath={currentPath}
        onNavigate={onNavigate}
        onOpenSystemHealth={() => setIsSystemHealthOpen(true)}
        onOpenDevConsole={() => setIsDevConsoleOpen(true)}
        activeMissionTitle={activeMissionTitle}
        coreState={coreState}
      />

      {/* Mobile Hamburger Header (Only on small screens) */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 border-b border-jarvis-border/60 bg-jarvis-surface font-mono text-xs">
        <button
          onClick={() => setIsMobileNavOpen(true)}
          className="flex items-center gap-2 text-jarvis-primary px-2 py-1 rounded border border-jarvis-border"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-4 h-4" />
          <span>MENU</span>
        </button>
        <span className="text-[10px] text-jarvis-textMuted uppercase tracking-wider truncate max-w-[200px]">
          {currentPath.replace('/', '').toUpperCase() || 'COMMAND CENTER'}
        </span>
      </div>

      {/* Main Structural Body: Sidebar + Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar (Section 6) */}
        <NavigationSidebar
          currentPath={currentPath}
          onNavigate={onNavigate}
          onOpenSystemHealth={() => setIsSystemHealthOpen(true)}
          onOpenDevConsole={() => setIsDevConsoleOpen(true)}
          isMobileOpen={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
          badges={badges}
        />

        {/* Backdrop for mobile drawer */}
        {isMobileNavOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileNavOpen(false)}
          />
        )}

        {/* Main Workspace with bottom padding for Global Command Dock */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-28">
          <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Global Command Dock (Section 18) */}
      <GlobalCommandDock
        onExecuteCommand={onExecuteCommand}
        onOpenVoiceHUD={onOpenVoiceHUD}
        activeContextTitle={activeMissionTitle || 'AI Assistant'}
        isExecuting={isExecuting}
      />

      {/* Global Voice HUD Modal (Section 19) */}
      <GlobalVoiceHUD
        isOpen={isVoiceHUDOpen}
        onClose={onCloseVoiceHUD}
        onNavigate={onNavigate}
      />

      {/* System Health Diagnostics Modal (Section 47) */}
      <SystemHealthModal
        isOpen={isSystemHealthOpen}
        onClose={() => setIsSystemHealthOpen(false)}
        userId={userId}
      />

      {/* Developer Console Modal (Section 46) */}
      <DeveloperConsoleModal
        isOpen={isDevConsoleOpen}
        onClose={() => setIsDevConsoleOpen(false)}
        userId={userId}
      />
    </div>
  );
};

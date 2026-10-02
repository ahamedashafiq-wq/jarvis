import React, { useState, useEffect } from 'react';
import { RoutePath } from '../../types';
import { SystemStatus } from '../zoro/SystemStatus';
import { ZoroSidebar } from '../zoro/ZoroSidebar';
import { ZoroIntelligencePanel } from '../zoro/ZoroIntelligencePanel';
import { ZoroVoiceCommandBar } from '../zoro/ZoroVoiceCommandBar';
import { GlobalVoiceHUD } from '../GlobalVoiceHUD';
import { SystemHealthModal } from './SystemHealthModal';
import { DeveloperConsoleModal } from './DeveloperConsoleModal';
import { soundService } from '../../services/sound';

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
  onOpenCommandPalette?: () => void;
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
  onOpenCommandPalette,
}) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSystemHealthOpen, setIsSystemHealthOpen] = useState(false);
  const [isDevConsoleOpen, setIsDevConsoleOpen] = useState(false);

  // Shortcut Ctrl + B to toggle sidebar collapsed state
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName);
      if (!isInput && (e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
        soundService.play('CLICK');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className="min-h-screen bg-[#03070D] text-zoro-text flex flex-col font-sans selection:bg-zoro-cyan/20 selection:text-zoro-cyan">
      {/* 1. Global Top System Bar (Section 3) */}
      <SystemStatus
        currentPath={currentPath}
        onNavigate={onNavigate}
        onOpenSearch={() => {
          if (onOpenCommandPalette) {
            onOpenCommandPalette();
          } else {
            onExecuteCommand('');
          }
        }}
        onOpenSystemHealth={() => setIsSystemHealthOpen(true)}
        onOpenDevConsole={() => setIsDevConsoleOpen(true)}
        onToggleMobileNav={() => setIsMobileNavOpen((prev) => !prev)}
        operatorName="COMMANDER"
        systemId="OMNIA-OS-01"
        agentActive={badges.agentActive}
      />

      {/* 2. Structured Layout: Left Sidebar + Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT SIDEBAR: Collapsible Navigation Rail (Section 3) */}
        <ZoroSidebar
          currentPath={currentPath}
          onNavigate={onNavigate}
          isMobileOpen={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapsed={() => setIsSidebarCollapsed((prev) => !prev)}
          badges={badges}
        />

        {/* Mobile Backdrop */}
        {isMobileNavOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/75 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileNavOpen(false)}
          />
        )}

        {/* MAIN CONTENT WORKSPACE */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-28">
          <div className="w-full max-w-7xl mx-auto p-3 sm:p-5 lg:p-7 space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* 3. Persistent Voice Command Bar on secondary screens */}
      {currentPath !== '/command' && currentPath !== '/commands' && currentPath !== '/' && (
        <ZoroVoiceCommandBar
          onExecuteCommand={onExecuteCommand}
          isProcessing={isExecuting}
          activeContextTitle={activeMissionTitle}
        />
      )}

      {/* Global Voice HUD Modal (Ctrl + Space) */}
      <GlobalVoiceHUD
        isOpen={isVoiceHUDOpen}
        onClose={onCloseVoiceHUD}
        onNavigate={onNavigate}
      />

      {/* System Health Diagnostics Modal */}
      <SystemHealthModal
        isOpen={isSystemHealthOpen}
        onClose={() => setIsSystemHealthOpen(false)}
        userId={userId}
      />

      {/* Developer Console Modal */}
      <DeveloperConsoleModal
        isOpen={isDevConsoleOpen}
        onClose={() => setIsDevConsoleOpen(false)}
        userId={userId}
      />
    </div>
  );
};

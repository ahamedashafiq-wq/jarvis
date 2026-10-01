import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { RoutePath } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { AIOrb } from './components/AIOrb';

import { Login } from './screens/Login';
import { Signup } from './screens/Signup';
import { ForgotPassword } from './screens/ForgotPassword';
import { BootScreen } from './screens/Boot';
import { Dashboard } from './screens/Dashboard';
import { Chat } from './screens/Chat';
import { Voice } from './screens/Voice';
import { Tasks } from './screens/Tasks';
import { MemoryScreen } from './screens/Memory';
import { FocusScreen } from './screens/Focus';
import { Commands } from './screens/Commands';
import { Analytics } from './screens/Analytics';
import { LogsScreen } from './screens/Logs';
import { Settings } from './screens/Settings';
import { Profile } from './screens/Profile';

export const App: React.FC = () => {
  const { authState, currentSession, isBootComplete, completeBoot } = useAuth();
  const [currentPath, setCurrentPath] = useState<RoutePath>('/dashboard');

  // Handle URL hash routing or initial route detection
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '') as RoutePath;
      if (hash && hash.startsWith('/')) {
        setCurrentPath(hash);
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
      case '/chat':
        return <Chat onNavigate={navigate} />;
      case '/voice':
        return <Voice onNavigate={navigate} />;
      case '/tasks':
        return <Tasks onNavigate={navigate} />;
      case '/memory':
        return <MemoryScreen onNavigate={navigate} />;
      case '/focus':
        return <FocusScreen onNavigate={navigate} />;
      case '/commands':
        return <Commands onNavigate={navigate} />;
      case '/analytics':
        return <Analytics onNavigate={navigate} />;
      case '/logs':
        return <LogsScreen onNavigate={navigate} />;
      case '/settings':
        return <Settings onNavigate={navigate} />;
      case '/profile':
        return <Profile onNavigate={navigate} />;
      case '/dashboard':
      default:
        return <Dashboard onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050706] flex flex-col text-[#F5F7F6]">
      <Navbar onNavigate={navigate} currentPath={currentPath} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar currentPath={currentPath} onNavigate={navigate} />
        <main className="flex-1 overflow-y-auto">{renderScreen()}</main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-[#16281F] bg-[#0A100D] py-2 px-1 sticky bottom-0 z-40 text-[10px] font-mono">
        {(
          [
            { path: '/dashboard', label: 'DASH' },
            { path: '/chat', label: 'CHAT' },
            { path: '/voice', label: 'VOICE' },
            { path: '/tasks', label: 'TASKS' },
            { path: '/focus', label: 'FOCUS' },
            { path: '/commands', label: 'CLI' },
            { path: '/profile', label: 'PROFILE' },
          ] as const
        ).map((m) => (
          <button
            key={m.path}
            onClick={() => navigate(m.path)}
            className={`px-2 py-1 rounded transition-colors ${
              currentPath === m.path ? 'text-[#19F59A] font-bold' : 'text-[#8B9992]'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
};

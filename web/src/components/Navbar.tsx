import React from 'react';
import { Shield, Bell, Settings as SettingsIcon, LogOut, Radio } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { RoutePath } from '../types';

interface NavbarProps {
  onNavigate: (path: RoutePath) => void;
  currentPath: RoutePath;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPath }) => {
  const { currentSession, profile, logout, isSupabase } = useAuth();

  return (
    <header className="h-14 border-b border-[#16281F] bg-[#0A100D]/90 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-50">
      {/* Brand & Tagline */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('/dashboard')}>
        <div className="w-8 h-8 rounded bg-[#00D084]/15 border border-[#00D084] flex items-center justify-center">
          <Shield className="w-4 h-4 text-[#19F59A]" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm tracking-wider text-[#F5F7F6]">JARVIS</span>
            <span className="text-[10px] font-mono font-bold text-[#19F59A] px-1 rounded bg-[#00D084]/10 border border-[#00D084]/20">
              ZORO EDITION
            </span>
          </div>
          <div className="text-[8px] font-mono text-[#8B9992] tracking-widest hidden sm:block">
            THREE BLADES. ONE INTELLIGENCE.
          </div>
        </div>
      </div>

      {/* Telemetry and User Controls */}
      <div className="flex items-center gap-3">
        {/* Backend & AI status */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded bg-[#050706] border border-[#16281F] text-[10px] font-mono">
          <Radio className="w-3 h-3 text-[#19F59A] animate-pulse" />
          <span className="text-[#8B9992]">CORE:</span>
          <span className="text-[#19F59A] font-bold">ONLINE</span>
          <span className="text-[#16281F]">|</span>
          <span className="text-[#8B9992]">DB:</span>
          <span className={isSupabase ? 'text-[#38E1FF]' : 'text-[#FFB000]'}>
            {isSupabase ? 'SUPABASE' : 'SANDBOX'}
          </span>
        </div>

        {/* Profile Pill */}
        {currentSession && (
          <button
            onClick={() => onNavigate('/profile')}
            className={`flex items-center gap-2 px-2.5 py-1 rounded border text-xs font-mono transition-all ${
              currentPath === '/profile'
                ? 'bg-[#121C17] border-[#00D084] text-[#19F59A]'
                : 'bg-[#050706] border-[#16281F] text-[#F5F7F6] hover:border-[#00D084]/40'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-[#00D084]/20 border border-[#00D084] flex items-center justify-center text-[10px] font-bold text-[#19F59A]">
              {(profile?.display_name || currentSession.displayName || 'C')[0]}
            </div>
            <span className="font-semibold max-w-[100px] truncate hidden sm:inline">
              {profile?.display_name || currentSession.displayName || 'COMMANDER'}
            </span>
          </button>
        )}

        <button
          onClick={() => onNavigate('/settings')}
          className="p-1.5 rounded border border-[#16281F] bg-[#050706] hover:border-[#00D084]/40 text-[#8B9992] hover:text-[#19F59A] transition-colors"
          title="Settings"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>

        {currentSession && (
          <button
            onClick={logout}
            className="p-1.5 rounded border border-[#16281F] bg-[#050706] hover:border-[#FF3B30]/40 text-[#8B9992] hover:text-[#FF3B30] transition-colors"
            title="Terminate Session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};

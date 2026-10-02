import React, { useState } from 'react';
import {
  Shield,
  Bell,
  Settings as SettingsIcon,
  LogOut,
  Radio,
  Activity,
  X,
  Check,
  CheckCheck,
  Command,
  Database,
  Terminal,
  Sparkles,
  AlertTriangle,
  Clock,
  Mic,
  Sliders,
  Monitor,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { RoutePath, NotificationItem } from '../types';
import { useRealtime } from '../hooks/useRealtime';

interface NavbarProps {
  onNavigate: (path: RoutePath) => void;
  currentPath: RoutePath;
  onOpenVoiceHUD?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenSystemOverlay?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigate,
  currentPath,
  onOpenVoiceHUD,
  onOpenCommandPalette,
  onOpenSystemOverlay,
}) => {
  const {
    currentSession,
    profile,
    logout,
    isSupabase,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    dismissNotification,
    clearNotifications,
  } = useAuth();

  const { connectionStatus, networkStatus, isConnected, isOnline, reconnect } = useRealtime();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getRealtimePill = () => {
    if (!isOnline) {
      return {
        label: 'NETWORK OFFLINE',
        mobileLabel: 'OFFLINE',
        color: 'text-[#FF3B30]',
        dotColor: 'bg-[#FF3B30]',
        pulse: false,
      };
    }
    switch (connectionStatus) {
      case 'CONNECTED':
        return {
          label: 'REALTIME CONNECTED',
          mobileLabel: 'LIVE',
          color: 'text-[#19F59A]',
          dotColor: 'bg-[#19F59A]',
          pulse: true,
        };
      case 'CONNECTING':
      case 'RECONNECTING':
        return {
          label: 'REALTIME RECONNECTING',
          mobileLabel: 'SYNC',
          color: 'text-[#FFB000]',
          dotColor: 'bg-[#FFB000]',
          pulse: true,
        };
      case 'ERROR':
        return {
          label: 'REALTIME ERROR',
          mobileLabel: 'ERR',
          color: 'text-[#FF3B30]',
          dotColor: 'bg-[#FF3B30]',
          pulse: false,
        };
      case 'DISCONNECTED':
      default:
        return {
          label: 'REALTIME DISCONNECTED',
          mobileLabel: 'DISC',
          color: 'text-[#8B9992]',
          dotColor: 'bg-[#8B9992]',
          pulse: false,
        };
    }
  };

  const rtPill = getRealtimePill();

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'TASK':
        return <Activity className="w-3.5 h-3.5 text-[#19F59A]" />;
      case 'MEMORY':
        return <Database className="w-3.5 h-3.5 text-[#FFB000]" />;
      case 'COMMAND':
        return <Terminal className="w-3.5 h-3.5 text-[#38E1FF]" />;
      case 'SYSTEM':
        return <Radio className="w-3.5 h-3.5 text-[#19F59A]" />;
      case 'WARNING':
      case 'ALERT':
        return <AlertTriangle className="w-3.5 h-3.5 text-[#FFB000]" />;
      case 'ERROR':
        return <X className="w-3.5 h-3.5 text-[#FF3B30]" />;
      case 'AI':
        return <Sparkles className="w-3.5 h-3.5 text-[#38E1FF]" />;
      case 'SUCCESS':
      default:
        return <Check className="w-3.5 h-3.5 text-[#19F59A]" />;
    }
  };

  return (
    <header className="h-14 border-b border-[#16281F] bg-[#0A100D]/90 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between sticky top-0 z-50">
      {/* Brand & Tagline with Original Three Blades Logo */}
      <div
        className="flex items-center gap-2.5 sm:gap-3 cursor-pointer shrink-0"
        onClick={() => onNavigate('/command')}
      >
        {/* Original Three Blade Motif */}
        <div className="w-8 h-8 rounded-lg bg-[#050706] border border-[#00D084] flex items-center justify-center gap-0.5 shadow-[0_0_10px_rgba(0,208,132,0.15)]">
          <div className="w-1 h-4 bg-[#00D084] -skew-x-12 rounded-xs shadow-[0_0_4px_#00D084]" />
          <div className="w-1 h-5 bg-[#38E1FF] -skew-x-12 rounded-xs shadow-[0_0_4px_#38E1FF]" />
          <div className="w-1 h-4 bg-[#FFB000] -skew-x-12 rounded-xs shadow-[0_0_4px_#FFB000]" />
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm tracking-wider text-[#F5F7F6]">ZORO</span>
            <span className="text-[10px] font-mono font-bold text-[#19F59A] px-1 rounded bg-[#00D084]/10 border border-[#00D084]/20">
              2.0 OMNIA
            </span>
          </div>
          <div className="text-[8px] font-mono text-[#8B9992] tracking-widest hidden sm:block">
            PERSONAL AI COMMAND OS
          </div>
        </div>
      </div>

      {/* Telemetry and Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Toggle ZORO OS Workspace */}
        <button
          onClick={() => onNavigate(currentPath === '/os' || currentPath === '/workspace' ? '/command' : '/os')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all shadow-sm ${
            currentPath === '/os' || currentPath === '/workspace'
              ? 'bg-[#121C17] border-[#38E1FF] text-[#38E1FF] shadow-[0_0_10px_rgba(56,225,255,0.2)] font-bold'
              : 'border-[#16281F] bg-[#050706] text-[#8B9992] hover:text-[#38E1FF] hover:border-[#38E1FF]/40'
          }`}
          title="Toggle ZORO OS Workspace"
        >
          <Monitor className="w-3.5 h-3.5 text-[#38E1FF]" />
          <span className="hidden sm:inline text-[11px]">
            {currentPath === '/os' || currentPath === '/workspace' ? 'EXIT OS' : 'ZORO OS'}
          </span>
        </button>

        {/* Command Palette Trigger Button (Ctrl + K) */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[#16281F] bg-[#050706] hover:border-[#00D084]/50 text-xs font-mono text-[#8B9992] hover:text-[#19F59A] transition-colors shadow-sm"
          title="Open Command Palette (Ctrl + K)"
        >
          <Command className="w-3.5 h-3.5 text-[#19F59A]" />
          <span className="hidden sm:inline text-[11px]">PALETTE</span>
          <kbd className="hidden lg:inline text-[9px] px-1 rounded bg-[#121C17] border border-[#16281F]">
            Ctrl+K
          </kbd>
        </button>

        {/* Realtime Live Connection Pill */}
        <div
          onClick={reconnect}
          className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#050706] border border-[#16281F] text-[10px] font-mono hover:border-[#16281F]/80 transition-colors"
          title={`${rtPill.label} - Click to verify`}
        >
          <span
            className={`w-2 h-2 rounded-full ${rtPill.dotColor} ${
              rtPill.pulse ? 'animate-pulse' : ''
            }`}
          />
          <span className={`font-bold ${rtPill.color} hidden md:inline`}>{rtPill.label}</span>
          <span className={`font-bold ${rtPill.color} md:hidden`}>{rtPill.mobileLabel}</span>
          <span className="text-[#16281F] hidden md:inline">|</span>
          <span className="text-[#8B9992] hidden md:inline">DB:</span>
          <span
            className={`hidden md:inline font-bold ${isSupabase ? 'text-[#38E1FF]' : 'text-[#FFB000]'}`}
          >
            {isSupabase ? 'SUPABASE' : 'SANDBOX'}
          </span>
        </div>

        {/* Global Voice HUD Trigger Button */}
        <button
          onClick={() => {
            if (onOpenVoiceHUD) {
              onOpenVoiceHUD();
            } else {
              onNavigate('/voice');
            }
          }}
          className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-mono flex items-center gap-1.5 transition-all shadow-sm ${
            currentPath === '/voice'
              ? 'bg-[#121C17] border-[#00D084] text-[#19F59A] shadow-[0_0_10px_rgba(0,208,132,0.2)]'
              : 'border-[#16281F] bg-[#050706] text-[#8B9992] hover:text-[#19F59A] hover:border-[#00D084]/50'
          }`}
          title="Engage Real-Time Voice AI (Ctrl + Space)"
        >
          <Mic className="w-3.5 h-3.5 text-[#19F59A] animate-pulse" />
          <span className="font-bold hidden sm:inline">VOICE</span>
          <span className="text-[8px] px-1 py-0.2 rounded bg-[#00D084]/15 text-[#19F59A] hidden lg:inline font-mono">
            ^SPACE
          </span>
        </button>

        {/* System Command Overlay Trigger */}
        <button
          onClick={onOpenSystemOverlay}
          className="p-1.5 rounded-lg border border-[#16281F] bg-[#050706] text-[#8B9992] hover:text-[#38E1FF] hover:border-[#38E1FF]/40 transition-colors hidden sm:flex"
          title="System Command Overlay"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* Notifications Icon with live dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 rounded-lg border border-[#16281F] bg-[#050706] hover:border-[#00D084]/40 text-[#8B9992] hover:text-[#19F59A] transition-colors relative"
            title="Notification Center"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#00D084] text-[#050706] text-[9px] font-bold font-mono flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0A100D] border border-[#16281F] rounded-2xl shadow-2xl p-3.5 z-50 font-mono text-xs space-y-2.5 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-[#16281F]">
                <div className="flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-[#19F59A]" />
                  <span className="font-bold text-[#F5F7F6] text-[11px] tracking-wider">
                    LIVE NOTIFICATIONS
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      onNavigate('/notifications');
                    }}
                    className="text-[10px] text-[#38E1FF] hover:underline"
                  >
                    VIEW ALL
                  </button>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[10px] text-[#19F59A] hover:underline flex items-center gap-1"
                    >
                      <CheckCheck className="w-3 h-3" />
                      <span>READ ALL</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-[#8B9992] text-[11px] space-y-1">
                    <p>No alerts in live buffer.</p>
                    <p className="text-[9px] text-[#8B9992]/60">All three blades synchronized.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer relative group ${
                        !n.read
                          ? 'bg-[#050706] border-[#00D084]/40 shadow-[0_0_10px_rgba(0,208,132,0.06)]'
                          : 'bg-[#050706]/60 border-[#16281F] opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {getNotificationIcon(n.type)}
                          <span className="font-bold text-[#F5F7F6] text-[11px]">{n.title}</span>
                          {!n.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#19F59A] shrink-0" />
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissNotification(n.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-[#8B9992] hover:text-[#FF3B30] p-0.5 transition-opacity"
                          title="Dismiss"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>

                      <p className="text-[#8B9992] text-[10px] mt-1 leading-relaxed font-sans pr-2">
                        {n.message}
                      </p>

                      <div className="flex items-center justify-between text-[8px] text-[#8B9992] mt-1.5 pt-1 border-t border-[#16281F]/40 font-mono">
                        <span className="text-[#00D084]">[{n.type}]</span>
                        <span>{new Date(n.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Pill */}
        {currentSession && (
          <button
            onClick={() => onNavigate('/profile')}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-mono transition-all ${
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

        {/* Settings button */}
        <button
          onClick={() => onNavigate('/settings')}
          className={`p-1.5 rounded-lg border transition-colors ${
            currentPath === '/settings'
              ? 'bg-[#121C17] border-[#00D084] text-[#19F59A]'
              : 'border-[#16281F] bg-[#050706] hover:border-[#00D084]/40 text-[#8B9992] hover:text-[#19F59A]'
          }`}
          title="Settings"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>

        {/* Logout button */}
        {currentSession && (
          <button
            onClick={logout}
            className="p-1.5 rounded-lg border border-[#16281F] bg-[#050706] hover:border-[#FF3B30]/40 text-[#8B9992] hover:text-[#FF3B30] transition-colors"
            title="Terminate Session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};

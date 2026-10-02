import React, { useState } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ArrowLeft,
  Activity,
  AlertTriangle,
  Zap,
  Cpu,
  Target,
  Database,
  Radio,
  Clock,
  Filter,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationItem, RoutePath } from '../types';

interface NotificationsScreenProps {
  onNavigate: (path: RoutePath) => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onNavigate }) => {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    dismissNotification,
    clearNotifications,
  } = useAuth();

  const [filterType, setFilterType] = useState<string>('ALL');

  const filteredNotifications = notifications.filter((n) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'UNREAD') return !n.read;
    if (filterType === 'WARNING') return n.type === 'WARNING' || n.type === 'ALERT' || n.type === 'ERROR';
    if (filterType === 'MISSION') return n.type === 'MISSION' || n.type === 'TASK';
    if (filterType === 'SYSTEM') return n.type === 'SYSTEM' || n.type === 'AI';
    return true;
  });

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'TASK':
        return <Activity className="w-4 h-4 text-[#19F59A]" />;
      case 'MISSION':
        return <Target className="w-4 h-4 text-[#38E1FF]" />;
      case 'MEMORY':
        return <Database className="w-4 h-4 text-[#FFB000]" />;
      case 'WARNING':
      case 'ALERT':
        return <AlertTriangle className="w-4 h-4 text-[#FFB000]" />;
      case 'ERROR':
        return <AlertTriangle className="w-4 h-4 text-[#FF3B30]" />;
      case 'AI':
        return <Cpu className="w-4 h-4 text-[#19F59A]" />;
      default:
        return <Bell className="w-4 h-4 text-[#8B9992]" />;
    }
  };

  const getNavigationRoute = (n: NotificationItem): RoutePath => {
    if (n.type === 'MISSION') return '/missions';
    if (n.type === 'TASK') return '/tasks';
    if (n.type === 'MEMORY') return '/memory';
    if (n.type === 'AI') return '/agents';
    return '/dashboard';
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#16281F] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#19F59A]" />
            <h1 className="text-xl font-black text-[#F5F7F6] tracking-wider">
              GLOBAL NOTIFICATION CENTER
            </h1>
          </div>
          <p className="text-[10px] text-[#8B9992] mt-0.5">
            AGGREGATED AUTOMATION ALERTS • DEADLINE SIGNALS • AGENT RESULTS • MISSION UPDATES
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigate('/command')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#19F59A] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>COMMAND SURFACE</span>
          </button>

          <button
            onClick={markAllNotificationsRead}
            disabled={notifications.every((n) => n.read)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#19F59A] disabled:opacity-40 disabled:hover:text-[#8B9992] transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>MARK ALL READ</span>
          </button>

          <button
            onClick={clearNotifications}
            disabled={notifications.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#FF3B30] disabled:opacity-40 disabled:hover:text-[#8B9992] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>CLEAR ALL</span>
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[10px] text-[#8B9992] shrink-0 flex items-center gap-1">
          <Filter className="w-3 h-3" />
          FILTER:
        </span>
        {[
          { id: 'ALL', label: `ALL (${notifications.length})` },
          { id: 'UNREAD', label: `UNREAD (${notifications.filter((n) => !n.read).length})` },
          { id: 'WARNING', label: 'WARNINGS & ALERTS' },
          { id: 'MISSION', label: 'MISSIONS & TASKS' },
          { id: 'SYSTEM', label: 'SYSTEM & AGENTS' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterType(f.id)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors shrink-0 ${
              filterType === f.id
                ? 'bg-[#121C17] border border-[#00D084] text-[#19F59A]'
                : 'bg-[#0A100D] border border-[#16281F] text-[#8B9992] hover:text-[#F5F7F6]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#0A100D] border border-[#16281F] text-[#8B9992] space-y-2">
            <Radio className="w-8 h-8 mx-auto text-[#16281F]" />
            <p className="text-xs font-bold text-[#F5F7F6]">Zero telemetry alerts in this category.</p>
            <p className="text-[10px]">All mission systems and automated watchdogs are running smoothly.</p>
          </div>
        ) : (
          filteredNotifications.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                item.read
                  ? 'bg-[#0A100D]/60 border-[#16281F]/70 text-[#8B9992]'
                  : 'bg-[#0A100D] border-[#00D084]/40 shadow-[0_0_15px_rgba(0,208,132,0.06)]'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-[#050706] border border-[#16281F] shrink-0 mt-0.5">
                  {getIcon(item.type)}
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-[#F5F7F6] truncate">
                      {item.title}
                    </span>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#050706] border border-[#16281F] text-[#8B9992]">
                      {item.type}
                    </span>
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-[#19F59A] animate-pulse" />
                    )}
                  </div>

                  <p className="text-[11px] text-[#8B9992] leading-relaxed break-words">
                    {item.message}
                  </p>

                  <div className="text-[9px] text-[#8B9992]/60 flex items-center gap-1 font-mono">
                    <Clock className="w-2.5 h-2.5" />
                    <span>
                      {new Date(item.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => {
                    if (!item.read) markNotificationRead(item.id);
                    onNavigate(getNavigationRoute(item));
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#050706] border border-[#16281F] text-[10px] text-[#19F59A] hover:border-[#00D084] transition-colors"
                >
                  OPEN
                </button>

                {!item.read && (
                  <button
                    type="button"
                    onClick={() => markNotificationRead(item.id)}
                    className="p-1.5 rounded-lg bg-[#050706] border border-[#16281F] text-[#8B9992] hover:text-[#19F59A]"
                    title="Mark as Read"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => dismissNotification(item.id)}
                  className="p-1.5 rounded-lg bg-[#050706] border border-[#16281F] text-[#8B9992] hover:text-[#FF3B30]"
                  title="Dismiss Alert"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

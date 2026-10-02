import React from 'react';
import {
  Shield,
  Activity,
  Zap,
  Target,
  Timer,
  Cpu,
  X,
  Radio,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { RoutePath } from '../types';

interface SystemCommandOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: RoutePath) => void;
  systemState: {
    coreOnline: boolean;
    voiceState: string;
    visionState: string;
    agentState: string;
    automationActiveCount: number;
    memoryCount: number;
    activeMissionTitle: string;
    activeFocusMinutes: number | null;
  };
  recentActivities: { id: string; time: string; text: string; type: string }[];
}

export const SystemCommandOverlay: React.FC<SystemCommandOverlayProps> = ({
  isOpen,
  onClose,
  onNavigate,
  systemState,
  recentActivities,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050706]/85 backdrop-blur-md animate-fadeIn font-mono">
      <div className="w-full max-w-xl bg-[#0A100D] border border-[#16281F] rounded-2xl shadow-2xl overflow-hidden animate-scaleUp">
        {/* Three Blade Slash Header */}
        <div className="h-1 bg-gradient-to-r from-[#00D084] via-[#38E1FF] to-[#00D084]" />

        {/* Header */}
        <div className="p-4 border-b border-[#16281F] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#19F59A] animate-pulse" />
            <h2 className="text-sm font-black text-[#F5F7F6] tracking-wider">
              JARVIS CORE • SYSTEM COMMAND OVERLAY
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#8B9992] hover:text-[#F5F7F6]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
          {/* Service States Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-[#050706] border border-[#16281F] space-y-1">
              <span className="text-[10px] text-[#8B9992]">JARVIS CORE</span>
              <div className="flex items-center gap-1.5 text-[#19F59A] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#19F59A]" />
                <span>ONLINE</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#050706] border border-[#16281F] space-y-1">
              <span className="text-[10px] text-[#8B9992]">VOICE ENGINE</span>
              <div className="flex items-center gap-1.5 text-[#38E1FF] font-bold">
                <span>{systemState.voiceState}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#050706] border border-[#16281F] space-y-1">
              <span className="text-[10px] text-[#8B9992]">VISION CORE</span>
              <div className="flex items-center gap-1.5 text-[#19F59A] font-bold">
                <span>{systemState.visionState}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#050706] border border-[#16281F] space-y-1">
              <span className="text-[10px] text-[#8B9992]">AGENT BRAIN</span>
              <div className="flex items-center gap-1.5 text-[#38E1FF] font-bold">
                <span>{systemState.agentState}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#050706] border border-[#16281F] space-y-1">
              <span className="text-[10px] text-[#8B9992]">AUTOMATION LAB</span>
              <div className="flex items-center gap-1.5 text-[#FFB000] font-bold">
                <span>{systemState.automationActiveCount} ACTIVE</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#050706] border border-[#16281F] space-y-1">
              <span className="text-[10px] text-[#8B9992]">PERSISTENT MEMORY</span>
              <div className="flex items-center gap-1.5 text-[#19F59A] font-bold">
                <span>{systemState.memoryCount} NODES</span>
              </div>
            </div>
          </div>

          {/* Current Mission & Focus Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div
              onClick={() => {
                onClose();
                onNavigate('/missions');
              }}
              className="p-3 rounded-xl bg-[#050706] border border-[#16281F] hover:border-[#00D084]/40 cursor-pointer space-y-1 transition-colors"
            >
              <div className="flex items-center justify-between text-[10px] text-[#8B9992]">
                <span className="flex items-center gap-1">
                  <Target className="w-3 h-3 text-[#38E1FF]" />
                  ACTIVE MISSION CONTEXT
                </span>
                <ArrowRight className="w-3 h-3 text-[#19F59A]" />
              </div>
              <div className="font-bold text-[#F5F7F6] truncate">
                {systemState.activeMissionTitle || 'No active mission set'}
              </div>
            </div>

            <div
              onClick={() => {
                onClose();
                onNavigate('/focus');
              }}
              className="p-3 rounded-xl bg-[#050706] border border-[#16281F] hover:border-[#00D084]/40 cursor-pointer space-y-1 transition-colors"
            >
              <div className="flex items-center justify-between text-[10px] text-[#8B9992]">
                <span className="flex items-center gap-1">
                  <Timer className="w-3 h-3 text-[#FF3B30]" />
                  COMBAT FOCUS
                </span>
                <ArrowRight className="w-3 h-3 text-[#19F59A]" />
              </div>
              <div className="font-bold text-[#F5F7F6]">
                {systemState.activeFocusMinutes
                  ? `${systemState.activeFocusMinutes}m session active`
                  : 'Stance Ready (Standby)'}
              </div>
            </div>
          </div>

          {/* Recent Live Activity Stream */}
          <div className="space-y-2">
            <div className="text-[10px] text-[#8B9992] flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-[#19F59A]" />
                RECENT ACTIVITY STREAM
              </span>
              <span>LIVE</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#050706] border border-[#16281F] divide-y divide-[#16281F]/40 space-y-1.5 max-h-40 overflow-y-auto">
              {recentActivities.length === 0 ? (
                <div className="text-[#8B9992] text-[11px] p-2 text-center">
                  Zero activity registered in current session.
                </div>
              ) : (
                recentActivities.slice(0, 5).map((act) => (
                  <div
                    key={act.id}
                    className="pt-1.5 first:pt-0 flex items-center justify-between text-[11px]"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="text-[#8B9992] text-[10px] shrink-0 font-mono">
                        {act.time}
                      </span>
                      <span className="text-[#F5F7F6] truncate">{act.text}</span>
                    </div>
                    <span className="text-[9px] text-[#19F59A] shrink-0 px-1 py-0.5 rounded bg-[#00D084]/10">
                      {act.type}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#16281F] bg-[#050706]/70 flex items-center justify-between text-[10px] text-[#8B9992]">
          <span>Press ESC or click outside to dismiss</span>
          <button
            onClick={() => {
              onClose();
              onNavigate('/command');
            }}
            className="text-[#19F59A] font-bold hover:underline"
          >
            OPEN COMMAND SURFACE →
          </button>
        </div>
      </div>
    </div>
  );
};
